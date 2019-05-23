const net = require('net');
const dgram = require('dgram');
const TextEncoding = require('text-encoding');
const {TunnelServerInfoType, SocketType} = require('./constant');
const {logServerError, logSendError, logSocketConnectError} = require('./log');

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

const createClientTunnelSocket = (uuid, socketType, bindPort,
                                  serverPort, serverIP) => {
  const tunnelSocket = net.createConnection(serverPort, serverIP);
  handleSocketError(tunnelSocket);

  tunnelSocket.on('connect', () => {
    const replyInfo = {
      type: TunnelServerInfoType.TUNNEL,
      bindPort, socketType, uuid
    };
    sendTcpInfo(tunnelSocket, replyInfo);
  });

  return tunnelSocket;
};

const handleSocketError = (socket) => {
  socket.on('error', (e) => {
    logSocketConnectError(e);
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

const trySendTcp = (sender, msg) => {
  try {
    sender.write(msg);
  } catch (e) {
    logSendError(e, sender, SocketType.TCP);
  }
};

const trySendUdp = (sender, msg, remotePort, remoteIP) => {
  try {
    sender.send(msg, 0, msg.length, remotePort, remoteIP);
  } catch (e) {
    logSendError(e, sender, SocketType.UDP);
  }
};

const sendTcpInfo = (sender, info, metaData) => {
  metaData = decodeMetaData(metaData);
  const msg = JSON.stringify(info) + (metaData ? '|' + metaData : '');
  trySendTcp(sender, msg);
};

const sendTcpMetaData = (sender, metaData) => {
  metaData = decodeMetaData(metaData);
  trySendTcp(sender, metaData);
};

const sendUdpMetaData = (sender, metaData, remotePort, remoteIP) => {
  metaData = decodeMetaData(metaData);
  trySendUdp(sender, metaData, remotePort, remoteIP);
};

module.exports = {
  createUdpSocket, createClientTunnelSocket, handleSocketError,
  parseMsgWithMetaData, sendTcpInfo, sendTcpMetaData, sendUdpMetaData
};
