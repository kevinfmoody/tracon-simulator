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

ConflictDetectionEngine.prototype.singleAircraftInConflict = function(aircraft) {
  if (this._conflicts[aircraft.callsign()])
    return true;
  else return false;
};

ConflictDetectionEngine.prototype.detect = function(aircraft) {
  var callsigns = Object.keys(aircraft);
  var numAircraft = callsigns.length;
  for (var i = 0; i < numAircraft; i++) {
    for (var j = i + 1; j < numAircraft; j++) {
      var localAircraft = aircraft[callsigns[i]];
      var foreignAircraft = aircraft[callsigns[j]];
      if (this.inConflict(localAircraft, foreignAircraft))
        this.addConflict(localAircraft, foreignAircraft);
      else
        this.removeConflict(localAircraft, foreignAircraft);
    }
  }
};

ConflictDetectionEngine.prototype.addConflict = function(localAircraft, foreignAircraft) {
  var identifier = this.aircraftToIdentifier(localAircraft, foreignAircraft);
  if (!this._conflictStates[identifier] || this._conflictStates[identifier] == this._conflictState.NONE) {
    this._conflictStates[identifier] = this._conflictState.ACTIVE;
    if (!this._conflicts[localAircraft.callsign()])
      this._conflicts[localAircraft.callsign()] = 0;
    this._conflicts[localAircraft.callsign()]++;
    if (!this._conflicts[foreignAircraft.callsign()])
      this._conflicts[foreignAircraft.callsign()] = 0;
    this._conflicts[foreignAircraft.callsign()]++;
    this._audibleConflicts++;
  }
};

ConflictDetectionEngine.prototype.removeConflict = function(localAircraft, foreignAircraft) {
  var identifier = this.aircraftToIdentifier(localAircraft, foreignAircraft);
  if (this._conflictStates[identifier] == this._conflictState.ACTIVE) {
    this._conflictStates[identifier] = this._conflictState.NONE;
    this._conflicts[localAircraft.callsign()]--;
    this._conflicts[foreignAircraft.callsign()]--;
    this._audibleConflicts--;
  } else if (this._conflictStates[identifier] == this._conflictState.MUTED) {
    this._conflictStates[identifier] = this._conflictState.NONE;
    this._conflicts[localAircraft.callsign()]--;
    this._conflicts[foreignAircraft.callsign()]--;
  }
};

ConflictDetectionEngine.prototype.muteAircraft = function(localAircraft, aircraft) {
  if (this._audibleConflicts > 0)
    for (var i in aircraft)
      this.muteConflict(localAircraft, aircraft[i]);
};

ConflictDetectionEngine.prototype.muteConflict = function(localAircraft, foreignAircraft) {
  var identifier = this.aircraftToIdentifier(localAircraft, foreignAircraft);
  if (this._conflictStates[identifier] == this._conflictState.ACTIVE) {
    this._conflictStates[identifier] = this._conflictState.MUTED;
    this._audibleConflicts--;
    this.manageAlarm();
  }
};

ConflictDetectionEngine.prototype.unmuteConflict = function(localAircraft, foreignAircraft) {
  var identifier = this.aircraftToIdentifier(localAircraft, foreignAircraft);
  if (this._conflictStates[identifier] == this._conflictState.MUTED) {
    this._conflictStates[identifier] = this._conflictState.ACTIVE;
    this._audibleConflicts++;
    this.manageAlarm();
  }
};

ConflictDetectionEngine.prototype.aircraftToIdentifier = function(localAircraft, foreignAircraft) {
  var aircraft = [localAircraft.callsign(), foreignAircraft.callsign()];
  aircraft.sort();
  return aircraft.join('*');
};

ConflictDetectionEngine.prototype.classifyMinima = function(localAircraft, foreignAircraft) {
  var minima = {
    lateral: 0,
    vertical: 0
  };
  for (var i in this._separationMinima) {
    var m = this._separationMinima[i];
    if (
      (m.lateral > minima.lateral 
        || m.vertical > m.vertical)
      && (!m.anchor
        || m.anchor)
      && (!m.minAltitude 
        || (localAircraft.altitude() >= m.minAltitude 
          || foreignAircraft.altitude() >= m.minAltitude))
      && (!m.maxAltitude
        || (localAircraft.altitude() <= m.maxAltitude
          || foreignAircraft.altitude() <= m.maxAltitude))
    ) {
      minima.lateral = Math.max(m.lateral, minima.lateral);
      minima.vertical = Math.max(m.vertical, minima.vertical);
    }
  }
  return minima;
};

ConflictDetectionEngine.prototype.inConflict = function(localAircraft, foreignAircraft) {
  var minima = this.classifyMinima(localAircraft, foreignAircraft);
    if (Math.abs(localAircraft.altitude() - foreignAircraft.altitude()) >= minima.vertical)
    return false;
  var localPosition = new LatLon(localAircraft.lat(), localAircraft.lon());
  var foreignAircraft = new LatLon(foreignAircraft.lat(), foreignAircraft.lon());
   if (localPosition.distanceTo(foreignAircraft) * 0.539957 >= minima.lateral)
    return false;
  return true;
};