const net = require('net');
const _ = require('lodash');
const {
  createClientTunnelSocket,
  createUdpSocket,
  handleSocketError,
  parseMsgWithMetaData,
  sendTcpInfo,
  sendUdpMetaData
} = require('./common/socket');
const {SocketType, TunnelClientInfoType,
  TunnelServerInfoType} = require('./common/constant');
const {logSocketData, logSocketConnection, logWarning} = require('./common/log');

// TODO: improve the random algorithm
const MIN_RANDOM_PORT = 20000;
const MAX_RANDOM_PORT = 65535;
let randomPort = 20000;

// TODO: need to reduce the number of parameter of pipeTunnelAndDataUdpSocket...
const pipeTunnelAndDataUdpSocket = (tunnelSocket, dataSocket,
                                    uuid, bindPort, localPort,
                                    tunnelSockets, dataSocketInfos) => {
  tunnelSocket.on('data', (data) => {
    logSocketData(data, 'Tunnel');

    const {metaData} = parseMsgWithMetaData(data);
    updateDataSocketTime(uuid, dataSocketInfos);
    sendUdpMetaData(dataSocket, metaData, localPort, '127.0.0.1');
  });
  dataSocket.on('message', (msg, rinfo) => {
    logSocketData(msg, 'Data');
    const info = {
      uuid, bindPort,
      type: TunnelServerInfoType.DATA,
      socketType: SocketType.UDP
    };
    updateDataSocketTime(uuid, dataSocketInfos);
    sendTcpInfo(tunnelSocket, info, msg);
  });
  tunnelSocket.on('close', () => {
    if (tunnelSockets[uuid]) {
      delete tunnelSockets[uuid];
    }
    if (dataSocketInfos[uuid]) {
      const dataSocketInfo = dataSocketInfos[uuid];
      dataSocketInfo.socket.close();
      dataSocketInfo.timeoutController.clear();
      delete dataSocketInfos[uuid];
    }
  });
};

const getNextRandomPort = () => {
  if (randomPort >= MAX_RANDOM_PORT) {
    randomPort = MIN_RANDOM_PORT;
  }
  return randomPort++;
};

const createUdpDataSocket = () => {
  // TODO: retry bind a new port when createUdpSocket fails
  while (true) {
    try {
      return createUdpSocket(getNextRandomPort())
    } catch (e) {
      logWarning('port has been occupied, trying to bind a new one...');
    }
  }
};

const updateDataSocketTime = (uuid, dataSocketInfos) => {
  const dataSocketInfo = dataSocketInfos[uuid];
  dataSocketInfo.lastTime = new Date().getTime();
  dataSocketInfo.timeoutController.resetTimeout();
};

const dataSocketTimeout = (uuid, dataSocketInfos, tunnelSockets, udpTimeout) => {
  const timeoutCb = () => {
    tunnelSockets[uuid].end();
    dataSocketInfos[uuid].socket.close();
    // TODO: delete tunnelSockets[uuid] might not be necessary,
    //  cuz it will be performed in onClose callback.
    delete tunnelSockets[uuid];
    delete dataSocketInfos[uuid];
  };

  let timeout = setTimeout(timeoutCb, udpTimeout * 1000);

  const resetTimeout = () => {
    clearTimeout(timeout);
    timeout = setTimeout(timeoutCb, udpTimeout * 1000);
  };

  const clear = () => {
    clearTimeout(timeout);
  };

  return {
    timeout, resetTimeout, clear
  };
};

const createUdpController = (serverPort, serverIP, proxies, udpTimeout) => {
  const tunnelSockets = {};
  // TODO: set interval time to reconnect

  // item: {socket, lastTime, timeoutController}
  const dataSocketInfos = {};

  const udpControlSocket = net.createConnection(serverPort, serverIP);
  logSocketConnection(serverPort, serverIP, 'Udp Control');
  handleSocketError(udpControlSocket);

  udpControlSocket.on('data', (data) => {
    logSocketData(data, 'UDP Control');
    const {info} = parseMsgWithMetaData(data);
    const uuid = info.uuid;
    if (info.type === TunnelClientInfoType.CREATE_TUNNEL) {
      const proxy = _.find(proxies, {remotePort: info.bindPort});
      if (!proxy || !proxy.localPort) {
        return;
      }

      const tunnelSocket = createClientTunnelSocket(uuid, SocketType.UDP,
        info.bindPort, serverPort, serverIP);
      tunnelSockets[uuid] = tunnelSocket;

      const dataSocket = createUdpDataSocket();
      pipeTunnelAndDataUdpSocket(tunnelSocket, dataSocket, uuid,
        info.bindPort, proxy.localPort, tunnelSockets, dataSocketInfos);

      dataSocketInfos[uuid] = {
        socket: dataSocket,
        lastTime: new Date().getTime(),
        timeoutController: dataSocketTimeout(uuid,
          dataSocketInfos, tunnelSockets, udpTimeout)
      };
    }
  });

  udpControlSocket.on('connect', () => {
    const info = {
      type: TunnelServerInfoType.CONTROL,
      bindPort: 0,
      socketType: SocketType.UDP,
      uuid: null
    };
    sendTcpInfo(udpControlSocket, info);
  });

  return udpControlSocket;
};

module.exports = {
  createUdpController
};
