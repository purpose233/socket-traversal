const fs = require('fs');
const {ConfigErrors} = require('./log');

const getMetaConfig = (fileName) => {
  let metaConfig;
  try {
    metaConfig = fs.readFileSync(fileName, 'utf-8');
  } catch (e) {
    return ConfigErrors.INVALID_FILE;
  }
  try {
    return JSON.parse(metaConfig);
  } catch (e) {
    return ConfigErrors.INVALID_CONFIG;
  }
};

const isValidPort = (port) => {
  return Number.isInteger(port) && port >= 0 && port <= 65535;
};

const isValidServerProxies = (proxies) => {
  if (!Array.isArray(proxies)) {
    return false;
  }
  for (const proxy of proxies) {
    if (!isValidPort(proxy.listenPort)) {
      return false;
    }
  }
  return true;
};

const isValidClientProxies = (proxies) => {
  if (!Array.isArray(proxies)) {
    return false;
  }
  for (const proxy of proxies) {
    if (!isValidPort(proxy.localPort) ||
      !isValidPort(proxy.remotePort)) {
      return false;
    }
  }
  return true;
};

const isValidIP = (ip) => {
  return typeof ip === 'string';
};

const isPortNotRepeated = (...ports) => {
  let portSet = new Set();
  let portCount = 0;
  for (const port of ports) {
    if (typeof port === 'number') {
      portSet.add(port);
      portCount++;
    } else {
      port.map((item) => {
        portSet.add(item);
        portCount++;
      });
    }
  }
  return portSet.size === portCount;
};

const parseServerProxies = (proxies) => {
  const parsedProxies = [];
  for (const proxy of proxies) {
    parsedProxies.push({
      listenPort: proxy.listenPort
    });
  }
  return parsedProxies;
};

const parseClientProxies = (proxies) => {
  const parsedProxies = [];
  for (const proxy of proxies) {
    parsedProxies.push({
      localPort: proxy.localPort,
      remotePort: proxy.remotePort
    });
  }
  return parsedProxies;
};

const getServerProxiesLocalPorts = (proxies) => {
  return proxies.map((item) => item.listenPort);
};

const getClientProxiesLocalPorts = (proxies) => {
  return proxies.map((item) => item.localPort);
};

const parseServerConfig = (filePath) => {
  const metaConfig = getMetaConfig(filePath);
  if (typeof metaConfig !== 'object') {
    return metaConfig;
  }

  if (typeof metaConfig.common !== 'object') {
    return ConfigErrors.MISSING_COMMON_CONFIG;
  }

  const bindPort = metaConfig.common.bindPort;
  if (!isValidPort(bindPort)) {
    return ConfigErrors.MISSING_BIND_PORT;
  }

  const tcpConfig = metaConfig.tcp;
  if (!isValidServerProxies(tcpConfig)) {
    return ConfigErrors.INVALID_TCP_PROXIES;
  }
  const tcpProxies = parseServerProxies(tcpConfig);

  const udpConfig = metaConfig.udp;
  if (!isValidServerProxies(udpConfig)) {
    return ConfigErrors.INVALID_UDP_PROXIES;
  }
  const udpProxies = parseServerProxies(udpConfig);

  if (!isPortNotRepeated(bindPort,
    getServerProxiesLocalPorts(tcpProxies),
    getServerProxiesLocalPorts(udpProxies))) {
    return ConfigErrors.REPEATED_PORT;
  }

  return {
    bindPort, tcpProxies, udpProxies
  };
};

const parseClientConfig = (filePath) => {
  const metaConfig = getMetaConfig(filePath);
  if (typeof metaConfig !== 'object') {
    return metaConfig;
  }

  if (typeof metaConfig.common !== 'object') {
    return ConfigErrors.MISSING_COMMON_CONFIG;
  }

  const serverPort = metaConfig.common.serverPort;
  if (!isValidPort(serverPort)) {
    return ConfigErrors.MISSING_SERVER_PORT;
  }

  const serverIP = metaConfig.common.serverIP;
  if (!isValidIP(serverIP)) {
    return ConfigErrors.MISSING_SERVER_IP;
  }

  const tcpConfig = metaConfig.tcp;
  if (!isValidClientProxies(tcpConfig)) {
    return ConfigErrors.INVALID_TCP_PROXIES;
  }
  const tcpProxies = parseClientProxies(tcpConfig);

  const udpConfig = metaConfig.udp;
  if (!isValidClientProxies(udpConfig)) {
    return ConfigErrors.INVALID_UDP_PROXIES;
  }
  const udpProxies = parseClientProxies(udpConfig);

  if (!isPortNotRepeated(getClientProxiesLocalPorts(tcpProxies),
    getClientProxiesLocalPorts(udpProxies))) {
    return ConfigErrors.REPEATED_PORT;
  }

  return {
    serverPort, serverIP, tcpProxies, udpProxies
  };
};

module.exports = {
  parseServerConfig, parseClientConfig
};
