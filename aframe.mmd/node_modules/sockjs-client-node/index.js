'use strict';

var scope = require('jsdom').jsdom().createWindow()
  , primus = require.resolve('primus')
  , read = require('fs').readFileSync
  , path = require('path');

//
// The library in Primus contains additional stability fixes which makes it
// a lot more stable to run on node, which why we use that instead.
//
var library = path.join(primus, '..', 'transformers/sockjs/library.js');

scope.WebSocket = require('ws');
scope.eval(read(library, 'utf-8'));

module.exports = scope.SockJS;
