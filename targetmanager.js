function TargetManager() {
  this._targets = [];
}

TargetManager.prototype.select = function(x, y, r) {
  var targets = this.getAllTargets(),
      selectedTarget = null,
      i = 0;
  for (i; i < targets.length; i++) {
    targets[i].deselect();
    var coordinates = r.gtoc(targets[i].position()._lat, targets[i].position()._lon);
    var dx = coordinates.x - x;
    var dy = coordinates.y - y;
    var distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    if (distance < 15) {
      selectedTarget = targets[i];
      selectedTarget.select();
      //this._cde.muteAircraft(selectedTarget, targets);
      break;
    }
  }
  for (i = i + 1; i < targets.length; i++)
    targets[i].deselect();
  return selectedTarget;
};

TargetManager.prototype.getAllTargets = function() {
  return this._targets;
};

TargetManager.prototype.getTargetsByController = function(controller) {
  var targetsByController = [];
  this._targets.forEach(function(target) {
    if (target.controller() === controller)
      targetsByController.push(target);
  });
  return targetsByController;
};

TargetManager.prototype.getTargetByCallsign = function(callsign) {
  for (var i = 0; i < this._targets.length; i++) {
    if (this._targets[i].callsign() === callsign)
      return this._targets[i];
  };
  return null;
};

TargetManager.prototype.noRadarReturn = function(callsign) {
  for (var i = 0; i < this._targets.length; i++) {
    var target = this._targets[i];
    if (target.callsign() === callsign) {
      target.noRadarReturn();
      if (target.isAwaitingPurge())
        this._targets.splice(i, 1);
      return;
    }
  }
};

TargetManager.prototype.addTarget = function(target) {
  this._targets.push(target);
};

TargetManager.prototype.reset = function() {
  this._targets = [];
};

TargetManager.prototype.render = function(r) {
  var elapsedRenderer = r.elapsed(),
      targets = this.getAllTargets(),
      targetsInRange = [];
  for (var i in targets)
    if (r.inBounds(targets[i].position()._lat, targets[i].position()._lon))
      targetsInRange.push(targets[i]);
  for (var i in targetsInRange)
    targetsInRange[i].renderHistory(r);
  for (var i in targetsInRange)
    targetsInRange[i].renderExtras(r);
  for (var i in targetsInRange)
    targetsInRange[i].renderTarget(r);
  for (var i in targetsInRange)
    targetsInRange[i].renderPosition(r);
  for (var i in targetsInRange)
    targetsInRange[i].renderDataBlock(r, elapsedRenderer);
};