function PathRenderer(path) {
  this._path = path;
}

PathRenderer.prototype.render = function(r) {
  var waypoints = this._path.waypoints(),
      pos;

  r.context().fillStyle = '#0c0';
  r.context().strokeStyle = '#0c0';
  r.context().lineJoin = 'round';
  r.context().textBaseline = 'center';
  r.context().textAlign = 'center';
  r.context().font = 10 + 'px Oxygen Mono';

  pos = r.gtoc(waypoints[0].position._lat, waypoints[0].position._lon);
  r.context().strokeStyle = '#030';
  r.context().lineWidth = 4;
  r.context().beginPath();
  r.context().moveTo(pos.x, pos.y);
  for (var i = 1; i < waypoints.length; i++) {
    pos = r.gtoc(waypoints[i].position._lat, waypoints[i].position._lon);
    r.context().lineTo(pos.x, pos.y);
  }
  r.context().stroke();

  pos = r.gtoc(waypoints[0].position._lat, waypoints[0].position._lon);
  r.context().strokeStyle = '#0c0';
  r.context().lineWidth = 4;
  r.context().beginPath();
  r.context().setLineDash([25, 1000]);
  r.context().lineDashOffset = -r.elapsed() % 1025;
  r.context().moveTo(pos.x, pos.y);
  for (var j = 1; j < waypoints.length; j++) {
    pos = r.gtoc(waypoints[j].position._lat, waypoints[j].position._lon);
    r.context().lineTo(pos.x, pos.y);
  }
  r.context().stroke();
  r.context().setLineDash([]);

  var startPos = r.gtoc(waypoints[0].position._lat, waypoints[0].position._lon);
  r.context().beginPath();
  r.context().arc(startPos.x, startPos.y, 4, 0, 2 * Math.PI);
  r.context().fill();

  if (waypoints.length > 1) {
    var endPos = r.gtoc(waypoints[waypoints.length - 1].position._lat,
          waypoints[waypoints.length - 1].position._lon),
        afterStartPos = r.gtoc(waypoints[1].position._lat, waypoints[1].position._lon),
        beforeEndPos = r.gtoc(waypoints[waypoints.length - 2].position._lat,
          waypoints[waypoints.length - 2].position._lon),
        startOrientation = startPos.y < afterStartPos.y ? 1 : -1,
        endOrientation = endPos.y < beforeEndPos.y ? 1 : -1;

    r.context().fillText(this._path.name(), startPos.x, startPos.y - 12 * startOrientation);

    r.context().beginPath();
    r.context().arc(endPos.x, endPos.y, 4, 0, 2 * Math.PI);
    r.context().fill();
  } else {
    r.context().fillText(this._path.name(), startPos.x, startPos.y - 12);
  }
};