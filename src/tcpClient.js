const Net = require('net');
const _ = require('lodash');
import {
  handleSocketError,
  parseMsgWithMetaData,
  sendTcpMetaData,
  sendTcpInfo,
  createClientTunnelSocket
} from './common/socket';
import {logSocketData} from './common/log';
import {SocketType, TunnelClientInfoType, TunnelServerInfoType} from './common/config';

const pipeTunnelAndDataTcpSocket = (tunnelSocket, dataSocket, uuid, bindPort) => {
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
};

export const createTcpController = (serverPort, serverIP, proxies) => {
  const tunnelSockets = {};

  // TODO: set interval time to reconnect
  const tcpControlSocket = Net.createConnection(serverPort, serverIP);
  handleSocketError(tcpControlSocket);

  tcpControlSocket.on('data', (data) => {
    logSocketData(data, 'TCP Control');
    const {info} = parseMsgWithMetaData(data);
    if (info.type === TunnelClientInfoType.CREATE_TUNNEL) {
      const proxy = _.find(proxies, {remotePort: info.bindPort});
      if (!proxy || !proxy.localPort) {
        return;
      }

      const tunnelSocket = createClientTunnelSocket(tunnelSockets, info.uuid,
        SocketType.TCP, info.bindPort, serverPort, serverIP);

      const dataSocket = Net.createConnection(proxy.localPort, '127.0.0.1');
      pipeTunnelAndDataTcpSocket(tunnelSocket, dataSocket,
        info.uuid, info.bindPort);
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
