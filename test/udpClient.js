const dgram = require('dgram');
const _ = require('lodash');
const TextEncoding = require('text-encoding');

const createUdpSocket = (port, onListening, onError) => {
  const socket = dgram.createSocket('udp4');
  socket.on('listening',
    onListening ? onListening :
      function() {
        console.log("echo server is listening on port %d.", port);
      }
  );
  socket.on('error',
    onError ? onError :
      function(err) {
        console.log('error, msg - %s, stack - %s\n', err.message, err.stack);
      }
  );
  socket.bind(port);
  return socket;
};

const decoder = new TextEncoding.TextDecoder('utf-8');

const MainClientPort = 8000;
const TunnelServerPort = 7004;
const ServerIP = '127.0.0.1';

const BindingPort = 11112;

const dataServerInfos = [];
let randomPort = 20000;

const mainClientServer = createUdpSocket(MainClientPort);
mainClientServer.on('message', (msg, rinfo) => {
  console.log('mainClientServer receive: ' + msg + ' from ' + rinfo.address + ':' + rinfo.port);
  const {info, metaData} = parseUdpMsgWithMetaData(msg);
  // info: {type: 'createTunnel'|'data', uuid: int}
  const uuid = info.uuid;
  switch(info.type) {
    case 'createTunnel':
      const dataServer = createUdpSocket(randomPort++);
      dataServer.on('message', (msg, rinfo) => {
        console.log('DataServer receive: ' + msg + ' from ' + rinfo.address + ':' + rinfo.port);
        if (rinfo.port === MainClientPort) {
          dataServer.send(msg, 0, msg.length, BindingPort, '127.0.0.1');
        } else {
          const info = JSON.stringify({
            uuid,
            type: 'data'
          }) + '|' + decoder.decode(msg);
          dataServer.send(info, 0, info.length, TunnelServerPort, ServerIP);
        }
      });
      dataServer.on('listening', () => {
        const info = JSON.stringify({
          type: 'tunnel',
          uuid
        });
        dataServer.send(info, 0, info.length, TunnelServerPort, ServerIP);
      });
      dataServerInfos.push({
        uuid,
        port: randomPort - 1,
        server: dataServer
      });
      break;
    case 'data':
      const serverInfo = _.find(dataServerInfos, {uuid});
      mainClientServer.send(metaData, 0, metaData.length, serverInfo.port, '127.0.0.1');
      break;
  }
});

const initMsg = JSON.stringify({
  type: 'main'
});
mainClientServer.send(initMsg, 0, initMsg.length, TunnelServerPort, ServerIP);

function parseUdpMsgWithMetaData(msg) {
  if (msg instanceof Uint8Array) {
    msg = decoder.decode(msg);
  }
  const index = msg.indexOf('|');
  if (~index) {
    return {
      info: JSON.parse(msg.slice(0, index)),
      metaData: msg.slice(index + 1)
    };
  } else {
    return {
      info: JSON.parse(msg),
      metaData: null
    };
  }
}
