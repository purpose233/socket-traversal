const program = require('commander');
const EventEmitter = require('events').EventEmitter;
const {parseServerConfig} = require('./common/config');
const {logConfigError} = require('./common/log');
const {createTunnelServer} = require('./tunnelServer');
const {createTcpProxies} = require('./tcpServer');
const {createUdpProxies} = require('./udpServer');

program
  .version('0.0.1')
  .option('-c, --config <file>', 'config file path')
  .parse(process.argv);

const filePath = program.config;

const parseResult = parseServerConfig(filePath);
if (typeof parseResult !== 'object') {
  return logConfigError(parseResult);
}

const {bindPort, tcpProxies, udpProxies} = parseResult;

const eventEmitter = new EventEmitter();

createTunnelServer(eventEmitter, bindPort);
createTcpProxies(eventEmitter, tcpProxies);
createUdpProxies(eventEmitter, udpProxies);
