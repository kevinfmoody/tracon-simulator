var LatLon = require('../latlon.js');

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

  this.ACTIVE_LEGS = [
    {
      startPosition: new LatLon(42.53728102399617, -69.99036947154653),
      endPosition: new LatLon(42.44679377265025, -70.47755508601381)
    },
    {
      startPosition: new LatLon(42.44679377265025, -70.47755508601381),
      endPosition: new LatLon(42.52755728169469, -70.61846177278272)
    },
    {
      startPosition: new LatLon(42.52755728169469, -70.61846177278272),
      endPosition: new LatLon(42.72859260197211, -70.48297467454829)
    }
  ];
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

  if (this._aircraft._callsign === 'ICE98') {
    this.track(r);
    return false;
  } else {
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

Autopilot.prototype.perpendicularDistanceToLeg = function(leg) {
  var bearingDelta = leg.startPosition.bearingTo(leg.endPosition) -
    this._aircraft.position().bearingTo(leg.endPosition);
  return Math.abs(this._aircraft.position().distanceTo(leg.endPosition) *
    Math.sin(bearingDelta * Math.PI / 180) * 0.539957);
};

Autopilot.prototype.angleBetween = function(primaryHeading, secondaryHeading) {
  var gap = Math.abs(primaryHeading - secondaryHeading);
  return Math.min(gap, 360 - gap);
};

Autopilot.prototype.testPerpendicularDistanceToLeg = function() {
  var leg = {
    startPosition: new LatLon(42.45175239815871, -70.46488620269045),
    endPosition: new LatLon(42.35927194570811, -70.99059588718505)
  };
  return this.perpendicularDistanceToLeg(leg);
};

Autopilot.prototype.interceptAngle = function(leg) {
  var d = this.perpendicularDistanceToLeg(leg),
      r = this._aircraft._performance.turnRadius(this._aircraft.groundspeed(), this._aircraft.altitude());
  return d >= r ? -1 : Math.acos(1 - d / r) * 180 / Math.PI;
};

Autopilot.prototype.interceptHeading = function(leg, r) {
  var angle = this.interceptAngle(leg);

  if (angle === -1)
    return -1;

  var legBearing = leg.startPosition.bearingTo(leg.endPosition),
      bearingFromLegEnd = leg.endPosition.bearingTo(this._aircraft.position()),
      radial = (bearingFromLegEnd - legBearing + 360) % 360,
      angleOffsetSign = radial < 180 ? -1 : 1;

  if (radial <= 90 || radial >= 270) {
    return -1;
  }

  return (legBearing + angle * angleOffsetSign - r.magVar() + 360) % 360;
};

Autopilot.prototype.track = function(r) {
  var legs = this.ACTIVE_LEGS;
  var activeLeg = legs[0],
      nextLeg = legs[1];
  if (activeLeg) {
    var activeInterceptHeading = this.interceptHeading(activeLeg, r);
    if (activeInterceptHeading <= 0) {
      this.ACTIVE_LEGS.shift();
      return;
    }
    if (nextLeg) {
      var nextInterceptHeading = this.interceptHeading(nextLeg, r);
      if (nextInterceptHeading >= 0) {
        var nextLegHeading = nextLeg.startPosition.bearingTo(nextLeg.endPosition) - r.magVar(),
            activeAngleDelta = this.angleBetween(activeInterceptHeading, nextLegHeading),
            nextAngleDelta = this.angleBetween(nextInterceptHeading, nextLegHeading);
        if (nextAngleDelta < activeAngleDelta) {
          activeInterceptHeading = nextInterceptHeading;
          this.ACTIVE_LEGS.shift();
        }
      }
    }
    this._aircraft.assignHeading(activeInterceptHeading, this._aircraft._lastSimulated, 0);
  }
};

module.exports = Autopilot;