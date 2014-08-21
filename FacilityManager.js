function FacilityManager() {
  this._airports = {};
}

FacilityManager.prototype.loadAirports = function(ICAOs, cb) {
  var numRequiredAirports = ICAOs.length,
      numLoadedAirports = 0;
  for (var i in ICAOs) {
    var icao = ICAOs[i];
    $.get('/api/airports/' + icao, function(data) {
      var airport = data.airport;
      if (airport) {
        this._airports[airport.icao] = new Airport(airport.icao, airport.iata, airport.lat,
          airport.lon, airport.elevation);
        for (var r in airport.runways) {
          var runway = airport.runways[r];
          this._airports[airport.icao].addRunway(new Runway(runway.id, runway.lat, runway.lon,
            runway.elevation, runway.length, runway.width, runway.course, runway.ILSCapable));
        }
        numLoadedAirports++;
        if (numLoadedAirports === numRequiredAirports)
          cb();
      }
    }.bind(this));
  }
};

FacilityManager.prototype.addAirport = function(airport) {
  this._airports[airport.icao()] = airport;
};

FacilityManager.prototype.airport = function(icao) {
  return this._airports[icao];
};