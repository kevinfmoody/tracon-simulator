var Runway = require('../facilities/runway.js');

function SimulationCommands(simulation) {
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
  var aircraft = this._simulation.getAircraftByCallsign(data.callsign),
      runway = data.runway ? new Runway(
        data.runway._id,
        data.runway._lat,
        data.runway._lon,
        data.runway._elevation,
        data.runway._length,
        data.runway._width,
        data.runway._course
      ) : null;
  if (aircraft && runway)
    aircraft.autopilot().engageILS(runway);
};

module.exports = SimulationCommands;