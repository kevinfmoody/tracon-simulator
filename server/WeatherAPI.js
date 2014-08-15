var WeatherAPI = {},
    request = require('request'),
    xml2js = require('xml2js');

WeatherAPI.metar = (function() {
  var cachedMETARs = {};
  return function(icao, cb) {
    if (icao.length !== 4)
      return cb(null);
    icao = icao.toUpperCase();
    var cachedMETAR = cachedMETARs[icao];
    if (cachedMETAR)
      return cb(cachedMETAR);
    request.get({
      url: 'https://aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&stationString=' + icao + '&mostRecentForEachStation=constraint&hoursBeforeNow=1.25'
    }, function(error, response, body) {
      xml2js.parseString(body, function(error, result) {
        var numResults = parseInt(result.response.data[0]['$'].num_results, 10);
        if (numResults > 0) {
          var METAR = result.response.data[0].METAR[0],
              metar = {
                raw: METAR.raw_text[0],
                time: new Date(METAR.observation_time[0]),
                temperature: parseFloat(METAR.temp_c[0]),
                dewpoint: parseFloat(METAR.dewpoint_c[0]),
                wind: {
                  direction: parseInt(METAR.wind_dir_degrees[0], 10),
                  speed: parseInt(METAR.wind_speed_kt[0], 10)
                },
                visibility: parseFloat(METAR.visibility_statute_mi[0]),
                altimeter: parseFloat(METAR.altim_in_hg[0]).toFixed(2)
              };
          cachedMETARs[icao] = metar;
          setTimeout(function() {
            delete cachedMETARs[icao];
          }, 60 * 1000);
          return cb(metar);
        }
        cb(null);
      });
    });
  };
})();

module.exports = WeatherAPI;