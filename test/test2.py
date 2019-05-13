import socket

s = socket.socket(socket.AF_INET,socket.SOCK_STREAM)
s.connect(('127.0.0.1', 7000))
s.send('hi'.encode())
receivedMsg = s.recv(1024)
print(receivedMsg.decode('utf-8'))
s.close()

# s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# s.sendto('exit'.encode(), ('127.0.0.1', 7001))
# # byteMsg, addr = s.recvfrom(1024)
# # strMsg = byteMsg.decode("utf-8")
# # print(strMsg, addr)
# s.close()
