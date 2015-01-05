function CRDAManager() {
  this._CRDAs = [];
  this._enabled = true;
}

CRDAManager.prototype.enable = function() {
  this._enabled = true;
};

CRDAManager.prototype.disable = function() {
  this._enabled = false;
};

CRDAManager.prototype.isEnabled = function() {
  return this._enabled;
};

CRDAManager.prototype.toggle = function() {
  this._enabled = !this._enabled;
};

CRDAManager.prototype.ghostTargets = function(targetManager, r) {
  for (var i in this._CRDAs) {
    var crda = this._CRDAs[i];
    if (crda.isEnabled())
      crda.ghostTargets(targetManager, r);
  }
};

CRDAManager.prototype.addCRDA = function(airport, masterRunwayID, slaveRunwayID) {
  this._CRDAs.push(new CRDA(airport, masterRunwayID, slaveRunwayID));
};

CRDAManager.prototype.CRDAs = function() {
  return this._CRDAs;
};