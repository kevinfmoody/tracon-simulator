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

TargetManager.prototype.massHandoff = function(fromController, toController) {
  this.getTargetsByController(fromController).forEach(function(target) {
    target.setController(toController);
  });
};

TargetManager.prototype.getTargetByCallsign = function(callsign) {
  for (var i = 0; i < this._targets.length; i++) {
    if (this._targets[i].callsign() === callsign)
      return this._targets[i];
  }
  return null;
};

TargetManager.prototype.purgeTargets = function() {
  for (var i = 0; i < this._targets.length; i++)
    if (target.isAwaitingPurge())
      this._targets.splice(i, 1);
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
  for (var a in targets)
    if (r.inBounds(targets[a].position()._lat, targets[a].position()._lon))
      targetsInRange.push(new TargetRenderer(targets[a]));
  for (var b in targetsInRange)
    targetsInRange[b].renderHistory(r);
  for (var c in targetsInRange)
    targetsInRange[c].renderExtras(r);
  for (var d in targetsInRange)
    targetsInRange[d].renderTarget(r);
  for (var e in targetsInRange)
    targetsInRange[e].renderPosition(r, elapsedRenderer);
  for (var f in targetsInRange)
    targetsInRange[f].renderDataBlock(r, elapsedRenderer);
};