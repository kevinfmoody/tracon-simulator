var VATSIM = require('./vatsim/vatsim.js'),
    TrafficSimulator = require('../traffic/TrafficSimulator.js'),
    SimulationCommands = require('./SimulationCommands.js');

function ClientManager(socket) {
  currentFlow = null;
  this._s = socket;
  this._v = new VATSIM(this._s);
  this._v.client().connect();

  this._simulation = new TrafficSimulator(this._s, currentFlow);
  this._commands = new SimulationCommands(this._simulation);
  this._simulation.loadSituation('../situations/a90.sit', function() {
    this._simulation.run({ magVar: function() { return -15.24; } });
  }.bind(this));

  setInterval(function() {
    this._v.atc().sendPosition({
      from: 'BOS_APP',
      frequency: '18250',
      facility: 5,
      visRange: 150,
      rating: 8,
      latitude: 42.3629722,
      longitude: -71.0064167
    });
    console.log('atc sent');
  }.bind(this), 5000);

  this.bindSocketListeners();
}

ClientManager.prototype.bindSocketListeners = function() {
  var ATC = this._v.atc(),
      TS = this._commands;

  this._s.on('ATC.addController', ATC.addController.bind(ATC));
  this._s.on('ATC.sendPosition', ATC.sendPosition.bind(ATC));
  this._s.on('ATC.deleteController', ATC.deleteController.bind(ATC));
  this._s.on('ATC.requestHandoff', ATC.requestHandoff.bind(ATC));
  this._s.on('ATC.acceptHandoff', ATC.acceptHandoff.bind(ATC));
  this._s.on('ATC.refuseHandoff', ATC.refuseHandoff.bind(ATC));
  this._s.on('ATC.pointout', ATC.pointout.bind(ATC));
  this._s.on('ATC.claimOwnership', ATC.claimOwnership.bind(ATC));
  this._s.on('ATC.scratchpad', ATC.scratchpad.bind(ATC));
  this._s.on('ATC.squawk', ATC.squawk.bind(ATC));
  this._s.on('ATC.voiceType', ATC.voiceType.bind(ATC));
  this._s.on('ATC.temporaryAltitude', ATC.temporaryAltitude.bind(ATC));
  this._s.on('ATC.amendFlightPlan', ATC.amendFlightPlan.bind(ATC));
  this._s.on('ATC.ping', ATC.ping.bind(ATC));
  this._s.on('ATC.pong', ATC.pong.bind(ATC));
  this._s.on('ATC.checkValidity', ATC.checkValidity.bind(ATC));
  this._s.on('ATC.checkCapabilities', ATC.checkCapabilities.bind(ATC));
  this._s.on('ATC.capabilities', ATC.capabilities.bind(ATC));

  this._s.on('TS.ILS', TS.ILS.bind(TS));
  this._s.on('TS.heading', TS.heading.bind(TS));
  this._s.on('TS.altitude', TS.altitude.bind(TS));
  this._s.on('TS.speed', TS.speed.bind(TS));
};

module.exports = ClientManager;