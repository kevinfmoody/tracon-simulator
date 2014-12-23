var fs = require('fs'),
    LatLon = require('../../latlon.js'),
    redis = require('redis'),
    r = redis.createClient();
fs.readFile('data/us-coastline.dat', function(err, data) {
  var lines = data.toString().split('\n'),
      buffer = null;
  for (var i in lines) {
    var line = lines[i];
    if (line.trim() === '>') {
      buffer = null;
    } else {
      var lineParts = line.split('\t');
      if (lineParts.length === 2) {
        var lat = parseFloat(lineParts[1].trim()),
            lon = parseFloat(lineParts[0].trim()),
            pos = new LatLon(lat, lon);
        if (buffer) {
          var positionString = buffer._lat + ' ' + buffer._lon + ' ' + pos._lat + ' ' + pos._lon;
          r.sadd('coastline:geo2.' + Math.floor(buffer._lat * 2) + '.' + Math.floor(buffer._lon * 2), positionString);
          r.sadd('coastline:geo2.' + Math.floor(pos._lat * 2) + '.' + Math.floor(pos._lon * 2), positionString);
        }
        buffer = pos;
      }
    }
  }
  process.exit();
});