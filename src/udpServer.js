const _ = require('lodash');
const {createUdpSocket, sendUdpMetaData} = require('./common/socket');
const {EventType, SocketType} = require('./common/constant');
const {logSocketData, logServerListening} = require('./common/log');

const createRemoteUdpServer = (eventEmitter, listenPort) => {
  const remoteServer = createUdpSocket(listenPort);

  remoteServer.on('message', (msg, rinfo) => {
    logSocketData(msg, 'UDP Remote');

    eventEmitter.emit(EventType.RECEIVE_UDP_MESSAGE,
      msg, rinfo.port, rinfo.address, listenPort);
  });

  logServerListening(listenPort, 'Udp Remote');
  return remoteServer;
};

const createUdpProxies = (eventEmitter, proxies) => {
  const remoteServers = {};

  for (let proxy of proxies) {
    remoteServers[proxy.listenPort] = createRemoteUdpServer(eventEmitter, proxy.listenPort);
  }

  eventEmitter.on(EventType.SEND_UDP_MESSAGE, (metaData, bindPort,
                                               remotePort, remoteIP) => {
    const server = remoteServers[bindPort];
    sendUdpMetaData(server, metaData, remotePort, remoteIP);
  });

  return remoteServers;
};

module.exports = {
  createUdpProxies
};
