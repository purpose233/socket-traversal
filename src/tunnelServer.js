const Net = require('net');
const uuidv4 = require('uuid/v4');
import {handleSocketError, parseMsgWithMetaData,
  sendMetaData, sendWithMetaData} from './common/socket';
import {logSocketData} from './common/log';
import {EventType, SocketType,
  TunnelClientInfoType, TunnelServerInfoType} from './common/config';

const pipeRemoteAndTunnelSocket = (remoteSocket, tunnelSocket, uuid, srcPort) => {
  remoteSocket.on('data', (data) => {
    const info = {
      srcPort, uuid,
      type: TunnelClientInfoType.DATA,
      socketType: SocketType.TCP
    };
    sendWithMetaData(tunnelSocket, info, data);
  });
  tunnelSocket.on('data', (data) => {
    const {metaData} = parseMsgWithMetaData(data);
    sendMetaData(remoteSocket, metaData);
  });
};

export const createTunnelServer = (eventEmitter, bindPort) => {
  // TODO: note that the amount of tunnelSocket might reach the limit.

  let tcpControlSocket = null;
  let udpControlSocket = null;

  // TODO: improve the performance of operation in tunnelSockets
  const tunnelSockets = {};
  const remoteTcpSocketInfos = {};
  // const remoteUdpAddresses = [];

  const tunnelServer = Net.createServer((socket) => {
    handleSocketError(socket);

    // Note that all communications between remote socket or remote udp server
    // are through eventEmitter. So, only message from local server will reach.
    socket.on('data', (data) => {
      logSocketData(data, 'Tunnel');
      const {info, metaData} = parseMsgWithMetaData(data);
      const uuid = info.uuid;
      switch (info.type) {
        case TunnelServerInfoType.CONTROL:
          if (info.socketType === SocketType.TCP) {
            tcpControlSocket = socket;
          } else if (info.socketType === SocketType.UDP) {
            udpControlSocket = socket;
          }
          break;
        case TunnelServerInfoType.TUNNEL:
          tunnelSockets[uuid] = socket;
          socket.on('close', () => {
            delete tunnelSockets[uuid];
          });
          break;
        case TunnelServerInfoType.DATA:
          if (info.socketType === SocketType.TCP) {
            const remoteSocketInfo = remoteTcpSocketInfos[uuid];
            pipeRemoteAndTunnelSocket(remoteSocketInfo.socket, socket, uuid, remoteSocketInfo.port);
            socket.resume();
          } else if (info.socketType === SocketType.UDP) {
            // TODO
          }
          break;
      }
    });
  });

  eventEmitter.on(EventType.RECEIVE_REMOTE_CONNECTION, (socketType, src, srcPort) => {
    // When socket type is TCP, src is socket object.
    //  else src is address object.
    if (socketType === SocketType.TCP) {
      const socketId = uuidv4();
      const remoteSocket = src;
      remoteTcpSocketInfos[socketId] = {
        port: srcPort,
        socket: remoteSocket,
      };
      remoteSocket.on('close', () => {
        delete remoteTcpSocketInfos[socketId];
      });
      remoteSocket.pause();
      const info = {
        type: TunnelClientInfoType.CREATE_TUNNEL,
        srcPort,
        socketType: SocketType.TCP,
        uuid: socketId
      };
      sendWithMetaData(tcpControlSocket, info);
    } else if (socketType === SocketType.UDP) {
      // TODO
    }
  });

  tunnelServer.listen(bindPort, '127.0.0.1');
  return tunnelServer;
};
