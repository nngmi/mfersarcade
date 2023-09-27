const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const PORT = process.env.PORT || 3001;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let games = {};

io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    socket.on("createGame", (gameId) => {
        console.log(`Game ${gameId} created by ${socket.id}`);
        games[gameId] = {
            players: [socket.id],
            board: [
                [null, null, null],
                [null, null, null],
                [null, null, null]
            ],
            currentPlayer: "X",
            state: "waiting",
        };
        socket.join(gameId);
        io.to(gameId).emit("gameUpdated", games[gameId]);
    });

    socket.on("joinGame", (gameId) => {
        const game = games[gameId];
        if (!game) return socket.emit("error", "Game does not exist");

        if (game.players.length >= 2) return socket.emit("error", "Game is full");

        console.log(`Player ${socket.id} joined game ${gameId}`);
        game.players.push(socket.id);
        game.state = "ongoing";
        socket.join(gameId);
        io.to(gameId).emit("gameUpdated", game);
    });

    socket.on("makeMove", (gameId, row, col) => {
        const game = games[gameId];
        if (!game) return socket.emit("error", "Game does not exist");
        if (game.players.indexOf(socket.id) === -1) return socket.emit("error", "Not a player in this game");
        if (game.currentPlayer !== (game.players.indexOf(socket.id) === 0 ? "X" : "O")) return socket.emit("error", "Not your turn");
        if (game.board[row][col] !== null) return socket.emit("error", "Cell is already occupied");
        if (game.state !== "ongoing") return socket.emit("error", "Game is not ongoing");

        game.board[row][col] = game.currentPlayer;
        game.currentPlayer = game.currentPlayer === "X" ? "O" : "X"; // switch player
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
