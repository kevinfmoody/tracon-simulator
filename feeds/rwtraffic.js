function RWTraffic(airport, situation, r) {
  this._r = r;
  this._airport = airport;
  this._situation = situation;
  this._airports = {};
  this._inRequest = {};
}

RWTraffic.prototype.inbound = function(distance, cb) {
  var icao = this._airport.icao();
  if (this._airports[icao] && this._airports[icao].inbound
      && this._airports[icao].inbound.lastUpdate >= new Date().getTime() - 15 * 1000) {
    cb(this._airports[icao].inbound.aircraft, this._airports[icao].inbound.lastUpdate);
    return;
  } else if (this._inRequest[icao])
    return;
  this._inRequest[icao] = true;
  var self = this;
  $.post('/sandbox/sim/feeds/proxy.php', {
    url: 'http://flightaware.com/live/airport/' + icao
  }, function(data) {
    var jsonInbound = data.match(/json_inbound = ({.+});/);
    var arrivals = JSON.parse(jsonInbound[1]);
    var aircraftList = {};
    for (var i in arrivals.features) {
      var aircraft = arrivals.features[i];
      if (aircraft.properties.projected === 0) {
        var inboundAircraft = new Aircraft(aircraft.properties.ident);
        inboundAircraft.setType(aircraft.properties.type);
        inboundAircraft.setCategory('J');
        inboundAircraft.setFlightRules('I');
        inboundAircraft.setArrival(aircraft.properties.destination);
        inboundAircraft.setLat(aircraft.geometry.coordinates[1]);
        inboundAircraft.setLon(aircraft.geometry.coordinates[0]);
        inboundAircraft.setAltitude(aircraft.properties.altitude * 100);
        inboundAircraft.setHeading((aircraft.properties.direction + 180 - self._r.magVar()) % 360);
        inboundAircraft.setSpeed(inboundAircraft.airspeed(aircraft.properties.groundspeed));
        inboundAircraft.setLastSimulated(self._situation.elapsed());
        inboundAircraft.performance().loadFromCategory(inboundAircraft.category());
        if (inboundAircraft.position().distanceTo(self._airport.position()) * 0.539957 < distance)
          aircraftList[inboundAircraft.callsign()] = inboundAircraft;
      }
    }
    if (self._airports[icao] === undefined)
      self._airports[icao] = {};
    self._airports[icao].inbound = {
      lastUpdate: new Date().getTime(),
      aircraft: aircraftList
    };
    //console.log('new update');
    self._inRequest[icao] = false;
    cb(aircraftList, self._airports[icao].inbound.lastUpdate);
  }, 'html');
};