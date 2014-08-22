var fs = require('fs'),
    redis = require('redis'),
    r = redis.createClient();

var processLine = function(line) {
  var iata = line.substr(27, 4).trim(),
      name = line.substr(133, 50).trim(),
      lat = parseInt(line.substr(538, 12), 10) / 3600,
      lon = parseInt(line.substr(565, 12), 10) / 3600,
      elevation = parseFloat(line.substr(578, 7));
  r.sadd('airports', iata);
  r.hmset(
    'airports.' + iata,
    'iata', iata,
    'name', name,
    'lat', lat,
    'lon', lon,
    'elevation', elevation
  );
};

fs.readFile('data/APT.txt', function(err, data) {
  var lines = data.toString().split('\r\n');
  for (var i in lines)
    processLine(lines[i]);
  console.log('Airports written.');
  process.exit();
});