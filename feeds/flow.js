function Flow() {
  this._urlRoot = 'http://flightaware.com';
  this._paths = [];
  this._positionReports = [];
}

Flow.prototype.altitude = function(position) {
  var forceReports = [];
  var minDistance = 5;
  for (var i in this._positionReports) {
    var report = this._positionReports[i];
    var distance = report.position.distanceTo(position) * 0.539957;
    if (distance <= 5) {
      report.distance = distance;
      forceReports.push(report);
      if (distance < minDistance)
        minDistance = distance;
    }
  }
  if (forceReports.length == 0)
    return -1;
  var altitudeSum = 0;
  var totalWeight = 0;
  for (var i in forceReports) {
    var report = forceReports[i];
    var weight = Math.pow(minDistance / report.distance, 0.5);
    console.log(weight);
    altitudeSum += report.altitude * weight;
    totalWeight += weight;
  }
  return altitudeSum / totalWeight;
}

Flow.prototype.countInRange = function(position, range) {
  var count = 0;
  for (var i in this._positionReports) {
    var distance = this._positionReports[i].position.distanceTo(position) * 0.539957;
    if (distance <= range)
      count++;
  }
  return count;
}

Flow.prototype.loadRecent = function(airport, limit, cb) {
  var flow = this;
  for (var o = 0; o < 200; o += 20) {
    $.post('/sandbox/sim/feeds/proxy.php', {
      url: this._urlRoot + '/live/airport/KBOS/arrivals?;offset=' + o
    }, function(data) {
      var flights = data.match(/\/live\/flight\/\w+/g);
      for (var i = 1; i < flights.length; i++) {
        (function(i) {
          $.post('/sandbox/sim/feeds/proxy.php', {
            url: flow._urlRoot + flights[i]
          }, function(data) {
            var path = data.match(/data-target='(.+?)' style/);
            var link = flow._urlRoot + path[1] + '/tracklog';
            $.post('/sandbox/sim/feeds/proxy.php', {
              url: link
            }, function(data) {
              //console.log(data);
              var path = [];

              var rows = data.match(/<tr class="smallrow[12]{1}">[\s\S]+?<\/tr>/g);
              //.+?<td align="center">.+?<\/td>.+?<td align="center">.+?&deg;<\/td>.+?<td align="left">.+?<\/td>.+?<td align="right">.+?<\/td>.+?<td align="right">.+?<\/td>.+?<td align="right">.+?<\/td>.+?<td align="right">.+?&nbsp;
              //console.log(stuff);



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

                flow._positionReports.push({
                  position: new LatLon(lat, lon),
                  heading: course,
                  speed: groundspeed,
                  altitude: altitude
                });
                console.log('added');
              }


              











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
  $.post('/sandbox/sim/feeds/proxy.php', {
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