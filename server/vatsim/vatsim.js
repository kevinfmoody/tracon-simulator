var Client = require('./client.js'),
    ATC = require('./atc.js'),
    Messages = require('./messages.js'),
    Weather = require('./weather.js');

function VATSIM() {
  this._client = new Client();

  this._atc = new ATC(this._client);
  this._messages = new Messages(this._client);
  this._weather = new Weather(this._client);
}

VATSIM.prototype.client = function() {
  return this._client;
};

VATSIM.prototype.atc = function() {
  return this._atc;
};

VATSIM.prototype.messages = function() {
  return this._messages;
};

VATSIM.prototype.weather = function() {
  return this._weather;
};

module.exports = VATSIM;