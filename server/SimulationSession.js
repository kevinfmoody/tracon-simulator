var VATSIM = require('./vatsim/vatsim.js'),
    TrafficSimulator = require('../traffic/TrafficSimulator.js'),
    SimulationCommands = require('./SimulationCommands.js'),
    FacilityManager = require('../FacilityManager.js'),
    Controller = require('../controller.js');

function SimulationSession(io, managerId, publicId) {
  this._mio = io.of('/' + managerId);
  this._pio = io.of('/' + publicId);

  this._terminal = 'BOS';
  this._enroute = 'ZBW';
  this._facilityManager = new FacilityManager();
  this._simulation = new TrafficSimulator(this._mio, this._pio);
  this._commands = new SimulationCommands(this._simulation, this._facilityManager);
  this._controllers = {};
  this._sockets = {};
  this._controllerCounts = {
    TOWER: 0,
    FEEDER: 0,
    FINAL: 0,
    DEPARTURE: 0,
    CENTER: 0
  };

  this._mio.on('connection', function(socket) {
    this.bindManagerListeners(socket);
    this.bindPublicListeners(socket);
    this.bindDisconnectListeners(socket);
  }.bind(this));

  this._pio.on('connection', function(socket) {
    this.bindPublicListeners(socket);
    this.bindDisconnectListeners(socket);
  }.bind(this));

  this._simulation.loadSituation('../situations/crda.sit', function() {
    this._simulation.run({ magVar: function() { return -15.24; } });
  }.bind(this));
}

SimulationSession.prototype.bindManagerListeners = function(socket) {
  var TS = this._commands;
  socket.on('TS.ILS', TS.ILS.bind(TS));
  socket.on('TS.visualApproach', TS.visualApproach.bind(TS));
  socket.on('TS.heading', TS.heading.bind(TS));
  socket.on('TS.altitude', TS.altitude.bind(TS));
  socket.on('TS.speed', TS.speed.bind(TS));
  socket.on('TS.relocate', TS.relocate.bind(TS));
};

SimulationSession.prototype.bindPublicListeners = function(socket) {
  socket.on('ATC.addController', function(data, cb) {
    this.addController(socket, data, cb);
  }.bind(this));

  socket.on('ATC.deleteController', function(cb) {
    this.deleteController(socket, cb);
  }.bind(this));

  socket.on('ATC.initiateControl', function(data, cb) {
    this.initiateControl(socket, data, cb);
  }.bind(this));

  socket.on('ATC.terminateControl', function(data, cb) {
    this.terminateControl(socket, data, cb);
  }.bind(this));

  socket.on('ATC.requestHandoff', function(data, cb) {
    this.requestHandoff(socket, data, cb);
  }.bind(this));

  socket.on('ATC.acceptHandoff', function(data, cb) {
    this.acceptHandoff(socket, data, cb);
  }.bind(this));

  socket.on('ATC.refuseHandoff', function(data, cb) {
    this.refuseHandoff(socket, data, cb);
  }.bind(this));
};

SimulationSession.prototype.bindDisconnectListeners = function(socket) {
  socket.on('disconnect', function() {
    this.deleteController(socket);
  }.bind(this));
};

SimulationSession.prototype.getControllerBySocket = function(socket) {
  var positionSectorId = this._sockets[socket.id];
  if (positionSectorId)
    return this._controllers[positionSectorId];
  return null;
};

SimulationSession.prototype.initiateControl = function(socket, data, cb) {
  var controller = this.getControllerBySocket(socket);
  if (controller && controller.getIdentifier() === data.controller) {
    var aircraft = this._simulation.getAircraftByCallsign(data.aircraft);
    if (aircraft && aircraft.controller() === null) {
      aircraft.setController(controller);
      this.ownershipClaimed(data);
      return cb(true);
    }
  }
  cb(false);
};

SimulationSession.prototype.terminateControl = function(socket, data, cb) {
  var controller = this.getControllerBySocket(socket);
  if (controller && controller.getIdentifier() === data.controller) {
    var aircraft = this._simulation.getAircraftByCallsign(data.aircraft);
    if (aircraft && aircraft.controller() === controller) {
      aircraft.setController(null);
      data.controller = '';
      this.ownershipClaimed(data);
      return cb(true);
    }
  }
  cb(false);
};

SimulationSession.prototype.requestHandoff = function(socket, data, cb) {
  var controller = this.getControllerBySocket(socket);
  if (controller && controller.getIdentifier() === data.controller) {
    var to = this._controllers[data.to];
    if (to && to !== controller) {
      var aircraft = this._simulation.getAircraftByCallsign(data.aircraft);
      if (aircraft && aircraft.controller() === controller) {
        to.getSocket().emit('handoffRequested', data);
        return cb(true);
      }
    }
  }
  cb(false);
};

SimulationSession.prototype.acceptHandoff = function(socket, data, cb) {
  var to = this.getControllerBySocket(socket);
  if (to && to.getIdentifier() === data.to) {
    var controller = this._controllers[data.controller];
    if (controller) {
      var aircraft = this._simulation.getAircraftByCallsign(data.aircraft);
      if (aircraft && aircraft.controller() === controller) {
        controller.getSocket().emit('handoffAccepted', data);
        aircraft.setController(to);
        data.controller = data.to;
        this.ownershipClaimed(data);
        return cb(true);
      }
    }
  }
  cb(false);
};

SimulationSession.prototype.refuseHandoff = function(socket, data, cb) {
  var to = this.getControllerBySocket(socket);
  if (to && to.getIdentifier() === data.to) {
    var controller = this._controllers[data.controller];
    if (controller) {
      var aircraft = this._simulation.getAircraftByCallsign(data.aircraft);
      if (aircraft && aircraft.controller() === controller) {
        controller.getSocket().emit('handoffRefused', data);
        return cb(true);
      }
    }
  }
  cb(false);
};

SimulationSession.prototype.ownershipClaimed = function(data) {
  this._pio.emit('ownershipClaimed', data);
  this._mio.emit('ownershipClaimed', data);
};

SimulationSession.prototype.addController = function(socket, data, cb) {
  var positionCount = this._controllerCounts[data.position];
  if (positionCount !== undefined) {
    this._controllerCounts[data.position]++;
    var positionTitle = this.positionTitle(data.position, positionCount);
    var positionSectorId = this.positionSectorId(data.position, positionCount);
    var positionLetter = this.positionLetter(data.position, positionCount);
    var controller = new Controller(data.position, positionLetter, positionSectorId, positionTitle, '199.98', socket);
    this._controllers[positionSectorId] = controller;
    this._sockets[socket.id] = positionSectorId;
    if (cb)
      cb(controller.toJSON());
  }
  this.broadcastControllers();
};

SimulationSession.prototype.deleteController = function(socket, cb) {
  var positionSectorId = this._sockets[socket.id];
  if (positionSectorId) {
    var controller = this._controllers[positionSectorId];
    delete this._controllers[positionSectorId];
    delete this._sockets[socket.id];
    this._simulation.getAllAircraftByController(controller).forEach(function(aircraft) {
      aircraft.setController(null);
      this.ownershipClaimed({
        aircraft: aircraft.callsign(),
        controller: ''
      });
    }.bind(this));
  }
  if (cb)
    cb();
  this.broadcastControllers();
};

SimulationSession.prototype.broadcastControllers = function() {
  var controllers = Object.keys(this._controllers).map(function(positionSectorId) {
    return this._controllers[positionSectorId].toJSON();
  }.bind(this));
  this._mio.emit('controllers', controllers);
  this._pio.emit('controllers', controllers);
};

SimulationSession.prototype.positionTitle = function(position, count) {
  var positionTitle = '';
  if (position === 'CENTER')
    positionTitle += this._enroute + (count ? '_' + count : '') + '_CTR';
  else {
    positionTitle += this._terminal;
    if (position === 'FINAL')
      positionTitle += '_F' + (count || '') + '_APP';
    else {
      positionTitle += (count ? '_' + count : '') + '_';
      if (position === 'TOWER')
        positionTitle += 'TWR';
      else if (position === 'FEEDER')
        positionTitle += 'APP';
      else if (position === 'DEPARTURE')
        positionTitle += 'DEP';
    }
  }
  return positionTitle;
};

SimulationSession.prototype.positionSectorId = function(position, count) {
  if (position === 'TOWER')
    return (count + 1) + 'T';
  else if (position === 'FEEDER')
    return 'A' + String.fromCharCode(65 + count);
  else if (position === 'FINAL')
    return 'F' + (count + 1);
  else if (position === 'DEPARTURE')
    if (count === 0)
      return 'ID';
    else
      return (count + 1) + 'D';
  else if (position === 'CENTER')
    return '1' + (count + 1);
};

SimulationSession.prototype.positionLetter = function(position) {
  if (position === 'TOWER')
    return 'T';
  else if (position === 'FEEDER')
    return 'A';
  else if (position === 'FINAL')
    return 'F';
  else if (position === 'DEPARTURE')
    return 'D';
  else if (position === 'CENTER')
    return 'C';
};

SimulationSession.prototype.bindSocketListeners = function() {
  // var ATC = this._v.atc(),
  //     TS = this._commands;

  // this._s.on('ATC.addController', ATC.addController.bind(ATC));
  // this._s.on('ATC.sendPosition', ATC.sendPosition.bind(ATC));
  // this._s.on('ATC.deleteController', ATC.deleteController.bind(ATC));
  // this._s.on('ATC.requestHandoff', ATC.requestHandoff.bind(ATC));
  // this._s.on('ATC.acceptHandoff', ATC.acceptHandoff.bind(ATC));
  // this._s.on('ATC.refuseHandoff', ATC.refuseHandoff.bind(ATC));
  // this._s.on('ATC.pointout', ATC.pointout.bind(ATC));
  // this._s.on('ATC.claimOwnership', ATC.claimOwnership.bind(ATC));
  // this._s.on('ATC.scratchpad', ATC.scratchpad.bind(ATC));
  // this._s.on('ATC.squawk', ATC.squawk.bind(ATC));
  // this._s.on('ATC.voiceType', ATC.voiceType.bind(ATC));
  // this._s.on('ATC.temporaryAltitude', ATC.temporaryAltitude.bind(ATC));
  // this._s.on('ATC.amendFlightPlan', ATC.amendFlightPlan.bind(ATC));
  // this._s.on('ATC.ping', ATC.ping.bind(ATC));
  // this._s.on('ATC.pong', ATC.pong.bind(ATC));
  // this._s.on('ATC.checkValidity', ATC.checkValidity.bind(ATC));
  // this._s.on('ATC.checkCapabilities', ATC.checkCapabilities.bind(ATC));
  // this._s.on('ATC.capabilities', ATC.capabilities.bind(ATC));

  // this._s.on('TS.ILS', TS.ILS.bind(TS));
  // this._s.on('TS.heading', TS.heading.bind(TS));
  // this._s.on('TS.altitude', TS.altitude.bind(TS));
  // this._s.on('TS.speed', TS.speed.bind(TS));
};

module.exports = SimulationSession;