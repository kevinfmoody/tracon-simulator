function PathManager() {
  this._paths = {};
  this._visiblePaths = [];
}

PathManager.ERROR = {
  PATH_NOT_FOUND: 1
};

PathManager.prototype.setPath = function(path) {
  this._paths[path.name()] = path;
};

PathManager.prototype.showPath = function(pathName) {
  if (pathName === 'ALL') {
    this._visiblePaths = Object.keys(this._paths);
    return;
  }
  for (var i in this._visiblePaths)
    if (this._visiblePaths[i] === pathName)
      return;
  if (this._paths[pathName])
    this._visiblePaths.push(pathName);
  else
    throw PathManager.ERROR.PATH_NOT_FOUND;
};

PathManager.prototype.hidePath = function(pathName) {
  if (pathName === 'ALL') {
    this._visiblePaths = [];
    return;
  }
  for (var i in this._visiblePaths)
    if (this._visiblePaths[i] === pathName) {
      this._visiblePaths.splice(i, 1);
      return;
    }
  throw PathManager.ERROR.PATH_NOT_FOUND;
};

PathManager.prototype.render = function(r) {
  for (var i in this._visiblePaths)
    new PathRenderer(this._paths[this._visiblePaths[i]]).render(r);
};