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
  this._currentState = this._state.AWAITING;
};

Autopilot.prototype.engageVisualApproach = function(runway) {
  this._runway = runway;
  this._currentAction = this._action.VISUAL_APPROACH;
};

Autopilot.prototype.fly = function(r) {
  switch (this._currentAction) {
    case this._action.ILS_APPROACH:
      this.flyILS(r);
      return true;
    case this._action.VISUAL_APPROACH:
      this.flyVisualApproach();
      return true;
    case this._action.INACTIVE:
      return false;
  }
};

var hdg = 257;

Autopilot.prototype.flyILS = function(r) {
  switch (this._currentState) {
    case this._state.AWAITING:
      var distanceInKm = this._aircraft.position().distanceTo(this._runway.position());
      var distanceInFeet = distanceInKm * 3280.84;
      console.log(this._runway.course(), r.magVar(), (this._runway.course() + r.magVar() + 180) % 360);
      var pos = this._runway.position().destinationPoint(hdg + 180, distanceInKm);
      this._aircraft.setLat(pos._lat);
      this._aircraft.setLon(pos._lon);
      var gsAltitude = Math.tan(3 * Math.PI / 180) * (distanceInFeet);
      this._aircraft.setAltitude(gsAltitude);
      // await loc capture
      break;
    case this._state.ESTABLISHED_LOC:
      // await GS capture
      break;
    case this._state.ESTABLISHED_GS:
      // maintain locked on the gs and loc with inbound speed
      break;
    case this._state.MISSED:
      // issue climb to 3000 agl at rwy heading and go inactive
      break;
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