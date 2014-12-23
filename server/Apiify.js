var Apiify = function(fn) {
  return function(req, res) {
    var args = [];
    for (var i in req.params)
      args.push(req.params[i]);
    args.push(function(val) {
      res.send(val);
    });
    fn.apply(this, args);
  };
};

module.exports = Apiify;