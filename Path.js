function Path(name) {
  this._name = name;
  this._waypoints = [];
}

Path.prototype.addWaypoint = function(name, position) {
  this._waypoints.push({
    name: name,
    position: position
  });
};

Path.prototype.setName = function(name) {
  this._name = name;
};

Path.prototype.name = function() {
  return this._name;
};

Path.prototype.waypoints = function() {
  return this._waypoints;
};