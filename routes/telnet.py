import getpass
import sys
import telnetlib
HOST = "localhost"
port = sys.argv[1]
mount = sys.argv[2]
playlist = sys.argv[3]
tn = telnetlib.Telnet(HOST,port)

tn.write("default(dot)pls.uri "+playlist+" \n")
tn.write(mount+".skip \n")
tn.close()