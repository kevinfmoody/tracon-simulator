function Flow() {
  this._urlRoot = 'http://flightaware.com';
  this._paths = [];
  this._positionReports = [];
  this._aircraftPaths = [];
}

Flow.ERROR = {
  NO_DATA: 1,
  END_PATH: 2
};

Flow.prototype.average = function(position) {
  var forceReports = {
    altitude: [],
    heading: [],
    speed: []
  };
  var minDistance = {
    altitude: 3,
    heading: 3,
    speed: 3
  };
  for (var i in this._positionReports) {
    var report = this._positionReports[i];
    var distance = report.position.distanceTo(position) * 0.539957;
    if (distance <= 3) {
      report.distance = distance;
      if (!isNaN(report.altitude)) {
        forceReports.altitude.push(report);
        if (distance < minDistance)
          minDistance.altitude = distance;
      }
      if (!isNaN(report.heading)) {
        forceReports.heading.push(report);
        if (distance < minDistance)
          minDistance.heading = distance;
      }
      if (!isNaN(report.speed)) {
        forceReports.speed.push(report);
        if (distance < minDistance)
          minDistance.speed = distance;
      }
    }
  }
  var averageAltitude = -1,
      averageHeading = -1,
      averageSpeed = -1;
  if (forceReports.altitude.length > 0) {
    var altitudeSum = 0;
    var totalAltitudeWeight = 0;
    for (var a in forceReports.altitude) {
      var report = forceReports.altitude[a];
      var weight = Math.pow(minDistance.altitude / report.distance, 0.5);
      altitudeSum += report.altitude * weight;
      totalAltitudeWeight += weight;
    }
    averageAltitude = altitudeSum / totalAltitudeWeight;
  }
  if (forceReports.heading.length > 0) {
    var headingX = 0,
        headingY = 0;
    for (var h in forceReports.heading) {
      var report = forceReports.heading[h];
      var weight = Math.pow(minDistance.heading / report.distance, 0.5);
      var headingInRad = (((90 - report.heading) + 360) % 360) * Math.PI / 180;
      headingX += Math.cos(headingInRad) * weight;
      headingY += Math.sin(headingInRad) * weight;
    }
    averageHeading = ((90 - Math.atan2(headingY, headingX) * 180 / Math.PI) + 360) % 360;
  }
  if (forceReports.speed.length > 0) {
    var speedSum = 0;
    var totalSpeedWeight = 0;
    for (var s in forceReports.speed) {
      var report = forceReports.speed[s];
      var weight = Math.pow(minDistance.speed / report.distance, 0.5);
      speedSum += report.speed * weight;
      totalSpeedWeight += weight;
    }
    averageSpeed = speedSum / totalSpeedWeight;
  }
  return {
    altitude: averageAltitude,
    heading: (averageHeading - scope.renderer().magVar()) + 360 % 360,
    speed: averageSpeed
  };
};

Flow.prototype.project = function(position, minutes) {
  var minDistance = 3,
      forceReports = [];
      
  for (var i in this._positionReports) {
    var report = this._positionReports[i];
    var distance = report.position.distanceTo(position) * 0.539957;
    if (distance <= 3) {
      report.distance = distance;
      forceReports.push(report);
      if (distance < minDistance)
        minDistance = distance;
    }
  }

  var sumX = 0,
      sumY = 0,
      sumZ = 0,
      totalWeight = 0,
      endProjections = 0,
      projectionThreshold = Math.floor(forceReports.length * 0.33);

  for (var j in forceReports) {
    var forceReport = forceReports[j],
        projection = forceReport.aircraftPath[forceReport.index + minutes];
    if (projection) {
      var lat = projection.position._lat * Math.PI / 180,
          lon = projection.position._lon * Math.PI / 180,
          x = Math.cos(lat) * Math.cos(lon),
          y = Math.cos(lat) * Math.sin(lon),
          z = Math.sin(lat),
          weight = Math.pow(minDistance / forceReport.distance, 0.5);
      sumX += x * weight;
      sumY += y * weight;
      sumZ += z * weight;
      totalWeight += weight;
    } else {
      endProjections++;
      if (endProjections >= projection)
        throw Flow.ERROR.END_PATH;
    }
  }

  var avgX = sumX / totalWeight,
      avgY = sumY / totalWeight,
      avgZ = sumZ / totalWeight,
      pLon = Math.atan2(avgY, avgX),
      pHyp = Math.sqrt(Math.pow(avgX, 2) + Math.pow(avgY, 2)),
      pLat = Math.atan2(avgZ, pHyp);

  if (isNaN(pLat) || isNaN(pLon))
    throw Flow.ERROR.NO_DATA;

  return new LatLon(pLat * 180 / Math.PI, pLon * 180 / Math.PI);
};

Flow.prototype.countInRange = function(position, range) {
  var count = 0;
  for (var i in this._positionReports) {
    var distance = this._positionReports[i].position.distanceTo(position) * 0.539957;
    if (distance <= range)
      count++;
  }
  return count;
};

Flow.prototype.loadRecent = function(airport, limit, cb) {
  var flow = this;
  for (var o = 0; o < 20; o += 20) {
    $.get('proxy', {
      url: this._urlRoot + '/live/airport/KBOS/arrivals?;offset=' + o
    }, function(data) {
      var flights = data.match(/\/live\/flight\/\w+/g);
      for (var i = 1; i < flights.length; i++) {
        (function(i) {
          $.get('proxy', {
            url: flow._urlRoot + flights[i]
          }, function(data) {
            var path = data.match(/data-target='(.+?)' style/);
            var link = flow._urlRoot + path[1] + '/tracklog';
            $.get('proxy', {
              url: link
            }, function(data) {
              //console.log(data);
              var path = [];

              var rows = data.match(/<tr class="smallrow[12]{1}">[\s\S]+?<\/tr>/g);
              //.+?<td align="center">.+?<\/td>.+?<td align="center">.+?&deg;<\/td>.+?<td align="left">.+?<\/td>.+?<td align="right">.+?<\/td>.+?<td align="right">.+?<\/td>.+?<td align="right">.+?<\/td>.+?<td align="right">.+?&nbsp;
              //console.log(stuff);


              var aircraftPath = [];

              for (var i in rows) {
                var row = rows[i];
                //console.log(row);
                var position = row.match(/<td align="center">(.+?)<\/td>[\s\S]+?<td align="center">(.+?)<\/td>[\s\S]+?<td align="center">(.+?)<\/td>[\s\S]+?<td align="center">(.+?)&deg;<\/td>[\s\S]+?<td align="left">(.+?)<\/td>[\s\S]+?<td align="right">(.*?)<\/td>[\s\S]+?<td align="right">(.*?)<\/td>[\s\S]+?<td align="right">(.*?)<\/td>[\s\S]+?<td align="right">(.*?)&nbsp;/);
                //console.log(position);
                var time = position[1];
                var lat = parseFloat(position[2]);
                var lon = parseFloat(position[3]);
                var course = parseInt(position[4]);
                var direction = position[5];
                var groundspeed = parseInt(position[6]);
                var groundspeedMPH = parseInt(position[7]);
                var altitude = parseInt(position[8].replace(',', ''));

                aircraftPath[i] = {
                  position: new LatLon(lat, lon),
                  heading: course,
                  speed: groundspeed,
                  altitude: altitude,
                  aircraftPath: aircraftPath,
                  index: parseInt(i, 10)
                };
                flow._positionReports.push(aircraftPath[i]);
                console.log('added');
              }
              flow._aircraftPaths.push(aircraftPath);


              











              var position = data.match(/"center">(.+?)</g);
              var numPositionReports = position.length / 4;
              for (var i = 0; i < numPositionReports; i++) {
                var latMatch = position[i * 4 + 1].match(/>(.+?)</);
                var lonMatch = position[i * 4 + 2].match(/>(.+?)</);
                path[i] = [parseFloat(latMatch[1]), parseFloat(lonMatch[1])];
              }
              flow._paths.push(path);
              //cb(path);
            }, 'html');
          }, 'html');
        })(i);
      }
    }, 'html');
  }
};

Flow.prototype.loadRecent2 = function(airport, limit, cb) {
  var flow = this;
  $.get('proxy', {
    url: this._urlRoot + '/live/flight/SKV7384'
  }, function(data) {
    var pathString = data.match(/trackstring = ({.+});/);
    var pathObject = JSON.parse(pathString[1]);
    var path = pathObject.features[2].geometry.coordinates;
    for (var i in path) {
      var temp = path[i][0];
      path[i][0] = path[i][1];
      path[i][1] = temp;
    }
    flow._paths['SKV73841'] = path;
    cb(path);
  }, 'html');
};

Flow.prototype.renderPath = function(path, r) {
  // r.context().fillStyle = 'rgb(255, 255, 0';
  // for (var i in path) {
  //   var pos = r.gtoc(path[i][0], path[i][1]);
  //   r.context().fillRect(pos.x - 2, pos.y - 2, 4, 4);
  // }
  r.context().lineWidth = 1.5;
  r.context().strokeStyle = 'rgba(255, 255, 0, .1)';
  r.context().beginPath();
  var start = r.gtoc(path[0][0], path[0][1]);
  r.context().moveTo(start.x, start.y);
  for (var i = 1; i < path.length; i++) {
    var next = r.gtoc(path[i][0], path[i][1]);
    r.context().lineTo(next.x, next.y);
  }
  r.context().stroke();
};

Flow.prototype.render = function(r) {
  for (var i in this._paths)
    this.renderPath(this._paths[i], r);
};