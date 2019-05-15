const net = require('net');
const dgram = require('dgram');
const TextEncoding = require('text-encoding');
const {TunnelServerInfoType} = require('./constant');
const {logServerListening, logServerError} = require('./log');

const decoder = new TextEncoding.TextDecoder('utf-8');

const decodeMetaData = (metaData) => {
  return metaData instanceof Uint8Array ? decoder.decode(metaData) : metaData;
};

const createUdpSocket = (port, onListening, onError) => {
  const socket = dgram.createSocket('udp4');
  socket.on('listening',
    onListening ? onListening :
      () => {
    // logServerListening(port, 'Udp Remote');
      }
  );
  socket.on('error',
    onError ? onError :
      (err) => {logServerError(err, port, 'Udp Remote');}
  );
  socket.bind(port);
  return socket;
};

const createClientTunnelSocket = (tunnelSockets, uuid, socketType,
                                         bindPort, serverPort, serverIP) => {
  const tunnelSocket = net.createConnection(serverPort, serverIP);
  handleSocketError(tunnelSocket);

  tunnelSocket.on('close', () => {
    delete tunnelSockets[uuid];
  });

  tunnelSocket.on('connect', () => {
    const replyInfo = {
      type: TunnelServerInfoType.TUNNEL,
      bindPort, socketType, uuid
    };
    sendTcpInfo(tunnelSocket, replyInfo);
  });

  tunnelSockets[uuid] = tunnelSocket;

  return tunnelSocket;
};

const handleSocketError = (socket) => {
  socket.on('error', (e) => {
    console.log(e);
  });
};

// TODO: add try..catch... so that when receiving wrong message program won't crash
const parseMsgWithMetaData = (msg) => {
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

const sendTcpInfo = (sender, info, metaData) => {
  metaData = decodeMetaData(metaData);
  const msg = JSON.stringify(info) + (metaData ? '|' + metaData : '');
  sender.write(msg);
};

const sendTcpMetaData = (sender, metaData) => {
  metaData = decodeMetaData(metaData);
  sender.write(metaData);
};

const sendUdpMetaData = (sender, metaData, remotePort, remoteIP) => {
  metaData = decodeMetaData(metaData);
  sender.send(metaData, 0, metaData.length, remotePort, remoteIP);
};

module.exports = {
  createUdpSocket, createClientTunnelSocket, handleSocketError,
  parseMsgWithMetaData, sendTcpInfo, sendTcpMetaData, sendUdpMetaData
};
