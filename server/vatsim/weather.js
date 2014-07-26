function Weather(client) {
  this._client = client;
}

Weather.prototype.metar = function(icao) {
  this._client.sendPacket('#AX', [
    'SERVER',
    'METAR',
    icao
  ]);
};

module.exports = Weather;