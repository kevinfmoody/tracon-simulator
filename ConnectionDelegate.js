function ConnectionDelegate(scope, socket) {
  this._scope = scope;
  this._socket = socket;

  this.bindServerListeners();
}

ConnectionDelegate.prototype.bindServerListeners = function() {

  this._socket.on('textMessage', function(data) {
    var $msg = $('<p>').text(data.from.toUpperCase() + '> ' + data.message);
    $('.incoming-messages').append($msg);
  });

  this._socket.on('controllers', function(controllers) {
    this._scope.setControllers(controllers.map(function(controller) {
      return Controller.fromJSON(controller);
    }));
  }.bind(this));

  this._socket.on('ownershipClaimed', function(data) {
    var target = scope.targetManager().getTargetByCallsign(data.aircraft);
    if (target) {
      var controller = scope.getControllerByIdentifier(data.controller);
      target.setController(controller);
    }
  });

  this._socket.on('handoffRequested', function(data) {
    var target = scope.targetManager().getTargetByCallsign(data.aircraft);
    if (target) {
      var controller = scope.getControllerByIdentifier(data.controller);
      target.inboundHandoff(controller);
    }
  });

  this._socket.on('handoffAccepted', function(data) {
    var target = scope.targetManager().getTargetByCallsign(data.aircraft);
    if (target) {
      var to = scope.getControllerByIdentifier(data.to);
      target.handoffAccepted(to);
    }
  });

  this._socket.on('handoffRefused', function(data) {
    var target = scope.targetManager().getTargetByCallsign(data.aircraft);
    if (target) {
      target.handoffRefused();
    }
  });

};