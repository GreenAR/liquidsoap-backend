let fs, http, port, server, websocket, wsServer;
let mkdirp = require('mkdirp');
let getDirName = require('path').dirname;

fs = require("fs");
const key  = fs.readFileSync('/home/liquser/privkey.pem', 'utf8');
const cert = fs.readFileSync('/home/liquser/fullchain.pem', 'utf8');
http = require("https");

websocket = require("websocket");

port = harbor_record_port;

server = http.createServer({key, cert},function(req, res) {
    console.log((new Date) + " -- Received request for " + req.url);
    res.writeHead(404);
    return res.end();
});

server.listen(port, function() {
    return console.log((new Date) + " -- Server ready on port " + port);
});

wsServer = new websocket.server({
    httpServer: server,
    autoAcceptConnections: false
});

wsServer.on("request", function(req) {
    var connection, fd;
    fd = null;
    console.log((new Date) + " -- Connection from " + req.origin);
    connection = req.accept("webcast", req.origin);
    console.log((new Date) + " -- Connection accepted");
    return connection.on("message", function(msg) {
        var ext;
        if (msg.type === "utf8") {
            msg.utf8Data = JSON.parse(msg.utf8Data);
        }
        if (connection.hello == null) {
            if (msg.type !== "utf8" || msg.utf8Data.type !== "hello") {
                console.log((new Date) + " -- Error: first message not hello!");
                return connection.close();
            }
            connection.hello = msg.utf8Data.data;
            console.log((new Date) + " -- Mount point: " + req.httpRequest.url + ".");
            console.log((new Date) + " -- MIME type: " + connection.hello.mime + ".");
            console.log((new Date) + " -- Audio channels: " + connection.hello.audio.channels + ".");
            if (connection.hello.mime === "audio/mpeg") {
                console.log((new Date) + " -- Audio bitrate: " + connection.hello.audio.bitrate + ".");
            }
            ext = connection.hello.mime === "audio/mpeg" ? "mp3" : "raw";
            let filenamee= Date.now()+ "."+ ext;
            let dirdir = "host_name";
            mkdirp.sync("src/record/"+dirdir,"777");
            fd = fs.openSync("src/record/"+dirdir+"/" + filenamee, "w");
            return;
        }
        switch (msg.type) {
            case "utf8":
                switch (msg.utf8Data.type) {
                    case "metadata":
                        return console.log((new Date) + " -- Got new metadata: " + (JSON.stringify(msg.utf8Data.data)));
                    default:
                        return console.log((new Date) + " -- Invalid message");
                }
                break;
            case "binary":
                console.log((new Date) + " -- Got " + msg.binaryData.length + " bytes of binary data");
                return fs.writeSync(fd, msg.binaryData, 0, msg.binaryData.length);
            default:
                return console.log((new Date) + " -- Invalid message");
        }
    });
});

