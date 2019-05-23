const SocketType = {
  TCP: 'tcp',
  UDP: 'udp'
};

const EventType = {
  RECEIVE_REMOTE_CONNECTION: 'remoteConnection',
  RECEIVE_UDP_MESSAGE: 'receiveUdpMessage',
  SEND_UDP_MESSAGE: 'sendUdpMessage'
};

const TunnelServerInfoType = {
  CONTROL: 'control',
  TUNNEL: 'tunnel',
  DATA: 'data',
  DELETE_UDP_SOCKET: 'deleteUdpSocket'
};

const TunnelClientInfoType = {
  CREATE_TUNNEL: 'createTunnel',
  DATA: 'data'
};

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

module.exports = {
  SocketType,
  EventType,
  TunnelServerInfoType,
  TunnelClientInfoType,
  ConfigErrors
};
