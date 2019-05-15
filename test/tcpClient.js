const net = require('net');
const TextEncoding = require('text-encoding');

const TunnelServerPort = 7001;
const ServerIP = '127.0.0.1';

const BindingPort = 11111;

const decoder = new TextEncoding.TextDecoder('utf-8');

const tunnelSockets = {};

// TODO: set interval time to reconnect
const mainClientSocket = net.createConnection(TunnelServerPort, ServerIP);

// data: {type: 'createTunnel', uuid: int}
mainClientSocket.on('data', (data) => {
  console.log('mainClientSocket receive data: ' + data);
  const receiveInfo = JSON.parse(decoder.decode(data));
  const uuid = receiveInfo.uuid;

  const tunnelSocket = net.createConnection(TunnelServerPort, ServerIP);
  tunnelSockets[uuid] = tunnelSocket;
  tunnelSocket.on('close', () => {
    delete tunnelSockets[uuid];
  });
  tunnelSocket.on('connect', () => {
    const replyInfo = {type: 'tunnel', uuid};
    tunnelSocket.write(JSON.stringify(replyInfo));
  });

  const dataSocket = net.createConnection(BindingPort, '127.0.0.1');
  tunnelSocket.pipe(dataSocket).pipe(tunnelSocket);
});

mainClientSocket.on('connect', () => {
  mainClientSocket.write(JSON.stringify({type: 'main'}));
});

mainClientSocket.on('error', (e) => {console.log(e)});
