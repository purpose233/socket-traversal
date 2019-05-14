const dgram = require('dgram');
const _ = require('lodash');
import config from '../test/server.json';
import {createUdpSocket} from './common/socket';

// TODO: need to parse config
const ServerPort = config.common.bindPort;
const ClientPort = config.common.clientPort;
const UDPConfigs = config.udp;

// binders contains the info of udpClient.
const binders = {};

const mainSocket = createUdpSocket(ServerPort);

// Main socket only receive message from udpClient.
mainSocket.on('message', function (msg, rinfo) {
  console.log('recv %s(%d bytes) from client %s:%d\n', msg, msg.length, rinfo.address, rinfo.port);

  let bindInfo;
  try {
    bindInfo = JSON.parse(msg);
  } catch (e) {
    bindInfo = null;
  }
  if (bindInfo && bindInfo.bindTo && binders[bindInfo.bindTo]) {
    binders[bindInfo.bindTo].remotePort = bindInfo.bindFrom;
    binders[bindInfo.bindTo].remoteIP = rinfo.address;
  }
});

for (const udpConfig of UDPConfigs) {
  const dataSocket = createUdpSocket(udpConfig.listenPort);
  dataSocket.on('message', function (msg, rinfo) {
    const binder = binders[udpConfig.listenPort];
    if (binder) { return; }
    msg = JSON.stringify({
      ip: binder.remoteIP,
      port: binder.remotePort
    }) + '|' + msg;
    dataSocket.send(msg, 0, msg.length, addr.port, ClientPort);
  });
  binders[udpConfig.listenPort] = {
    // localPort: udpConfig.listenPort,
    socket: dataSocket,
    remotePort: 0,
    remoteIP: null
  };
}
