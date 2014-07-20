function Controller(beaconCode, identifier, name, frequency) {
  this._targetCode = beaconCode;
  this._identifier = identifier;
  this._name = name;
  this._frequency = frequency;
}

Controller.prototype.getTargetCode = function() {
  return this._targetCode;
};

Controller.prototype.getIdentifier = function() {
  return this._identifier;
};

Controller.prototype.getName = function() {
  return this._name;
};

Controller.prototype.getFrequency = function() {
  return this._frequency;
};

Controller.prototype.setTargetCode = function(targetCode) {
  this._targetCode = targetCode;
};

Controller.prototype.setIdentifier = function(identifier) {
  this._identifier = identifier;
};

Controller.prototype.setName = function(name) {
  this._name = name;
};

Controller.prototype.setFrequency = function(frequency) {
  this._frequency = frequency;
};