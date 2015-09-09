var Wind = function(direction, velocity, gust) {
  this.direction = direction || 0.0;
  this.velocity = velocity || 0.0;
  this.gust = gust || 0.0;
};

var Station = function(identifier, position, wind) {
  this.identifier = identifier || '';
  this.position = position || null;
  this.wind = wind || null;
};

var Situation = function() {
  this.stations = [];
};

Situation.prototype.windAtPosition = function(position) {
  var wind = new Wind();
  var closest = Number.MAX_VALUE;
  this.stations.forEach(function(station) {
    var distance = station.position.distanceTo(position);
    if (distance < closest)
    {
      closest = distance;
      wind = station.wind;
    }
  }.bind(this));
  return wind;
};

module.exports = {
  Wind: Wind,
  Station: Station,
  Situation: Situation
};