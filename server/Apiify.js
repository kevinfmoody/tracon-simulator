var Apiify = function(fn, type) {
  return function(req, res) {
    var args = [];
    for (var i in req.params)
      args.push(req.params[i]);
    args.push(function(val) {
      var payload = {};
      payload[type] = val;
      res.send(payload);
    });
    fn.apply(this, args);
  };
};

module.exports = Apiify;