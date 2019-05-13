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

const RemoteServerPort = 7003;
const TunnelServerPort = 7004;

let UUID = 0;
let mainClientAddress = null;

const remoteAddresses = [];
// TODO: remove useless tunnelAddresses
//  or directly send meta data to tunnelAddress
const tunnelAddresses = [];

const stashedMsgs = [];

const remoteServer = createUdpSocket(RemoteServerPort);
remoteServer.on('message', (msg, rinfo) => {
  console.log('RemoteServer receive: ' + msg + ' from ' + rinfo.address + ':' + rinfo.port);
  const remoteAddress = _.find(remoteAddresses, {port: rinfo.port, ip: rinfo.address});
  let uuid;
  if (!remoteAddress) {
    uuid = UUID++;
    stashedMsgs.push({
      msg, uuid,
      port: rinfo.port,
      ip: rinfo.address
    });
    remoteAddresses.push({
      uuid,
      port: rinfo.port,
      ip: rinfo.address
    });
    const info = JSON.stringify({
      type: 'createTunnel',
      uuid
    });
    tunnelServer.send(info, 0, info.length, mainClientAddress.port, mainClientAddress.ip);
  } else {
    uuid = remoteAddress.uuid;
    const tunnelAddress = _.find(tunnelAddresses, {uuid: uuid});
    if (tunnelAddress) {
      sendToAddress(uuid, msg, tunnelServer, mainClientAddress);
    } else {
      stashedMsgs.push({
        msg, uuid,
        port: rinfo.port,
        ip: rinfo.address
      });
    }
  }
});

const tunnelServer = createUdpSocket(TunnelServerPort);
// msg: {type: 'main'|'tunnel'|'data', uuid: int}
tunnelServer.on('message', (msg, rinfo) => {
  console.log('TunnelServer receive: ' + msg + ' from ' + rinfo.address + ':' + rinfo.port);
  const {info, metaData} = parseUdpMsgWithMetaData(msg);

  switch (info.type) {
    case 'main':
      mainClientAddress = {
        port: rinfo.port,
        ip: rinfo.address
      };
      break;
    case 'tunnel':
      const uuid = info.uuid;
      const tunnelAddress = {
        uuid,
        port: rinfo.port,
        ip: rinfo.address
      };
      tunnelAddresses.push(tunnelAddress);
      const oldMsgStashes = _.remove(stashedMsgs, {uuid});
      for (const oldMsgStash of oldMsgStashes) {
        sendToAddress(uuid, oldMsgStash.msg, tunnelServer, mainClientAddress);
      }
      break;
    case 'data':
      const remoteAddress = _.find(remoteAddresses, {uuid: info.uuid});
      remoteServer.send(metaData, 0, metaData.length, remoteAddress.port, remoteAddress.ip);
      break;
  }
});

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

function sendToAddress(uuid, msg, source, address) {
  const info = JSON.stringify({
    uuid,
    type: 'data'
  }) + '|' + decoder.decode(msg);
  source.send(info, 0, info.length, address.port, address.ip);
}

// const _ = require('lodash');
//
// let o = {
//   1: {a: 0, b: 1, c: 3},
//   2: {a: 1, b: 1},
//   3: {a: 0, b: 1, c: 4}
// };
//
// let result = _.find(o, {a: 0, b: 1});
// console.log(result);
// result = _.find(o, {a:2});
// console.log(result);
//
// let a = [{a: 0, b: 1, c: 3}, {a: 1, b: 1}, {a: 0, b: 1, c: 4}];
// result = _.remove(a, {a:2});
// result = _.remove(a, {a:0});
// console.log(result);
