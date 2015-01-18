var lineReader = require('line-reader'),
    redis = require('redis'),
    
    r = redis.createClient(),
    processLine = function(line) {
      var parts = line.split(',');
      var icao = /^"(.+?)"$/.exec(parts[4]);
      var callsign = /^"(.+?)"$/.exec(parts[5]);
      if (icao && callsign)
        r.set('callsigns.' + icao[1], callsign[1]);
    };

lineReader.eachLine('data/airlines.dat', function(line, last) {
  processLine(line);
  if (last)
    process.exit();
});