function Messages(client) {
  this._client = client;
}

Messages.prototype.send = function(to, message) {
  this._client.sendPacket('#TM', [
    to,
    message
  ]);
};

module.exports = Messages;