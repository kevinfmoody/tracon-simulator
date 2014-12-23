var LatLon;
if (typeof module !== 'undefined' && module.exports) {
  LatLon = require('../latlon.js');
}

function Airport(icao, iata, lat, lon, elevation, magVar) {
  this._icao = icao;
  this._iata = iata;
	this._lat = lat;
	this._lon = lon;
	this._elevation = elevation;
  this._magVar = magVar;
	this._runways = {};
  this._metar = null;
  this._syncing = false;
}

Airport.SYNC_INTERVAL = 5 * 60 * 1000;

Airport.prototype.enterSync = function() {
  if (!this._syncing) {
    this._syncing = true;
    this.sync();
    setInterval(function() {
      this.sync();
    }.bind(this), Airport.SYNC_INTERVAL);
  }
};

Airport.prototype.sync = function() {
  $.get('/api/metars/' + this.icao(), function(data) {
    if (data.metar) {
      this._metar = data.metar;
      scope.render();
    }
  }.bind(this));
};

Airport.prototype.numRunways = function() {
  return this._runways.length / 2;
};

Airport.prototype.addRunway = function(runway) {
	this._runways[runway.id()] = runway;
};

Airport.prototype.runway = function(id) {
	return this._runways[id];
};

Airport.prototype.runways = function() {
  return this._runways;
};

Airport.prototype.runwayPairs = function() {
  var runwayIDs = {},
      runwayPairs = [];
  for (var id in this._runways) {
    if (!runwayIDs[id] && /^(\d{1,2})(L|C|R){0,1}$/.test(id)) {
      var pair = this.runwayPair(id);
      runwayIDs[pair[0].id()] = true;
      runwayIDs[pair[1].id()] = true;
      runwayPairs.push(pair);
    }
  }
  return runwayPairs;
};

Airport.prototype.runwayPair = function(id) {
  var runwayParts = id.match(/^(\d{1,2})(L|C|R){0,1}$/),
      letter = runwayParts[2],
      number = parseInt(runwayParts[1], 10),
      opposingLetter = '',
      opposingNumber = (number + 18) % 36;
  if (opposingNumber === 0)
    opposingNumber = 36;
  if (opposingNumber < 10)
    opposingNumber = '0' + opposingNumber;
  switch (letter) {
    case 'L':
      opposingLetter = 'R';
      break;
    case 'R':
      opposingLetter = 'L';
      break;
    case 'C':
      opposingLetter = 'C';
      break;
    default:
      opposingLetter = '';
  }
  var opposingID = opposingNumber + opposingLetter;
  return [this.runway(id), this.runway(opposingID)];
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

Airport.prototype.magVar = function() {
  return this._magVar;
};

Airport.prototype.metar = function(tryAgain) {
  this.enterSync();
  return this._metar;
};

Airport.prototype.altimeter = function(tryAgain) {
  return this.metar() ? this.metar().altimeter : '--.--';
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Airport;
}