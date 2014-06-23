function CRDA(airport, masterRunwayID, slaveRunwayID, r) {
  this._r = r;
  this._airport = airport;
  this._master = airport.runway(masterRunwayID);
  this._slave = airport.runway(slaveRunwayID);
}

CRDA.prototype.ghostAircraft = function(aircraft) {
  if (this._master && this.inMasterZone(aircraft))
    this.renderGhost(aircraft, this.ghostPosition(aircraft));
};

CRDA.prototype.ghostPosition = function(aircraft) {
  var bearingOffset = 360 - (this._master.course() + this._r.magVar()) + this._master.position().bearingTo(aircraft.position());
  var distance = this._master.position().distanceTo(aircraft.position());
  return this._slave.position().destinationPoint(this._slave.course() + this._r.magVar() + bearingOffset, distance);
};

CRDA.prototype.renderGhost = function(aircraft, position) {
  var acPos = this._r.gtoc(position._lat, position._lon);
  this._r.context().fillStyle = '#ff0';
  this._r.context().strokeStyle = '#ff0';
  // Render position
  this._r.context().beginPath();
  this._r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  this._r.context().textAlign = 'center';
  this._r.context().textBaseline = 'middle';
  this._r.context().fillText('0', acPos.x, acPos.y);
  // Draw the leader line
  this._r.context().beginPath();
  this._r.context().moveTo(acPos.x - 10, acPos.y);
  this._r.context().lineTo(acPos.x - 40, acPos.y);
  this._r.context().lineWidth = 1;
  this._r.context().stroke();
  // Draw the target altitude and speed data block
  this._r.context().beginPath();
  this._r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  this._r.context().textAlign = 'right';
  this._r.context().textBaseline = 'middle';
  var scopeSpeed = Math.floor(aircraft.groundspeed() / 10);
  var scopeAltitude = Math.floor(aircraft.altitude() / 100);
  this._r.context().fillText(this._r.pad(scopeSpeed, 2), acPos.x - 45, acPos.y);
};

CRDA.prototype.setMaster = function(runway) {
  this._master = runway;
};

CRDA.prototype.setSlave = function(runway) {
  this._slave = runway;
};

CRDA.prototype.master = function() {
  return this._master;
};

CRDA.prototype.slave = function() {
  return this._slave;
};

CRDA.prototype.airport = function() {
  return this._airport;
};

CRDA.prototype.inMasterZone = function(aircraft) {
  var distanceInFeet = aircraft.position().distanceTo(this._master.position()) * 3280.84;
  var radioAltitude = aircraft.altitude() - this._master.elevation();
  var gsAltitude = Math.tan(3 * Math.PI / 180) * distanceInFeet;
  if (aircraft.altitude() < gsAltitude + 1000
      && this.angleBetween(aircraft.heading(), this._master.course()) < 90
      && this.inMasterFunnel(aircraft))
    return true;
  return false;
};

CRDA.prototype.angleBetween = function(primaryHeading, secondaryHeading) {
  var gap = Math.abs(primaryHeading - secondaryHeading);
  return Math.min(gap, 360 - gap);
};

CRDA.prototype.inMasterFunnel = function(aircraft) {
  var bearingOffset = (360 - (this._master.course() + this._r.magVar()) + this._master.position().bearingTo(aircraft.position())) % 360;
  var distance = this._master.position().distanceTo(aircraft.position()) * 0.539957;
  return 150 <= bearingOffset && bearingOffset <= 210 && distance <= 30;
};