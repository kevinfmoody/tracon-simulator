function Radar() {
  this._position;
}

Radar.prototype.setPosition = function(position) {
  this._position = position;
};

Radar.prototype.position = function() {
  return this._position;
};

Radar.prototype.sweep = function(feed, targetManager, renderFn) {
  var blips = [];//feed.blips();
  // socket.emit('radar.sweep', function(blips) {
  //   blips.forEach(function(blip) {
  //     this.sync(blip, targetManager);
  //   }.bind(this));
  //   targetManager.getAllTargets().forEach(function(target) {
  //     //this.revSync(target, feed, targetManager);
  //   }.bind(this));
  //   if (renderFn)
  //     renderFn();
  // }.bind(this));

  

  // var radials = [],
  //     currentRadial = 0;
  // for (var i = 0; i < 36; i++)
  //   radials[i] = [];
  // feed.blips().forEach(function(blip) {
  //   var radial = Math.floor(this.position().bearingTo(blip.position()) / 10);
  //     radials[radial].push(blip);
  // }.bind(this));
  // var syncNextRadial = function() {
  //   radials[currentRadial].forEach(function(blip) {
  //     this.sync(blip, targetManager);
  //     if (renderFn)
  //       renderFn();
  //   }.bind(this));
  //   currentRadial++;
  //   if (currentRadial < 36)
  //     setTimeout(syncNextRadial, 0);
  // }.bind(this);
  // syncNextRadial();
};

Radar.prototype.sync = function(blip, targetManager) {
  var target = targetManager.getTargetByCallsign(blip.callsign);
  if (target)
    target.updateFromBlip(blip);
  else {
    target = new Target();
    target.updateFromBlip(blip);
    targetManager.addTarget(target);
  }
};

Radar.prototype.heartbeat = function(callsign, targetManager) {
  var target = targetManager.getTargetByCallsign(callsign);
  if (target)
    target.heartbeat();
};

Radar.prototype.revSync = function(target, feed, targetManager) {
  var blip = feed.getBlipByCallsign(target.callsign());
  if (!blip)
    targetManager.noRadarReturn(target.callsign());
};