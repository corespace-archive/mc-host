"use strict";
const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const tail = require('tail').Tail;
const fs = require("fs");
const { exec } = require("child_process");
// set active watcher to default false
// TODO: remove this!!
let activeWatcher = false;
// Create server folder if doesn't exists
// For easier handeling in the script the log file will be created before the server
if (!fs.existsSync(__dirname + "/server")) {
    fs.mkdir(__dirname + "/server", { recursive: true }, (err) => {
        if (err)
            throw err;
    });
}
if (!fs.existsSync(__dirname + "/server/logs")) {
    fs.mkdir(__dirname + "/server/logs", { recursive: true }, (err) => {
        if (err)
            throw err;
        fs.writeFileSync(__dirname + "/server/logs/latest.log", "");
    });
}
// setting listener for port 3000
http.listen(3000, () => {
    console.log("Server running on: localhost:3000");
});
// executing given command as shell command
//TODO: command check to filter harmfull attacks
function executeCommand(socket, cmd) {
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
    });
}
// #####################################################################
// ##                      Routes section                             ##
// #####################################################################
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/assets/website/index.html");
});
app.get("/console", (req, res) => {
    res.sendFile(__dirname + "/assets/website/console.html");
});
app.get("/styles", (req, res) => {
    const style = req.query.style;
    res.sendFile(__dirname + "/assets/website/assets/style/" + style + ".css");
});
app.get("/scripts", (req, res) => {
    const script = req.query.script;
    res.sendFile(__dirname + "/assets/website/assets/scripts/" + script + ".js");
});
// #####################################################################
// ##                      Socket Section                             ##
// #####################################################################
// listening for connection
// if connection, server listens for changes in the latest.log file
// and returns the newest change via socket.emit
io.on('connection', (socket) => {
    var xtail = new tail(__dirname + "/server/logs/latest.log");
    xtail.watch();
    activeWatcher = true;
    xtail.on("line", (data) => {
        socket.emit("joined", data);
    });
});
// listening for connection
// if connection, server is listening for incomming commands
io.on('connection', (socket) => {
    // command send by commandfield on the website
    // server is fusing the command form the received message and a template
    socket.on('command', (message) => {
        executeCommand(socket, 'docker exec -t mctest screen -S Minecraft-Server -p 0 -X stuff "' + message + '^M"');
        socket.emit("action_result", `Remote command executed: ${message}`);
    });
    // action command received
    // server is executing the command from a commandset
    socket.on('action', (message) => {
        // action server start
        // this action is also creating a new server
        // if the plugin folder doesn't exists
        if (message == "start") {
            if (fs.existsSync(__dirname + "/server/plugins")) {
                executeCommand(socket, 'docker start mctest');
                socket.emit("action_result", "Starting Server");
            }
            else {
                executeCommand(socket, 'docker run -tid --name mctest --volume=' + __dirname + "/server/:/server -p 25565:25565 -e RAM=4G zombymediaic/papermc:1.16.5-java16");
                socket.emit("action_result", "Creating Server please wait...");
            }
        }
        // action server restart
        // this action is restarting the server and saving all progress
        // docker container is restarted as well
        if (message == "restart") {
            executeCommand(socket, 'docker exec -t mctest screen -S Minecraft-Server -p 0 -X stuff "save-all^M"');
            executeCommand(socket, 'docker exec -t mctest screen -S Minecraft-Server -p 0 -X stuff "stop^M"');
            // delaying the docker restart command to avoid problems with the saving of chunks
            // will be changed in the future to calculate the delay from the amount of plugins
            setTimeout(() => {
                executeCommand(socket, 'docker restart mctest');
                socket.emit("action_result", "Restarting Server");
            }, 4000);
        }
        // action server stop
        // this action is stopping the server and saving all progress
        if (message == "stop") {
            executeCommand(socket, 'docker exec -t mctest screen -S Minecraft-Server -p 0 -X stuff "save-all^M"');
            executeCommand(socket, 'docker exec -t mctest screen -S Minecraft-Server -p 0 -X stuff "stop^M"');
            socket.emit("action_result", "Stopping Server");
        }
    });
});
//# sourceMappingURL=app.js.map