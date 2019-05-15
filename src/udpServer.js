const _ = require('lodash');
import {createUdpSocket, sendUdpMetaData} from './common/socket';
import {EventType, SocketType} from './common/config';
import {logSocketData} from './common/log';

const createRemoteUdpServer = (eventEmitter, listenPort) => {
  const remoteServer = createUdpSocket(listenPort);

  remoteServer.on('message', (msg, rinfo) => {
    logSocketData(msg, 'UDP Remote');

    eventEmitter.emit(EventType.RECEIVE_UDP_MESSAGE,
      SocketType.UDP, rinfo.port, rinfo.address, listenPort);
  });
};

export const createUdpProxies = (eventEmitter, proxies) => {
  const remoteServers = {};

  for (let proxy of proxies) {
    remoteServers[proxy.listenPort] = createRemoteUdpServer(eventEmitter, proxy.listenPort);
  }

  eventEmitter.on(EventType.SEND_UDP_MESSAGE, (bindPort, remotePort, remoteIP, metaData) => {
    const server = remoteServers[bindPort];
    sendUdpMetaData(server, metaData, remotePort, remoteIP);
  });
};
