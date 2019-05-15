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
  DATA: 'data'
};

const TunnelClientInfoType = {
  CREATE_TUNNEL: 'createTunnel',
  DATA: 'data'
};

module.exports = {
  SocketType, EventType, TunnelServerInfoType, TunnelClientInfoType
};
