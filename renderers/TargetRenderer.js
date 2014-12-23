function TargetRenderer(target) {
  this._target = target;
}


/*****************/
/** CLASS LEVEL **/
/*****************/

TargetRenderer.DIRECTION = {
  N: 0.00 * Math.PI,
  NE: 0.25 * Math.PI,
  E: 0.50 * Math.PI,
  SE: 0.75 * Math.PI,
  S: 1.00 * Math.PI,
  SW: 1.25 * Math.PI,
  W: 1.50 * Math.PI,
  NW: 1.75 * Math.PI
};

TargetRenderer.setLeaderLength = function(length) {
  console.log(length);
  TargetRenderer.LEADER_LENGTH = Math.min(Math.max(parseInt(length, 10), 0), 7);
  console.log(TargetRenderer.LEADER_LENGTH);
};

TargetRenderer.setLeaderDirection = function(directionString) {
  if (directionString in TargetRenderer.DIRECTION)
    TargetRenderer.LEADER_DIRECTION = TargetRenderer.DIRECTION[directionString];
};

TargetRenderer.getLeaderDirectionString = function() {
  for (var key in TargetRenderer.DIRECTION)
    if (TargetRenderer.DIRECTION[key] === TargetRenderer.LEADER_DIRECTION)
      return key;
};

TargetRenderer.LEADER_LENGTH = 3;
TargetRenderer.LEADER_DIRECTION = TargetRenderer.DIRECTION.N;
TargetRenderer.LEADER_TIP_OFFSET = {
  length: TargetRenderer.LEADER_LENGTH,
  direction: TargetRenderer.LEADER_DIRECTION
};

TargetRenderer.getLeaderTipOffset = function() {
  return Renderer.staticRotate(0, TargetRenderer.LEADER_LENGTH * 15, 0, 0, TargetRenderer.LEADER_DIRECTION);
};

/********************/
/** INSTANCE LEVEL **/
/********************/

TargetRenderer.prototype.renderDataBlockColor = function(elapsed) {
  if (this._target._controlState === this._target._controlStates.INBOUND_HANDOFF ||
    this._target._controlState === this._target._controlStates.POST_HANDOFF)
    return elapsed % 1000 < 500 ? '#fff' : '#bbb';
  else if (this._target._controlState === this._target._controlStates.POST_HANDOFF)
    return elapsed % 1000 < 500 ? '#0c0' : '#080';
  else if (this._target.isOwned())
    return '#fff';
  else
    return '#0c0';
};

TargetRenderer.prototype.renderCone = function(r) {
  if (this._target.course() == -1)
    return;
  if (this._target.isDisplayingCone()) {
    var magCourse = this._target.course() - r.magVar(),
        len = r.distanceToPixels(this._target.position(), this._target.course(), this._target._coneSize),
        width = r.distanceToPixels(this._target.position(), this._target.course(), 0.5),
        pos = r.gtoc(this._target.position()._lat, this._target.position()._lon),
        theta = -magCourse * Math.PI / 180,
        minLeft = r.rotate(-width / 2 * 0.4, -len * 0.4, 0, 0, theta),
        minRight = r.rotate(width / 2 * 0.4, -len * 0.4, 0, 0, theta),
        midLeft = r.rotate(-width / 2 * 0.6, -len * 0.6, 0, 0, theta),
        midRight = r.rotate(width / 2 * 0.6, -len * 0.6, 0, 0, theta),
        maxLeft = r.rotate(-width / 2, -len, 0, 0, theta),
        maxRight = r.rotate(width / 2, -len, 0, 0, theta),
        distanceLabel = r.rotate(0, -len / 2, 0, 0, theta);
    r.context().strokeStyle = '#369';
    r.context().lineWidth = 1;
    r.context().beginPath();
    r.context().moveTo(pos.x + minLeft.x, pos.y + minLeft.y);
    r.context().lineTo(pos.x, pos.y);
    r.context().lineTo(pos.x + minRight.x, pos.y + minRight.y);
    r.context().stroke();
    r.context().beginPath();
    r.context().moveTo(pos.x + midLeft.x, pos.y + midLeft.y);
    r.context().lineTo(pos.x + maxLeft.x, pos.y + maxLeft.y);
    r.context().lineTo(pos.x + maxRight.x, pos.y + maxRight.y);
    r.context().lineTo(pos.x + midRight.x, pos.y + midRight.y);
    r.context().stroke();
    r.context().beginPath();
    r.context().font = 'bold ' + width + 'px Oxygen Mono';
    r.context().textAlign = 'center';
    r.context().textBaseline = 'middle';
    r.context().fillStyle = '#369';
    r.context().fillText('' + this._target._coneSize, pos.x + distanceLabel.x, pos.y + distanceLabel.y);
  }
};

TargetRenderer.prototype.renderJRing = function(r) {
  if (this._target.isDisplayingJRing()) {
    var pos = r.gtoc(this._target.position()._lat, this._target.position()._lon);
    r.context().strokeStyle = '#369';
    r.context().lineWidth = 1;
    r.context().beginPath();
    r.context().arc(pos.x, pos.y, r.distanceToPixels(this._target.position(), this._target.course(), this._target._jRingSize), 0, 2 * Math.PI);
    r.context().stroke();
  }
};

TargetRenderer.prototype.renderExtras = function(r) {
  this.renderJRing(r);
  this.renderCone(r);

  // if (this._target.callsign() === 'ICE98') {
  //   var ACTIVE_LEGS = [
  //     {
  //       startPosition: new LatLon(42.53728102399617, -69.99036947154653),
  //       endPosition: new LatLon(42.44679377265025, -70.47755508601381)
  //     },
  //     {
  //       startPosition: new LatLon(42.44679377265025, -70.47755508601381),
  //       endPosition: new LatLon(42.52755728169469, -70.61846177278272)
  //     },
  //     {
  //       startPosition: new LatLon(42.52755728169469, -70.61846177278272),
  //       endPosition: new LatLon(42.72859260197211, -70.48297467454829)
  //     }
  //   ];

  //   r.context().strokeStyle = 'orange';
  //   r.context().lineWidth = 2;
  //   for (var i in ACTIVE_LEGS) {
  //     var start = r.gtoc(ACTIVE_LEGS[i].startPosition._lat, ACTIVE_LEGS[i].startPosition._lon);
  //     var end = r.gtoc(ACTIVE_LEGS[i].endPosition._lat, ACTIVE_LEGS[i].endPosition._lon);
  //     r.context().beginPath();
  //     r.context().moveTo(start.x, start.y);
  //     r.context().lineTo(end.x, end.y);
  //     r.context().stroke();
  //   }
  // }
};

TargetRenderer.prototype.renderHistory = function(r) {
  if (r.targetHistory()) {
    r.context().fillStyle = '#00f';
    for (var i in this._target.history().slice(1)) {
      var historyPos = r.gtoc(this._target.history()[i]._lat, this._target.history()[i]._lon);
      r.context().beginPath();
      r.context().arc(historyPos.x, historyPos.y, 5 - Math.floor((i - 1) / 2), 0, 2 * Math.PI);
      r.context().globalAlpha = 0.5 - (i - 1) / 10;
      r.context().fill();
    }
    r.context().globalAlpha = 1;
  }
};

TargetRenderer.prototype.renderTarget = function(r) {
  if (this._target.isCoasting())
    return;
  // Determine size of beacon based on distance from radar site
  var radarDistance = r.radarCenterPosition().distanceTo(this._target.position()) * 0.539957;
  var beaconWidth = Math.min(Math.max(4 * Math.sqrt(radarDistance), 4), 32);
  var acPos = r.gtoc(this._target.position()._lat, this._target.position()._lon);
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

TargetRenderer.prototype.renderPosition = function(r, elapsed) {
  var acPos = r.gtoc(this._target.position()._lat, this._target.position()._lon),
      targetCode = this._target.isControlled() ? this._target.controller().getTargetCode() : '*';
  r.context().beginPath();
  r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  r.context().textAlign = 'center';
  r.context().textBaseline = 'middle';
  r.context().strokeStyle = '#000';
  r.context().lineWidth = 2;
  r.context().strokeText(targetCode, acPos.x, acPos.y);
  r.context().fillStyle = this.renderDataBlockColor(elapsed);
  r.context().fillText(targetCode, acPos.x, acPos.y);
};

TargetRenderer.prototype.renderPartialDataBlock = function(r, elapsed) {
  var acPos = r.gtoc(this._target.position()._lat, this._target.position()._lon),
      leaderTipOffset = TargetRenderer.getLeaderTipOffset();
  // Draw the target altitude and speed
  r.context().beginPath();
  r.context().imageSmoothingEnabled= false;
  r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  r.context().textAlign = 'left';
  r.context().textBaseline = 'middle';
  r.context().fillStyle = this.renderDataBlockColor(elapsed);
  var scopeSpeed = Math.floor(this._target.speed() / 10);
  var scopeAltitude = Math.floor(this._target.altitude() / 100);
  r.context().fillText(r.pad(scopeAltitude, 3) + '  ' + r.pad(scopeSpeed, 2), acPos.x + leaderTipOffset.x + 5, acPos.y - 10 - leaderTipOffset.y);
  r.context().imageSmoothingEnabled = true;
};

TargetRenderer.prototype.renderFullDataBlock = function(r, elapsed) {
  var acPos = r.gtoc(this._target.position()._lat, this._target.position()._lon),
      leaderTipOffset = TargetRenderer.getLeaderTipOffset();
  // Draw the target callsign
  r.context().beginPath();
  r.context().imageSmoothingEnabled= false;
  r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  r.context().textAlign = 'left';
  r.context().textBaseline = 'middle';
  r.context().fillStyle = this.renderDataBlockColor(elapsed);
  r.context().fillText(this._target.callsign(), acPos.x + leaderTipOffset.x + 5, acPos.y - 10 - leaderTipOffset.y);
  r.context().imageSmoothingEnabled = true;
  // Draw the target aircraft, altitude, and speed data block
  r.context().beginPath();
  r.context().font = 'bold ' + 14 + 'px Oxygen Mono';
  r.context().textAlign = 'left';
  r.context().textBaseline = 'middle';
  r.context().fillStyle = this.renderDataBlockColor(elapsed);
  var scopeSpeed = Math.floor(this._target.speed() / 10),
      scopeAltitude = Math.floor(this._target.altitude() / 100),
      scopeText,
      otherController = this._target.otherController(),
      spacing = otherController ? otherController.getIdentifier() : '  ';
  if (this._target.isCoasting())
    scopeText = 'CST' + spacing + (elapsed % 4000 < 2000 ? r.pad(scopeSpeed, 2) : this._target.type());
  else
    scopeText = elapsed % 4000 < 2000 ? r.pad(scopeAltitude, 3) + spacing + r.pad(scopeSpeed, 2) : this._target.arrival() + spacing + this._target.type();
  r.context().fillText(scopeText, acPos.x + leaderTipOffset.x + 5, acPos.y - 10 - (leaderTipOffset.y - 15));
};

TargetRenderer.prototype.renderDataBlock = function(r, elapsed) {
  var acPos = r.gtoc(this._target.position()._lat, this._target.position()._lon),
      leaderTipOffset = TargetRenderer.getLeaderTipOffset();
  // Draw the leader line
  r.context().beginPath();
  r.context().moveTo(acPos.x, acPos.y + -10);
  r.context().lineTo(acPos.x + leaderTipOffset.x, acPos.y - 10 - leaderTipOffset.y);
  r.context().lineWidth = 1;
  r.context().strokeStyle = this.renderDataBlockColor(elapsed);
  r.context().stroke();
  if (this._target.isExpanded())
    this.renderFullDataBlock(r, elapsed);
  else
    this.renderPartialDataBlock(r, elapsed);
};