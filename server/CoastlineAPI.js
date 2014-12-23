var CoastlineAPI = {},
    redis = require('redis'),
    r = redis.createClient(),
    LatLon = require('../latlon.js'),
    navUtils = require('../utils/navigation.js');

CoastlineAPI.coastline = function(lat, lon, radius, cb) {
  var position = new LatLon(lat, lon),
      tiles = navUtils.geoTilesInRadius('coastline', position, radius, true);
  r.sunion(tiles, function(err, lineStrings) {
    if (lineStrings.length) {
      var lines = [];
      for (var i in lineStrings) {
        var lineString = lineStrings[i],
            lineParts = lineString.split(' '),
            startLat = parseFloat(lineParts[0]),
            startLon = parseFloat(lineParts[1]),
            startPos = new LatLon(startLat, startLon),
            endLat = parseFloat(lineParts[2]),
            endLon = parseFloat(lineParts[3]),
            endPos = new LatLon(endLat, endLon);
        if (navUtils.within(startPos, position, radius) && navUtils.within(endPos, position, radius)) {
          lines.push([
            startLat,
            startLon,
            endLat,
            endLon
          ]);
        }
      }
      cb(lines);
    } else
      cb([]);
  });
};

module.exports = CoastlineAPI;