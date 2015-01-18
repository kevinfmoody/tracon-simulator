var Runway = require('../facilities/runway.js');

function SimulationCommands(simulation, facilityManager) {
  this._facilityManager = facilityManager;
  this._simulation = simulation;
}

SimulationCommands.prototype.heading = function(data) {
  var aircraft = this._simulation.getAircraftByCallsign(data.callsign);
  if (aircraft)
    if (0 <= data.heading && data.heading <= 360)
      aircraft.assignHeading(data.heading, this._simulation.elapsed(), 0);
};

SimulationCommands.prototype.altitude = function(data) {
  var aircraft = this._simulation.getAircraftByCallsign(data.callsign);
  if (aircraft)
    if (0 <= data.altitude && data.altitude <= 99999)
      aircraft.assignAltitude(data.altitude, this._simulation.elapsed(), 0);
};

SimulationCommands.prototype.speed = function(data) {
  var aircraft = this._simulation.getAircraftByCallsign(data.callsign);
  if (aircraft)
    if (0 <= data.speed && data.speed <= 9999)
      aircraft.assignSpeed(data.speed, this._simulation.elapsed(), 0);
};

SimulationCommands.prototype.ILS = function(data) {
  var aircraft = this._simulation.getAircraftByCallsign(data.callsign);
  if (aircraft) {
    this._facilityManager.airport(data.icao, function(airport) {
      if (airport) {
        var runway = airport.runway(data.runway);
        if (runway) {
          aircraft.autopilot().engageILS(runway);
        }
      }
    });
  }
};

SimulationCommands.prototype.visualApproach = function(data) {
  var aircraft = this._simulation.getAircraftByCallsign(data.callsign);
  if (aircraft) {
    this._facilityManager.airport(data.icao, function(airport) {
      if (airport) {
        var runway = airport.runway(data.runway);
        if (runway) {
          aircraft.autopilot().engageVisualApproach(runway);
        }
      }
    });
  }
};

SimulationCommands.prototype.relocate = function(data) {
  console.log('relocating!');
  var aircraft = this._simulation.getAircraftByCallsign(data.callsign),
      lat = parseFloat(data.lat),
      lon = parseFloat(data.lon);
  if (!isNaN(lat) && !isNaN(lon) && aircraft) {
    aircraft.setLat(lat);
    aircraft.setLon(lon);
  }
};

module.exports = SimulationCommands;