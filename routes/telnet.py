import getpass
import sys
import telnetlib
HOST = "localhost"
port = sys.argv[1]
cmd = sys.argv[2]
tn = telnetlib.Telnet(HOST,port)

tn.write(cmd+" \n")
print tn.read_some()
tn.close()