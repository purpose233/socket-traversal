// TODO: remove all error.stack logs
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

const logSocketConnectError = (error, serverName='')  => {
  console.log('Cannot connect to server' + (serverName ? ' ' + serverName : '.') +
    ' error: ' + error.message + ' stack: ' + error.stack);
};

module.exports = {
  logConfigError,
  logSocketData,
  logServerListening,
  logSocketConnection,
  logServerError,
  logWarning,
  logError,
  logSendError,
  logSocketConnectError
};
