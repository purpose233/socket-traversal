const dgram = require('dgram');

export const createUdpSocket = (port, onListening, onError) => {
  const socket = dgram.createSocket('udp4');
  socket.on('listening',
    onListening ? onListening :
      function() {
        console.log("echo server is listening on port %d.", port);
      }
  );
  socket.on('error',
    onError ? onError :
      function(err) {
        console.log('error, msg - %s, stack - %s\n', err.message, err.stack);
      }
  );
  socket.bind(port);
  return socket;
};
