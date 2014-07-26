var net = require('net');

function Client() {
  this._HOST = '127.0.0.1';
  this._PORT = 6809;

  this._FIELD_DELIMETER = ':';
  this._PACKET_DELIMETER = '\r\n';

  this._isConnected = false;
  this._isConnecting = false;

  this._callsign = '';

  this._client = new net.Socket();
  this._client.on('connect', this.handleConnect.bind(this));
  this._client.on('data', this.handleData.bind(this));
  this._client.on('error', this.handleError.bind(this));
  this._client.on('close', this.handleClose.bind(this));
}

Client.prototype.isConnected = function() {
  return this._isConnected;
};

Client.prototype.connect = function(cb) {
  if (!this.isConnected() && !this._isConnecting) {
    this._isConnecting = true;
    this._client.connect(this._PORT, this._HOST, cb);
  }
};

Client.prototype.disconnect = function() {
  if (this.isConnected()) {
    this._isConnected = false;
    this._client.destroy();
  }
};

Client.prototype.callsign = function() {
  return this._callsign;
};

Client.prototype.sendPacket = function(command, payload) {
  if (this._callsign) {
    this.sendRawPacket(command + this._callsign + this._FIELD_DELIMETER +
      payload.join(this._FIELD_DELIMETER));
  } else {
    this._callsign = payload[0];
    this.sendRawPacket(command + payload.join(this._FIELD_DELIMETER));
  }
};

Client.prototype.sendRawPacket = function(packet) {
  console.log(packet + this._PACKET_DELIMETER);
  this._client.write(packet + this._PACKET_DELIMETER);
};

Client.prototype.handleConnect = function() {
  console.log(':)');

  this._isConnecting = false;
  this._isConnected = true;
};

Client.prototype.handleData = function(data) {
  console.log(data.toString());
};

Client.prototype.handleError = function(err) {
  console.log(':/');

  this._isConnecting = false;
};

Client.prototype.handleClose = function(msg) {
  console.log(':\'(');

  this._isConnected = false;
};

module.exports = Client;