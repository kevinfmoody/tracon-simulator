var NavigationAPI = {},
    redis = require('redis'),
    r = redis.createClient(),
    LatLon = require('../latlon.js'),
    navUtils = require('../utils/navigation.js');

NavigationAPI.fix = function(fix, cb) {
  if (fix.length !== 5)
    return cb(null);
  fix = fix.toUpperCase();
  r.hgetall('fixes.' + fix, function(err, fix) {
    if (fix) {
      cb({
        id: fix.id,
        lat: parseFloat(fix.lat),
        lon: parseFloat(fix.lon)
      });
    } else
      return cb(null);
  });
};

NavigationAPI.fixes = function(lat, lon, radius, cb) {
  var position = new LatLon(lat, lon),
      tiles = navUtils.geoTilesInRadius('fixes', position, radius);
  r.sunion(tiles, function(err, fixNames) {
    var multi = r.multi();
    for (var i in fixNames)
      multi.hgetall('fixes.' + fixNames[i]);
    multi.exec(function(err, fixes) {
      for (var i = 0; i < fixes.length; i++) {
        var fix = fixes[i];
        fix.lat = parseFloat(fix.lat);
        fix.lon = parseFloat(fix.lon);
        if (!navUtils.within(position, new LatLon(fix.lat, fix.lon), radius)) {
          fixes.splice(i, 1);
          i--;
        }
      }
      cb(fixes);
    });
  });
};

NavigationAPI.navaid = function(navaid, cb) {
  if (navaid.length !== 3)
    return cb(null);
  navaid = navaid.toUpperCase();
  r.hgetall('navaid.' + navaid, function(err, navaid) {
    if (navaid) {
      cb({
        id: navaid.id,
        lat: parseFloat(navaid.lat),
        lon: parseFloat(navaid.lon)
      });
    } else
      return cb(null);
  });
};

NavigationAPI.navaids = function(lat, lon, radius, cb) {
  var position = new LatLon(lat, lon),
      tiles = navUtils.geoTilesInRadius('navaids', position, radius);
  r.sunion(tiles, function(err, navaidNames) {
    var multi = r.multi();
    for (var i in navaidNames)
      multi.hgetall('navaids.' + navaidNames[i]);
    multi.exec(function(err, navaids) {
      for (var i = 0; i < navaids.length; i++) {
        var navaid = navaids[i];
        navaid.lat = parseFloat(navaid.lat);
        navaid.lon = parseFloat(navaid.lon);
        if (!navUtils.within(position, new LatLon(navaid.lat, navaid.lon), radius)) {
          navaids.splice(i, 1);
          i--;
        }
      }
      cb(navaids);
    });
  });
};

module.exports = NavigationAPI;