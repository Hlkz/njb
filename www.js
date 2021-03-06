var debug = require('debug')('hlkz:server');
import http from 'http'
import { ConfigPath } from './path'
let config = require(ConfigPath)

var port = normalizePort(config.port);

export default (app) => {
  // Get port from environment and store in Express
  // Create HTTP server
  var server = http.createServer(app);

  // Event listener for HTTP server "listening" event
  function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug('Listening on ' + bind);
  }

  app.Start = function() {
    // Listen on provided port, on all network interfaces
    app.set('port', port)
    server.listen(port)
    server.on('error', onError)
    server.on('listening', onListening)
  }
}

// Normalize a port into a number, string, or false.
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

// Event listener for HTTP server "error" event
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
