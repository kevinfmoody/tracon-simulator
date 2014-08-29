var LatLon = require('../latlon.js'),
    nagivation = {};

nagivation.geoTilesInRadius = function(type, position, radius, geo2Mode) {
  var radiusInKm = radius * 1.852,
      multiplier = geo2Mode ? 2 : 1,
      minLatTile = Math.floor(position.destinationPoint(180, radiusInKm)._lat * multiplier),
      maxLatTile = Math.floor(position.destinationPoint(360, radiusInKm)._lat * multiplier),
      minLonTile = Math.floor(position.destinationPoint(270, radiusInKm)._lon * multiplier),
      maxLonTile = Math.floor(position.destinationPoint(90, radiusInKm)._lon * multiplier),
      tiles = [];
  for (var lat2 = minLatTile; lat2 <= maxLatTile; lat2++)
    for (var lon2 = minLonTile; lon2 <= maxLonTile; lon2++)
      tiles.push(type + ':geo' + (geo2Mode ? '2' : '') + '.' + lat2 + '.' + lon2);
  return tiles;
};

nagivation.within = function(originPoint, foreignPoint, distance) {
  return originPoint.distanceTo(foreignPoint) * 0.539957 < distance;
};

nagivation.parseLat = function(string) {
  var match = string.match(/(\d+)-(\d+)-(\d+\.\d+)(N|S)/),
      latDegrees = parseInt(match[1], 10),
      latMinutes = parseInt(match[2], 10),
      latSeconds = parseFloat(match[3]),
      latDirection = match[4],
      lat = (latDirection === 'N' ? 1 : -1) * (latDegrees + latMinutes / 60 + latSeconds / 3600);
  return lat;
};

nagivation.parseLon = function(string) {
  var match = string.match(/(\d+)-(\d+)-(\d+\.\d+)(E|W)/),
      lonDegrees = parseInt(match[1], 10),
      lonMinutes = parseInt(match[2], 10),
      lonSeconds = parseFloat(match[3]),
      lonDirection = match[4],
      lon = (lonDirection === 'E' ? 1 : -1) * (lonDegrees + lonMinutes / 60 + lonSeconds / 3600);
  return lon;
};

nagivation.parsePosition = function(string) {
  var match = string.match(/(\d+)-(\d+)-(\d+\.\d+)(N|S)\s+(\d+)-(\d+)-(\d+\.\d+)(E|W)/),
      latDegrees = parseInt(match[1], 10),
      latMinutes = parseInt(match[2], 10),
      latSeconds = parseFloat(match[3]),
      latDirection = match[4],
      lonDegrees = parseInt(match[5], 10),
      lonMinutes = parseInt(match[6], 10),
      lonSeconds = parseFloat(match[7]),
      lonDirection = match[8],
      lat = (latDirection === 'N' ? 1 : -1) * (latDegrees + latMinutes / 60 + latSeconds / 3600),
      lon = (lonDirection === 'E' ? 1 : -1) * (lonDegrees + lonMinutes / 60 + lonSeconds / 3600);
  return new LatLon(lat, lon);
};

module.exports = nagivation;