export const SocketType = {
  TCP: 'tcp',
  UDP: 'udp'
};

export const EventType = {
  RECEIVE_REMOTE_CONNECTION: 'remoteConnection',
  RECEIVE_UDP_MESSAGE: 'receiveUdpMessage',
  SEND_UDP_MESSAGE: 'sendUdpMessage'
};

export const TunnelServerInfoType = {
  CONTROL: 'control',
  TUNNEL: 'tunnel',
  DATA: 'data'
};

export const TunnelClientInfoType = {
  CREATE_TUNNEL: 'createTunnel',
  DATA: 'data'
};
