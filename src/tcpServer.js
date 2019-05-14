const Net = require('net');
import {handleSocketError} from './common/socket';
import {EventType, SocketType} from './common/config';

const createRemoteServer = (eventEmitter, listenPort) => {
  const remoteServer = Net.createServer(function (socket) {
    handleSocketError(socket);

    eventEmitter.emit(EventType.RECEIVE_REMOTE_CONNECTION,
      SocketType.TCP, socket, listenPort);
  });

  remoteServer.listen(listenPort, '127.0.0.1');
};

export const createTcpProxies = (eventEmitter, proxies) => {
  for (let proxy of proxies) {
    createRemoteServer(eventEmitter, proxy.listenPort);
  }
};
