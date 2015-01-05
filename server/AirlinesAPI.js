var AirlinesAPI = {},
    redis = require('redis'),
    r = redis.createClient(),
    LatLon = require('../latlon.js');

AirlinesAPI.callsigns = function(airlines, cb) {
  var m = r.multi();
  airlines.forEach(function(airline) {
    if (airline.length === 3)
      m.get('callsigns.' + airline.toUpperCase());
  });
  m.exec(function(err, results) {
    var callsigns = {};
    results.forEach(function(result, index) {
      if (result)
        callsigns[airlines[index]] = result;
    });
    cb(callsigns);
  });
};

module.exports = AirlinesAPI;