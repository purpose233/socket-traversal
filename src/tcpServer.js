const Net = require('net');
import {handleSocketError} from './common/socket';
import {EventType, SocketType} from './common/config';


// const createRemoteServer = () => {
//   const remoteServer = Net.createServer(function (socket) {
//     handleSocketError(socket);
//
//     const socketId = UUID++;
//     remoteSockets[socketId] = socket;
//     socket.on('close', () => {
//       delete remoteSockets[socketId];
//     });
//     socket.pause();
//     const info = {type: 'createTunnel', uuid: socketId};
//     mainClientSocket.write(JSON.stringify(info));
//   });
//
//   remoteServer.listen(RemoteServerPort, '127.0.0.1');
// };
//
// export const initTcpProxyServer = (proxies, bindPort) => {
//   let UUID = 0;
//   let mainClientSocket = null;
//
//   const remoteSockets = {};
//   const tunnelSockets = {};
//
//   const tunnelServer = Net.createServer((socket) => {
//     let isPiping = false;
//     handleSocketError(socket);
//     // data: {type: 'main'|'tunnel', uuid: int, remotePort: int}
//     socket.on('data', (data) => {
//       if (isPiping) { return; }
//       console.log('Tunnel receive data: ' + data);
//       const info = JSON.parse(decoder.decode(data));
//       const uuid = info.uuid;
//       if (info.type === 'main') {
//         mainClientSocket = socket;
//       } else if (info.type === 'tunnel') {
//         tunnelSockets[uuid] = socket;
//         socket.on('close', () => {
//           delete tunnelSockets[uuid];
//         });
//         remoteSockets[uuid].pipe(socket).pipe(remoteSockets[uuid]);
//         remoteSockets[uuid].resume();
//         isPiping = true;
//       }
//     });
//   });
//
//   tunnelServer.listen(TunnelServerPort, '127.0.0.1');
// };

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
