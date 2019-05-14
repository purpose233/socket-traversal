export const ConfigErrors = {
  INVALID_CONFIG: 'invalid config, please make sure the config is JSON.'
};

export const logConfigError = (msg) => {
  console.log('Config Error: ' + msg);
};

export const logSocketData = (data, socketName='A') => {
  console.log(socketName + ' socket receives data: ' + data);
};
