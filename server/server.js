var express = require('express'),
    app = express(),
    pem = require('pem'),
    //https = require('https');
    http = require('http').Server(app);

//pem.createCertificate({days:1, selfSigned:true}, function(err, keys) {

 // https = https.createServer({key: keys.serviceKey, cert: keys.certificate}, app);

  var io = require('socket.io')(http),
      request = require('request'),
      SessionManager = require('./SessionManager.js'),
      NavigationAPI = require('./NavigationAPI.js'),
      NavigationAPIV2 = require('./NavigationAPIV2.js'),
      WeatherAPI = require('./WeatherAPI.js'),
      FacilitiesAPI = require('./FacilitiesAPI.js'),
      CoastlineAPI = require('./CoastlineAPI.js'),
      AirlinesAPI = require('./AirlinesAPI.js'),
      Apiify = require('./Apiify.js');//,
      //Flow = require('./Flow.js');

  // var currentFlow = new Flow();
  // currentFlow.loadRecent();

  // this should do the trick
  var sessionManager = new SessionManager(io);
  sessionManager.createSession();

  // io.on('connection', function(socket) {
  //   new ClientManager(socket, null/*currentFlow*/);
  // });

  app.get('/proxy', function(req, res) {
    request.get(req.query.url, function(error, response, body) {
      res.send(body);
    });
  });

  app.get('/api/fixes/*', Apiify(NavigationAPIV2.fix));
  app.get('/api/navaids/*', Apiify(NavigationAPI.navaid));
  app.get('/api/metars/*', Apiify(WeatherAPI.metar));
  app.get('/api/airports/*', Apiify(FacilitiesAPI.airport));
  app.get('/api/callsigns', function(req, res) {
    AirlinesAPI.callsigns(req.query.airlines, function(callsigns) {
      res.send(callsigns);
    });
  });
  app.get('/api/coastline', function(req, res) {
    CoastlineAPI.coastline(req.query.lat, req.query.lon, req.query.radius, function(lines) {
      res.send(lines);
    });
  });
  app.get('/api/fixes', function(req, res) {
    NavigationAPIV2.fixes(req.query.lat, req.query.lon, req.query.radius, function(fixes) {
      res.send(fixes);
    });
  });
  app.get('/api/navaids', function(req, res) {
    NavigationAPIV2.navaids(req.query.lat, req.query.lon, req.query.radius, function(navaids) {
      res.send(navaids);
    });
  });

  app.set('view engine', 'jade');
  app.get('/s/*', function(req, res) {
    res.render('index', {
      id: req.params[0]
    });
  });

  app.use('/', express.static('../'));

  http.listen(8080, 'localhost');

//});
