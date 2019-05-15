const fs = require('fs');
const program = require('commander');
import {ConfigErrors, logConfigError} from './common/log';

program.version('0.0.1');

try {
  const metaConfig = fs.readFileSync('../test/client.json', 'utf-8');
} catch (e) {
  // TODO: log error
}
let config;
try {
  config = JSON.parse(metaConfig);
} catch (e) {
  logConfigError(ConfigErrors.INVALID_CONFIG);
}

// TODO: check whether the config is valid

