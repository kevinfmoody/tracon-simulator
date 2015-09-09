var LiveSession = require('./LiveSession.js');

function LiveSessionManager(io) {
  this._io = io;
  this._sessions = {};
}

LiveSessionManager.prototype.createSession = function(icao) {
  this._sessions[icao] = new LiveSession(this._io, icao);
  setTimeout(function() {
    delete this._sessions[icao];
  }.bind(this), 1000 * 60 * 60 * 12); // Session is automatically killed after 12 hours
};

LiveSessionManager.prototype.isSessionValid = function(icao) {
  return !!this._sessions[icao];
};

module.exports = LiveSessionManager;