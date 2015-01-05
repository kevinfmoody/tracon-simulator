function ConflictDetectionEngine() {
  this._conflictStates = {};
  this._conflicts = {};
  this._audibleConflicts = 0;
  this._alarmSounding = false;
  this._alarm = new Audio('../atc2/conflictalert.wav');
  this._separationMinima = [
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
  this._conflictState = {
    NONE: 1,
    ACTIVE: 2,
    MUTED: 3
  }
}

ConflictDetectionEngine.prototype.conflicts = function() {
  var identifiers = [];
  for (var id in this._conflictStates)
    if (this._conflictStates[id] != this._conflictState.NONE)
      identifiers.push(id);
  return identifiers;
};

ConflictDetectionEngine.prototype.manageAlarm = function() {
  if (this._audibleConflicts > 0) {
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

ConflictDetectionEngine.prototype.singleTargetInConflict = function(target) {
  if (this._conflicts[target.callsign()])
    return true;
  else return false;
};

ConflictDetectionEngine.prototype.detect = function(targets) {
  var callsigns = Object.keys(targets);
  var numTarget = callsigns.length;
  for (var i = 0; i < numTarget; i++) {
    for (var j = i + 1; j < numTarget; j++) {
      var localTarget = targets[callsigns[i]];
      var foreignTarget = targets[callsigns[j]];
      if (this.inConflict(localTarget, foreignTarget))
        this.addConflict(localTarget, foreignTarget);
      else
        this.removeConflict(localTarget, foreignTarget);
    }
  }
};

ConflictDetectionEngine.prototype.addConflict = function(localTarget, foreignTarget) {
  var identifier = this.targetsToIdentifier(localTarget, foreignTarget);
  if (!this._conflictStates[identifier] || this._conflictStates[identifier] == this._conflictState.NONE) {
    this._conflictStates[identifier] = this._conflictState.ACTIVE;
    if (!this._conflicts[localTarget.callsign()])
      this._conflicts[localTarget.callsign()] = 0;
    this._conflicts[localTarget.callsign()]++;
    if (!this._conflicts[foreignTarget.callsign()])
      this._conflicts[foreignTarget.callsign()] = 0;
    this._conflicts[foreignTarget.callsign()]++;
    this._audibleConflicts++;
  }
};

ConflictDetectionEngine.prototype.removeConflict = function(localTarget, foreignTarget) {
  var identifier = this.targetsToIdentifier(localTarget, foreignTarget);
  if (this._conflictStates[identifier] == this._conflictState.ACTIVE) {
    this._conflictStates[identifier] = this._conflictState.NONE;
    this._conflicts[localTarget.callsign()]--;
    this._conflicts[foreignTarget.callsign()]--;
    this._audibleConflicts--;
  } else if (this._conflictStates[identifier] == this._conflictState.MUTED) {
    this._conflictStates[identifier] = this._conflictState.NONE;
    this._conflicts[localTarget.callsign()]--;
    this._conflicts[foreignTarget.callsign()]--;
  }
};

ConflictDetectionEngine.prototype.muteTarget = function(localTarget, targets) {
  if (this._audibleConflicts > 0)
    for (var i in targets)
      this.muteConflict(localTarget, targets[i]);
};

ConflictDetectionEngine.prototype.muteConflict = function(localTarget, foreignTarget) {
  var identifier = this.targetsToIdentifier(localTarget, foreignTarget);
  if (this._conflictStates[identifier] == this._conflictState.ACTIVE) {
    this._conflictStates[identifier] = this._conflictState.MUTED;
    this._audibleConflicts--;
    this.manageAlarm();
  }
};

ConflictDetectionEngine.prototype.unmuteConflict = function(localTarget, foreignTarget) {
  var identifier = this.targetsToIdentifier(localTarget, foreignTarget);
  if (this._conflictStates[identifier] == this._conflictState.MUTED) {
    this._conflictStates[identifier] = this._conflictState.ACTIVE;
    this._audibleConflicts++;
    this.manageAlarm();
  }
};

ConflictDetectionEngine.prototype.targetsToIdentifier = function(localTarget, foreignTarget) {
  var targets = [localTarget.callsign(), foreignTarget.callsign()];
  targets.sort();
  return targets.join('*');
};

ConflictDetectionEngine.prototype.classifyMinima = function(localTarget, foreignTarget) {
  var minima = {
    lateral: 0,
    vertical: 0
  };
  for (var i in this._separationMinima) {
    var m = this._separationMinima[i];
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

ConflictDetectionEngine.prototype.inConflict = function(localTarget, foreignTarget) {
  var minima = this.classifyMinima(localTarget, foreignTarget);
    if (Math.abs(localTarget.altitude() - foreignTarget.altitude()) >= minima.vertical)
    return false;
  var localPosition = new LatLon(localTarget.lat(), localTarget.lon());
  var foreignTarget = new LatLon(foreignTarget.lat(), foreignTarget.lon());
   if (localPosition.distanceTo(foreignTarget) * 0.539957 >= minima.lateral)
    return false;
  return true;
};