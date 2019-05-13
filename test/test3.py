import socket

ipPort = ('127.0.0.1', 11112)
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.bind(ipPort)

while(True):
    byteMsg, addr = s.recvfrom(1024)
    strMsg = byteMsg.decode('utf-8')
    print(strMsg, addr)
    s.sendto('bye'.encode(), addr)
