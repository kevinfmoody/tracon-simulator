var lineReader = require('line-reader'),
    LatLon = require('../../latlon.js'),
    redis = require('redis'),
    r = redis.createClient();
    buffer = null;
lineReader.eachLine('data/us-coastline.dat', function(line, last) {
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
  if (last)
    process.exit();
});