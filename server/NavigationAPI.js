var NavigationAPI = {},
    request = require('request'),
    LatLon = require('../latlon.js');

NavigationAPI.fix = (function() {
  var cachedFixes = {};
  return function(fix, cb) {
    if (fix.length !== 5)
      return cb(null);
    fix = fix.toUpperCase();
    var cachedPosition = cachedFixes[fix];
    if (cachedPosition)
      return cb(cachedPosition);
    request.get({
      url: 'http://www.airnav.com/airspace/fix/' + fix
    }, function(error, response, body) {
      if (body) {
        var match = body.match(/(\d+)-(\d+)-(\d+\.\d+)(N|S)\s+(\d+)-(\d+)-(\d+\.\d+)(E|W)/);
        if (match) {
          var latDegrees = parseInt(match[1], 10),
              latMinutes = parseInt(match[2], 10),
              latSeconds = parseFloat(match[3]),
              latDirection = match[4],
              lonDegrees = parseInt(match[5], 10),
              lonMinutes = parseInt(match[6], 10),
              lonSeconds = parseFloat(match[7]),
              lonDirection = match[8],
              lat = (latDirection === 'N' ? 1 : -1) * (latDegrees + latMinutes / 60 + latSeconds / 3600),
              lon = (lonDirection === 'E' ? 1 : -1) * (lonDegrees + lonMinutes / 60 + lonSeconds / 3600),
              position = new LatLon(lat, lon);
          cachedFixes[fix] = position;
          setTimeout(function() {
            delete cachedFixes[fix];
          }, 8 * 60 * 60 * 1000);
          return cb(position);
        }
      }
      cb(null);
    });
  };
})();

NavigationAPI.navaid = (function() {
  var cachedNavaids = {};
  return function(navaid, cb) {
    if (navaid.length !== 3)
      return cb(null);
    navaid = navaid.toUpperCase();
    var cachedPosition = cachedNavaids[navaid];
    if (cachedPosition)
      return cb(cachedPosition);
    request.post({
      url: 'http://www.airnav.com/cgi-bin/navaid-info',
      form: {
        a: navaid
      }
    }, function(error, response, body) {
      if (body) {
        var match = body.match(/([\d-]+\.[\d]+)\/([\d-]+\.[\d]+)/);
        if (match) {
          var position = new LatLon(parseFloat(match[1]), parseFloat(match[2]));
          cachedNavaids[navaid] = position;
          setTimeout(function() {
            delete cachedFixes[fix];
          }, 8 * 60 * 60 * 1000);
          return cb(position);
        }
      }
      cb(null);
    });
  };
})();

module.exports = NavigationAPI;