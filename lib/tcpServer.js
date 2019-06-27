const net = require('net');
const {handleSocketError} = require('./common/socket');
const {EventType} = require('./common/constant');
const {logServerListening} = require('./common/log');

const createRemoteTcpServer = (eventEmitter, listenPort) => {
  const remoteServer = net.createServer(function (socket) {
    handleSocketError(socket);

    eventEmitter.emit(EventType.RECEIVE_REMOTE_CONNECTION, socket, listenPort);
  });

  remoteServer.listen(listenPort);
  logServerListening(listenPort, 'Tcp Remote');

  return remoteServer;
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
