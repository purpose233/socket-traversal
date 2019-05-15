const Net = require('net');
const uuidv4 = require('uuid/v4');
const {
  handleSocketError,
  parseMsgWithMetaData,
  sendTcpMetaData,
  sendTcpInfo} = require('./common/socket');
const {logSocketData} = require('./common/log');
const {
  EventType,
  SocketType,
  TunnelClientInfoType,
  TunnelServerInfoType} = require('./common/constant');

const pipeRemoteAndTunnelSocket = (remoteSocket, tunnelSocket, uuid, bindPort) => {
  remoteSocket.on('data', (data) => {
    logSocketData(data, 'TCP Remote');
    const info = {
      bindPort, uuid,
      type: TunnelClientInfoType.DATA,
      socketType: SocketType.TCP
    };
    sendTcpInfo(tunnelSocket, info, data);
  });
  tunnelSocket.on('data', (data) => {
    logSocketData(data, 'Tunnel');
    const {metaData} = parseMsgWithMetaData(data);
    sendTcpMetaData(remoteSocket, metaData);
  });
};

const createTunnelServer = (eventEmitter, listenPort) => {
  // TODO: note that the amount of tunnelSocket might reach the limit.

  let tcpControlSocket = null;
  let udpControlSocket = null;

  // TODO: improve the performance of operation in tunnelSockets
  const tunnelSockets = {};
  // TODO: maybe put tcp and udp remote sockets in the same object
  // item: {port, socket, uuid}
  const remoteTcpSocketInfos = {};
  // item: {port, remotePort, remoteIP, uuid}
  const remoteUdpSocketInfos = {};

  // Stash the msg from udp remote server
  // msg: {msg, uuid, remotePort, remoteIP}
  const stashedMsgInfos = [];

  const tunnelServer = Net.createServer((socket) => {
    handleSocketError(socket);

    // Used for tcp <--> tcp piping.
    let isPiping = false;

    // Note that all communications between remote socket or remote udp server
    // are through eventEmitter. So, only message from local server will reach.
    socket.on('data', (data) => {
      if (isPiping) { return; }

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
          if (info.socketType === SocketType.TCP) {
            const remoteSocketInfo = remoteTcpSocketInfos[uuid];
            // pipe teh remote socket and tunnel socket
            pipeRemoteAndTunnelSocket(remoteSocketInfo.socket, socket,
              uuid, remoteSocketInfo.port);
            remoteSocketInfo.socket.resume();
            isPiping = true;
          } else if (info.socketType === SocketType.UDP) {
            const remoteSocketInfo = remoteUdpSocketInfos[uuid];
            const msgInfos = _.remove(stashedMsgInfos, {uuid});
            // flush all stashed messages
            for (const msgInfo of msgInfos) {
              const dataInfo = {
                uuid,
                type: TunnelClientInfoType.DATA,
                bindPort: remoteSocketInfo.port,
                socketType: SocketType.UDP
              };
              sendTcpInfo(socket, dataInfo, msgInfo.msg);
            }
          }
          break;
        case TunnelServerInfoType.DATA:
          // If socketType is TCP, then it will be handled by piping.
          if (info.socketType === SocketType.UDP) {
            const remoteSocketInfo = remoteUdpSocketInfos[uuid];
            eventEmitter.emit(EventType.SEND_UDP_MESSAGE, metaData, info.bindPort,
              remoteSocketInfo.remotePort, remoteSocketInfo.remoteIP);
          }
          break;
      }
    });
  });

  eventEmitter.on(EventType.RECEIVE_REMOTE_CONNECTION, (remoteSocket, bindPort) => {
    const uuid = uuidv4();
    remoteTcpSocketInfos[uuid] = {
      uuid,
      port: bindPort,
      socket: remoteSocket,
    };
    remoteSocket.on('close', () => {
      delete remoteTcpSocketInfos[uuid];
    });
    remoteSocket.pause();
    const info = {
      type: TunnelClientInfoType.CREATE_TUNNEL,
      bindPort, uuid,
      socketType: SocketType.TCP
    };
    sendTcpInfo(tcpControlSocket, info);
  });

  eventEmitter.on(EventType.RECEIVE_UDP_MESSAGE, (msg, remotePort, remoteIP, bindPort) => {
    const remoteInfo = _.find(remoteUdpSocketInfos, {remotePort, remoteIP});
    if (!remoteInfo) {
      const uuid = uuidv4();
      remoteUdpSocketInfos[uuid] = {
        uuid,
        port: bindPort,
        remotePort, remoteIP
      };
      stashedMsgInfos.push({
        msg, uuid, remotePort, remoteIP
      });
      const info = {
        type: TunnelClientInfoType.CREATE_TUNNEL,
        bindPort, uuid,
        socketType: SocketType.UDP
      };
      sendTcpInfo(udpControlSocket, info);
    } else {
      const uuid = remoteInfo.uuid;
      const tunnelSocket = tunnelSockets[uuid];
      if (tunnelSocket) {
        const info = {
          type: TunnelClientInfoType.DATA,
          bindPort, uuid,
          socketType: SocketType.UDP
        };
        sendTcpInfo(tunnelSocket, info, msg);
      } else {
        stashedMsgInfos.push({
          msg, uuid, remotePort, remoteIP
        });
      }
    }
  });

  tunnelServer.listen(listenPort, '127.0.0.1');
  return tunnelServer;
};

module.exports = {
  createTunnelServer
};
