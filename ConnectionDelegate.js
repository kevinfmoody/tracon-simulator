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

};