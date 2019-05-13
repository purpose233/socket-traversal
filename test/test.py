import socket

ipPort = ('127.0.0.1', 11111)
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind(ipPort)
s.listen(5)

while True:
    conn, addr = s.accept();
    print('got connected from', addr)

    receivedMsg = conn.recv(1024)
    print(receivedMsg.decode('utf-8'))
    conn.send('bye'.encode())
    conn.close()

s.close()

# ipPort = ('127.0.0.1', 11111)
# s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
# s.bind(ipPort)

# while(True):
#     byteMsg, addr = s.recvfrom(1024)
#     strMsg = byteMsg.decode("utf-8")
#     print(strMsg, addr)
#     # s.sendto('hi'.encode(), addr)
