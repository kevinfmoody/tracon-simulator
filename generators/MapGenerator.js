var fs = require('fs'),
    LatLon = require('../latlon.js'),
    AirportAPI = require('../server/AirportAPI.js'),
    Airport = require('../facilities/airport.js'),
    Runway = require('../facilities/runway.js'),
    magVar = require('../MagVar.js');

function MapGenerator() {
  this._airports = {};
  this._lines = [];
  this._points = {};
}

MapGenerator.prototype.addLine = function(from, to, phantomLine, phantomPoints) {
  if (!phantomLine)
    this._lines.push([from, to]);
  if (!phantomPoints) {
    this._points[from._lat + '' + from._lon] = from;
    this._points[to._lat + '' + to._lon] = to;
  }
};

MapGenerator.prototype.addAirport = function(airport) {
  if (!this._airports[airport.icao()])
    this._airports[airport.icao()] = airport;
};

MapGenerator.prototype.generateRunwayPair = function(runwayPair) {
  this.addLine(runwayPair[0].position(), runwayPair[1].position());
  for (var i = 0; i < 2; i++) {
    if (runwayPair[i].hasILS()) {
      var runwayPosition = runwayPair[i].position(),
        backcourse = runwayPair[1 - i].position().bearingTo(runwayPosition);
      this.generateLocalizer(runwayPosition, backcourse);
    }
  }
};

MapGenerator.prototype.generateLocalizer = function(position, course) {
  var phantom = course > 180;
  for (var i = 1; i < 25; i +=2) {
    var start = position.destinationPoint(course, i * 1.852),
        end = position.destinationPoint(course, (i + 1) * 1.852);
    this.addLine(start, end, phantom);
  }
  for (var d = 5; d <= 15; d += 5) {
    var tickBase = position.destinationPoint(course, d * 1.852),
        tickStart = tickBase.destinationPoint(course - 90, 0.6 * 1.852),
        tickEnd = tickBase.destinationPoint(course + 90, 0.6 * 1.852);
    this.addLine(tickStart, tickEnd, phantom);
    this.generateAirspaceRing(tickBase, 12);
  }
  this.generateFinalAirpspace(position, course);
};

MapGenerator.prototype.generateFinalAirpspace = function(position, course) {
  var phantom = course > 180,
      innerLeft = position.destinationPoint(course - 90, 8 * 1.852),
      outerLeft = innerLeft.destinationPoint(course, 19 * 1.852),
      innerRight = position.destinationPoint(course + 90, 8 * 1.852),
      outerRight = innerRight.destinationPoint(course, 19 * 1.852);
  this.addLine(innerLeft, innerLeft.destinationPoint(course, 2 * 1.852), phantom);
  this.addLine(innerLeft.destinationPoint(course, 9 * 1.852), innerLeft.destinationPoint(course, 11 * 1.852), phantom);
  this.addLine(innerLeft.destinationPoint(course, 17 * 1.852), outerLeft, phantom);
  this.addLine(innerRight, innerRight.destinationPoint(course, 2 * 1.852), phantom);
  this.addLine(innerRight.destinationPoint(course, 9 * 1.852), innerRight.destinationPoint(course, 11 * 1.852), phantom);
  this.addLine(innerRight.destinationPoint(course, 17 * 1.852), outerRight, phantom);
  var lastPoint = outerLeft,
      leftRadius = position.distanceTo(outerLeft),
      rightRadius = position.distanceTo(outerRight),
      radiusDelta = rightRadius - leftRadius,
      leftCourse = position.bearingTo(outerLeft),
      rightCourse = position.bearingTo(outerRight),
      courseDelta = (rightCourse - leftCourse + 360) % 360;
  for (var i = 1; i < 20; i++) {
    var nextPoint = position.destinationPoint(leftCourse + courseDelta * i / 20, leftRadius + radiusDelta * i / 20);
    this.addLine(lastPoint, nextPoint, i % 9 < 4 ? phantom : true);
    lastPoint = nextPoint;
  }
  this.addLine(lastPoint, outerRight, phantom);
};

MapGenerator.prototype.generateAirspaceRing = function(position, radius, draw, numPoints) {
  var offset = Math.round(position._lat * position._lon * 1000) % 360,
      points = [];
  numPoints = numPoints || 8;
  for (var i = 0; i < numPoints; i++)
    points.push(position.destinationPoint(offset + i * (360 / numPoints), radius * 1.852));
  for (var p = 0; p < numPoints; p++)
    this.addLine(points[p], points[(p + 1) % numPoints], !draw);
};

MapGenerator.prototype.generateAirspaceBox = function(position, altitude, radius) {
  var diagonal = (radius + 2) * Math.sqrt(2),
      points = [],
      declination = magVar(position, altitude);
  for (var i = 45; i < 360; i += 90)
    points.push(position.destinationPoint(i, diagonal * 1.852));
  for (var p = 0; p < 4; p++)
    this.addLine(points[p], points[(p + 1) % 4]);
  for (var j = 0; j < 360; j += 90)
    this.addLine(position.destinationPoint(j, radius * 1.852), position.destinationPoint(j, (radius + 2) * 1.852));
  for (var l = 0; l < 4; l++)
    this.addLine(position.destinationPoint(declination + l * 90, (radius - 3) * 1.852), position.destinationPoint(declination + l * 90, (radius + 1.5) * 1.852));
};

MapGenerator.prototype.findNorthernmostPoint = function() {
  var northernmostPoint = {
    _lat: -90
  };
  for (var i in this._points)
    if (this._points[i]._lat > northernmostPoint._lat)
      northernmostPoint = this._points[i];
  return northernmostPoint;
};

MapGenerator.prototype.findNextBorderPoint = function(position, sweepBearing) {
  var bestCandidate = {
        _lat: -90,
        _lon: -180
      },
      bestCandidateBearingDelta = 360;
  console.log('------' + sweepBearing + '---------');
  for (var i in this._points) {
    var point = this._points[i];
    if (point._lat !== position._lat && point._lon !== position._lon) {
      var bearing = position.bearingTo(point),
          bearingDelta = (bearing - sweepBearing + 360) % 360;
      console.log(bearingDelta);
      if (bearingDelta === 0) {
        console.log('~!~!~!~!~');
        console.log(position);
        console.log(point);
        console.log(bearing);
        console.log('!@!#~!#~#');
      }
      if (bearingDelta < bestCandidateBearingDelta) {
        console.log('!! ' + bearingDelta);
        bestCandidate = point;
        bestCandidateBearingDelta = bearingDelta;
      }
    }
  }
  console.log(bestCandidate);
  return bestCandidate;
};

MapGenerator.prototype.generateAirspaceBorder = function() {
  var points = [this.findNorthernmostPoint()];
  points[1] = this.findNextBorderPoint(points[0], 90);
  for (var i = 1; points[i]._lat !== points[0]._lat && points[i]._lon !== points[0]._lon; i++) {
    var lastBearing = points[i - 1].bearingTo(points[i]);
    console.log(lastBearing);
    points.push(this.findNextBorderPoint(points[i], lastBearing));
  }
  var on = true,
      longDash = true,
      offset = 3,
      pos = points[0];
  for (var p = 0; p < points.length; p++) {
    var nextPoint = points[(p + 1) % points.length],
        nextPos = null;
    while (true) {
      var dashRemaining = on && longDash ? 6 - offset : 0.8 - offset,
          distanceRemaining = pos.distanceTo(nextPoint);
      if (distanceRemaining < dashRemaining) {
        if (on)
          this.addLine(pos, nextPoint);
        pos = nextPoint;
        offset = dashRemaining - distanceRemaining;
        break;
      } else {
        nextPos = pos.destinationPoint(pos.bearingTo(nextPoint), dashRemaining);
        if (on)
          this.addLine(pos, nextPos);
        pos = nextPos;
        offset = 0;
        if (on) {
          on = false;
          longDash = !longDash;
        } else {
          on = true;
        }
      }
    }
  }
};

MapGenerator.prototype.generateAirport = function(airport) {
  var runwayPairs = airport.runwayPairs(),
      longestRunwayLength = 0;
  for (var i in runwayPairs) {
    var runwayPair = runwayPairs[i],
        runwayLength = runwayPair[0].length();
    this.generateRunwayPair(runwayPair);
    if (runwayLength > longestRunwayLength)
      longestRunwayLength = runwayLength;
  }
  this.generateAirspaceRing(airport.position(), longestRunwayLength * 0.003);
};

MapGenerator.prototype.generateGeography = function() {
  var data = fs.readFileSync('/Users/kmoody/Downloads/ne-coastline-mini.dat', {
        encoding: 'utf8'
      }),
      textLines = data.split('\n'),
      buffer = null,
      lines = [];
  for (var i in textLines) {
    var textLine = textLines[i];
    if (textLine.trim() === '>') {
      buffer = null;
    } else {
      var lineParts = textLine.split('\t');
      if (lineParts.length === 2) {
        var lat = parseFloat(lineParts[1].trim()),
            lon = parseFloat(lineParts[0].trim()),
            pos = new LatLon(lat, lon);
        if (buffer) {
          lines.push([buffer, pos]);
        }
        buffer = pos;
      }
    }
  }
  var primaryAirportPosition = this._airports['KBOS'].position(),
      avoidLines = this._lines.concat();
  for (var l in lines) {
    console.log(l);
    var line = lines[l];
    if (line[0].distanceTo(primaryAirportPosition) * 0.539957 < 60 && line[1].distanceTo(primaryAirportPosition) * 0.539957 < 60) {
      var canDraw = true;
      for (var p in avoidLines) {
        for (var s = 0; s < 2; s++) {
          var point = avoidLines[p][s];
          if (point.distanceTo(line[0]) * 0.539957 < 0.5 || point.distanceTo(line[1]) * 0.539957 < 0.5) {
            canDraw = false;
            break;
          }
        }
      }
      if (canDraw) {
        this.addLine(line[0], line[1], false, true);
      }
    }
  }
};

MapGenerator.prototype.generate = function() {
  for (var icao in this._airports) {
    var airport = this._airports[icao];
    this.generateAirport(airport);
  }
  this.generateAirspaceBorder();
  this.generateGeography();
  return this;
};

MapGenerator.prototype.toFile = function(filename, cb) {
  var primaryAirportPosition = this._airports['KBOS'].position(),
      primaryAirportElevation = this._airports['KBOS'].elevation();
  this.generateAirspaceRing(primaryAirportPosition, 59.95, true, 360);
  var fileString = '';
  for (var i in this._lines) {
    var line = this._lines[i];
    if (line[0].distanceTo(primaryAirportPosition) * 0.539957 <= 60 && line[1].distanceTo(primaryAirportPosition) * 0.539957 <= 60) {
      fileString += line[0]._lat + ' ' + line[0]._lon + ' ' + line[1]._lat + ' ' + line[1]._lon + '\r\n';
    }
  }
  this._lines = [];
  this.generateAirspaceBox(primaryAirportPosition, primaryAirportElevation, 59.95);
  for (var l in this._lines) {
    var line = this._lines[l];
    fileString += line[0]._lat + ' ' + line[0]._lon + ' ' + line[1]._lat + ' ' + line[1]._lon + '\r\n';
  }
  fs.writeFile(filename, fileString, cb);
};

var airports = /*//['KSFO', 'KSJC', 'KOAK', 'KPAO'];//['KSRQ', 'KTPA', 'KPIE', 'KSPG', 'KVNC'];//*/['K1B9', 'K3B2', 'K3B4', 'K6B6', 'KASH', 'KBED', 'KBOS', 'KBVY', 'KCON', 'KDAW', 'KFIT', 'KLCI', 'KLWM', 'KMHT', 'KOWD', 'KPSM'];
var numRequiredAirports = airports.length;
var numLoadedAirports = 0;
var gen = new MapGenerator();
var airportHandler = function(airport) {
  if (airport) {
    console.log('loaded ' + airport.icao);
    var airportObj = new Airport(airport.icao, airport.iata, airport.lat,
      airport.lon, airport.elevation);
    for (var r in airport.runways) {
      var runway = airport.runways[r];
      airportObj.addRunway(new Runway(runway.id, runway.lat, runway.lon,
        runway.elevation, runway.length, runway.width, runway.course, runway.ILSCapable));
    }
    gen.addAirport(airportObj);
  } else
    console.log('failed to load airport');
  numLoadedAirports++;
  if (numLoadedAirports === numRequiredAirports) {
    gen.generate().toFile('../maps/bosmht.map', function() {
      var numPoints = Object.keys(gen._points).length;
      console.log('Generated w/ ' + numPoints + ' points');
    });
  }
};
for (var i in airports)
  AirportAPI.airport(airports[i], airportHandler);


module.exports = MapGenerator;