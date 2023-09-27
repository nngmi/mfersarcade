const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const PORT = process.env.PORT || 3001;
const { v4: uuidv4 } = require('uuid');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let games = {};

const cleanupGames = () => {
    const now = Date.now();
    const timeout = 10 * 60 * 1000; // 10 minutes in milliseconds

    for (const gameId in games) {
        const game = games[gameId];
        
        // Assume game has a `lastActivity` timestamp and a `status` property
        if (game.status === 'ended' || (now - game.lastActivity) > timeout) {
            delete games[gameId];
            console.log(`Game ${gameId} cleaned up.`);
        }
    }
};
  
app.post("/api/game", (req, res) => {
    const gameId = uuidv4();
    if (games[gameId]) return res.status(400).json({ message: "Game already exists" }); // This check is technically redundant now, as UUIDs are unique.
    games[gameId] = {
        players: [],
        board: [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ],
        currentPlayer: "X",
        state: "waiting",
        lastActivity: Date.now(),
    };
    res.status(201).json({ gameId });
});

app.get("/api/game/:gameId", (req, res) => {
    const gameId = req.params.gameId;
    const game = games[gameId];
    if (!game) return res.status(404).json({ message: "Game does not exist" });
    res.json(game);
});

io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    socket.on("joinGame", (gameId) => {
        console.log("joinGame emitted for gameID", gameId);
        const game = games[gameId];

        if (!game) return socket.emit("error", "Game does not exist");
        console.log("Game found", game);

        if (game.players.length >= 2) return socket.emit("error", "Game is full");
        console.log(`Player ${socket.id} joined game ${gameId}`);
        const playerSymbol = game.players.length === 0 ? "X" : "O";

        game.players.push({ id: socket.id, symbol: playerSymbol });
        if (game.players.length == 2) {
            game.state = "ongoing";
        }
        game.lastActivity = Date.now(),
        socket.join(gameId);
        io.to(gameId).emit("gameUpdated", game);
        socket.emit("playerSymbol", playerSymbol);
    });

    socket.on("makeMove", (gameId, row, col) => {
        const game = games[gameId];
        if (!game) return socket.emit("error", "Game does not exist");
        
        // Find the player object corresponding to this socket.id
        const player = game.players.find(p => p.id === socket.id);
        if (!player) return socket.emit("error", "Not a player in this game");
        
        // Check if it’s this player’s turn
        if (game.currentPlayer !== player.symbol) return socket.emit("error", "Not your turn");
        
        if (game.board[row][col] !== null) return socket.emit("error", "Cell is already occupied");
        if (game.state !== "ongoing") return socket.emit("error", "Game is not ongoing");
        
        // Make the move
        game.board[row][col] = game.currentPlayer;
        game.lastActivity = Date.now(),
        
        // Switch the current player
        game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
        
        // Check the game state and broadcast the updated game state to all clients in the room
        game.state = checkGameState(game.board) || game.state;
        io.to(gameId).emit("gameUpdated", game);
    });
    
});

function checkGameState(board) {
    const winningCombinations = [
        [[0, 0], [0, 1], [0, 2]],
        [[1, 0], [1, 1], [1, 2]],
        [[2, 0], [2, 1], [2, 2]],
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        [[0, 0], [1, 1], [2, 2]],
        [[0, 2], [1, 1], [2, 0]],
    ];

    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a[0]][a[1]] && board[a[0]][a[1]] === board[b[0]][b[1]] && board[a[0]][a[1]] === board[c[0]][c[1]]) {
            return `${board[a[0]][a[1]]}-wins`;
        }
    }
    if (board.flat().every(cell => cell !== null)) return "draw";
    return "ongoing";
}

app.use(express.static(path.resolve(__dirname, '../client/build')));
// Handle any requests that don't match the ones above
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});  

module.exports = server;
