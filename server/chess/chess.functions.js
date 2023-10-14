const Chess = require('chess.js').Chess;
const { v4: uuidv4 } = require('uuid');

const { 
    joinExistingGame: commonJoinExistingGame, 
    playerResign: commonPlayerResign, 
    handleDisconnect: commonHandleDisconnect,
    createGame,
} = require('../common/playerconnect.functions');

function joinExistingGame(game, playerId, joinKey) {

    function newPlayerFunction(newplayer, game) {
        const newPlayerColor = game.players.length === 0 ? "white" : "black";
        // newplayer will be created by library function, augment it with game specific logic
        newplayer.color = newPlayerColor;
        newplayer.timeLeft = 900000;
        //newplayer.timeLeft = 9000;
    }

    return commonJoinExistingGame(game, playerId, joinKey, newPlayerFunction);
}


function playerResign(game, playerId) {
    return commonPlayerResign(game, playerId);
}

function handleDisconnect(games, playerId) {
    return commonHandleDisconnect(games, playerId);
}

function processMove(game, move, playerId) {
    const player = game.players.find(p => p.id === playerId);
    if (!player) return { error: "Not a valid player" };
    if (game.currentPlayer !== playerId) return { error: "Not your turn" };
    if (game.state !== "ongoing") return { error: "Game is not ongoing" };

    const fromCol = move.from.charCodeAt(0) - 'a'.charCodeAt(0);
    const fromRow = 8 - parseInt(move.from[1]);
    const toRow = 8 - parseInt(move.to[1]);

    const promotingPiece = game.board[fromRow][fromCol];
    if (promotingPiece && promotingPiece.toLowerCase() === 'p') {
        if (player.color === 'white' && toRow === 0) {
            move.promotion = 'q';
        } else if (player.color === 'black' && toRow === 7) {
            move.promotion = 'q';
        }
    }

    // Validate the move using chess.js
    if (!isValidMove(game.board, move, player.color, game.castling, game.moveNumber)) {
        return { error: "Invalid move", success: false };
    }

    const turn = player.color === 'white' ? 'w' : 'b';
    const fen = boardToFEN(game.board, turn, game.castling, game.moveNumber);
    const chess = new Chess(fen);
    chess.move(move);
    const { board, newturn, castling, moveNumber } = FENToBoard(chess.fen());
    game.board = board;
    game.turn = newturn;
    game.castling = castling;

    if (chess.isCheckmate()) {
        const winningPlayerIndex = game.players.findIndex(p => p.id === playerId); 
        game.state = winningPlayerIndex === 0 ? "player0-wins" : "player1-wins";
    } else {
        const otherPlayer = game.players.find(p => p.id !== playerId); // Find the other player
        game.currentPlayer = otherPlayer.id; // Set the currentPlayer to the other player's id
    }    

    const currentTime = Date.now();
    const timeElapsed = currentTime - game.lastActivity;
    player.timeLeft -= timeElapsed;
    if (player.timeLeft < 0) {
        player.timeLeft = 0;
        game.state = `${player.color === "white" ? "black" : "white"}-wins`; // Using player.color for the outcome
    }

    game.lastActivity = Date.now();

    return { success: true };
}


function isValidMove(board, move, playerColor, castling, moveCount) {
    // Create a new Chess instance with the current board state
    try {
        const turn = playerColor === 'white' ? 'w' : 'b';
        const chess = new Chess(boardToFEN(board, turn, castling, moveCount));

        const result = chess.move(move);
        return result !== null;

    } catch (error) {
        return false;
    }
}

function boardToFEN(board, turn = 'w', castling = 'KQkq', moveCount=1) {
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

    fen += ` ${turn} ${castling} - 0 1`;

    return fen;
}

function FENToBoard(fen) {
    // Extracts the board part of the FEN string and splits it into rows
    const fenParts = fen.split(' ');
    const rows = fenParts[0].split('/');
    const turn = fenParts[1] === 'w' ? "white" : "black";
    const castling = fenParts[2];
    const moveNumber = parseInt(fenParts[5]);

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

    return { board, turn, castling, moveNumber };
}

function createChessGame(gameName, fenPosition = null) {
    if (!gameName) {
        throw new Error("Game name is required.");
    }

    const gameId = uuidv4();

    const initialBoard = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];

    const initialData = fenPosition ? FENToBoard(fenPosition) : { board: initialBoard, turn: "white", castling: "KQkq", moveNumber: 0 };

    let game = createGame(gameName);
    game.board = initialData.board;
    game.castling = initialData.castling; // Add castling availability to the game
    game.moveNumer = initialData.moveNumber;

    return { gameId, game };
}


module.exports = {
    isValidMove,
    boardToFEN,
    FENToBoard,
    processMove,
    joinExistingGame,
    playerResign,
    handleDisconnect,
    createChessGame,
};