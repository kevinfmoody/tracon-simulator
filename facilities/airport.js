function Airport(icao, iata, lat, lon, elevation) {
  this._icao = icao;
  this._iata = iata;
	this._lat = lat;
	this._lon = lon;
	this._elevation = elevation;
	this._runways = {};
  this._metar = null;
  this._updating = false;
}

Airport.prototype.numRunways = function() {
  return this._runways.length / 2;
};

Airport.prototype.addRunway = function(runway, oppositeRunway) {
	this._runways[runway.id()] = runway;
  this._runways[oppositeRunway.id()] = oppositeRunway;
};

Airport.prototype.runway = function(id) {
	return this._runways[id];
};

Airport.prototype.position = function() {
  return new LatLon(this._lat, this._lon);
};

Airport.prototype.icao = function() {
  return this._icao;
};

Airport.prototype.iata = function() {
  return this._iata;
};

Airport.prototype.lat = function() {
  return this._lat;
};

Airport.prototype.lon = function() {
  return this._lon;
};

Airport.prototype.elevation = function() {
  return this._elevation;
};

Airport.prototype.updateMetar = function(cb) {
  $.get('/api/metars/' + this.icao(), function(data) {
    if (data.metar)
      this._metar = data.metar;
    cb();
  }.bind(this));
};

Airport.prototype.metar = function(tryAgain) {
  if (!this._updating) {
    this._updating = true;
    this.updateMetar(tryAgain);
    setInterval(this.updateMetar.bind(this), 5 * 60 * 1000);
  }
  return this._metar;
};

Airport.prototype.altimeter = function(tryAgain) {
  this.metar(tryAgain);
  return this._metar ? this._metar.altimeter : '--.--';
};