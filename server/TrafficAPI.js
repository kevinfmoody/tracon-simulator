var TrafficAPI = {},
    FacilitiesAPI = require('./FacilitiesAPI.js'),
    LatLon = require('../latlon.js'),
    navUtils = require('../utils/navigation.js'),
    request = require('request');

var trafficURL = function(bounds) {
  return 'http://arn.data.fr24.com/zones/fcgi/feed.js?bounds=' + bounds.maxLat + ',' + bounds.minLat + ',' + bounds.minLon + ',' + bounds.maxLon + '&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=900&gliders=1&stats=1';
};

// 0 id
// 1 lat
// 2 lon
// 3 hdg
// 4 alt
// 5 spd
// 6 sqk
// 7 rdr
// 8 ac
// 9 reg
// 10 tim
// 11 dep
// 12 arr
// 13 fln
// 14 unknown
// 15 vs
// 16 callsign
// 17 unknown

TrafficAPI.arrivals = function(icao, cb) {
  FacilitiesAPI.airport(icao, function(airport) {
    if (!airport)
      return cb([]);
    request.get(trafficURL(navUtils.bounds(new LatLon(airport.lat, airport.lon), 80)), function(err, res, body) {
      var data = JSON.parse(body),
          aircraft = [],
          iata = icao.substr(1);
      for (var i in data) {
        var ac = data[i];
        if (ac[1] && ac[5] > 80) {
          aircraft.push({
            callsign: ac[16] || ac[13],
            latitude: ac[1],
            longitude: ac[2],
            altitude: ac[4],
            groundspeed: ac[5],
            heading: ac[3],
            vs: ac[15],
            aircraft: ac[8],
            squawk: ac[6],
            departure: ac[11],
            arrival: ac[12],
            timestamp: ac[10]
          });
        }
      }
      cb(aircraft);
    });
  });
};

module.exports = TrafficAPI;