function Target(callsign) {
  this._callsign = callsign;

  this._mode;
  this._type;
  this._position;
  this._arrival;
  this._altitude;
  this._speed;
  this._squawk;
  this._controller = null;
  this._history = [];
  this._coneSize;
  this._jRingSize;

  this._isExpanded = false;
  this._isSelected = false;
  this._isInConflict = false;
  this._isDisplayingCone = false;
  this._isDisplayingJRing = false;
  this._isCoasting = false;
  this._isAwaitingPurge = false;

  this._modes = {
    OFF: 1,
    STANDBY: 2,
    ALTITUDE: 3,
    IDENT: 4
  };
}

Target.prototype.updateFromBlip = function(blip) {
  this.update(blip.callsign, blip.mode, blip.type, blip.arrival, blip.position, blip.altitude, blip.speed, blip.squawk);
};

Target.prototype.update = function(callsign, mode, type, arrival, position, altitude, speed, squawk) {
  this.setCallsign(callsign);
  this.setMode(mode);
  this.setType(type);
  this.setArrival(arrival);
  this.setPosition(position);
  this.setAltitude(altitude);
  this.setSpeed(speed);
  this.setSquawk(squawk);

  this.radarReturn();
};

Target.prototype.setCallsign = function(callsign) {
  this._callsign = callsign;
};

Target.prototype.setMode = function(mode) {
  this._mode = mode;
};

Target.prototype.setType = function(type) {
  this._type = type;
};

Target.prototype.setArrival = function(arrival) {
  this._arrival = arrival;
};

Target.prototype.setPosition = function(position) {
  position = new LatLon(position._lat, position._lon);
  if (this._position)
    this.addHistory(position);
  this._position = position;
};

Target.prototype.setAltitude = function(altitude) {
  this._altitude = altitude;
};

Target.prototype.setSpeed = function(speed) {
  this._speed = speed;
};

Target.prototype.setSquawk = function(squawk) {
  this._squawk = squawk;
};

Target.prototype.setController = function(controller) {
  this._controller = controller;
  if (this._controller)
    this.expand();
  else
    this.contract();
};

Target.prototype.addHistory = function(position) {
  this._history.unshift(position);
  if (this._history.length > 6)
    this._history.length = 6;
};

Target.prototype.callsign = function() {
  return this._callsign;
};

Target.prototype.mode = function() {
  return this._mode;
};

Target.prototype.type = function() {
  return this._type;
};

Target.prototype.arrival = function() {
  return this._arrival;
};

Target.prototype.position = function() {
  return this._position;
};

Target.prototype.altitude = function() {
  return this._altitude;
};

Target.prototype.speed = function() {
  return this._speed;
};

Target.prototype.squawk = function() {
  return this._squawk;
};

Target.prototype.controller = function() {
  return this._controller;
};

Target.prototype.history = function() {
  return this._history.slice(1);
};

Target.prototype.course = function() {
  return this.history().length ? this.history()[0].bearingTo(this.position()) : -1;
};

Target.prototype.enableCone = function(size) {
  this._coneSize = size;
  this._isDisplayingCone = true;
};

Target.prototype.disableCone = function() {
  this._isDisplayingCone = false;
};

Target.prototype.isDisplayingCone = function() {
  return this._isDisplayingCone;
};

Target.prototype.enableJRing = function(size) {
  this._jRingSize = size;
  this._isDisplayingJRing = true;
};

Target.prototype.disableJRing = function() {
  this._isDisplayingJRing = false;
};

Target.prototype.isDisplayingJRing = function() {
  return this._isDisplayingJRing;
};

Target.prototype.expand = function() {
  this._isExpanded = true;
};

Target.prototype.contract = function() {
  this._isExpanded = false;
};

Target.prototype.isExpanded = function() {
  return this._isExpanded;
};

Target.prototype.select = function() {
  this._isSelected = true;
  if (!this.isExpanded()) {
    this.expand();
    setTimeout(function() {
      if (!this.isControlled())
        this.contract();
    }.bind(this), 3000);
  }
};

Target.prototype.deselect = function() {
  this._isSelected = false;
};

Target.prototype.isSelected = function() {
  return this._isSelected;
};

Target.prototype.inConflict = function() {
  this._isInConflict = true;
};

Target.prototype.notInConflict = function() {
  this._isInConflict = false;
};

Target.prototype.isInConflict = function() {
  return this._isInConflict;
};

Target.prototype.coast = function() {
  this._isCoasting = true;
};

Target.prototype.uncoast = function() {
  this._isCoasting = false;
};

Target.prototype.isCoasting = function() {
  return this._isCoasting;
};

Target.prototype.radarReturn = function() {
  this.uncoast();
  this.cancelPurge();
};

Target.prototype.noRadarReturn = function() {
  if (this.controller() && !this.isCoasting()) {
    this.coast();
    var purgeTrack = setTimeout(function() {
      this.awaitPurge();
    }.bind(this), 30000);
  }
  if (!this.controller())
    this.awaitPurge();
  if (this.isCoasting())
    this.coastPosition();
};

Target.prototype.coastPosition = function() {
  var history = this.history();
  if (history.length > 0) {
    var previousDistance = history[0].distanceTo(this.position());
    var newEstimatedPosition = this.position().destinationPoint(this.course(), previousDistance);
    this.setPosition(newEstimatedPosition);
  }
};

Target.prototype.awaitPurge = function() {
  this._isAwaitingPurge = true;
};

Target.prototype.cancelPurge = function() {
  this._isAwaitingPurge = false;
};

Target.prototype.isAwaitingPurge = function() {
  return this._isAwaitingPurge;
};

Target.prototype.isControlled = function() {
  return this.controller() !== null;
};