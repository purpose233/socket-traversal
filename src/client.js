const program = require('commander');
const {logConfigError} = require('./common/log');
const {parseClientConfig} = require('./common/config');
const {createTcpController} = require('./tcpClient');
const {createUdpController} = require('./udpClient');

program.version('0.0.1');

const filePath = './test/client.json';

const parseResult = parseClientConfig(filePath);
if (typeof parseResult !== 'object') {
  return logConfigError(parseResult);
}

const {serverPort, serverIP, tcpProxies, udpProxies} = parseResult;

createTcpController(serverPort, serverIP, tcpProxies);
createUdpController(serverPort, serverIP, udpProxies);
