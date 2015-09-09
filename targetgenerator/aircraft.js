var Aircraft = function(callsign, state) {
  this.callsign = callsign;
  this.position = state.position || null;
  
  this.airspeed = state.airspeed || 0.0;
  this.altitude = state.altitude || 0.0;
  this.heading = state.heading || 0.0;
  
  this.airspeedTarget = 0.0;
  this.altitudeTarget = 0.0;
  this.headingTarget = 0.0;
  
  this.airspeedDelta = 0.0;
  this.altitudeDelta = 0.0;
  this.headingDelta = 0.0;
  
  this.maxAirspeedDelta = 0.0;
  this.maxAltitudeDelta = 0.0;
  this.maxHeadingDelta = 0.0;
  
  this.airspeedDeltaDelta = 0.0;
  this.altitudeDeltaDelta = 0.0;
  this.headingDeltaDelta = 0.0;
  
  this.groundspeed = 0.0;
  
  this.wind = null;
};

Aircraft.prototype.fly = function(wx, milliseconds) {
    this.updateWeather(wx);
    this.updateState(milliseconds);
    this.updateDeltaState(milliseconds);
};

Aircraft.prototype.updateWeather = function(wx) {
    this.wind = wx.windAtPosition(this.position);
};

Aircraft.prototype.updateState = function(milliseconds) {
    this.updateGroundspeed();
    this.updatePosition(milliseconds);
    this.updateAirspeed(milliseconds);
    this.updateAltitude(milliseconds);
    this.updateHeading(milliseconds);
};

Aircraft.prototype.updateDeltaState = function(milliseconds) {

};

Aircraft.prototype.updateGroundspeed = function() {
    var radians = Position.DegreesToRadians(Position.AngleBetween(this.wind.direction, this.heading));
    var correction = this.wind.velocity * Math.Cos(radians);
    this.groundspeed = this.altitude / 200 + this.airspeed - correction;
};

Aircraft.prototype.updatePosition = function(milliseconds) {
    var distance = this.groundspeed * milliseconds / Position.KM_TO_NM / Position.MS_IN_HR;
    this.position = this.position.destinationPoint(this.heading + this.position.magneticDeclination(this.altitude), distance);
};

Aircraft.prototype.updateAirspeed = function(milliseconds) {
    var remaining = this.airspeedTarget - this.airspeed;
    var sign = remaining >= 0 ? 1 : -1;
    this.airspeed += sign * Math.Min(this.airspeedDelta, sign * remaining);
};

Aircraft.prototype.updateAltitude = function(milliseconds) {
    var remaining = this.altitudeTarget - this.altitude;
    var sign = remaining >= 0 ? 1 : -1;
    this.altitude += sign * Math.Min(this.altitudeDelta, sign * remaining);
};

Aircraft.prototype.updateHeading = function(milliseconds) {
    var remaining = (this.headingTarget - this.heading + 360) % 360;
    if (Math.Abs(remaining - 360) < remaining)
        remaining -= 360;
    var sign = remaining >= 0 ? 1 : -1;
    this.heading = (this.heading + sign * Math.Min(this.headingDelta, sign * remaining)) % 360;
};

module.exports = Aircraft;