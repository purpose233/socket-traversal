const fs = require('fs');
const program = require('commander');
import {ConfigErrors, logConfigError} from './common/log';

program.version('0.0.1');

// program
//   .option('-d, --debug', 'output extra debugging')
//   .option('-s, --small', 'small pizza size')
//   .option('-p, --pizza-type <type>', 'flavour of pizza');
//
// program.parse(process.argv);

try {
  const metaConfig = fs.readFileSync('../test/server.json', 'utf-8');
} catch (e) {
  // TODO: log error
}
let config;
try {
  config = JSON.parse(metaConfig);
} catch (e) {
  logConfigError(ConfigErrors.INVALID_CONFIG);
}

const tcpProxies = metaConfig;

// TODO: check whether the config is valid


