const socketIo = require("socket.io");
let chessGames = require('./state');
const Chess = require('chess.js').Chess;

function isValidMove(board, move) {
    // Create a new Chess instance with the current board state
    const chess = new Chess(boardToFEN(board));

    // Try the move
    const result = chess.move(move);

    // If the move is invalid, result will be null
    return result !== null;
}

function boardToFEN(board) {
    // Convert your board representation to FEN format
    // For simplicity, assume board is an 8x8 array representing the chess board
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

    // Add space and additional details (assuming it's white's turn and both sides can castle and no en passant target)
    fen += ' w KQkq - 0 1';

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
    const chess = io.of('/chess');

    chess.on("connection", (socket) => {
        console.log("New client connected", socket.id);
    
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
            chess.to(gameId).emit("gameUpdated", game);
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
            if (!isValidMove(game.board, move)) {
                return socket.emit("error", "Invalid move");
            }
            
            // Update the board state. We assume move contains {from: 'e2', to: 'e4'}
            // TODO: Convert game.board to the right format and back after moving
            const chess = new Chess(boardToFEN(game.board));
            chess.move(move);
            game.board = FENToBoard(chess.fen());
        
            game.lastActivity = Date.now();
        
            // Check for game end conditions like checkmate
            if (chess.in_checkmate()) {
                game.state = `${game.currentPlayer}-wins`;
            } else {
                game.currentPlayer = game.currentPlayer === "white" ? "black" : "white";
            }
        
            chess.to(gameId).emit("gameUpdated", game);
        });
        
    });
};
