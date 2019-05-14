const Net = require('net');
const _ = require('lodash');

import {handleSocketError, parseMsgWithMetaData, sendMetaData, sendWithMetaData} from './common/socket';
import {logSocketData} from './common/log';
import {SocketType, TunnelClientInfoType, TunnelServerInfoType} from './common/config';

const pipeTunnelSocketAndDataSocket = (tunnelSocket, dataSocket, uuid, bindPort) => {
  tunnelSocket.on('data', (data) => {
    logSocketData(data, 'Tunnel');
    const {metaData} = parseMsgWithMetaData(data);
    sendMetaData(dataSocket, metaData);
  });
  dataSocket.on('data', (data) => {
    logSocketData(data, 'Data');
    const info = {
      uuid, bindPort,
      type: TunnelServerInfoType.DATA,
      socketType: SocketType.TCP
    };
    sendWithMetaData(tunnelSocket, info, data);
  });
};

export const createTcpController = (serverPort, serverIP, proxies) => {
  const tunnelSockets = {};

  // TODO: set interval time to reconnect
  const tcpControlSocket = Net.createConnection(serverPort, serverIP);
  handleSocketError(tcpControlSocket);

  tcpControlSocket.on('data', (data) => {
    logSocketData(data, 'TcpControl');
    const {info} = parseMsgWithMetaData(data);
    if (info.type === TunnelClientInfoType.CREATE_TUNNEL) {
      const proxy = _.find(proxies, {remotePort: info.bindPort});
      if (!proxy || !proxy.localPort) {
        return;
      }

      const tunnelSocket = Net.createConnection(serverPort, serverIP);
      handleSocketError(tcpControlSocket);

      tunnelSocket.on('close', () => {
        delete tunnelSockets[info.uuid];
      });

      tunnelSocket.on('connect', () => {
        const replyInfo = {
          type: TunnelServerInfoType.TUNNEL,
          bindPort: info.bindPort,
          socketType: SocketType.TCP,
          uuid: null
        };
        sendWithMetaData(tunnelSocket, replyInfo);
      });

      const dataSocket = Net.createConnection(proxy.localPort, '127.0.0.1');
      pipeTunnelSocketAndDataSocket(tunnelSocket, dataSocket,
        info.uuid, info.bindPort);
      tunnelSockets[info.uuid] = tunnelSocket;
    }
  });

  tcpControlSocket.on('connect', () => {
    const info = {
      type: TunnelServerInfoType.CONTROL,
      bindPort: 0,
      socketType: SocketType.TCP,
      uuid: null
    };
    sendWithMetaData(tcpControlSocket, info);
  });

  return tcpControlSocket;
};
