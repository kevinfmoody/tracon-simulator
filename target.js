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
  this.update(blip.callsign(), blip.mode(), blip.type(), blip.arrival(), blip.position(), blip.altitude(), blip.speed(), blip.squawk());
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
  if (this._position)
    this.addHistory(this._position);
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
  if (this._history.length > 5)
    this._history.length = 5;
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
  return this._history;
};

Target.prototype.course = function() {
  return this.history().length ? this.history()[0].bearingTo(this.position()) : -1;
};

Target.prototype.enableCone = function(size) {
  debugger
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
  debugger
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

Target.prototype.renderDataBlockColor = function() {
  return this.isControlled() ? '#fff' : '#0c0';
};

Target.prototype.renderCone = function(r) {
  if (this.course() == -1)
    return;
  if (this.isDisplayingCone()) {
    var magCourse = this.course() - r.magVar(),
        len = r.distanceToPixels(this.position(), this.course(), this._coneSize),
        width = r.distanceToPixels(this.position(), this.course(), .3),
        pos = r.gtoc(this.position()._lat, this.position()._lon),
        leadLeft = r.rotate(-width / 2, len, 0, 0, magCourse * Math.PI / 180),
        leadRight = r.rotate(width / 2, len, 0, 0, magCourse * Math.PI / 180);
    r.context().strokeStyle = '#369';
    r.context().lineWidth = 1;
    r.context().beginPath();
    r.context().moveTo(pos.x, pos.y);
    r.context().lineTo(pos.x + leadLeft.x, pos.y + leadLeft.y);
    r.context().lineTo(pos.x + leadRight.x, pos.y + leadRight.y);
    r.context().lineTo(pos.x, pos.y);
    r.context().stroke();
  }
};

Target.prototype.renderJRing = function(r) {
  if (this.isDisplayingJRing()) {
    var pos = r.gtoc(this.position()._lat, this.position()._lon);
    r.context().strokeStyle = '#369';
    r.context().lineWidth = 1;
    r.context().beginPath();
    r.context().arc(pos.x, pos.y, r.distanceToPixels(this.position(), this.course(), this._jRingSize), 0, 2 * Math.PI);
    r.context().stroke();
  }
};

Target.prototype.renderExtras = function(r) {
  this.renderJRing(r);
  this.renderCone(r);
};

Target.prototype.renderHistory = function(r) {
  if (r.targetHistory()) {
    r.context().fillStyle = '#00f';
    for (var i in this.history()) {
      var historyPos = r.gtoc(this.history()[i]._lat, this.history()[i]._lon);
      r.context().beginPath();
      r.context().arc(historyPos.x, historyPos.y, 5 - Math.floor(i / 2), 0, 2 * Math.PI);
      r.context().globalAlpha = .5 - i / 10;
      r.context().fill();
    }
    r.context().globalAlpha = 1;
  }
};

Target.prototype.renderTarget = function(r) {
  if (this.isCoasting())
    return;
  // Determine size of beacon based on distance from radar site
  var radarDistance = r.radarCenterPosition().distanceTo(this.position()) * 0.539957;
  var beaconWidth = Math.min(Math.max(4 * Math.sqrt(radarDistance), 4), 32);
  var acPos = r.gtoc(this.position()._lat, this.position()._lon);
  var radarCenter = r.radarCenter();
  var theta = r.angleBetween(acPos.x, acPos.y, radarCenter.x, radarCenter.y) + Math.PI / 2;
  // Draw the beacon line
  var lineL = r.rotate(-beaconWidth, 0, 0, 0, theta);
  var lineR = r.rotate(beaconWidth, 0, 0, 0, theta);
  r.context().beginPath();
  r.context().moveTo(acPos.x + lineL.x, acPos.y + lineL.y);
  r.context().lineTo(acPos.x + lineR.x, acPos.y + lineR.y);
  r.context().strokeStyle = '#1e582f';
  r.context().lineWidth = 2;
  r.context().stroke();
  // Draw the beacon target
  var boxBL = r.rotate(-beaconWidth / 2, 0, 0, 0, theta);
  var boxTL = r.rotate(-beaconWidth / 2, 9, 0, 0, theta);
  var boxTR = r.rotate(beaconWidth / 2, 9, 0, 0, theta);
  var boxBR = r.rotate(beaconWidth / 2, 0, 0, 0, theta);
  r.context().beginPath();
  r.context().moveTo(acPos.x + boxBL.x, acPos.y + boxBL.y);
  r.context().lineTo(acPos.x + boxTL.x, acPos.y + boxTL.y);
  r.context().lineTo(acPos.x + boxTR.x, acPos.y + boxTR.y);
  r.context().lineTo(acPos.x + boxBR.x, acPos.y + boxBR.y);
  r.context().fillStyle = '#2d82ed';
  r.context().fill();
};

Target.prototype.renderPosition = function(r) {
  var acPos = r.gtoc(this.position()._lat, this.position()._lon),
      targetCode = this.isControlled() ? this.controller().getTargetCode() : '*';
  r.context().beginPath();
  r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  r.context().textAlign = 'center';
  r.context().textBaseline = 'middle';
  r.context().strokeStyle = '#000';
  r.context().lineWidth = 2;
  r.context().strokeText(targetCode, acPos.x, acPos.y);
  r.context().fillStyle = this.renderDataBlockColor();
  r.context().fillText(targetCode, acPos.x, acPos.y);
};

Target.prototype.renderPartialDataBlock = function(r, elapsed) {
  var acPos = r.gtoc(this.position()._lat, this.position()._lon);
  // Draw the target altitude and speed
  r.context().beginPath();
  r.context().imageSmoothingEnabled= false;
  r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  r.context().textAlign = 'left';
  r.context().textBaseline = 'middle';
  r.context().fillStyle = this.renderDataBlockColor();
  var scopeSpeed = Math.floor(this.speed() / 10);
  var scopeAltitude = Math.floor(this.altitude() / 100);
  r.context().fillText(r.pad(scopeAltitude, 3) + '  ' + r.pad(scopeSpeed, 2), acPos.x + 5, acPos.y + -45);
  r.context().imageSmoothingEnabled = true;
};

Target.prototype.renderFullDataBlock = function(r, elapsed) {
  var acPos = r.gtoc(this.position()._lat, this.position()._lon);
  // Draw the target callsign
  r.context().beginPath();
  r.context().imageSmoothingEnabled= false;
  r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  r.context().textAlign = 'left';
  r.context().textBaseline = 'middle';
  r.context().fillStyle = this.renderDataBlockColor();
  r.context().fillText(this.callsign(), acPos.x + 5, acPos.y + -45);
  r.context().imageSmoothingEnabled = true;
  // Draw the target aircraft, altitude, and speed data block
  r.context().beginPath();
  r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  r.context().textAlign = 'left';
  r.context().textBaseline = 'middle';
  r.context().fillStyle = this.renderDataBlockColor();
  var scopeSpeed = Math.floor(this.speed() / 10),
      scopeAltitude = Math.floor(this.altitude() / 100),
      scopeText;
  if (this.isCoasting())
    scopeText = 'CST  ' + (elapsed % 4000 < 2000 ? r.pad(scopeSpeed, 2) : this.type());
  else
    scopeText = elapsed % 4000 < 2000 ? r.pad(scopeAltitude, 3) + '  ' + r.pad(scopeSpeed, 2) : this.arrival() + '  ' + this.type()
  r.context().fillText(scopeText, acPos.x + 5, acPos.y + -30);
};

Target.prototype.renderDataBlock = function(r, elapsed) {
  var acPos = r.gtoc(this.position()._lat, this.position()._lon);
  // Draw the leader line
  r.context().beginPath();
  r.context().moveTo(acPos.x, acPos.y + -10);
  r.context().lineTo(acPos.x, acPos.y + -45);
  r.context().lineWidth = 1;
  r.context().strokeStyle = this.renderDataBlockColor();
  r.context().stroke();
  if (this.isExpanded())
    this.renderFullDataBlock(r, elapsed);
  else
    this.renderPartialDataBlock(r, elapsed);
};