var AirportAPI = {},
    request = require('request'),
    LatLon = require('../latlon.js');

AirportAPI.airport = (function() {
  var cachedAirports = {};
  return function(icao, cb) {
    if (icao.length !== 4)
      return cb(null);
    icao = icao.toUpperCase();
    var cachedAirport = cachedAirports[icao];
    if (cachedAirport)
      return cb(cachedAirport);
    request.get({
      url: 'http://www.airnav.com/airport/' + icao
    }, function(error, response, body) {
      if (body) {
        var nameMatch = body.match(new RegExp(icao + ' - (.+?)<')),
            positionMatch = body.match(/([\+\-]{0,1}\d+\.\d+)\s*\/\s*([\+\-]{0,1}\d+\.\d+)/),
            iataMatch = body.match(/FAA Identifier.+([A-Z]{3})/),
            elevationMatch = body.match(/Elevation.+?[\+\-]{0,1}(\d+)/);
        if (nameMatch && positionMatch && iataMatch && elevationMatch) {
          var runways = {},
              runwayClauseMatches = body.match(/<H4>Runway[\S\s]+?\/TABLE[\S\s]+?\/TABLE/g),
              numRunways = 0;
          if (runwayClauseMatches) {
            for (var i in runwayClauseMatches) {
              var runwayClause = runwayClauseMatches[i],
                  clauseMatch = runwayClause.match(/<H4>Runway\s*([\d]{1,2}[LCR]{0,1})\s*\/\s*([\d]{1,2}[LCR]{0,1})[\S\s]+?\/TABLE[\S\s]+?\/TABLE/);
              if (clauseMatch) {
                for (var runwayIndex = 1; runwayIndex <= 2; runwayIndex++) {
                  var id = clauseMatch[runwayIndex],
                      dimensionsMatch = runwayClause.match(/Dimensions.+?(\d+)\sx\s(\d+)/),
                      latitudeMatch = runwayClause.match(/Latitude.+?(\d+)-(\d+\.\d+)(N|S).+?(\d+)-(\d+\.\d+)(N|S)/),
                      longitudeMatch = runwayClause.match(/Longitude.+?(\d+)-(\d+\.\d+)(E|W).+?(\d+)-(\d+\.\d+)(E|W)/),
                      runwayElevationMatch = runwayClause.match(/Elevation.+?(\d+\.{0,1}\d{0,1}).+?(\d+\.{0,1}\d{0,1})/),
                      courseMatch = runwayClause.match(/Runway heading.+?(\d{3})\smagnetic.+?(\d{3})\smagnetic/),
                      approachesMatch = runwayClause.match(/Instrument approach.+?<TD>(.*?)<\/TD><TD>.*?<\/TD><TD>(.*?)<\/TD>/);

                  if (dimensionsMatch && latitudeMatch && longitudeMatch && runwayElevationMatch && courseMatch) {
                    var latDegrees = parseInt(latitudeMatch[(runwayIndex - 1) * 3 + 1], 10),
                        latMinutes = parseFloat(latitudeMatch[(runwayIndex - 1) * 3 + 2]),
                        latDirection = latitudeMatch[(runwayIndex - 1) * 3 + 3],
                        lonDegrees = parseInt(longitudeMatch[(runwayIndex - 1) * 3 + 1], 10),
                        lonMinutes = parseFloat(longitudeMatch[(runwayIndex - 1) * 3 + 2]),
                        lonDirection = longitudeMatch[(runwayIndex - 1) * 3 + 3],
                        lat = (latDirection === 'N' ? 1 : -1) * (latDegrees + latMinutes / 60),
                        lon = (lonDirection === 'E' ? 1 : -1) * (lonDegrees + lonMinutes / 60),
                        runway = {
                          id: id,
                          lat: lat,
                          lon: lon,
                          elevation: parseFloat(runwayElevationMatch[runwayIndex]),
                          length: parseInt(dimensionsMatch[1], 10),
                          width: parseInt(dimensionsMatch[2], 10),
                          course: parseInt(courseMatch[runwayIndex], 10),
                          ILSCapable: !!approachesMatch && approachesMatch[runwayIndex].indexOf('ILS') >= 0
                        };
                    runways[id] = runway;
                    numRunways++;
                  }
                }
              }
            }
          }
          if (numRunways > 0 && numRunways % 2 == 0) {
            var airport = {
              icao: icao,
              iata: iataMatch[1],
              name: nameMatch[1],
              lat: parseFloat(positionMatch[1]),
              lon: parseFloat(positionMatch[2]),
              elevation: parseInt(elevationMatch[1], 10),
              runways: runways
            };
            cachedAirports[icao] = airport;
            setTimeout(function() {
              delete cachedAirports[icao];
            }, 8 * 60 * 60 * 1000);
            return cb(airport);
          }
        }
      }
      cb(null);
    });
  };
})();

module.exports = AirportAPI;