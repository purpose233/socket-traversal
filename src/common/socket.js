const dgram = require('dgram');
const TextEncoding = require('text-encoding');
import {TunnelServerInfoType} from './constant';

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

export const createClientTunnelSocket = (tunnelSockets, uuid, socketType,
                                         bindPort, serverPort, serverIP) => {
  const tunnelSocket = Net.createConnection(serverPort, serverIP);
  handleSocketError(tunnelSocket);

  tunnelSocket.on('close', () => {
    delete tunnelSockets[uuid];
  });

  tunnelSocket.on('connect', () => {
    const replyInfo = {
      type: TunnelServerInfoType.TUNNEL,
      bindPort, socketType,
      uuid: null
    };
    sendTcpInfo(tunnelSocket, replyInfo);
  });

  tunnelSockets[uuid] = tunnelSocket;

  return tunnelSocket;
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

const decodeMetaData = (metaData) => {
  return metaData instanceof Uint8Array ? decoder.decode(metaData) : metaData;
};

export const sendTcpInfo = (sender, info, metaData) => {
  metaData = decodeMetaData(metaData);
  const msg = JSON.stringify(info) + (metaData ? '|' + metaData : '');
  sender.write(msg);
};

export const sendTcpMetaData = (sender, metaData) => {
  metaData = decodeMetaData(metaData);
  sender.write(metaData);
};

export const sendUdpMetaData = (sender, metaData, remotePort, remoteIP) => {
  metaData = decodeMetaData(metaData);
  sender.send(metaData, 0, metaData.length, remotePort, remoteIP);
};
