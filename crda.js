function CRDA(airport, masterRunwayID, slaveRunwayID) {
  this._airport = airport;
  this._master = airport.runway(masterRunwayID);
  this._slave = airport.runway(slaveRunwayID);

  if (!this._master || !this._slave)
    throw CRDA.ERROR.INVALID_RUNWAYS;

  this._enabled = true;
}

CRDA.ERROR = {
  INVALID_RUNWAYS: 1
};

CRDA.prototype.enable = function() {
  this._enabled = true;
};

CRDA.prototype.disable = function() {
  this._enabled = false;
};

CRDA.prototype.isEnabled = function() {
  return this._enabled;
};

CRDA.prototype.toggle = function() {
  this._enabled = !this._enabled;
};

CRDA.prototype.ghostTargets = function(targetManager, r) {
  var targets = targetManager.getAllTargets();
  for (var i in targets)
    this.ghostTarget(targets[i], r);
};

CRDA.prototype.ghostTarget = function(target, r) {
  if (this._master && this.inMasterZone(target, r))
    this.renderGhost(target, this.ghostPosition(target, r), r);
};

CRDA.prototype.ghostPosition = function(target, r) {
  var bearingOffset = 360 - (this._master.course() + r.magVar()) + this._master.position().bearingTo(target.position());
  var distance = this._master.position().distanceTo(target.position());
  return this._slave.position().destinationPoint(this._slave.course() + r.magVar() + bearingOffset, distance);
};

CRDA.prototype.renderGhost = function(target, position, r) {
  var acPos = r.gtoc(position._lat, position._lon);
  r.context().fillStyle = '#ff0';
  r.context().strokeStyle = '#ff0';
  // Render position
  r.context().beginPath();
  r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  r.context().textAlign = 'center';
  r.context().textBaseline = 'middle';
  r.context().fillText('0', acPos.x, acPos.y);
  // Draw the leader line
  r.context().beginPath();
  r.context().moveTo(acPos.x - 10, acPos.y);
  r.context().lineTo(acPos.x - 40, acPos.y);
  r.context().lineWidth = 1;
  r.context().stroke();
  // Draw the target altitude and speed data block
  r.context().beginPath();
  r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  r.context().textAlign = 'right';
  r.context().textBaseline = 'middle';
  var scopeSpeed = Math.floor(target.speed() / 10);
  var scopeAltitude = Math.floor(target.altitude() / 100);
  r.context().fillText(r.pad(scopeSpeed, 2), acPos.x - 45, acPos.y);
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

CRDA.prototype.inMasterZone = function(target, r) {
  if (target.course() == -1)
    return false;
  var distanceInFeet = target.position().distanceTo(this._master.position()) * 3280.84;
  var radioAltitude = target.altitude() - this._master.elevation();
  var gsAltitude = Math.tan(3 * Math.PI / 180) * distanceInFeet;
  if (target.altitude() < gsAltitude + 1000
      && this.angleBetween(target.course(), this._master.course()) < 90
      && this.inMasterFunnel(target, r))
    return true;
  return false;
};

CRDA.prototype.angleBetween = function(primaryHeading, secondaryHeading) {
  var gap = Math.abs(primaryHeading - secondaryHeading);
  return Math.min(gap, 360 - gap);
};

CRDA.prototype.inMasterFunnel = function(target, r) {
  var bearingOffset = (360 - (this._master.course() + r.magVar()) + this._master.position().bearingTo(target.position())) % 360;
  var distance = this._master.position().distanceTo(target.position()) * 0.539957;
  return 150 <= bearingOffset && bearingOffset <= 210 && distance <= 30;
};