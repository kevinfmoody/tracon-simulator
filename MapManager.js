function MapManager(scope) {
  this._scope = scope;
  this._smartMap = new SmartMap(this._scope);
  this._inSmartMode = false;
  this._manageMaps = setInterval(this.manage.bind(this), 100);
}

MapManager.prototype.enableSmartMode = function() {
  this._inSmartMode = true;
};

MapManager.prototype.disableSmartMode = function() {
  this._inSmartMode = false;
};

MapManager.prototype.isInSmartMode = function() {
  return this._inSmartMode;
};

MapManager.prototype.manager = function() {
  if (this.isInSmartMode()) {

  }
};

MapManager.prototype.render = function(r) {

};