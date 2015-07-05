var LiveFlightsAPI = {},
    request = require('request'),
    FacilitiesAPI = require('../FacilitiesAPI.js'),
    LatLon = require('../../latlon.js'),
    FLIGHTAWARE_BASE_URL = 'http://flightaware.com/live/airport/';

LiveFlightsAPI.processICAO = function (icao) {
  switch (icao.length) {
    case 3:
      icao = 'K' + icao;
      break;
    case 4:
      break;
    default:
      return null;
  }
  return icao.toUpperCase();
};

LiveFlightsAPI.fetchInboundAircraftForAirport = function(airport, cb) {
  request.get(FLIGHTAWARE_BASE_URL + airport.icao + '/enroute', function(err, res, body) {
    var match = body.match(/json_flights = ({.+});/);
    if (match) {
      var aircraft = JSON.parse(match[1]).features.map(function(acinfo) {
        return {
          callsign: acinfo.properties.ident,
          type: acinfo.properties.type,
          departure: acinfo.properties.origin,
          arrival: acinfo.properties.destination,
          altitude: acinfo.properties.altitude,
          groundspeed: acinfo.properties.groundspeed,
          heading: acinfo.properties.direction,
          lat: acinfo.geometry.coordinates[1],
          lon: acinfo.geometry.coordinates[0]
        };
      }).filter(function(aircraft) {
        if (aircraft.altitude !== undefined) {
          var dist = new LatLon(aircraft.lat, aircraft.lon)
                     .distanceTo(new LatLon(airport.lat, airport.lon));
          return (dist > (10 * 1.852)) && (dist < (250 * 1.852));
        }
        return false;
      });
      return cb(aircraft);
    }
    cb([]);
  });
};

LiveFlightsAPI.fetchInboundAircraftForICAO = function(icao, cb) {
  icao = LiveFlightsAPI.processICAO(icao);
  if (!icao)
    return cb([]);
  FacilitiesAPI.airport(icao, function(airport) {
    if (!airport)
      return cb([]);
    LiveFlightsAPI.fetchInboundAircraftForAirport(airport, cb);
  });
};

module.exports = LiveFlightsAPI;