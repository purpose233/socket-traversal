const net = require('net');
const TextEncoding = require('text-encoding');

const RemoteServerPort = 7000;
const TunnelServerPort = 7001;

const decoder = new TextEncoding.TextDecoder('utf-8');

let UUID = 0;
let mainClientSocket = null;
const remoteSockets = {};
const tunnelSockets = {};

const remoteServer = net.createServer(function (socket) {
  socket.on('error', (e) => {console.log(e);});

  const socketId = UUID++;
  remoteSockets[socketId] = socket;
  socket.on('close', () => {
    delete remoteSockets[socketId];
  });
  socket.pause();
  const info = {type: 'createTunnel', uuid: socketId};
  mainClientSocket.write(JSON.stringify(info));
});

remoteServer.listen(RemoteServerPort, '127.0.0.1');

const tunnelServer = net.createServer((socket) => {
  let isPiping = false;
  socket.on('error', (e) => {console.log(e);});
  // data: {type: 'main'|'tunnel', uuid: int}
  socket.on('data', (data) => {
    if (isPiping) { return; }
    console.log('Tunnel receive data: ' + data);
    const info = JSON.parse(decoder.decode(data));
    const uuid = info.uuid;
    if (info.type === 'main') {
      mainClientSocket = socket;
    } else if (info.type === 'tunnel') {
      tunnelSockets[uuid] = socket;
      socket.on('close', () => {
        delete tunnelSockets[uuid];
      });
      remoteSockets[uuid].pipe(socket).pipe(remoteSockets[uuid]);
      remoteSockets[uuid].resume();
      isPiping = true;
    }
  });
});

tunnelServer.listen(TunnelServerPort, '127.0.0.1');
