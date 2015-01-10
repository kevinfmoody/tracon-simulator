function CRDAManager() {
  this._CRDAs = [];
  this._CRDAIdentifiers = {};
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

CRDAManager.prototype.toggleCRDA = function(num) {
  var crda = this._CRDAs[num - 1];
  if (crda)
    crda.toggle();
};

CRDAManager.prototype.select = function(e) {
  var offset = $(e.target).offset(),
      x = e.clientX - offset.left,
      y = e.clientY - offset.top,
      r = scope.renderer();
  if (this.isEnabled())
    for (var i in this._CRDAs) {
      var crda = this._CRDAs[i];
      if (crda.isEnabled()) {
        var target = crda.select(x, y, r);
        if (target)
          return target;
      }
    }
  return null;
};

CRDAManager.prototype.ghostTargets = function(targetManager, r) {
  for (var i in this._CRDAs) {
    var crda = this._CRDAs[i];
    if (crda.isEnabled())
      crda.ghostTargets(targetManager, r);
  }
};

CRDAManager.prototype.addRemoveCRDA = function(airport, masterRunwayID, slaveRunwayID) {
  var id = airport.icao() + masterRunwayID + slaveRunwayID;
  if (!this._CRDAIdentifiers[id]) {
    this._CRDAIdentifiers[id] = true;
    this._CRDAs.push(new CRDA(airport, masterRunwayID, slaveRunwayID));
  } else {
    for (var i in this._CRDAs) {
      var crda = this._CRDAs[i];
      if (crda.airport().icao() === airport.icao() &&
          crda.master().id() === masterRunwayID &&
          crda.slave().id() === slaveRunwayID) {
        delete this._CRDAIdentifiers[id];
        return this._CRDAs.splice(i, 1);
      }
    }
  }
};

CRDAManager.prototype.CRDAs = function() {
  return this._CRDAs;
};