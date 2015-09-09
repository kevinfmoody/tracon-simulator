// var VATSIM = require('./vatsim/vatsim.js'),
    var LiveTraffic = require('../traffic/livetraffic.js');
    // SimulationCommands = require('./SimulationCommands.js'),
    // FacilityManager = require('../FacilityManager.js'),
    // Controller = require('../controller.js');

function LiveSession(io, icao) {
  console.log('live session started at ' + icao);
  this._io = io.of('/' + icao);

  // this._terminal = 'BOS';
  // this._enroute = 'ZBW';
  // this._facilityManager = new FacilityManager();
  this._traffic = new LiveTraffic(this._io);
  //this._commands = new SimulationCommands(this._simulation, this._facilityManager);
  // this._controllers = {};
  // this._sockets = {};
  // this._controllerCounts = {
  //   TOWER: 0,
  //   FEEDER: 0,
  //   FINAL: 0,
  //   DEPARTURE: 0,
  //   CENTER: 0
  // };

  // this._mio.on('connection', function(socket) {
  //   this.bindManagerListeners(socket);
  //   this.bindPublicListeners(socket);
  //   this.bindDisconnectListeners(socket);
  // }.bind(this));

  // this._pio.on('connection', function(socket) {
  //   this.bindPublicListeners(socket);
  //   this.bindDisconnectListeners(socket);
  // }.bind(this));

  console.log('about to stream traffic at ' + icao);
  this._traffic.stream(icao);
}

// LiveSession.prototype.bindManagerListeners = function(socket) {
//   var TS = this._commands;
//   socket.on('TS.ILS', TS.ILS.bind(TS));
//   socket.on('TS.visualApproach', TS.visualApproach.bind(TS));
//   socket.on('TS.heading', TS.heading.bind(TS));
//   socket.on('TS.altitude', TS.altitude.bind(TS));
//   socket.on('TS.speed', TS.speed.bind(TS));
//   socket.on('TS.relocate', TS.relocate.bind(TS));
// };

// LiveSession.prototype.bindPublicListeners = function(socket) {
//   socket.on('ATC.addController', function(data, cb) {
//     this.addController(socket, data, cb);
//   }.bind(this));

//   socket.on('ATC.deleteController', function(cb) {
//     this.deleteController(socket, cb);
//   }.bind(this));

//   socket.on('ATC.initiateControl', function(data, cb) {
//     this.initiateControl(socket, data, cb);
//   }.bind(this));

//   socket.on('ATC.terminateControl', function(data, cb) {
//     this.terminateControl(socket, data, cb);
//   }.bind(this));

//   socket.on('ATC.requestHandoff', function(data, cb) {
//     this.requestHandoff(socket, data, cb);
//   }.bind(this));

//   socket.on('ATC.acceptHandoff', function(data, cb) {
//     this.acceptHandoff(socket, data, cb);
//   }.bind(this));

//   socket.on('ATC.refuseHandoff', function(data, cb) {
//     this.refuseHandoff(socket, data, cb);
//   }.bind(this));
// };

// LiveSession.prototype.bindDisconnectListeners = function(socket) {
//   socket.on('disconnect', function() {
//     this.deleteController(socket);
//   }.bind(this));
// };

// LiveSession.prototype.getControllerBySocket = function(socket) {
//   var positionSectorId = this._sockets[socket.id];
//   if (positionSectorId)
//     return this._controllers[positionSectorId];
//   return null;
// };

// LiveSession.prototype.initiateControl = function(socket, data, cb) {
//   var controller = this.getControllerBySocket(socket);
//   if (controller && controller.getIdentifier() === data.controller) {
//     var aircraft = this._simulation.getAircraftByCallsign(data.aircraft);
//     if (aircraft && aircraft.controller() === null) {
//       aircraft.setController(controller);
//       this.ownershipClaimed(data);
//       return cb(true);
//     }
//   }
//   cb(false);
// };

// LiveSession.prototype.terminateControl = function(socket, data, cb) {
//   var controller = this.getControllerBySocket(socket);
//   if (controller && controller.getIdentifier() === data.controller) {
//     var aircraft = this._simulation.getAircraftByCallsign(data.aircraft);
//     if (aircraft && aircraft.controller() === controller) {
//       aircraft.setController(null);
//       data.controller = '';
//       this.ownershipClaimed(data);
//       return cb(true);
//     }
//   }
//   cb(false);
// };

// LiveSession.prototype.requestHandoff = function(socket, data, cb) {
//   var controller = this.getControllerBySocket(socket);
//   if (controller && controller.getIdentifier() === data.controller) {
//     var to = this._controllers[data.to];
//     if (to && to !== controller) {
//       var aircraft = this._simulation.getAircraftByCallsign(data.aircraft);
//       if (aircraft && aircraft.controller() === controller) {
//         to.getSocket().emit('handoffRequested', data);
//         return cb(true);
//       }
//     }
//   }
//   cb(false);
// };

// LiveSession.prototype.acceptHandoff = function(socket, data, cb) {
//   var to = this.getControllerBySocket(socket);
//   if (to && to.getIdentifier() === data.to) {
//     var controller = this._controllers[data.controller];
//     if (controller) {
//       var aircraft = this._simulation.getAircraftByCallsign(data.aircraft);
//       if (aircraft && aircraft.controller() === controller) {
//         controller.getSocket().emit('handoffAccepted', data);
//         aircraft.setController(to);
//         data.controller = data.to;
//         this.ownershipClaimed(data);
//         return cb(true);
//       }
//     }
//   }
//   cb(false);
// };

// LiveSession.prototype.refuseHandoff = function(socket, data, cb) {
//   var to = this.getControllerBySocket(socket);
//   if (to && to.getIdentifier() === data.to) {
//     var controller = this._controllers[data.controller];
//     if (controller) {
//       var aircraft = this._simulation.getAircraftByCallsign(data.aircraft);
//       if (aircraft && aircraft.controller() === controller) {
//         controller.getSocket().emit('handoffRefused', data);
//         return cb(true);
//       }
//     }
//   }
//   cb(false);
// };

// LiveSession.prototype.ownershipClaimed = function(data) {
//   this._pio.emit('ownershipClaimed', data);
//   this._mio.emit('ownershipClaimed', data);
// };

// LiveSession.prototype.addController = function(socket, data, cb) {
//   var positionCount = this._controllerCounts[data.position];
//   if (positionCount !== undefined) {
//     this._controllerCounts[data.position]++;
//     var positionTitle = this.positionTitle(data.position, positionCount);
//     var positionSectorId = this.positionSectorId(data.position, positionCount);
//     var positionLetter = this.positionLetter(data.position, positionCount);
//     var controller = new Controller(data.position, positionLetter, positionSectorId, positionTitle, '199.98', socket);
//     this._controllers[positionSectorId] = controller;
//     this._sockets[socket.id] = positionSectorId;
//     if (cb)
//       cb(controller.toJSON());
//   }
//   this.broadcastControllers();
// };

// LiveSession.prototype.deleteController = function(socket, cb) {
//   var positionSectorId = this._sockets[socket.id];
//   if (positionSectorId) {
//     var controller = this._controllers[positionSectorId];
//     delete this._controllers[positionSectorId];
//     delete this._sockets[socket.id];
//     this._simulation.getAllAircraftByController(controller).forEach(function(aircraft) {
//       aircraft.setController(null);
//       this.ownershipClaimed({
//         aircraft: aircraft.callsign(),
//         controller: ''
//       });
//     }.bind(this));
//   }
//   if (cb)
//     cb();
//   this.broadcastControllers();
// };

// LiveSession.prototype.broadcastControllers = function() {
//   var controllers = Object.keys(this._controllers).map(function(positionSectorId) {
//     return this._controllers[positionSectorId].toJSON();
//   }.bind(this));
//   this._mio.emit('controllers', controllers);
//   this._pio.emit('controllers', controllers);
// };

// LiveSession.prototype.positionTitle = function(position, count) {
//   var positionTitle = '';
//   if (position === 'CENTER')
//     positionTitle += this._enroute + (count ? '_' + count : '') + '_CTR';
//   else {
//     positionTitle += this._terminal;
//     if (position === 'FINAL')
//       positionTitle += '_F' + (count || '') + '_APP';
//     else {
//       positionTitle += (count ? '_' + count : '') + '_';
//       if (position === 'TOWER')
//         positionTitle += 'TWR';
//       else if (position === 'FEEDER')
//         positionTitle += 'APP';
//       else if (position === 'DEPARTURE')
//         positionTitle += 'DEP';
//     }
//   }
//   return positionTitle;
// };

// LiveSession.prototype.positionSectorId = function(position, count) {
//   if (position === 'TOWER')
//     return (count + 1) + 'T';
//   else if (position === 'FEEDER')
//     return 'A' + String.fromCharCode(65 + count);
//   else if (position === 'FINAL')
//     return 'F' + (count + 1);
//   else if (position === 'DEPARTURE')
//     if (count === 0)
//       return 'ID';
//     else
//       return (count + 1) + 'D';
//   else if (position === 'CENTER')
//     return '1' + (count + 1);
// };

// LiveSession.prototype.positionLetter = function(position) {
//   if (position === 'TOWER')
//     return 'T';
//   else if (position === 'FEEDER')
//     return 'A';
//   else if (position === 'FINAL')
//     return 'F';
//   else if (position === 'DEPARTURE')
//     return 'D';
//   else if (position === 'CENTER')
//     return 'C';
// };

module.exports = LiveSession;
