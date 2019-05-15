import socket

s = socket.socket(socket.AF_INET,socket.SOCK_STREAM)
s.connect(('127.0.0.1', 7005))
s.send('hi'.encode())
receivedMsg = s.recv(1024)
print(receivedMsg.decode('utf-8'))
s.close()
