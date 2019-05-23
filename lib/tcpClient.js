const net = require('net');
const _ = require('lodash');
const {
  handleSocketError,
  parseMsgWithMetaData,
  sendTcpMetaData,
  sendTcpInfo,
  createClientTunnelSocket
} = require('./common/socket');
const {
  logSocketData,
  logSocketConnection,
  logSocketConnectError
} = require('./common/log');
const {
  SocketType,
  TunnelClientInfoType,
  TunnelServerInfoType
} = require('./common/constant');

const pipeTunnelAndDataTcpSocket = (tunnelSocket, dataSocket, uuid, bindPort,
                                    tunnelSockets, dataSockets) => {
  tunnelSocket.on('data', (data) => {
    logSocketData(data, 'Tunnel');
    const {metaData} = parseMsgWithMetaData(data);
    sendTcpMetaData(dataSocket, metaData);
  });
  dataSocket.on('data', (data) => {
    logSocketData(data, 'Data');
    const info = {
      uuid, bindPort,
      type: TunnelServerInfoType.DATA,
      socketType: SocketType.TCP
    };
    sendTcpInfo(tunnelSocket, info, data);
  });
  tunnelSocket.on('close', () => {
    if (tunnelSockets[uuid]) {
      delete tunnelSockets[uuid];
    }
    if (!dataSocket.destroyed) {
      dataSocket.end();
    }
  });
  dataSocket.on('close', () => {
    if (dataSockets[uuid]) {
      delete dataSockets[uuid];
    }
    if (!tunnelSocket.destroyed) {
      tunnelSocket.end();
    }
  });
};

const createTcpController = (serverPort, serverIP, proxies) => {
  const tunnelSockets = {};
  const dataSockets = {};

  const tcpControlSocket = net.createConnection(serverPort, serverIP);
  logSocketConnection(serverPort, serverIP, 'Tcp Control');
  handleSocketError(tcpControlSocket);

  tcpControlSocket.on('data', (data) => {
    logSocketData(data, 'TCP Control');
    const {info} = parseMsgWithMetaData(data);
    const uuid = info.uuid;
    if (info.type === TunnelClientInfoType.CREATE_TUNNEL) {
      const proxy = _.find(proxies, {remotePort: info.bindPort});
      if (!proxy || !proxy.localPort) {
        return;
      }

      const tunnelSocket = createClientTunnelSocket(uuid, SocketType.TCP,
        info.bindPort, serverPort, serverIP);
      tunnelSockets[uuid] = tunnelSocket;

      const dataSocket = net.createConnection(proxy.localPort, '127.0.0.1');
      dataSockets[uuid] = dataSocket;
      dataSocket.on('error', (e) => {
        logSocketConnectError(e);
        if (!tunnelSocket.destroyed) {
          tunnelSocket.end();
        }
        delete dataSockets[uuid];
      });
      pipeTunnelAndDataTcpSocket(tunnelSocket, dataSocket,
        uuid, info.bindPort, tunnelSockets, dataSockets);
    }
  });

  tcpControlSocket.on('connect', () => {
    const info = {
      type: TunnelServerInfoType.CONTROL,
      bindPort: 0,
      socketType: SocketType.TCP,
      uuid: null
    };
    sendTcpInfo(tcpControlSocket, info);
  });

  return tcpControlSocket;
};

module.exports = {
  createTcpController
};
