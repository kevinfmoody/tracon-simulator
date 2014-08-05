var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    request = require('request'),
    ClientManager = require('./ClientManager.js');

io.on('connection', function(socket) {
  new ClientManager(socket);
});

app.get('/proxy', function(req, res) {
  request.get(req.query.url, function(error, response, body) {
    res.send(body);
  });
});

app.use('/', express.static('../'));

http.listen(8080);