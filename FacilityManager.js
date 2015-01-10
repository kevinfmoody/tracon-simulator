var FacilitiesAPI,
    Airport,
    Runway,
    NODE = false;

if (typeof module !== 'undefined' && module.exports) {
  FacilitiesAPI = require('./server/FacilitiesAPI.js');
  Airport = require('./facilities/airport.js');
  Runway = require('./facilities/runway.js');
  NODE = true;
}

function FacilityManager() {
  this._airports = {};
  this._primaryAirport = '';
}

FacilityManager.prototype.setPrimaryAirport = function(icao) {
  this._primaryAirport = icao;
};

FacilityManager.prototype.primaryAirport = function(cb, cbOnlyIfAvailable) {
  if (this._primaryAirport)
    return this.airport(this._primaryAirport, cb, cbOnlyIfAvailable);
  cb(null);
};

FacilityManager.prototype.airports = function() {
  return this._airports;
};

FacilityManager.prototype.airport = function(icao, cb, cbOnlyIfAvailable) {
  var airport = this._airports[icao];
  if (airport)
    return cb(airport);
  var airportCallback = function(airport) {
    if (airport) {
      this._airports[airport.icao] = new Airport(
        airport.icao,
        airport.iata,
        airport.lat,
        airport.lon,
        airport.elevation,
        airport.magVar
      );
      for (var r in airport.runways) {
        var runway = airport.runways[r];
        this._airports[airport.icao].addRunway(new Runway(
          runway.id,
          runway.lat,
          runway.lon,
          runway.elevation,
          runway.length,
          runway.width,
          runway.course,
          runway.ILSCapable
        ));
      }
      return cbOnlyIfAvailable || cb(this._airports[airport.icao]);
    }
    cb(null);
  }.bind(this);
  if (NODE)
    FacilitiesAPI.airport(icao, airportCallback);
  else
    $.get('/api/airports/' + icao, airportCallback);
};

if (NODE) {
  module.exports = FacilityManager;
}