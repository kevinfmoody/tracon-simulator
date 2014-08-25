var fs = require('fs'),
    LatLon = require('../../latlon.js'),
    navUtils = require('../../utils/navigation.js'),
    redis = require('redis'),
    r = redis.createClient(),
    processLine = function(line) {
      var record = line.substr(0, 4);
      if (record === 'NAV1') {
        var id = line.substr(4, 4).trim();
        if (/^[A-Z]{3}$/.test(id)) {
          var latString = line.substr(371, 14),
              lonString = line.substr(396, 14),
              lat = navUtils.parseLat(latString),
              lon = navUtils.parseLon(lonString);
          r.hmset(
            'navaids.' + id,
            'id', id,
            'lat', lat,
            'lon', lon
          );
          r.sadd('navaids', id);
          r.sadd('navaids:geo.' + Math.floor(lat) + '.' + Math.floor(lon), id);
        }
      }
    };
fs.readFile('data/NAV.txt', function(err, data) {
  var lines = data.toString().split('\r\n');
  for (var i in lines)
    processLine(lines[i]);
  process.exit();
});