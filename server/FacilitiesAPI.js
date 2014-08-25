var FacilitiesAPI = {},
    redis = require('redis'),
    r = redis.createClient(),
    LatLon = require('../latlon.js');

FacilitiesAPI.airport = function(icao, cb) {
  if (icao.length !== 4)
    return cb(null);
  icao = icao.toUpperCase();
  r.hgetall('airports.' + icao, function(err, apt) {
    if (apt) {
      var airport = {
        icao: apt.icao,
        iata: apt.iata,
        name: apt.name,
        lat: parseFloat(apt.lat),
        lon: parseFloat(apt.lon),
        elevation: parseFloat(apt.elevation),
        magVar: parseInt(apt.magVar, 10),
        runways: []
      };
      r.smembers('airports.' + icao + '.runways', function(err, ids) {
        var numRequiredRunways = ids.length,
            numLoadedRunways = 0;
        if (ids) {
          var handleRunwayResponse = function(err, rwy) {
            if (rwy) {
              airport.runways.push({
                id: rwy.id,
                lat: parseFloat(rwy.lat),
                lon: parseFloat(rwy.lon),
                elevation: parseFloat(rwy.elevation),
                length: parseInt(rwy.length, 10),
                width: parseInt(rwy.width, 10),
                course: parseInt(rwy.course, 10),
                ILSCapable: rwy.ILSCapable === 'true',
                thresholdCrossingHeight: parseInt(rwy.thresholdCrossingHeight, 10),
                visualGlidePathAngle: parseFloat(rwy.visualGlidePathAngle)
              });
            } else
              return cb(null);
            numLoadedRunways++;
            if (numLoadedRunways === numRequiredRunways)
              cb(airport);
          };
          for (var i in ids)
            r.hgetall('airports.' + icao + '.runways.' + ids[i], handleRunwayResponse);
        } else
          return cb(null);
      });
    } else
      return cb(null);
  });
};

module.exports = FacilitiesAPI;