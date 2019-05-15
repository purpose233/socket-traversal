const program = require('commander');
const EventEmitter = require('events').EventEmitter;
const {parseServerConfig} = require('./common/config');
const {logConfigError} = require('./common/log');
const {createTunnelServer} = require('./tunnelServer');
const {createTcpProxies} = require('./tcpServer');
const {createUdpProxies} = require('./udpServer');

program.version('0.0.1');

// program
//   .option('-d, --debug', 'output extra debugging')
//   .option('-s, --small', 'small pizza size')
//   .option('-p, --pizza-type <type>', 'flavour of pizza');
//
// program.parse(process.argv);

const filePath = '../test/server.json';

const parseResult = parseServerConfig(filePath);
if (typeof parseResult !== 'object') {
  return logConfigError(parseResult);
}

const {bindPort, tcpProxies, udpProxies} = parseResult;

const eventEmitter = new EventEmitter();

createTunnelServer(eventEmitter, bindPort);
createTcpProxies(eventEmitter, tcpProxies);
createUdpProxies(eventEmitter, udpProxies);
