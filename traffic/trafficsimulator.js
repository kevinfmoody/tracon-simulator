function TrafficSimulator() {
  this._aircraft = [];
  this._lastRun = 0;
  this._elapsed = 0;

  this._aircraftManager;
  this._isRunning = false;
}

/**
 * In order for TrafficSimulator to be considered a 
 * TrafficFeed, it must contain a blips() method that
 * returns all targets in the simulation.
 */
TrafficSimulator.prototype.blips = function() {
  return this.getAllAircraft();
};

TrafficSimulator.prototype.getBlipByCallsign = function(callsign) {
  return this.getAircraftByCallsign(callsign);
};

TrafficSimulator.prototype.getAllAircraft = function() {
  return this._aircraft;
};

TrafficSimulator.prototype.getAircraftByCallsign = function(callsign) {
  var aircraft = this.getAllAircraft();
  for (var i in aircraft)
    if (aircraft[i].callsign() === callsign)
      return aircraft[i];
  return null;
};

TrafficSimulator.prototype.loadSituation = function(filename, loadedFn) {
  $.get(filename, function(data) {
    var situation = data.split('\n');
    this._aircraft = [];
    for (var i in situation)
      this._aircraft.push(new Aircraft(situation[i]));
    loadedFn();
  }.bind(this));
};

TrafficSimulator.prototype.elapsed = function() {
  return this._elapsed + (!this._isRunning ? 0 : new Date().getTime() - this._lastRun);
};

TrafficSimulator.prototype.run = function(r) {
  if (!this._isRunning) {
    this._isRunning = true;
    this._lastRun = new Date().getTime();
    this._aircraftManager = setInterval(function() {
      for (var i in this._aircraft)
        this._aircraft[i].flyQuick(this.elapsed(), r);
    }.bind(this), 100);
  }
};

TrafficSimulator.prototype.pause = function() {
  if (this._isRunning) {
    this._isRunning = false;
    clearInterval(this._aircraftManager);
    this._elapsed += new Date().getTime() - this._lastRun;
  }
};