function Controller(position, beaconCode, identifier, name, frequency, socket) {
  this._position = position;
  this._targetCode = beaconCode;
  this._identifier = identifier;
  this._name = name;
  this._frequency = frequency;
  this._socket = socket;
}

Controller.fromJSON = function(data) {
  return new Controller(data.position, data.targetCode, data.identifier, data.name, data.frequency, null);
};

Controller.prototype.toJSON = function() {
  return {
    position: this.getPosition(),
    targetCode: this.getTargetCode(),
    identifier: this.getIdentifier(),
    name: this.getName(),
    frequency: this.getFrequency()
  };
};

Controller.prototype.getSocket = function() {
  return this._socket;
};

Controller.prototype.getPosition = function() {
  return this._position;
};

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Controller;
}