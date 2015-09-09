var fs = require('fs');
var Aircraft = require('./aircraft.js');
var TrafficAPI = require('../server/TrafficAPI.js');

function LiveTraffic(io) {
  this._io = io;

  this._updates = {};
  this._aircraft = [];
  this._lastRun = 0;
  this._elapsed = 0;

  this._aircraftManager;
  this._isRunning = false;
}

LiveTraffic.prototype.blips = function() {
  return this._aircraft.map(function(aircraft) {
    return aircraft.blip();
  });
};

LiveTraffic.prototype.getBlipByCallsign = function(callsign) {
  return this.getAircraftByCallsign(callsign);
};

LiveTraffic.prototype.getAllAircraft = function() {
  return this._aircraft;
};

LiveTraffic.prototype.getAircraftByCallsign = function(callsign) {
  var aircraft = this.getAllAircraft();
  for (var i in aircraft)
    if (aircraft[i].callsign() === callsign)
      return aircraft[i];
  return null;
};

LiveTraffic.prototype.getAllAircraftByController = function(controller) {
  return this.getAllAircraft().filter(function(aircraft) {
    return aircraft.controller() === controller;
  });
};

// LiveTraffic.prototype.loadReadWorldSituation = function(icao) {
  
// };

// LiveTraffic.prototype.loadSituation = function(filename, loadedFn) {
//   if (typeof module !== 'undefined' && module.exports) {
//     fs.readFile(filename, function(err, data) {
//       if (err)
//         return console.log(err);
//       var situation = data.toString().split('\n');
//       this._aircraft = [];
//       for (var i in situation)
//         this._aircraft.push(new Aircraft(situation[i], this._mio, this._pio));
//       loadedFn();
//     }.bind(this));
//   } else {
//     $.get(filename, function(data) {
//       var situation = data.split('\n');
//       this._aircraft = [];
//       for (var i in situation)
//         this._aircraft.push(new Aircraft(situation[i], this._mio, this._pio));
//       loadedFn();
//     }.bind(this));
//   }
// };

LiveTraffic.prototype.elapsed = function() {
  return this._elapsed + (!this._isRunning ? 0 : new Date().getTime() - this._lastRun);
};

LiveTraffic.prototype.stream = function(icao) {
  if (!this._isRunning) {
    this._isRunning = true;
    this._aircraftManager = setInterval(function() {
      TrafficAPI.arrivals(icao, function(aircraft) {
        aircraft.forEach(function(ac) {
          if (this._updates[ac.callsign] !== ac.timestamp) {
            this._updates[ac.callsign] = ac.timestamp;
            var target = new Aircraft();
            target.setCallsign(ac.callsign);
            target.setLat(ac.latitude);
            target.setLon(ac.longitude);
            target.setAltitude(ac.altitude);
            target.setSpeed(ac.groundspeed);
            target.setHeading(ac.heading);
            target.setType(ac.aircraft);
            target.setDeparture(ac.departure);
            target.setArrival(ac.arrival);
            this._io.emit('blip', target.blip());
          } else {
            this._io.emit('heartbeat', ac.callsign);
          }
        }.bind(this));
      }.bind(this));
    }.bind(this), 1000);
  }
};

LiveTraffic.prototype.pause = function() {
  if (this._isRunning) {
    this._isRunning = false;
    clearInterval(this._aircraftManager);
    this._elapsed += new Date().getTime() - this._lastRun;
  }
};

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LiveTraffic;
}