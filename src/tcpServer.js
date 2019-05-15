const Net = require('net');
const {handleSocketError} = require('./common/socket');
const {EventType, SocketType} = require('./common/constant');

const createRemoteTcpServer = (eventEmitter, listenPort) => {
  const remoteServer = Net.createServer(function (socket) {
    handleSocketError(socket);

    eventEmitter.emit(EventType.RECEIVE_REMOTE_CONNECTION, socket, listenPort);
  });

  remoteServer.listen(listenPort, '127.0.0.1');
};

const createTcpProxies = (eventEmitter, proxies) => {
  const remoteServers = {};
  for (let proxy of proxies) {
    remoteServers[proxy.listenPort] = createRemoteTcpServer(eventEmitter, proxy.listenPort);
  }
  return remoteServers;
};

module.exports = {
  createTcpProxies
};
