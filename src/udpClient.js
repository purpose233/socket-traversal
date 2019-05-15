const _ = require('lodash');
import {
  createClientTunnelSocket,
  createUdpSocket,
  handleSocketError,
  parseMsgWithMetaData,
  sendTcpInfo,
  sendUdpMetaData
} from './common/socket';
import {SocketType, TunnelClientInfoType, TunnelServerInfoType} from './common/constant';
import {logSocketData} from './common/log';

// TODO: improve the random algorithm
let randomPort = 20000;

const pipeTunnelAndDataUdpSocket = (tunnelSocket, dataSocket,
                                    uuid, bindPort, localPort) => {
  tunnelSocket.on('data', (data) => {
    logSocketData(data, 'Tunnel');

    const {metaData} = parseMsgWithMetaData(data);
    sendUdpMetaData(dataSocket, metaData, localPort, '127.0.0.1');
  });
  dataSocket.on('message', (msg, rinfo) => {
    logSocketData(msg, 'Data');
    const info = {
      uuid, bindPort,
      type: TunnelServerInfoType.DATA,
      socketType: SocketType.UDP
    };
    sendTcpInfo(tunnelSocket, info, msg);
  });
};

const createUdpDataSocket = () => {
  // TODO: retry bind a new port when createUdpSocket fails
  return createUdpSocket(randomPort++);
};

export const createUdpController = (serverPort, serverIP, proxies) => {
  const tunnelSockets = {};
  // TODO: set interval time to reconnect

  const udpControlSocket = Net.createConnection(serverPort, serverIP);
  handleSocketError(udpControlSocket);

  udpControlSocket.on('data', (data) => {
    logSocketData(data, 'UDP Control');
    const {info} = parseMsgWithMetaData(data);
    if (info.type === TunnelClientInfoType.CREATE_TUNNEL) {
      const proxy = _.find(proxies, {remotePort: info.bindPort});
      if (!proxy || !proxy.localPort) {
        return;
      }

      const tunnelSocket = createClientTunnelSocket(tunnelSockets, info.uuid,
        SocketType.UDP, info.bindPort, serverPort, serverIP);

      const dataSocket = createUdpDataSocket();
      pipeTunnelAndDataUdpSocket(tunnelSocket, dataSocket,
        info.uuid, info.bindPort, proxy.localPort);
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
