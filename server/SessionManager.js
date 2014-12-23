var SimulationSession = require('./SimulationSession.js');

function SessionManager(io) {
  this._io = io;
  this._managerSessions = {};
  this._publicSessions = {};
  this._sessions = {};
}

SessionManager.prototype.generateUniqueId = function() {
  while (true) {
    var sessionId = this.generateId();
    if (!this._sessions[sessionId]) {
      return {
        s: sessionId,
        m: sessionId.substr(0, 6),
        p: sessionId.substr(6, 6)
      };
    }
  }
};

SessionManager.prototype.generateId = function() {
  var text = '',
      possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < 12; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
};

SessionManager.prototype.createSession = function() {
  var id = this.generateUniqueId();
  this._managerSessions[id.m] = id.s;
  this._publicSessions[id.p] = id.s;
  this._sessions[id.s] = new SimulationSession(this._io, id.m, id.p);
  console.log('Session created.');
  console.log('Manager id: ' + id.m);
  console.log('Public id: ' + id.p);
  setTimeout(function() {
    delete this._managerSessions[id.m];
    delete this._publicSessions[id.p];
    delete this._sessions[id.s];
  }.bind(this), 1000 * 60 * 60 * 12); // Session is automatically killed after 12 hours
};

SessionManager.prototype.isSessionValid = function(sessionId) {
  return !!this._managerSessions[sessionId] || !!this._publicSessions[sessionId];
};

module.exports = SessionManager;