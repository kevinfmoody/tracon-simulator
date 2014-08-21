var fs = require('fs'),
    LatLon = require('../latlon.js'),
    lines = '';

fs.readFile(process.argv[2], {
  encoding: 'utf8'
}, function(err, data) {
  if (err) throw err;
  var lines = data.split('\n'),
      buffer = null;
  for (var i in lines) {
    var line = lines[i];
    if (line.trim() === '>') {
      buffer = null;
    } else {
      var lineParts = line.split('\t');
      if (lineParts.length === 2) {
        var lat = parseFloat(lineParts[1].trim()),
            lon = parseFloat(lineParts[0].trim()),
            pos = new LatLon(lat, lon);
        if (buffer) {
          newFileContents += buffer._lat + ' ' + buffer._lon + ' ' + pos._lat + ' ' + pos._lon + '\n';
        }
        buffer = pos;
      }
    }
  }
  fs.writeFileSync(process.argv[3], newFileContents);
  console.log('DONE! :)');
});