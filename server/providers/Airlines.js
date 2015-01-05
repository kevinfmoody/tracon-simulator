var fs = require('fs'),
    redis = require('redis'),
    
    r = redis.createClient(),
    processLine = function(line) {
      var parts = line.split(',');
      var icao = /^"(.+?)"$/.exec(parts[4]);
      var callsign = /^"(.+?)"$/.exec(parts[5]);
      if (icao && callsign)
        r.set('callsigns.' + icao[1], callsign[1]);
    };

fs.readFile('data/airlines.dat', function(err, data) {
  var lines = data.toString().split('\n');
  for (var i in lines)
    processLine(lines[i]);
  process.exit();
});