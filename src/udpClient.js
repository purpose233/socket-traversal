const dgram = require('dgram');
const _ = require('lodash');
import config from '../test/client.json';
import {createUdpSocket} from './common/socket';

// TODO: need to parse config

const ServerAddress = config.common.serverAddress;
const ServerPort = config.common.serverPort;
const UDPConfigs = config.udp;

for (const udpConfig of UDPConfigs) {

}


const clientSocket = createUdpSocket(clientSocket);

const clientSocket = dgram.createSocket('udp4');

clientSocket.on('message', function(msg, rinfo) {
  console.log('recv %s(%d) from server\n', msg, msg.length);
  let addr = JSON.parse(msg.slice(0, msg.indexOf('|')));
  msg = msg.slice(msg.indexOf('|') + 1);

  const dataSocket = dgram.createSocket('udp4');
  dataSocket.on('message', function(msg, rinfo) {
    console.log('recv %s from localhost\n', msg);
    dataSocket.send(msg, 0, msg.length, addr.port, addr.ip);
  });
  dataSocket.bind(8001);
  dataSocket.send(msg, 0, msg.length, addr.port, 'localhost');
});

clientSocket.on('error', function(err) {
  console.log('error, msg - %s, stack - %s\n', err.message, err.stack);
});

clientSocket.bind(8000);
const bindInfo = {
  bindTo: 7001,
  bindFrom: 11111
};
const bindMsg = JSON.stringify(bindInfo);
clientSocket.send(bindMsg, 0, bindMsg.length, 7000, 'localhost');

