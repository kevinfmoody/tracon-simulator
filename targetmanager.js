function TargetManager() {
  this._targets = [];
  this._airlines = {};
  this._callsigns = {};

  this._conflicts = [];

  this._alarmSounding = false;
  this._alarm = new Audio('/sounds/ConflictAlert.wav');

  this._targetPurger = setInterval(this.purgeTargets.bind(this), 5 * 1000);
}

TargetManager.SEPARATION_MINIMA = [
  {
    anchor: null,
    radius: null,
    minAltitude: null,
    maxAltitude: 17999,
    lateral: 3,
    vertical: 1000
  },
  {
    anchor: null,
    radius: null,
    minAltitude: 18000,
    maxAltitude: null,
    lateral: 5,
    vertical: 1000
  }
];

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

TargetManager.prototype.getAllOwnedTargets = function() {
  return this.getAllTargets().filter(function(target) {
    return target.controller() !== null && target.controller() === scope.controller();
  });
};

TargetManager.prototype.getTargetsByController = function(controller) {
  var targetsByController = [];
  this._targets.forEach(function(target) {
    if (target.controller() === controller)
      targetsByController.push(target);
  });
  return targetsByController;
};

TargetManager.prototype.getTargetsByAirline = function(airline) {
  var targetsByAirline = [];
  this._targets.forEach(function(target) {
    if (target.callsign().substr(0, 3) === airline)
      targetsByAirline.push(target);
  });
  return targetsByAirline;
};

TargetManager.prototype.getOwnedTargetsByAirline = function(airline) {
  return this.getTargetsByAirline(airline).filter(function(target) {
    return target.controller() !== null && target.controller() === scope.controller();
  });
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

TargetManager.prototype.manageAlarm = function(alarmShouldSound) {
  if (alarmShouldSound && scope.sounds()) {
    if (!this._alarmSounding) {
      this._alarmSounding = true;
      this._alarm.loop = true;
      this._alarm.play();
    }
  } else if (this._alarmSounding) {
    this._alarmSounding = false;
    this._alarm.pause();
  }
};

TargetManager.prototype.classifyMinima = function(localTarget, foreignTarget) {
  var minima = {
    lateral: 0,
    vertical: 0
  };
  for (var i in TargetManager.SEPARATION_MINIMA) {
    var m = TargetManager.SEPARATION_MINIMA[i];
    if (
      (m.lateral > minima.lateral ||
        m.vertical > m.vertical) &&
      (!m.anchor ||
        m.anchor) &&
      (!m.minAltitude ||
        (localTarget.altitude() >= m.minAltitude ||
          foreignTarget.altitude() >= m.minAltitude)) &&
      (!m.maxAltitude ||
        (localTarget.altitude() <= m.maxAltitude ||
          foreignTarget.altitude() <= m.maxAltitude))
    ) {
      minima.lateral = Math.max(m.lateral, minima.lateral);
      minima.vertical = Math.max(m.vertical, minima.vertical);
    }
  }
  return minima;
};

TargetManager.prototype.isInConflict = function(localTarget, foreignTarget) {
  var minima = this.classifyMinima(localTarget, foreignTarget);
  if (Math.abs(localTarget.altitude() - foreignTarget.altitude()) >= minima.vertical)
    return false;
  if (localTarget.position().distanceTo(foreignTarget.position()) * 0.539957 >= minima.lateral)
    return false;
  return true;
};

TargetManager.prototype.detectConflicts = function() {
  var targets = this.getAllTargets(),
      conflicts = Array(targets.length),
      alarmShouldSound = false;
  this._conflicts = [];
  for (var i = 0; i < targets.length; i++) {
    var localTarget = targets[i];
    if (localTarget.conflictState() !== Target.CONFLICT_STATES.INHIBITED) {
      for (var j = i + 1; j < targets.length; j++) {
        var foreignTarget = targets[j];
        if (foreignTarget.conflictState() !== Target.CONFLICT_STATES.INHIBITED) {
          if (this.isInConflict(localTarget, foreignTarget)) {
            if (localTarget.callsign() < foreignTarget.callsign())
              this._conflicts.push(localTarget.callsign() + '*' + foreignTarget.callsign());
            else
              this._conflicts.push(foreignTarget.callsign() + '*' + localTarget.callsign());
            if (conflicts[i])
              conflicts[i].push(foreignTarget);
            else
              conflicts[i] = [foreignTarget];
            if (conflicts[j])
              conflicts[j].push(localTarget);
            else
              conflicts[j] = [localTarget];
          }
        }
      }
    }
  }
  this._conflicts.sort();
  targets.forEach(function(target, index) {
    if (!conflicts[index])
      conflicts[index] = [];
    if (target.setTargetsInConflict(conflicts[index]) ===
        Target.CONFLICT_STATES.CONFLICTING)
      alarmShouldSound = true;
  });
  this.manageAlarm(alarmShouldSound);
};

TargetManager.prototype.conflicts = function() {
  return this._conflicts;
};

TargetManager.prototype.purgeTarget = function(target) {
  for (var i = 0; i < this._targets.length; i++) {
    var t = this._targets[i];
    if (t === target) {
      this._targets.splice(i, 1);
      return;
    }
  }
};

TargetManager.prototype.purgeTargets = function() {
  var purged = false;
  for (var i = 0; i < this._targets.length; i++) {
    var target = this._targets[i];
    if (target.isAwaitingPurge()) {
      purged = true;
      this._targets.splice(i, 1);
      i--;
    }
  }
  if (purged)
    this.updateCallsigns();
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
  this.updateCallsigns();
};

TargetManager.prototype.reset = function() {
  this._targets = [];
  this.updateCallsigns();
};

TargetManager.prototype.updateCallsigns = _.throttle(function() {
  var airlines = {};
  this._targets.forEach(function(target) {
    airlines[target.callsign().substr(0, 3)] = true;
  });
  $.get('/api/callsigns', {
    airlines: Object.keys(airlines)
  }, function(callsigns) {
    var airlines = {};
    for (var i in callsigns)
      airlines[callsigns[i].toUpperCase()] = i.toUpperCase();
    this._airlines = airlines;
    this._callsigns = callsigns;
  }.bind(this));
}, 1000, {
  leading: false
});

TargetManager.prototype.callsigns = function() {
  return Object.keys(this._airlines);
};

TargetManager.prototype.getAirlineByCallsign = function(callsign) {
  return this._airlines[callsign];
};

TargetManager.prototype.getCallsignByAirline = function(airline) {
  return this._callsigns[airline];
};

TargetManager.prototype.render = function(r) {
  var elapsedRenderer = r.elapsed(),
      targets = this.getAllTargets(),
      targetsInRange = [];
  this.detectConflicts();
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