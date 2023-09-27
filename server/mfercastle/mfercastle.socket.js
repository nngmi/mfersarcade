// mfercastle.socket.js
const socketIo = require("socket.io");
let games = require('./state');

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

module.exports = (io) => {
    const tictactoe = io.of('/mfercastle');

    tictactoe.on("connection", (socket) => {
        console.log("New client connected", socket.id);
    
        socket.on("joinGame", (gameId) => {
            console.log("joinGame emitted for gameID", gameId);
            const game = games[gameId];
    
            if (!game) return socket.emit("error", "Game does not exist");
            console.log("Game found", game);
    
            if (game.players.length >= 2) return socket.emit("error", "Game is full");
            console.log(`Player ${socket.id} joined game ${gameId}`);
            const playerSymbol = game.players.length === 0 ? "X" : "O";
            console.log("player symbol done");
    
            game.players.push({ id: socket.id, symbol: playerSymbol });
            console.log(game.players.length);
            if (game.players.length == 2) {
                game.state = "ongoing";
            }
            game.lastActivity = Date.now(),
            console.log(game);
            socket.join(gameId);
            tictactoe.to(gameId).emit("gameUpdated", game);
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
            tictactoe.to(gameId).emit("gameUpdated", game);
        });
    });
};