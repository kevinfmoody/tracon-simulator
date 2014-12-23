function WeatherOverlay() {
  this._overlays = [];
  this._weatherMarks = [];
  this._weatherGrid = [];
  this._contourGrid = [];
  this._weatherLoading = false;
}

WeatherOverlay.prototype.refresh = function(r) {
  var weatherOverlay = this;
  this.fetch(r, function(data) {
    weatherOverlay._overlays.push(data);
  });
};

WeatherOverlay.prototype.fetch = function(r, callback) {
  var baseURL = 'http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi';
  var requestData = {
    'service': 'WMS',
    'request': 'GetMap',
    'version': '1.1.1',
    'format': 'PNG',
    'width': r.scope().width,
    'height': r.scope().height,
    'SRS': 'EPSG:4326',
    'bbox': (r.minLon() + ',' + r.minLat() + ',' + r.maxLon() + ',' + r.maxLat()),
    'layers': 'nexrad-n0q-conus'
  };
  $.get(baseURL, requestData, function(data) {
    callback(data);
  }, 'jsonp');
};

WeatherOverlay.prototype.render = function(r) {
  if (this._overlays.length > 0) {
    r.context().save();
    r.context().globalAlpha = .5;
    for (var row in this._contourGrid) {
      for (var col in this._contourGrid[row]) {
        var wx = this._contourGrid[row][col];
        if (wx.precip > 0) {
          var pos = r.gtoc(wx.lat, wx.lon);
          r.context().beginPath();
          r.context().moveTo(pos.x - 10, pos.y - 10);
          r.context().lineTo(pos.x + 10, pos.y - 10);
          r.context().lineTo(pos.x + 10, pos.y + 10);
          r.context().lineTo(pos.x - 10, pos.y + 10);
          if (wx.precip < 4)
            r.context().fillStyle = 'rgb(25, 50, 50)';
            //r.context().strokeStyle = 'rgb(' + wx.red + ', ' + wx.green + ', ' + wx.blue + ')';
          else
            r.context().fillStyle = 'rgb(70, 70, 35)';
          r.context().fill();
          r.context().fillStyle = '#fff';
          r.context().font = 'bold 14 px Arial';
          r.context().textAlign = 'center';
          r.context().textBaseline = 'middle';


          
          // Dots
          r.context().lineWidth = 1;
          r.context().strokeStyle = 'rgb(100, 100, 100)';
          var theta = wx.lat * wx.lon;
          if (wx.precip % 3 == 2) {
            r.context().beginPath();
            r.context().moveTo(pos.x, pos.y);
            r.context().lineTo(pos.x + 2 * Math.cos(theta), pos.y + 2 * Math.sin(theta));
            r.context().stroke();
          } else if (wx.precip % 3 == 0) {
            r.context().beginPath();
            r.context().moveTo(pos.x - 20 / 3, pos.y - 20 / 3);
            r.context().lineTo(pos.x - 20 / 3 + 2 * Math.cos(theta), pos.y - 20 / 3 + 2 * Math.sin(theta));
            r.context().stroke();

            r.context().beginPath();
            r.context().moveTo(pos.x + 20 / 3, pos.y - 20 / 3);
            r.context().lineTo(pos.x + 20 / 3 + 2 * Math.cos(theta), pos.y - 20 / 3 + 2 * Math.sin(theta));
            r.context().stroke();

            r.context().beginPath();
            r.context().moveTo(pos.x + 20 / 3, pos.y + 20 / 3);
            r.context().lineTo(pos.x + 20 / 3 + 2 * Math.cos(theta), pos.y + 20 / 3 + 2 * Math.sin(theta));
            r.context().stroke();

            r.context().beginPath();
            r.context().moveTo(pos.x - 20 / 3, pos.y + 20 / 3);
            r.context().lineTo(pos.x - 20 / 3 + 2 * Math.cos(theta), pos.y + 20 / 3 + 2 * Math.sin(theta));
            r.context().stroke();
          }

          
          //r.context().fillText(wx.precip, pos.x, pos.y);
        }
      }
    }
    r.context().restore();
  } else if (!this._weatherLoading) {
    this._weatherLoading = true;
    var weatherOverlay = this;
    $.get('wx/wx.php', {
      'bbox': ((r.minLon() - r.lonRange() * .1) + ',' + (r.minLat() - r.latRange() * .1) + ',' + (r.maxLon() + r.lonRange() * .1) + ',' + (r.maxLat() + r.latRange() * .1))
    }, function() {
      var img = new Image;
      img.src = 'wx/wx.gif';
      img.onload = function() {
        var imgData = {
          data: weatherOverlay.imageToData(img)
        };
        var analyzed = 0, marked = 0, loop = 0;

        var bottomLeft = new LatLon(r.minLat() - r.latRange() * .1, r.minLon() - r.lonRange() * .1);
        var topRight = new LatLon(r.maxLat() + r.latRange() * .1, r.maxLon() + r.lonRange() * .1);

        var geoHeight = bottomLeft.distanceTo(new LatLon(topRight._lat, bottomLeft._lon)) * 0.539957;
        var latIncrement = (topRight._lat - bottomLeft._lat) / geoHeight / 1;
        for (var latStep = 0; latStep < topRight._lat - bottomLeft._lat; latStep += latIncrement) {
          var precipGridRow = [];
          var contourGridRow = [];
          var geoWidth = new LatLon(bottomLeft._lat + latStep, bottomLeft._lon).distanceTo(new LatLon(bottomLeft._lat + latStep, topRight._lon)) * 0.539957;
          var lonIncrement = (topRight._lon - bottomLeft._lon) / geoWidth / 1;
          for (var lonStep = 0; lonStep < topRight._lon - bottomLeft._lon; lonStep += lonIncrement) {
            var x = Math.floor(lonStep / (topRight._lon - bottomLeft._lon) * 2048);
            var y = img.height - Math.floor(latStep / (topRight._lat - bottomLeft._lat) * 2048);
            var xRow = 2048 * 4 * y;
            var base = xRow + x * 4;
            var alpha = imgData.data[base + 3];
            //if (alpha == '255') {
              // RGB Color Data
              var red = imgData.data[base];
              var green = imgData.data[base + 1];
              var blue = imgData.data[base + 2];
              var precipLevel = 0;
              if (red < blue && green < blue && Math.abs(red - green) < 50)
                precipLevel = 1;
              else if (red < green && red < blue && Math.abs(green - blue) < 100)
                precipLevel = 2;
              else if (red < green && green > blue && Math.abs(red - blue) < 50)
                precipLevel = 3;
              else if (green > blue && Math.abs(red - green) < 50)
                precipLevel = 4;
              else if (red > blue && green > 50 && Math.abs(green - blue) > 50)
                precipLevel = 5;
              else if (red > blue && red > green && Math.abs(green - blue) < 50)
                precipLevel = 6;

              weatherOverlay._weatherMarks.push(bottomLeft._lat + latStep);
              weatherOverlay._weatherMarks.push(bottomLeft._lon + lonStep);
              weatherOverlay._weatherMarks.push(precipLevel);
              weatherOverlay._weatherMarks.push(red);
              weatherOverlay._weatherMarks.push(green);
              weatherOverlay._weatherMarks.push(blue);

              precipGridRow.push({
                precip: precipLevel,
                lat: bottomLeft._lat + latStep,
                lon: bottomLeft._lon + lonStep,
                red: red,
                green: green,
                blue: blue
              });

              contourGridRow.push({
                precip: precipLevel,
                lat: bottomLeft._lat + latStep,
                lon: bottomLeft._lon + lonStep,
                red: red,
                green: green,
                blue: blue
              });
            //}
          }
          weatherOverlay._weatherGrid.push(precipGridRow);
          weatherOverlay._contourGrid.push(contourGridRow);
        }


        // for (var row = 0; row < weatherOverlay._weatherGrid.length; row++) {
        //   for (var col = 0; col < weatherOverlay._weatherGrid[row].length; col++) {
        //     var anchor = weatherOverlay._weatherGrid[row][col];
        //     var delta = 0;
        //     for (var nrow = row - 1; nrow <= row + 1; nrow++) {
        //       for (var ncol = col - 1; ncol <= col + 1; ncol++) {
        //         var neighbor;
        //         if (nrow >= 0 && nrow < weatherOverlay._weatherGrid.length
        //           && ncol >= 0 && ncol < weatherOverlay._weatherGrid[nrow].length)
        //           neighbor = weatherOverlay._weatherGrid[nrow][ncol];
        //         else
        //           neighbor = {precip: 0};
        //         delta += Math.abs(neighbor.precip - anchor.precip);
        //       }
        //     }
        //     weatherOverlay._contourGrid[row][col].precip = delta;
        //   }
        // }

        // for (var row = 0; row < weatherOverlay._weatherGrid.length; row++) {
        //   for (var col = 0; col < weatherOverlay._weatherGrid[row].length; col++) {
        //     var anchor = weatherOverlay._weatherGrid[row][col];
        //     var delta = 0;
        //     for (var nrow = row - 1; nrow <= row + 1; nrow++) {
        //       for (var ncol = col - 1; ncol <= col + 1; ncol++) {
        //         if (nrow == row || ncol == col) {
        //           var neighbor;
        //           if (nrow >= 0 && nrow < weatherOverlay._weatherGrid.length
        //             && ncol >= 0 && ncol < weatherOverlay._weatherGrid[nrow].length) {
        //             neighbor = weatherOverlay._weatherGrid[nrow][ncol];
        //             if (nrow == row) {

        //             } else {

        //             }
        //           }
        //           else
        //             neighbor = {precip: 0};
        //           delta += Math.abs(neighbor.precip - anchor.precip);
        //         }
        //       }
        //     }
        //     weatherOverlay._contourGrid[row][col].precip = delta;
        //   }
        // }

        weatherOverlay._overlays.push(img);
      };
    });
  }
};

WeatherOverlay.prototype.weatherDataToSystems = function(data, r) {
  var imgData = weatherOverlay.imageToData(img);
  var analyzed = 0, marked = 0, loop = 0;

  var bottomLeft = new LatLon(r.minLat() - r.latRange() * .1, r.minLon() - r.lonRange() * .1);
  var topRight = new LatLon(r.maxLat() + r.latRange() * .1, r.maxLon() + r.lonRange() * .1);

  var geoHeight = bottomLeft.distanceTo(new LatLon(topRight._lat, bottomLeft._lon)) * 0.539957;
  var latIncrement = (topRight._lat - bottomLeft._lat) / geoHeight;
  for (var latStep = 0; latStep < topRight._lat - bottomLeft._lat; latStep += latIncrement) {
    var geoWidth = new LatLon(bottomLeft._lat + latStep, bottomLeft._lon).distanceTo(new LatLon(bottomLeft._lat + latStep, topRight._lon)) * 0.539957;
    var lonIncrement = (topRight._lon - bottomLeft._lon) / geoWidth;
    for (var lonStep = 0; lonStep < topRight._lon - bottomLeft._lon; lonStep += lonIncrement) {
      var x = Math.floor(lonStep / (topRight._lon - bottomLeft._lon) * 2048);
      var y = img.height - Math.floor(latStep / (topRight._lat - bottomLeft._lat) * 2048);
      var xRow = 2048 * 4 * y;
      var base = xRow + x * 4;
      var alpha = imgData.data[base + 3];
      if (alpha == '255') {
        weatherOverlay._weatherMarks.push(bottomLeft._lat + latStep);
        weatherOverlay._weatherMarks.push(bottomLeft._lon + lonStep);
        // RGB Color Data
        weatherOverlay._weatherMarks.push(imgData.data[base]);
        weatherOverlay._weatherMarks.push(imgData.data[base + 1]);
        weatherOverlay._weatherMarks.push(imgData.data[base + 2]);
      }
    }
  }
  weatherOverlay._overlays.push(img);
};

WeatherOverlay.prototype.imageToData = function(img) {
  var canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  var context = canvas.getContext('2d');
  context.drawImage(img, 0, 0, img.width, img.height);
  var imgData = context.getImageData(0, 0, img.width, img.height);
  return imgData.data;
};