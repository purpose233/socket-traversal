import socket

s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

s.sendto('hi'.encode(), ('127.0.0.1', 7010))
byteMsg, addr = s.recvfrom(1024)
strMsg = byteMsg.decode('utf-8')
print(strMsg, addr)
s.close()
