function Autopilot(aircraft) {
  this._aircraft = aircraft;
  this._runway;
  this._action = {
    INACTIVE: 1,
    VISUAL_APPROACH: 2,
    ILS_APPROACH: 3
  };
  this._state = {
    LOOKING: 1,
    AWAITING: 2,
    ESTABLISHED_LOC: 3,
    ESTABLISHED_GS: 4,
    MISSED: 5,
    INACTIVE: 6
  };
  this._currentAction = this._action.INACTIVE;
  this._currentState = this._state.INACTIVE;
}

Autopilot.prototype.engageILS = function(runway) {
  this._runway = runway;
  this._currentAction = this._action.ILS_APPROACH;
};

Autopilot.prototype.engageVisualApproach = function(runway) {
  this._runway = runway;
  this._currentAction = this._action.VISUAL_APPROACH;
};

Autopilot.prototype.fly = function(r) {
  switch (this._currentAction) {
    case this._action.ILS_APPROACH:
      this.flyILS(r);
      return false;
    case this._action.VISUAL_APPROACH:
      this.flyVisualApproach();
      return true;
    case this._action.INACTIVE:
      return false;
  }
};

Autopilot.prototype.flyILS = function(r) {
  var acTrack = this._aircraft.position().bearingTo(this._runway.position()),
      rwyTrack = this._runway.course() + r.magVar(),
      delta = this.angleBetween(rwyTrack, acTrack);
  if (delta < 3) {
    var hdgDelta = this.angleBetween(this._aircraft.heading(), this._runway.course()),
        maxInterceptAngle = delta * 10,
        sign = acTrack - rwyTrack < 0 ? -1 : 1,
        interceptAngle = Math.min(hdgDelta, maxInterceptAngle),
        trackHeading = this._runway.course() + interceptAngle * sign,
        distanceInKm = this._aircraft.position().distanceTo(this._runway.position()),
        distanceInFeet = distanceInKm * 3280.84,
        distanceInNm = distanceInFeet * 0.000164579,
        gsAltitude = Math.tan(3 * Math.PI / 180) * (distanceInFeet);
    this._aircraft.assignHeading(trackHeading, this._aircraft._lastSimulated, 0);
    if (gsAltitude < this._aircraft.altitude() && this._aircraft.altitude() - gsAltitude < 300)
      this._aircraft.setAltitude(gsAltitude);
    if (distanceInNm < 5)
      this._aircraft.assignSpeed(this._aircraft.performance().vref() + 5, this._aircraft._lastSimulated, 0);
  }
};

Autopilot.prototype.flyVisualApproach = function() {
  switch (this._currentState) {
    case this._state.LOOKING:
      // await until proximity to airport is valid
      break;
    case this._state.AWAITING:
    case this._state.ESTABLISHED_LOC:
      // self vector onto final and descend
      break;
    case this._state.ESTABLISHED_GS:
      // manage proper descent and inbound speed
      break;
    case this._state.MISSED:
      // issue climb to 3000 agl at rwy heading and go inactive
      break;
  }
};

Autopilot.prototype.angleBetween = function(primaryHeading, secondaryHeading) {
  var gap = Math.abs(primaryHeading - secondaryHeading);
  return Math.min(gap, 360 - gap);
};