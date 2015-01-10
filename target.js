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
  this._ghostState = Target.GHOST_STATES.ENABLED;

  this._otherController = null;
  this._controlStates = {
    NORMAL: 1,
    OWNED: 2,
    INBOUND_HANDOFF: 3,
    HANDOFF: 4,
    POST_HANDOFF: 5
  };
  this._controlState = this._controlStates.NORMAL;
  this._handoffTimeout;

  this._radarReturnTimeout;

  this._modes = {
    OFF: 1,
    STANDBY: 2,
    ALTITUDE: 3,
    IDENT: 4
  };

  this._conflicts = {};
  this._conflictState = Target.CONFLICT_STATES.NONE;
}

Target.GHOST_STATES = {
  ENABLED: 1,
  FORCED: 2,
  INHIBITED: 3
};

Target.CONFLICT_STATES = {
  NONE: 1,
  CONFLICTING: 2,
  SUPPRESSED: 3,
  INHIBITED: 4
};

Target.prototype.toggleConflictAlerts = function() {
  this._conflictState = this._conflictState === Target.CONFLICT_STATES.INHIBITED ?
    Target.CONFLICT_STATES.NONE : Target.CONFLICT_STATES.INHIBITED;
};

Target.prototype.setTargetsInConflict = function(targets) {
  if (this._conflictState !== Target.CONFLICT_STATES.INHIBITED) {
    var conflicts = {};
    this._conflictState = Target.CONFLICT_STATES.NONE;
    targets.forEach(function(target) {
      var callsign = target.callsign();
      if (this._conflicts[callsign]) {
        conflicts[callsign] = this._conflicts[callsign];
        if (!conflicts[callsign]['isSuppressed'])
          this._conflictState = Target.CONFLICT_STATES.CONFLICTING;
        else if (this._conflictState !== Target.CONFLICT_STATES.CONFLICTING)
          this._conflictState = Target.CONFLICT_STATES.SUPPRESSED;
      } else {
        this._conflictState = Target.CONFLICT_STATES.CONFLICTING;
        conflicts[callsign] = {
          target: target,
          isSuppressed: false
        };
      }
    }.bind(this));
    this._conflicts = conflicts;
  } else
    this._conflicts = {};
  return this._conflictState;
};

Target.prototype.conflicts = function() {
  return this._conflicts;
};

Target.prototype.conflictState = function() {
  return this._conflictState;
};

Target.prototype.clearPostHandoff = function() {
  if (this._handoffTimeout) {
    clearTimeout(this._handoffTimeout);
    delete this._handoffTimeout;
  }
  this._otherController = null;
  this._controlState = this.isOwned() ? this._controlStates.OWNED : this._controlStates.NORMAL;
  this.contract();
};

Target.prototype.handoff = function(toController) {
  if (this._handoffTimeout) {
    clearTimeout(this._handoffTimeout);
    delete this._handoffTimeout;
  }
  this._otherController = toController;
  this._controlState = this._controlStates.HANDOFF;
  this._handoffTimeout = setTimeout(function() {
    this._otherController = null;
    this._controlState = this._controlStates.OWNED;
  }.bind(this), 10 * 1000);
};

Target.prototype.acceptHandoff = function() {
  if (this._handoffTimeout) {
    clearTimeout(this._handoffTimeout);
    delete this._handoffTimeout;
  }
  this._otherController = null;
  this._controlState = this._controlStates.OWNED;
  this.setController(scope.controller());
};

Target.prototype.handoffAccepted = function(byControler) {
  if (this._handoffTimeout) {
    clearTimeout(this._handoffTimeout);
    delete this._handoffTimeout;
  }
  this.expand();
  this._controller = byControler;
  this._otherController = null;
  this._controlState = this._controlStates.POST_HANDOFF;
  if (scope.sounds())
    new Audio('/sounds/HandoffAccepted.wav').play();
  this._handoffTimeout = setTimeout(function() {
    this._controlState = this._controlStates.NORMAL;
    this.contract();
  }.bind(this), 10 * 1000);
};

Target.prototype.refuseHandoff = function() {
  if (this._handoffTimeout) {
    clearTimeout(this._handoffTimeout);
    delete this._handoffTimeout;
  }
  this._otherController = null;
  this._controlState = this._controlStates.NORMAL;
  this.contract();
};

Target.prototype.handoffRefused = function() {
  if (this._handoffTimeout) {
    clearTimeout(this._handoffTimeout);
    delete this._handoffTimeout;
  }
  this._otherController = null;
  this._controlState = this._controlStates.OWNED;
  if (scope.sounds())
    new Audio('/sounds/Error.wav').play();
};

Target.prototype.inboundHandoff = function(fromController) {
  if (this._handoffTimeout) {
    clearTimeout(this._handoffTimeout);
    delete this._handoffTimeout;
  }
  this._otherController = fromController;
  this._controlState = this._controlStates.INBOUND_HANDOFF;
  this.expand();
  if (scope.sounds())
    new Audio('/sounds/HandoffRequest.wav').play();
  this._handoffTimeout = setTimeout(function() {
    this._otherController = null;
    this._controlState = this._controlStates.NORMAL;
    this.contract();
  }.bind(this), 10 * 1000);
};

Target.prototype.assignHeading = function(heading) {
  if (0 <= heading && heading <= 360) {
    socket.emit('TS.heading', {
      callsign: this.callsign(),
      heading: heading
    });
    return true;
  }
  return false;
};

Target.prototype.assignAltitude = function(altitude) {
  if (0 <= altitude && altitude <= 99999) {
    socket.emit('TS.altitude', {
      callsign: this.callsign(),
      altitude: altitude
    });
    return true;
  }
  return false;
};

Target.prototype.assignSpeed = function(speed) {
  if (0 <= speed && speed <= 9999) {
    socket.emit('TS.speed', {
      callsign: this.callsign(),
      speed: speed
    });
    return true;
  }
  return false;
};

Target.prototype.otherController = function() {
  return this._otherController;
};

Target.prototype.updateFromBlip = function(blip) {
  this.update(blip.callsign, blip.mode, blip.type, blip.arrival, blip.position, blip.altitude, blip.speed, blip.squawk, blip.controller);
  if (this._radarReturnTimeout)
    clearTimeout(this._radarReturnTimeout);
  this._radarReturnTimeout = setTimeout(function() {
    this.noRadarReturn();
  }.bind(this), 7 * 1000);
};

Target.prototype.update = function(callsign, mode, type, arrival, position, altitude, speed, squawk, controller) {
  this.setCallsign(callsign);
  this.setMode(mode);
  this.setType(type);
  this.setArrival(arrival);
  this.setPosition(position);
  this.setAltitude(altitude);
  this.setSpeed(speed);
  this.setSquawk(squawk);

  var currentController = this.controller();
  if (!currentController || currentController.getIdentifier() !== controller)
    this.setController(scope.getControllerByIdentifier(controller));

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
  if (this._controlState !== this._controlStates.POST_HANDOFF) {
    if (this.isOwned())
      this.expand();
    else
      this.contract();
  }
};

Target.prototype.addHistory = function(position) {
  this._history.unshift(position);
  if (this._callsign === 'SWA115')
    console.log(this._history);
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
  this.disableJRing();
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
  this.disableCone();
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

Target.prototype.demoteGhosting = function() {
  switch (this._ghostState) {
    case Target.GHOST_STATES.ENABLED:
      this._ghostState = Target.GHOST_STATES.INHIBITED;
      break;
    case Target.GHOST_STATES.FORCED:
      this._ghostState = Target.GHOST_STATES.ENABLED;
      break;
  }
};

Target.prototype.promoteGhosting = function() {
  switch (this._ghostState) {
    case Target.GHOST_STATES.INHIBITED:
      this._ghostState = Target.GHOST_STATES.ENABLED;
      break;
    case Target.GHOST_STATES.ENABLED:
      this._ghostState = Target.GHOST_STATES.FORCED;
      break;
  }
};

Target.prototype.ghostState = function() {
  return this._ghostState;
};

Target.prototype.select = function() {
  this._isSelected = true;
  if (!this.isExpanded()) {
    this.expand();
    setTimeout(function() {
      if (!this.isOwned())
        this.contract();
    }.bind(this), 3000);
  }
  if (this._controlState === this._controlStates.POST_HANDOFF)
    this.clearPostHandoff();
  if (this._conflictState === Target.CONFLICT_STATES.CONFLICTING) {
    this._conflictState = Target.CONFLICT_STATES.SUPPRESSED;
    for (var i in this._conflicts) {
      this._conflicts[i].isSuppressed = true;
      this._conflicts[i].target.conflicts()[this.callsign()].isSuppressed = true;
    }
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

Target.prototype.isOwned = function() {
  return this.isControlled() && this.controller() === scope.controller();
};

Target.prototype.isControlled = function() {
  return this.controller() !== null;
};

Target.prototype.isUndergoingHandoff = function() {
  return this._controlState === this._controlStates.HANDOFF;
};

Target.prototype.isUndergoingInboundHandoff = function() {
  return this._controlState === this._controlStates.INBOUND_HANDOFF;
};