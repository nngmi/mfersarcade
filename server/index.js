const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const PORT = process.env.PORT || 3001;
const { v4: uuidv4 } = require('uuid');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const bodyParser = require('body-parser');
app.use(bodyParser.json()); 
// mfer castle
require('./mfercastle/mfercastle.socket')(io);
app.use("/api/mfercastle", require("./mfercastle/mfercastle.routes"));

// mfer chess
require('./chess/chess.socket')(io);
app.use("/api/chess", require("./chess/chess.routes"));

// connect 4
require('./connect4/connect4.socket')(io);
app.use("/api/connect4", require("./connect4/connect4.routes"));

app.use(express.static(path.resolve(__dirname, '../client/build')));
// Handle any requests that don't match the ones above
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});

module.exports = server;
