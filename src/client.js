const program = require('commander');
import {logConfigError} from './common/log';
import {parseClientConfig} from './common/config';
import {createTcpController} from './tcpClient';
import {createUdpController} from './udpClient';

program.version('0.0.1');

const filePath = '../test/client.json';

const parseResult = parseClientConfig(filePath);
if (typeof parseResult !== 'object') {
  return logConfigError(parseResult);
}

const {serverPort, serverIP, tcpProxies, udpProxies} = parseResult;

createTcpController(serverPort, serverIP, tcpProxies);
createUdpController(serverPort, serverIP, udpProxies);
