# Socket-traversal

What is **Socket-traversal**?

Socket-traversal is a simple tool to perform UDP/TCP internal network penetration.

## Installation
```
git clone https://github.com/purpose233/socket-traversal.git
cd ./socket-traversal
npm install
```

## Usage
Server side:
```
node ./src/server -c <serverConfigFilePath>
```
A demo of server config file is shown as follow:
```json
{
  "common": {
    "bindPort": 7000
  },
  "tcp": [
    {
      "listenPort": 7005
    }
  ],
  "udp": [
    {
      "listenPort": 7010
    }
  ]
}
```

Client side:
```
node ./src/client -c <clientConfigFilePath>
```
A demo of client config file is shown as follow:
```json
{
  "common": {
    "serverIP": "127.0.0.1",
    "serverPort": 7000
  },
  "tcp": [
    {
      "localPort": 11111,
      "remotePort": 7005
    }
  ],
  "udp": [
    {
      "localPort": 11112,
      "remotePort": 7010
    }
  ]
}
```