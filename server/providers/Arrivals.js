var fs = require('fs'),
    LatLon = require('../../latlon.js'),
    navUtils = require('../../utils/navigation.js'),
    redis = require('redis'),
    
    r = redis.createClient(),
    processLine = function(line) {
      var record = line.substr(0, 4);
      if (record === 'FIX1') {
        var id = line.substr(4, 30).trim();
        if (/^[A-Z]{5}$/.test(id)) {
          var positionString = line.substr(66, 28),
              position = navUtils.parsePosition(positionString),
              lat = position._lat,
              lon = position._lon;
          r.hmset(
            'fixes.' + id,
            'id', id,
            'lat', lat,
            'lon', lon
          );
          r.sadd('fixes', id);
          r.sadd('fixes:geo.' + Math.floor(lat) + '.' + Math.floor(lon), id);
        }
      }
    };
fs.readFile('data/FIX.txt', function(err, data) {
  var lines = data.toString().split('\r\n');
  for (var i in lines)
    processLine(lines[i]);
  process.exit();
});