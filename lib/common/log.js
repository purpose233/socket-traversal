const ConfigErrors = {
  INVALID_FILE: 'invalid file, please make sure the file path exists',
  INVALID_CONFIG: 'invalid config, please make sure the config is JSON',
  MISSING_COMMON_CONFIG: 'common config missing',
  MISSING_BIND_PORT: 'binding port missing or not valid',
  INVALID_TCP_PROXIES: 'invalid tcp proxies format',
  INVALID_UDP_PROXIES: 'invalid udp proxies format',
  REPEATED_PORT: 'binding port should not repeat',
  MISSING_SERVER_PORT: 'server binding port missing or not valid',
  MISSING_SERVER_IP: 'server ip missing or not valid'
};

const logConfigError = (msg) => {
  console.log('Config Error: ' + msg);
};

const logSocketData = (data, socketName='A') => {
  console.log(socketName + ' socket receives data: ' + data);
};

const logServerListening = (port, serverName='A') => {
  console.log(serverName + ' server is listening on port ' + port);
};

const logSocketConnection = (remotePort, remoteIP, socketName='A') => {
  console.log(socketName + ' socket connect to remote port ' +
    remotePort + ' remote ip ' + remoteIP);
};

const logServerError = (error, port, serverName='A') => {
  console.log(serverName + ' server on port ' + port +
    ' occurs error: ' + error.message + ' stack: ' + error.stack);
};

const logWarning = (msg) => {
  console.log('Warning: ' + msg);
};

const logError = (error) => {
  console.log('Error: ' + error.message + ' stack: ' + error.stack);
};

const logSendError = (error, sender, type) => {
  console.log(type + ' msg send error: ' + error.message + ' stack: ' + error.stack);
};

module.exports = {
  ConfigErrors,
  logConfigError,
  logSocketData,
  logServerListening,
  logSocketConnection,
  logServerError,
  logWarning,
  logError,
  logSendError
};
