var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    TrafficSimulator = require('../traffic/TrafficSimulator.js'),
    ClientManager = require('./ClientManager.js'),
    r = {
      magVar: function() { return -15.24; }
    },
    COUNT = 0;

io.on('connection', function(socket) {
  var cm = new ClientManager(socket);
  // if (COUNT === 0) {
  //   COUNT++;
  //   cm._v.pilot().addPilot({
  //     from: 'SWA393',
  //     cid: '5!MP!L0T',
  //     password: '5!MTR@C0N',
  //     name: 'Kevin Moody'
  //   });
  //   cm._v.pilot().addPilot({
  //     from: 'SWA3999',
  //     cid: '5!MP!L0T',
  //     password: '5!MTR@C0N',
  //     name: 'Kevin Moody'
  //   });
  // }
});

app.use('/', express.static('../'));

http.listen(8080);