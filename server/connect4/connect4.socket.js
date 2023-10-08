const socketIo = require("socket.io");
let games = require('./state');

function checkGameState(board) {
    // Check for horizontal wins
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
            if (board[col][row] && 
                board[col][row] === board[col + 1][row] && 
                board[col][row] === board[col + 2][row] && 
                board[col][row] === board[col + 3][row]) {
                return `${board[col][row]}-wins`;
            }
        }
    }

    // Check for vertical wins
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row < 3; row++) {
            if (board[col][row] && 
                board[col][row] === board[col][row + 1] && 
                board[col][row] === board[col][row + 2] && 
                board[col][row] === board[col][row + 3]) {
                return `${board[col][row]}-wins`;
            }
        }
    }

    // Check for diagonal wins (bottom-left to top-right)
    for (let col = 0; col < 4; col++) {
        for (let row = 3; row < 6; row++) {
            if (board[col][row] &&
                board[col][row] === board[col + 1][row - 1] && 
                board[col][row] === board[col + 2][row - 2] && 
                board[col][row] === board[col + 3][row - 3]) {
                return `${board[col][row]}-wins`;
            }
        }
    }

    // Check for diagonal wins (top-left to bottom-right)
    for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 3; row++) {
            if (board[col][row] && 
                board[col][row] === board[col + 1][row + 1] && 
                board[col][row] === board[col + 2][row + 2] && 
                board[col][row] === board[col + 3][row + 3]) {
                return `${board[col][row]}-wins`;
            }
        }
    }

    // Check for draw (i.e., no null values left on the board)
    // console.log(board);
    // if (board.flat().every(column => column.every(cell => cell !== null))) {
    //     return "draw";
    // }

    return "ongoing";
}

function makeMove(board, col, symbol) {
    for (let row = 5; row >= 0; row--) {
        if (board[col][row] === null) {
            board[col][row] = symbol;
            return true;  // Move was successful
        }
    }
    return false;  // Column is full
}

module.exports = (io) => {
    const connect4 = io.of('/connect4');

    connect4.on("connection", (socket) => {
        console.log("New client connected", socket.id);
    
        socket.on("joinGame", (gameId) => {
            const game = games[gameId];
            if (!game) return socket.emit("error", "Game does not exist");
            if (game.players.length >= 2) return socket.emit("error", "Game is full");

            const playerSymbol = game.players.length === 0 ? "X" : "O";
            game.players.push({ id: socket.id, symbol: playerSymbol });
            if (game.players.length == 2) {
                game.state = "ongoing";
            }
            game.lastActivity = Date.now(),
            socket.join(gameId);
            connect4.to(gameId).emit("gameUpdated", game);
            socket.emit("playerSymbol", playerSymbol);
        });
    
        socket.on("makeMove", (gameId, col) => {
            const game = games[gameId];
            if (!game) return socket.emit("error", "Game does not exist");

            const player = game.players.find(p => p.id === socket.id);
            if (!player) return socket.emit("error", "Not a player in this game");
            
            if (game.currentPlayer !== player.symbol) return socket.emit("error", "Not your turn");
            if (game.state !== "ongoing") return socket.emit("error", "Game is not ongoing");
            
            if (!makeMove(game.board, col, game.currentPlayer)) {
                return socket.emit("error", "Column is full");
            }
            game.lastActivity = Date.now(),

            game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
            game.state = checkGameState(game.board) || game.state;
            connect4.to(gameId).emit("gameUpdated", game);
        });
    });
};
