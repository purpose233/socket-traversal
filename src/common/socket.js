const dgram = require('dgram');
const TextEncoding = require('text-encoding');

const decoder = new TextEncoding.TextDecoder('utf-8');

export const createUdpSocket = (port, onListening, onError) => {
  const socket = dgram.createSocket('udp4');
  socket.on('listening',
    onListening ? onListening :
      function() {
        console.log("Server is listening on port %d.", port);
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

export const handleSocketError = (socket) => {
  socket.on('error', (e) => {
    console.log(e);
  });
};

export const parseMsgWithMetaData = (msg) => {
  if (msg instanceof Uint8Array) {
    msg = decoder.decode(msg);
  }
  const index = msg.indexOf('|');
  if (~index) {
    return {
      info: JSON.parse(msg.slice(0, index)),
      metaData: msg.slice(index + 1)
    };
  } else {
    return {
      info: JSON.parse(msg),
      metaData: null
    };
  }
};

// export const sendToAddress = (uuid, msg, source, address) => {
//   const info = JSON.stringify({
//     uuid,
//     type: 'data'
//   }) + '|' + decoder.decode(msg);
//   source.send(info, 0, info.length, address.port, address.ip);
// };

export const sendWithMetaData = (sender, info, metaData) => {
  // TODO: might add udp send
  metaData = metaData instanceof Uint8Array ? decoder.decode(metaData) : metaData;
  const msg = JSON.stringify(info) + (metaData ? '|' + metaData : '');
  sender.write(msg);
};

export const sendMetaData = (sender, metaData) => {
  metaData = metaData instanceof Uint8Array ? decoder.decode(metaData) : metaData;
  sender.write(metaData);
};
