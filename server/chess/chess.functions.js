const Chess = require('chess.js').Chess;
const { v4: uuidv4 } = require('uuid');

function processMove(game, move, playerId) {
    const player = game.players.find(p => p.id === playerId);
    if (game.currentPlayer !== player.color) return { error: "Not your turn" };
    if (game.state !== "ongoing") return { error: "Game is not ongoing" };
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

    game.lastActivity = Date.now();
    if (chess.isCheckmate()) {
        game.state = `${game.currentPlayer}-wins`;
    } else {
        game.currentPlayer = game.currentPlayer === "white" ? "black" : "white";
    }

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
        //console.log("Error during move:", move);
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


function joinExistingGame(game, playerId) {
    if (!game) return { error: "Game does not exist" };
    if (game.players.length >= 2) return { error: "Game is full" };

    const playerColor = game.players.length === 0 ? "white" : "black";
    game.players.push({ id: playerId, color: playerColor });

    if (game.players.length === 2) {
        game.state = "ongoing";
    }
    
    game.lastActivity = Date.now();

    return { success: true, playerColor };
}

function playerResign(game, playerId) {
    if (!game) return { error: "Game does not exist" };

    const player = game.players.find(p => p.id === playerId);
    if (!player) return { error: "Not a player in this game" };
    
    if (game.currentPlayer !== player.color) return { error: "Not your turn" };
    if (game.state !== "ongoing") return { error: "Game is not ongoing" };
    
    const otherPlayer = game.currentPlayer === "white" ? "black" : "white";
    game.state = `${otherPlayer}-wins`;
    game.lastActivity = Date.now();

    return { success: true, resignedPlayer: game.currentPlayer, winningPlayer: otherPlayer };
}

function handleDisconnect(chessGames, playerId) {
    for (const gameId in chessGames) {
        const game = chessGames[gameId];

        const disconnectingPlayer = game.players.find(p => p.id === playerId);
        
        if (disconnectingPlayer && game.state === "ongoing") {
            const opponentColor = disconnectingPlayer.color === "white" ? "black" : "white";
            game.state = `${opponentColor}-wins`; 
            game.lastActivity = Date.now();

            return {
                gameUpdated: true,
                gameId: gameId,
                disconnectedColor: disconnectingPlayer.color,
                winningColor: opponentColor
            };
        }
    }
    return { gameUpdated: false };
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

    const game = {
        players: [],
        board: initialData.board,
        currentPlayer: initialData.turn, // Using the turn value extracted from FEN
        castling: initialData.castling, // Add castling availability to the game
        state: "waiting for players",
        lastActivity: Date.now(),
        gameName: gameName,
        moveNumber: initialData.moveNumber,
    };

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