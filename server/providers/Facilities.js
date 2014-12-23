var fs = require('fs'),
    LatLon = require('../../latlon.js'),
    magVarDeclination = require('../../MagVar.js'),
    redis = require('redis'),
    r = redis.createClient(),
    faaIdToIcao = {},
    iataToIcao = function(iata, state) {
      if (iata.length === 4)
        return iata;
      switch (state) {
        case 'AK':
        case 'HI':
          return 'P' + iata;
        default:
          return 'K' + iata;
      }
    },
    magVarStringToInt = function(magVarString) {
      var magVarMagnitude = parseInt(magVarString, 10);
      if (!isNaN(magVarMagnitude))
        return magVarMagnitude * (magVarString[2] === 'W' ? -1 : 1);
      return 0;
    },
    processAirport = function(line) {
      var type = line.substr(14, 13).trim();
      if (type === 'AIRPORT') {
        var state = line.substr(91, 2);
        if (state) {
          var faaId = line.substr(3, 11).trim(),
              iata = line.substr(27, 4).trim(),
              icao = iataToIcao(iata, state),
              name = line.substr(133, 50).trim(),
              lat = parseInt(line.substr(538, 12), 10) / 3600,
              lon = -parseInt(line.substr(565, 12), 10) / 3600,
              elevation = parseFloat(line.substr(578, 7)),
              exactMagVar = magVarDeclination(new LatLon(lat, lon), elevation);
              magVar = !isNaN(exactMagVar) && exactMagVar !== -999 ? exactMagVar : magVarStringToInt(line.substr(586, 3));
          faaIdToIcao[faaId] = icao;
          r.hmset(
            'airports.' + icao,
            'icao', icao,
            'iata', iata,
            'name', name,
            'lat', lat,
            'lon', lon,
            'elevation', elevation,
            'magVar', magVar
          );
          r.sadd('airports', icao);
          r.sadd('airports:geo.' + Math.floor(lat) + '.' + Math.floor(lon), icao);
        }
      }
    },
    processRunway = function(line) {
      var faaId = line.substr(3, 11).trim(),
          icao = faaIdToIcao[faaId];
      if (icao) {
        var length = parseInt(line.substr(23, 5), 10);
        if (length > 0) {
          var width = parseInt(line.substr(28, 5), 10),
              baseRecriprocalOffset = [65, 287];
          for (var i = 0; i < 2; i++) {
            var offset = baseRecriprocalOffset[i],
                id = line.substr(offset + 0, 3).trim(),
                instrumentLandingSystemType = line.substr(offset + 6, 10).trim(),
                lat = parseInt(line.substr(offset + 38, 12), 10) / 3600,
                lon = -parseInt(line.substr(offset + 65, 12), 10) / 3600,
                opposingLat = parseInt(line.substr(baseRecriprocalOffset[1 - i] + 38, 12), 10) / 3600,
                opposingLon = -parseInt(line.substr(baseRecriprocalOffset[1 - i] + 65, 12), 10) / 3600,
                exactCourse = new LatLon(lat, lon).bearingTo(new LatLon(opposingLat, opposingLon)),
                course = isNaN(exactCourse) ? exactCourse : parseInt(line.substr(offset + 3, 3), 10),
                elevation = parseFloat(line.substr(offset + 77, 7)),
                thresholdCrossingHeight = parseInt(line.substr(offset + 84, 3), 10),
                visualGlidePathAngle = parseFloat(line.substr(offset + 87, 4)),
                ILSCapable = instrumentLandingSystemType.indexOf('ILS') >= 0;
            console.log(exactCourse);
            r.hmset(
              'airports.' + icao + '.runways.' + id,
              'id', id,
              'lat', lat,
              'lon', lon,
              'elevation', elevation,
              'length', length,
              'width', width,
              'course', course,
              'ILSCapable', ILSCapable,
              'thresholdCrossingHeight', thresholdCrossingHeight,
              'visualGlidePathAngle', visualGlidePathAngle
            );
            r.sadd('airports.' + icao + '.runways', id);
          }
        }
      }
    },
    processLine = function(line) {
      var record = line.substr(0, 3);
      switch (record) {
        case 'APT':
          processAirport(line);
          break;
        case 'RWY':
          processRunway(line);
          break;
      }
    };
fs.readFile('data/APT.txt', function(err, data) {
  var lines = data.toString().split('\r\n');
  for (var i in lines)
    processLine(lines[i]);
  process.exit();
});