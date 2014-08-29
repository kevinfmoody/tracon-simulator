function SmartMap(id, name, scope) {
  this._id = id;
  this._name = name;
  this._scope = scope;
  this._brite = 5;
  this._enabled = false;
  this._primaryAirport = null;
  this._paths = [];
  this._pathsByType = {
    RUNWAY: [],
    LOCALIZER: [],
    COASTLINE: [],
    FIX: []
  };
  this._yields = {
    RUNWAY: [],
    LOCALIZER: [],
    FIX: [],
    COASTLINE: [
      'RUNWAY',
      'LOCALIZER'
    ]
  };
  this.configure();
}

SmartMap.prototype.id = function() {
  return this._id;
};

SmartMap.prototype.name = function() {
  return this._name;
};

SmartMap.prototype.enabled = function() {
  return this._enabled;
};

SmartMap.prototype.toggle = function() {
  this._enabled = !this._enabled;
};

SmartMap.prototype.setBrite = function(brite) {
  this._brite = brite;
};

SmartMap.prototype.configure = function() {
  this._scope.facilityManager().primaryAirport(function(airport) {
    this._scope.renderer().setMagVar(airport.magVar());
    this._primaryAirport = airport;
    this.generatePrimaryAirport();
    this.generateCoastline();
    this.generateFixes();
    this._enabled = true;
  }.bind(this));
};

SmartMap.prototype.generatePrimaryAirport = function() {
  this.generateRunwayPairs(this._primaryAirport);
  this.generateLocalizers(this._primaryAirport);
};

SmartMap.prototype.generateRunwayPairs = function(airport) {
  var runwayPairs = airport.runwayPairs();
  for (var i in runwayPairs)
    this.generateRunwayPair(runwayPairs[i]);
};

SmartMap.prototype.generateRunwayPair = function(runwayPair) {
  this.layer([runwayPair[0].position(), runwayPair[1].position()], 'RUNWAY');
};

SmartMap.prototype.generateLocalizers = function(airport) {
  var runways = airport.runways();
  for (var i in runways) {
    var runway = runways[i];
    if (runway.hasILS())
      this.generateLocalizer(runway);
  }
};

SmartMap.prototype.generateLocalizer = function(runway) {
  var position = runway.position(),
      course = (runway.course() + 180) % 360;
  for (var i = 1; i < 25; i +=2) {
    var start = position.destinationPoint(course, i * 1.852),
        end = position.destinationPoint(course, (i + 1) * 1.852);
    this.layer([start, end], 'LOCALIZER');
  }
  for (var d = 5; d <= 15; d += 5) {
    var tickBase = position.destinationPoint(course, d * 1.852),
        tickStart = tickBase.destinationPoint(course - 90, 0.6 * 1.852),
        tickEnd = tickBase.destinationPoint(course + 90, 0.6 * 1.852);
    this.layer([tickStart, tickEnd], 'LOCALIZER');
  }
};

SmartMap.prototype.generateCoastline = function() {
  $.get('/api/coastline', {
    lat: this._primaryAirport.lat(),
    lon: this._primaryAirport.lon(),
    radius: 60
  }, function(paths) {
    for (var i in paths) {
      var path = paths[i];
      this.layer([new LatLon(path[0], path[1]), new LatLon(path[2], path[3])], 'COASTLINE');
    }
  }.bind(this));
};

SmartMap.prototype.generateFixes = function(cb) {
  $.get('/api/fixes', {
    lat: this._primaryAirport.lat(),
    lon: this._primaryAirport.lon(),
    radius: 60
  }, function(fixes) {
    for (var i in fixes) {
      var fix = fixes[i],
          fixPos = new LatLon(fix.lat, fix.lon);
      this.layer([fixPos, fixPos.destinationPoint(Math.random() * 360, 1)], 'FIX');
    }
    cb();
  }.bind(this));
};

SmartMap.prototype.layer = function(path, type) {
  var r = this._scope.renderer(),
      yields = this._yields[type];
  for (var i in yields) {
    var yieldPaths = this._pathsByType[yields[i]];
    for (var j in yieldPaths) {
      var yieldPath = yieldPaths[j];
      for (var p in yieldPath) {
        var yieldPoint = yieldPath[p];
        for (var n in path) {
          var point = path[n];
          if (point.distanceTo(yieldPoint) * 0.539957 < 0.5)
            return;
        }
      }
    }
  }
  this._pathsByType[type].push(path);
  this._paths.push(path);
  r.setMinLat(Math.min(r.minLat(), path[0]._lat, path[1]._lat));
  r.setMinLon(Math.min(r.minLon(), path[0]._lon, path[1]._lon));
  r.setMaxLat(Math.max(r.maxLat(), path[0]._lat, path[1]._lat));
  r.setMaxLon(Math.max(r.maxLon(), path[0]._lon, path[1]._lon));
  var scopeCorner = new LatLon(r.minLat(), r.minLon()),
      scopeMidpoint = scopeCorner.midpointTo(new LatLon(r.maxLat(), r.maxLon()));
  r.setMidLat(scopeMidpoint._lat);
  r.setMidLon(scopeMidpoint._lon);
};

SmartMap.prototype.render = function(r) {
  if (this._enabled) {
    r.context().lineWidth = 1.5;
    r.context().strokeStyle = r.brite(this._brite);
    for (var i in this._paths) {
      var path = this._paths[i],
          startPoint = r.gtoc(path[0]._lat, path[0]._lon);
      r.context().beginPath();
      r.context().moveTo(startPoint.x, startPoint.y);
      for (var j = 1; j < path.length; j ++) {
        var nextPoint = r.gtoc(path[j]._lat, path[j]._lon);
        r.context().lineTo(nextPoint.x, nextPoint.y);
      }
      r.context().stroke();
    }
  }
};

// SmartMap.prototype.generateRunwayPair = function(runwayPair) {
//   this.addLine(this._scope.renderer(), 'runways', [runwayPair[0].position()._lat, runwayPair[0].position()._lon, runwayPair[1].position()._lat, runwayPair[1].position()._lon]);
//   for (var i = 0; i < 2; i++) {
//     if (runwayPair[i].hasILS()) {
//       var runwayPosition = runwayPair[i].position(),
//         backcourse = runwayPair[1 - i].position().bearingTo(runwayPosition);
//       this.generateLocalizer(runwayPosition, backcourse);
//     }
//   }
// };

// SmartMap.prototype.generateLocalizer = function(position, course) {
//   for (var i = 1; i < 25; i +=2) {
//     var start = position.destinationPoint(course, i * 1.852),
//         end = position.destinationPoint(course, (i + 1) * 1.852);
//     this._path.runways.push([start._lat, start._lon, end._lat, end._lon]);
//   }
//   for (var d = 5; d <= 15; d += 5) {
//     var tickBase = position.destinationPoint(course, d * 1.852),
//         tickStart = tickBase.destinationPoint(course - 90, 0.6 * 1.852),
//         tickEnd = tickBase.destinationPoint(course + 90, 0.6 * 1.852);
//     this.addLine(this._scope.renderer(), 'runways', [tickStart._lat, tickStart._lon, tickEnd._lat, tickEnd._lon]);
//   }
// };

// SmartMap.prototype.addLine = function(r, category, line) {
//   r.setMinLat(Math.min(r.minLat(), line[0], line[2]));
//   r.setMinLon(Math.min(r.minLon(), line[1], line[3]));
//   r.setMaxLat(Math.max(r.maxLat(), line[0], line[2]));
//   r.setMaxLon(Math.max(r.maxLon(), line[1], line[3]));
//   this._path[category].push(line);
// };

// SmartMap.prototype.update = function() {
//   if (!this._loadedPrimaryAirport) {
//     this._loadedPrimaryAirport = true;
//     this._scope.facilityManager().primaryAirport(function(airport) {
//       if (airport) {
//         var r = this._scope.renderer(),
//             runwayPairs = airport.runwayPairs();
//         r.setMagVar(airport.magVar());
//         for (var i in runwayPairs) {
//           var pair = runwayPairs[i];
//           this.generateRunwayPair(pair);
//         }
//         var scopeCorner = new LatLon(r.minLat(), r.minLon()),
//             scopeMidpoint = scopeCorner.midpointTo(new LatLon(r.maxLat(), r.maxLon()));
//         r.setMidLat(scopeMidpoint._lat);
// //         r.setMidLon(scopeMidpoint._lon);

//         $.get('/api/coastline', {
//           lat: airport.lat(),
//           lon: airport.lon(),
//           radius: 30
//         }, function(lines) {
//           if (lines.length) {
//             for (var i in lines) {
//               var line = lines[i];
//               var canDraw = true;
//               for (var p in this._path.runways) {
//                 var avoidLine = this._path.runways[p];
//                 for (var s = 0; s < 2; s++) {
//                   var point = new LatLon(avoidLine[2 * s], avoidLine[2 * s + 1]);
//                   if (point.distanceTo(new LatLon(line[0], line[1])) * 0.539957 < 0.5 || point.distanceTo(new LatLon(line[2], line[3])) * 0.539957 < 0.5) {
//                     canDraw = false;
//                     break;
//                   }
//                 }
//               }
//               if (canDraw) {
//                 this.addLine(r, 'coastline', line);
//               }
//             }
//             var scopeCorner = new LatLon(r.minLat(), r.minLon()),
//                 scopeMidpoint = scopeCorner.midpointTo(new LatLon(r.maxLat(), r.maxLon()));
//             r.setMidLat(scopeMidpoint._lat);
//             r.setMidLon(scopeMidpoint._lon);
//           }
//         }.bind(this));
//       }
//     }.bind(this));
// //   }
// // };

// // SmartMap.prototype.render = function(r) {
// //   if (this._enabled) {
// //     this.update();
// //     r.context().lineWidth = 1.5;

// //     r.context().strokeStyle = 'rgb(100, 100, 100)';
// //     // Render each line
// //     for (var line in this._path.coastline) {
// //       var from = r.gtoc(this._path.coastline[line][0], this._path.coastline[line][1]);
// //       var to = r.gtoc(this._path.coastline[line][2], this._path.coastline[line][3]);
// //       // Draw a scaled line
// //       r.context().beginPath();
// //       r.context().moveTo(from.x, from.y);
// //       r.context().lineTo(to.x, to.y);
// //       r.context().stroke();
// //     }

// //     r.context().strokeStyle = 'rgb(100, 100, 100)';
// //     // Render each line
// //     for (var line in this._path.runways) {
// //       var from = r.gtoc(this._path.runways[line][0], this._path.runways[line][1]);
// //       var to = r.gtoc(this._path.runways[line][2], this._path.runways[line][3]);
// //       // Draw a scaled line
// //       r.context().beginPath();
// //       r.context().moveTo(from.x, from.y);
// //       r.context().lineTo(to.x, to.y);
// //       r.context().stroke();
// //     }
// //   }
// // };