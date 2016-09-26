'use strict';

var sockjs = require('sockjs')
  , http = require('http');

//
// Setup a Sockjs server so we can listen for incoming connections and regular
// HTTP server to listen for incoming requests.
//
var realtime = sockjs.createServer()
  , server = http.createServer();

realtime.on('connection', function (socket) {
  socket.on('data', function echo(data) {
    socket.write(data);
  });
});

realtime.installHandlers(server, {
  prefix: '/test'
});

//
// Listen to the server.
//
server.listen(8123, function listening() {
  var SockJS = require('./')
    , socket = new SockJS('http://localhost:8123/test');

  socket.onopen = function onopen() {
    socket.send('foo');
  };

  socket.onmessage = function onmessage(evt) {
    if ('foo' === evt.data) return process.exit(0);

    console.error('Invalid message');
    process.exit(1);
  };

  setTimeout(function timeout() {
    console.error('timeout');

    process.exit(1);
  }, 1000);
});
