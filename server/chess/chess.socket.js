const socketIo = require("socket.io");
let chessGames = require('./state');
const Chess = require('chess.js').Chess;

function isValidMove(board, move, playerColor) {
    // Create a new Chess instance with the current board state
    try {
        const turn = playerColor === 'white' ? 'w' : 'b';
        const chess = new Chess(boardToFEN(board, turn));

        const result = chess.move(move);
        return result !== null;

    } catch (error) {
        console.log("Error during move:", error);
        return false;
    }
}


function boardToFEN(board, turn = 'w') {
    let fen = "";
    let empty = 0;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                if (empty !== 0) {
                    fen += empty;
                    empty = 0;
                }
                fen += piece;
            } else {
                empty++;
            }
        }
        if (empty !== 0) {
            fen += empty;
            empty = 0;
        }
        if (row !== 7) {
            fen += '/';
        }
    }

    fen += ` ${turn} KQkq - 0 1`;

    return fen;
}

function FENToBoard(fen) {
    // Extracts the board part of the FEN string and splits it into rows
    const rows = fen.split(' ')[0].split('/');
    const board = [];
    
    for (const row of rows) {
        const boardRow = [];
        for (const char of row) {
            if (isNaN(char)) {
                boardRow.push(char);
            } else {
                for (let i = 0; i < parseInt(char); i++) {
                    boardRow.push(null);
                }
            }
        }
        board.push(boardRow);
    }

    return board;
}

module.exports = (io) => {
    const chessSocket = io.of('/chess');

    chessSocket.on("connection", (socket) => {
        console.log("New client connected", socket.id);
    
        socket.on("viewGame", (gameId) => {
            const game = chessGames[gameId];
            if (!game) return socket.emit("error", "Game does not exist");
            socket.join(gameId);
        });

        socket.on("disconnect", (reason) => {
            console.log("Client disconnected", socket.id, "Reason:", reason);
        
            // Loop through all games
            for (const gameId in chessGames) {
                const game = chessGames[gameId];
        
                // Check if the disconnecting socket is part of the game
                const disconnectingPlayer = game.players.find(p => p.id === socket.id);
        
                if (disconnectingPlayer && game.state === "ongoing") {
                    const opponentColor = disconnectingPlayer.color === "white" ? "black" : "white";
        
                    game.state = `${opponentColor}-wins`; // set the win for the other player
                    game.lastActivity = Date.now();
                    
                    // Notify other players in the game room about the game update
                    chessSocket.to(gameId).emit("gameUpdated", game);
                    chessSocket.to(gameId).emit("notify", disconnectingPlayer.color + " disconnected, " + opponentColor + " wins!");
                    break; // exit the loop as we've found the game the disconnecting player was part of
                }
            }
        });

        socket.on("joinGame", (gameId) => {
            const game = chessGames[gameId];
            if (!game) return socket.emit("error", "Game does not exist");
            if (game.players.length >= 2) return socket.emit("error", "Game is full");

            const playerColor = game.players.length === 0 ? "white" : "black";
            game.players.push({ id: socket.id, color: playerColor });
            if (game.players.length == 2) {
                game.state = "ongoing";
            }
            game.lastActivity = Date.now();
            socket.join(gameId);
            chessSocket.to(gameId).emit("gameUpdated", game);
            socket.emit("playerColor", playerColor);
        });
    
        socket.on("makeMove", (gameId, move) => {
            const game = chessGames[gameId];
            if (!game) return socket.emit("error", "Game does not exist");
            
            const player = game.players.find(p => p.id === socket.id);
            if (!player) return socket.emit("error", "Not a player in this game");
            
            if (game.currentPlayer !== player.color) return socket.emit("error", "Not your turn");
            if (game.state !== "ongoing") return socket.emit("error", "Game is not ongoing");
            
            // Validate the move using chess.js
            if (!isValidMove(game.board, move, player.color)) {
                return socket.emit("error", "Invalid move");
            }
        
            const turn = player.color === 'white' ? 'w' : 'b';
            const chess = new Chess(boardToFEN(game.board, turn));
            chess.move(move);
            game.board = FENToBoard(chess.fen());
        
            game.lastActivity = Date.now();
            chessSocket.to(gameId).emit("notify", player.color + " made move from " + move["from"] + " to " + move["to"]);
            // Check for game end conditions like checkmate
            if (chess.isCheckmate()) {
                game.state = `${game.currentPlayer}-wins`;
                chessSocket.to(gameId).emit("notify", game.currentPlayer + " wins via checkmate!");
            } else {
                game.currentPlayer = game.currentPlayer === "white" ? "black" : "white";
            }
        

            
            chessSocket.to(gameId).emit("gameUpdated", game);
        });
        

        socket.on("resign", (gameId) => {
            const game = chessGames[gameId];
            if (!game) return socket.emit("error", "Game does not exist");
        
            const player = game.players.find(p => p.id === socket.id);
            if (!player) return socket.emit("error", "Not a player in this game");
            
            if (game.currentPlayer !== player.color) return socket.emit("error", "Not your turn");
            if (game.state !== "ongoing") return socket.emit("error", "Game is not ongoing");
            
            const otherPlayer = game.currentPlayer === "white" ? "black" : "white";

            game.state = `${otherPlayer}-wins`;
            game.lastActivity = Date.now();
            chessSocket.to(gameId).emit("notify", game.currentPlayer + " resigned, " + otherPlayer + " wins!");
            chessSocket.to(gameId).emit("gameUpdated", game);
        });


    });
};
