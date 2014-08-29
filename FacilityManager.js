function FacilityManager() {
  this._airports = {};
  this._primaryAirport = '';
}

FacilityManager.prototype.setPrimaryAirport = function(icao) {
  this._primaryAirport = icao;
};

FacilityManager.prototype.primaryAirport = function(cb) {
  if (this._primaryAirport)
    return this.airport(this._primaryAirport, cb);
  cb(null);
};

FacilityManager.prototype.airport = function(icao, cb) {
  var airport = this._airports[icao];
  if (airport)
    return cb(airport);
  $.get('/api/airports/' + icao, function(airport) {
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
      return cb(this._airports[airport.icao]);
    }
    cb(null);
  }.bind(this));
};