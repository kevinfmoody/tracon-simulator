var Command = Command || {};

Command.ERROR = {
  FORMAT: 0,
  TAKE_NO_ACTION: 1
};

Command.SEGMENT_TYPE = {
  PLACEHOLDER: 0,
  CALLSIGN: 0,
  HEADING: 0,
  ALTITUDE: 0,
  SPEED: 0,
  SECTOR: 0,
  RUNWAY: 0,
  PATH_NAME: 0,
  PATH_FIXES: 0
};

Command.SEGMENT = {
  ILS: 'ILS',
  VISUAL_APPROACH: 'VA',
  INITIATE_CONTROL: 'IC',
  TERMINATE_CONTROL: 'TC',
  FLY_HEADING: 'FH',
  MAINTAIN_ALTITUDE: 'MA',
  SPEED: 'SPD',
  DRAW_PATH: 'DRAWPATH',
  TYPE_PATH: 'TYPEPATH',
  SHOW_PATH: 'SHOWPATH',
  HIDE_PATH: 'HIDEPATH',
  RELOCATE_TARGET: 'RELOCATE',
  MEASURE_DISTANCE: '*',
  SHOW_COORDINATES: 'FD*',
  TOGGLE_CONFLICT_ALERTS: 'CAK',
  MANAGE_CRDA: 'FN',
  CLEAR_JRING: '*J',
  CLEAR_ALL_JRINGS: '**J',
  CLEAR_CONE: '*P',
  CLEAR_ALL_CONES: '**P'
};

Command.SEGMENT_RAW = {
  ILS: true,
  VA: true,
  IC: true,
  TC: true,
  FH: true,
  MA: true,
  SPD: true,
  TYPE_PATH: true,
  FIXPATH: true,
  '*': true,
  'FD*': true,
  CAK: true,
  FN: true,
  '*J': true,
  '**J': true,
  '*P': true,
  '**P': true,
  RELOCATE: 'true'
};

Command.ALIAS = {
  TL: Command.SEGMENT.FLY_HEADING,
  TR: Command.SEGMENT.FLY_HEADING,
  CM: Command.SEGMENT.MAINTAIN_ALTITUDE,
  DM: Command.SEGMENT.MAINTAIN_ALTITUDE,
  SLOW: Command.SEGMENT.SPEED,
  DP: Command.SEGMENT.DRAW_PATH,
  TP: Command.SEGMENT.TYPE_PATH,
  SP: Command.SEGMENT.SHOW_PATH,
  HP: Command.SEGMENT.HIDE_PATH,
  RELOC: Command.SEGMENT.RELOCATE_TARGET,
  REPO: Command.SEGMENT.RELOCATE_TARGET
};

Command.currentCommand = [];
Command.lastCommand = [];

Command.cleanupFunction = null;

Command.clickable = function(e) {
  if (e.type !== 'click')
    throw Command.ERROR.FORMAT;
};

Command.enterable = function(e) {
  if (e.type === 'click')
    throw Command.ERROR.FORMAT;
};

Command.registerCleanupFunction = function(fn, skipOnCurrent) {
  Command.cleanup(skipOnCurrent);
  Command.cleanupFunction = fn;
};

Command.cleanup = function(skipOnCurrent) {
  Command.clearCleanupTimeout();
  if (Command.cleanupFunction) {
    if (!skipOnCurrent || JSON.stringify(Command.currentCommand) !== JSON.stringify(Command.lastCommand))
      Command.cleanupFunction();
    Command.cleanupFunction = null;
    scope.render();
  }
};

Command.cleanupTimeout = null;

Command.clearCleanupTimeout = function() {
  if (Command.cleanupTimeout) {
    clearTimeout(Command.cleanupTimeout);
    Command.cleanupTimeout = null;
  }
};

Command.cleanupIn = function(milliseconds) {
  Command.clearCleanupTimeout();
  Command.cleanupTimeout = setTimeout(function() {
    Command.cleanup();
    Command.clearCleanupTimeout();
  }, milliseconds);
};

Command.run = function(e, args) {
  var fn = Command.manualProcess(e, args),
      command = [];
  if (!fn) {
    for (var i in args) {
      arg = args[i];
      if (!Command.SEGMENT_RAW[arg])
        arg = Command.ALIAS[arg] || Command.SEGMENT_TYPE.PLACEHOLDER;
      command.push(arg);
    }
    fn = Command;
    for (var j in command) {
      fn = fn[command[j]] || Command.manualProcess(e, args);
      if (!fn)
        scope.textOverlay().formatError();
    }
  }
  Command.currentCommand = command;
  try {
    fn(e, args);
    scope.textOverlay().clearPreview();
  } catch (err) {
    switch (err) {
      case Command.ERROR.FORMAT:
        scope.textOverlay().formatError();
        break;
    }
  }
  Command.lastCommand = command;
};

Command.manualProcess = function(e, args) {
  var command = args[0],
      emptySelect = /^$/,
      coneCommand = /^\*P(\d{1,2}(\.\d|))$/,
      jRingCommand = /^\*J(\d{1,2}(\.\d|))$/,
      addRemoveCRDACommand = /^FN([A-Z]{3,4})(\d{2}[A-Z]{0,1})\/(\d{2}[A-Z]{0,1})$/,
      toggleCRDACommand = /^FN(\d)$/;
  if (command.length === 2) {
    var controller = scope.getControllerByIdentifier(command);
    if (controller) {
      return function(e, args) {
        if (e.type === 'click') {
          var target = scope.select(e);
          if (target) {
            if (target.isUndergoingHandoff()) {
              scope.textOverlay().setPreviewAreaMessage('ILL TRK');
              Command.registerCleanupFunction(function() {
                scope.textOverlay().clearPreviewAreaMessage();
              });
            } else {
              socket.emit('ATC.requestHandoff', {
                controller: scope.controller().getIdentifier(),
                to: command,
                aircraft: target.callsign()
              }, function(success) {
                if (!success) {
                  scope.textOverlay().setPreviewAreaMessage('ILL TRK');
                  Command.registerCleanupFunction(function() {
                    scope.textOverlay().clearPreviewAreaMessage();
                  });
                } else
                  target.handoff(controller);
              });
            }
            return;
          }
        }
        throw Command.ERROR.FORMAT;
      };
    }
  }
  switch (true) {
    case emptySelect.test(command):
      return function(e, args) {
        if (e.type === 'click') {
          var target = scope.select(e);
          if (target && target.isUndergoingInboundHandoff()) {
            socket.emit('ATC.acceptHandoff', {
              controller: target.otherController().getIdentifier(),
              to: scope.controller().getIdentifier(),
              aircraft: target.callsign()
            }, function(success) {
              if (success) {
                target.acceptHandoff();
              } else {
                scope.textOverlay().setPreviewAreaMessage('ILL TRK');
                Command.registerCleanupFunction(function() {
                  scope.textOverlay().clearPreviewAreaMessage();
                });
              }
            });
          }
        }
      };
    case coneCommand.test(command):
      return function(e, args) {
        if (e.type === 'click') {
          var result = coneCommand.exec(command),
              dist = parseFloat(result[1]);
          if (dist < 1 || dist > 30)
            throw Command.ERROR.FORMAT;
          var aircraft = scope.select(e);
          if (aircraft) {
            aircraft.enableCone(dist);
          }
        }
      };
    case jRingCommand.test(command):
      return function(e, args) {
        if (e.type === 'click') {
          var result = jRingCommand.exec(command),
              dist = parseFloat(result[1]);
          if (dist < 1 || dist > 30)
            throw Command.ERROR.FORMAT;
          var aircraft = scope.select(e);
          if (aircraft) {
            aircraft.enableJRing(dist);
          }
        }
      };
    case addRemoveCRDACommand.test(command):
      return function(e, args) {
        Command.enterable(e);
        var result = addRemoveCRDACommand.exec(command),
            icao = result[1].length === 3 ? 'K' + result[1] : result[1],
            master = result[2],
            slave = result[3];
        scope.facilityManager().airport(icao, function(airport) {
          if (airport) {
            try {
              scope.CRDAManager().addRemoveCRDA(airport, master, slave);
              scope.textOverlay().clearPreview();
            } catch (err) {
              scope.textOverlay().setPreviewAreaMessage('ILL RWY');
              Command.registerCleanupFunction(function() {
                scope.textOverlay().clearPreviewAreaMessage();
              });
            }
          } else {
            scope.textOverlay().setPreviewAreaMessage('ILL APT');
            Command.registerCleanupFunction(function() {
              scope.textOverlay().clearPreviewAreaMessage();
            });
          }
        });
        throw Command.ERROR.TAKE_NO_ACTION;
      };
    case toggleCRDACommand.test(command):
      return function(e, args) {
        Command.enterable(e);
        var result = toggleCRDACommand.exec(command),
            num = parseInt(result[1], 10);
        scope.CRDAManager().toggleCRDA(num);
      };
  }
  return null;
};

Command[Command.SEGMENT_TYPE.PLACEHOLDER] = {};

Command[Command.SEGMENT.SHOW_COORDINATES] = function(e, args) {
  if (e.type === 'click') {
    var pos = scope.selectPosition(e);
    scope.addRenderPoint(pos);
    scope.textOverlay().setPreviewAreaMessage(pos._lat.toFixed(4) + ',' + pos._lon.toFixed(4));
    Command.registerCleanupFunction(function() {
      scope.textOverlay().clearPreviewAreaMessage();
      scope.clearRenderPoints();
    });
    Command.cleanupIn(15000);
    return;
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT.CLEAR_JRING] = function(e, args) {
  if (e.type === 'click') {
    var target = scope.select(e);
    if (target) {
      target.disableJRing();
      return;
    }
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT.CLEAR_ALL_JRINGS] = function(e, args) {
  Command.enterable(e);
  scope.targetManager().getAllTargets().forEach(function(target) {
    target.disableJRing();
  });
};

Command[Command.SEGMENT.CLEAR_CONE] = function(e, args) {
  if (e.type === 'click') {
    var target = scope.select(e);
    if (target) {
      target.disableCone();
      return;
    }
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT.CLEAR_ALL_CONES] = function(e, args) {
  Command.enterable(e);
  scope.targetManager().getAllTargets().forEach(function(target) {
    target.disableCone();
  });
};

Command[Command.SEGMENT.MANAGE_CRDA] = function(e, args) {
  if (e.type === 'click') {
    var target = scope.select(e);
    if (target) {
      target.promoteGhosting();
      return;
    }
    target = scope.CRDAManager().select(e);
    if (target) {
      target.demoteGhosting();
      return;
    }
    throw Command.ERROR.FORMAT;
  } else {
    scope.CRDAManager().toggle();
  }
};

Command[Command.SEGMENT.RELOCATE_TARGET] = (function() {
  var selectedTarget = null;
  return function(e, args) {
    if (e.type === 'click') {
      var target = scope.select(e);
      if (target) {
        selectedTarget = target;
        throw Command.ERROR.TAKE_NO_ACTION;
      } else if (selectedTarget) {
        var newPos = scope.selectPosition(e);
        console.log('emitting:');
        console.log('TS.relocate');
        console.log({
          callsign: selectedTarget.callsign(),
          lat: newPos._lat,
          lon: newPos._lon
        });
        socket.emit('TS.relocate', {
          callsign: selectedTarget.callsign(),
          lat: newPos._lat,
          lon: newPos._lon
        });
        return;
      }
    }
    throw Command.ERROR.FORMAT;
  };
})();

Command[Command.SEGMENT.MEASURE_DISTANCE] = function(e, args) {
  if (e.type === 'click') {
    var headingAndDistance = scope.measureHeadingAndDistance(e);
    if (headingAndDistance) {
      scope.addRenderPoint(scope.selectPosition(e));
      scope.textOverlay().clearPreview();
      scope.textOverlay().setPreviewAreaMessage(headingAndDistance.heading + '/' + headingAndDistance.distance);
      Command.registerCleanupFunction(function() {
        scope.textOverlay().clearPreviewAreaMessage();
        scope.clearRenderPoints();
      });
      Command.cleanupIn(15000);
    }
    throw Command.ERROR.TAKE_NO_ACTION;
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT.INITIATE_CONTROL] = function(e, args) {
  if (e.type === 'click') {
    var target = scope.select(e);
    if (target) {
      if (target.isUndergoingHandoff()) {
        scope.textOverlay().setPreviewAreaMessage('ILL TRK');
        Command.registerCleanupFunction(function() {
          scope.textOverlay().clearPreviewAreaMessage();
        });
      } else {
        debugger
        if (scope.controller()) {
          socket.emit('ATC.initiateControl', {
            aircraft: target.callsign(),
            controller: scope.controller().getIdentifier()
          }, function(success) {
            if (!success) {
              scope.textOverlay().setPreviewAreaMessage('ILL TRK');
              Command.registerCleanupFunction(function() {
                scope.textOverlay().clearPreviewAreaMessage();
              });
            }
          });
        } else {
          target.enableQuickLook(); 
        }
      }
      return;
    }
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT.TERMINATE_CONTROL] = function(e, args) {
  if (e.type === 'click') {
    var target = scope.select(e);
    if (target) {
      if (target.isUndergoingHandoff()) {
        scope.textOverlay().setPreviewAreaMessage('ILL TRK');
        Command.registerCleanupFunction(function() {
          scope.textOverlay().clearPreviewAreaMessage();
        });
      } else if (target.isUndergoingInboundHandoff()) {
        socket.emit('ATC.refuseHandoff', {
          controller: target.otherController().getIdentifier(),
          to: scope.controller().getIdentifier(),
          aircraft: target.callsign()
        }, function(success) {
          if (success) {
            target.refuseHandoff();
          } else {
            scope.textOverlay().setPreviewAreaMessage('ILL TRK');
            Command.registerCleanupFunction(function() {
              scope.textOverlay().clearPreviewAreaMessage();
            });
          }
        });
      } else {
        if (scope.controller()) {
          socket.emit('ATC.terminateControl', {
            aircraft: target.callsign(),
            controller: scope.controller().getIdentifier()
          }, function(success) {
            if (!success) {
              scope.textOverlay().setPreviewAreaMessage('ILL TRK');
              Command.registerCleanupFunction(function() {
                scope.textOverlay().clearPreviewAreaMessage();
              });
            }
          });
        } else {
          target.disableQuickLook();
        }
      }
      return;
    }
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT.TOGGLE_CONFLICT_ALERTS] = function(e, args) {
  if (e.type === 'click') {
    var target = scope.select(e);
    if (target)
      return target.toggleConflictAlerts();
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.ILS] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.ILS][Command.SEGMENT_TYPE.RUNWAY] = function(e, args) {
  var FORMAT_ERROR = false;
  scope.facilityManager().primaryAirport(function(airport) {
    if (airport) {
      var callsign = args[0],
          runwayID = args[2],
          target = scope.targetManager().getTargetByCallsign(callsign),
          runway = airport.runway(runwayID);
      if (target && runway) {
        socket.emit('TS.ILS', {
          callsign: callsign,
          icao: airport.icao(),
          runway: runwayID
        });
        scope.textOverlay().clearPreview();
        return;
      }
    }
    scope.textOverlay().formatError();
    FORMAT_ERROR = true;
  });
  if (FORMAT_ERROR)
    throw Command.ERROR.FORMAT;
  return;
};

Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.VISUAL_APPROACH] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.VISUAL_APPROACH][Command.SEGMENT_TYPE.RUNWAY] = function(e, args) {
  var FORMAT_ERROR = false;
  scope.facilityManager().primaryAirport(function(airport) {
    if (airport) {
      var callsign = args[0],
          runwayID = args[2],
          target = scope.targetManager().getTargetByCallsign(callsign),
          runway = airport.runway(runwayID);
      if (target && runway) {
        socket.emit('TS.visualApproach', {
          callsign: callsign,
          icao: airport.icao(),
          runway: runwayID
        });
        scope.textOverlay().clearPreview();
        return;
      }
    }
    scope.textOverlay().formatError();
    FORMAT_ERROR = true;
  });
  if (FORMAT_ERROR)
    throw Command.ERROR.FORMAT;
  return;
};

Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.FLY_HEADING] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.FLY_HEADING][Command.SEGMENT_TYPE.HEADING] = function(e, args) {
  var callsign = args[0],
      heading = args[2],
      target = scope.targetManager().getTargetByCallsign(callsign);
  if (target && target.assignHeading(heading)) {
    scope.textOverlay().keepFirstLine();
    throw Command.ERROR.TAKE_NO_ACTION;
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.MAINTAIN_ALTITUDE] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.MAINTAIN_ALTITUDE][Command.SEGMENT_TYPE.SPEED] = function(e, args) {
  var callsign = args[0],
      altitude = args[2],
      target = scope.targetManager().getTargetByCallsign(callsign);
  if (target && target.assignAltitude(altitude)) {
    scope.textOverlay().keepFirstLine();
    throw Command.ERROR.TAKE_NO_ACTION;
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.SPEED] = {};
Command[Command.SEGMENT_TYPE.CALLSIGN][Command.SEGMENT.SPEED][Command.SEGMENT_TYPE.SPEED] = function(e, args) {
  var callsign = args[0],
      speed = args[2],
      target = scope.targetManager().getTargetByCallsign(callsign);
  if (target && target.assignSpeed(speed)) {
    scope.textOverlay().keepFirstLine();
    throw Command.ERROR.TAKE_NO_ACTION;
  }
  throw Command.ERROR.FORMAT;
};

Command[Command.SEGMENT.SHOW_PATH] = {};
Command[Command.SEGMENT.SHOW_PATH][Command.SEGMENT_TYPE.PATH_NAME] = function(e, args) {
  try {
    scope.pathManager().showPath(args[1].toUpperCase());
  } catch (err) {
    switch (err) {
      case PathManager.ERROR.PATH_NOT_FOUND:
        scope.textOverlay().setPreviewAreaMessage('ILL PTH');
        Command.registerCleanupFunction(function() {
          scope.textOverlay().clearPreviewAreaMessage();
        });
        throw Command.ERROR.TAKE_NO_ACTION;
    }
  }
};

Command[Command.SEGMENT.HIDE_PATH] = {};
Command[Command.SEGMENT.HIDE_PATH][Command.SEGMENT_TYPE.PATH_NAME] = function(e, args) {
  try {
    scope.pathManager().hidePath(args[1].toUpperCase());
  } catch (err) {
    switch (err) {
      case PathManager.ERROR.PATH_NOT_FOUND:
        scope.textOverlay().setPreviewAreaMessage('ILL PTH');
        Command.registerCleanupFunction(function() {
          scope.textOverlay().clearPreviewAreaMessage();
        });
        throw Command.ERROR.TAKE_NO_ACTION;
    }
  }
};

Command[Command.SEGMENT.DRAW_PATH] = {};
Command[Command.SEGMENT.DRAW_PATH][Command.SEGMENT_TYPE.PATH_NAME] = (function() {
  var path = null,
      cleanup = function() {
        path = null;
        scope.textOverlay().clearPreviewAreaMessage();
      };
  return function(e, args) {
    scope.textOverlay().clearPreviewAreaMessage();
    var pathName = args[1].toUpperCase();
    if (!pathName)
      throw Command.ERROR.FORMAT;
    if (!path)
      path = new Path(pathName);
    if (e.type === 'click') {
      Command.registerCleanupFunction(cleanup, true);
      var pos = scope.selectPosition(e),
          waypoints = path.waypoints(),
          last = waypoints[waypoints.length - 1],
          secondToLast = waypoints[waypoints.length - 2];
      if (last) {
        if (last.position.distanceTo(pos) * 0.539957 < 1) {
          scope.textOverlay().setPreviewAreaMessage('ILL DIST');
          throw Command.ERROR.TAKE_NO_ACTION;
        }
        if (secondToLast) {
          var lastBearing = secondToLast.position.bearingTo(last.position),
              newBearing = last.position.bearingTo(pos);
          if (scope.renderer().angleBetweenHeadings(lastBearing, newBearing) >= 90) {
            scope.textOverlay().setPreviewAreaMessage('ILL TURN');
            throw Command.ERROR.TAKE_NO_ACTION;
          }
        }
      }
      path.addWaypoint(null, pos);
      scope.pathManager().setPath(path);
      scope.pathManager().showPath(pathName);
      throw Command.ERROR.TAKE_NO_ACTION;
    }
    cleanup();
  };
})();

Command[Command.SEGMENT.TYPE_PATH] = {};
Command[Command.SEGMENT.TYPE_PATH][Command.SEGMENT_TYPE.PATH_NAME] = {};
Command[Command.SEGMENT.TYPE_PATH][Command.SEGMENT_TYPE.PATH_NAME][Command.SEGMENT_TYPE.PATH_FIXES] = function(e, args) {
  scope.textOverlay().clearPreviewAreaMessage();
  var pathName = args[1].toUpperCase(),
      waypoints = args[2].split('.'),
      numRequiredWaypoints = waypoints.length;
  if (pathName && numRequiredWaypoints) {
    scope.textOverlay().setPreviewAreaMessage('LOAD...');
    var numResolvedWaypoints = 0,
        waypointLocations = {},
        path = new Path(pathName),
        formRoute = function() {
          Command.registerCleanupFunction(function() {
            scope.clearRenderPaths();
            scope.textOverlay().clearPreviewAreaMessage();
          }, true);
          for (var i in waypoints) {
            var waypointName = waypoints[i],
                waypointLocation = waypointLocations[waypointName];
            if (waypointLocation)
              path.addWaypoint(waypointName, waypointLocation);
            else {
              scope.textOverlay().setPreviewAreaMessage('ILL RTE');
              return;
            }
          }
          scope.pathManager().setPath(path);
          scope.pathManager().showPath(pathName);
          scope.textOverlay().clearPreviewAreaMessage();
        },
        navaidHandler = function(navaid, data) {
          numResolvedWaypoints++;
          if (data.navaid)
            waypointLocations[navaid] = data.navaid;
          if (numResolvedWaypoints === numRequiredWaypoints)
            formRoute();
        },
        fixHandler = function(fix, data) {
          numResolvedWaypoints++;
          if (data.fix)
            waypointLocations[fix] = data.fix;
          if (numResolvedWaypoints === numRequiredWaypoints)
            formRoute();
        };
    for (var i in waypoints) {
      waypoints[i] = waypoints[i].toUpperCase();
      var waypoint = waypoints[i];
      if (waypoint.length === 3)
        $.get('/api/navaids/' + waypoint, navaidHandler.bind(this, waypoint));
      else if (waypoint.length === 5)
        $.get('/api/fixes/' + waypoint, fixHandler.bind(this, waypoint));
      else {
        numResolvedWaypoints++;
        if (numResolvedWaypoints === numRequiredWaypoints)
          formRoute();
      }
    }
    throw Command.ERROR.TAKE_NO_ACTION;
  }
  throw Command.ERROR.FORMAT;
};