const _ = require('lodash');
const {createUdpSocket, sendUdpMetaData} = require('./common/socket');
const {EventType, SocketType} = require('./common/constant');
const {logSocketData} = require('./common/log');

const createRemoteUdpServer = (eventEmitter, listenPort) => {
  const remoteServer = createUdpSocket(listenPort);

  remoteServer.on('message', (msg, rinfo) => {
    logSocketData(msg, 'UDP Remote');

    eventEmitter.emit(EventType.RECEIVE_UDP_MESSAGE,
      SocketType.UDP, rinfo.port, rinfo.address, listenPort);
  });
};

const createUdpProxies = (eventEmitter, proxies) => {
  const remoteServers = {};

  for (let proxy of proxies) {
    remoteServers[proxy.listenPort] = createRemoteUdpServer(eventEmitter, proxy.listenPort);
  }

  eventEmitter.on(EventType.SEND_UDP_MESSAGE, (bindPort, remotePort, remoteIP, metaData) => {
    const server = remoteServers[bindPort];
    sendUdpMetaData(server, metaData, remotePort, remoteIP);
  });

  return remoteServers;
};

module.exports = {
  createUdpProxies
};
