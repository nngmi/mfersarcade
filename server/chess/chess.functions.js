const Chess = require('chess.js').Chess;
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const { 
    joinExistingGame: commonJoinExistingGame, 
    playerResign: commonPlayerResign, 
    handleDisconnect: commonHandleDisconnect,
    createGame,
} = require('../common/playerconnect.functions');

function notifyDiscord(gameId, message) {
    const discordWebhookURL = process.env.DISCORD_WEBHOOK_URL;
    try {
        if (discordWebhookURL) {
            axios.post(discordWebhookURL, {
                content: "mfer chess alert! " + message + " https://www.mfersarcade.lol/mferchess/" + gameId
            }).catch(error => {
                // Log the error if the request fails. This is just for monitoring and won't delay the route's response.
                console.error('Error sending Discord notification:', error.message);
            });
        }
    } catch (err) {
        console.log("failed to send discord webhook ", err);
    }
}

function joinExistingGame(game, playerId, joinKey) {

    function newPlayerFunction(newplayer, game) {
        const newPlayerColor = game.players.length === 0 ? "white" : "black";
        // newplayer will be created by library function, augment it with game specific logic
        newplayer.color = newPlayerColor;
        newplayer.capturedPieces = [];
        newplayer.timeLeft = 1200000;
    }

    return commonJoinExistingGame(game, playerId, joinKey, newPlayerFunction);
}


function playerResign(game, playerId) {
    return commonPlayerResign(game, playerId);
}

function handleDisconnect(games, playerId) {
    return commonHandleDisconnect(games, playerId);
}

function suggestMove(game, turn) {
    const pieceValues = {
        'p': 1,
        'n': 3,
        'b': 3,
        'r': 5,
        'q': 9,
        'k': 100
    };

    const centerSquares = ['d4', 'e4', 'd5', 'e5'];

    const simpleTurn = turn === 'white' ? 'w' : 'b';
    const fen = boardToFEN(game.board, simpleTurn, game.castling, game.moveNumber);

    const chess = new Chess(fen);
    const moves = chess.moves({ verbose: true });

    if (moves.length === 0) {
        return null;
    }

    // Prioritize captures by the piece value
    moves.sort((a, b) => {
        const aValue = a.flags.includes('c') ? pieceValues[a.piece] : 0;
        const bValue = b.flags.includes('c') ? pieceValues[b.piece] : 0;
        return bValue - aValue;
    });

    const topMove = moves[0];

    if (topMove.flags.includes('c')) {
        return {
            from: topMove.from,
            to: topMove.to,
            promotion: topMove.promotion
        };
    }

    // Prioritize center control
    moves.sort((a, b) => {
        const aCenterValue = centerSquares.includes(a.to) ? 1 : 0;
        const bCenterValue = centerSquares.includes(b.to) ? 1 : 0;
        return bCenterValue - aCenterValue;
    });

    const topCenterMove = moves[0];

    // If the top move controls the center, prefer it
    if (centerSquares.includes(topCenterMove.to)) {
        return {
            from: topCenterMove.from,
            to: topCenterMove.to,
            promotion: topCenterMove.promotion
        };
    }

    // Check if the piece can be captured in the next move
    for (let move of moves) {
        chess.move(move);
        const opponentsMoves = chess.moves({ verbose: true });
        if (!opponentsMoves.some(opMove => opMove.to === move.to)) {
            return {
                from: move.from,
                to: move.to,
                promotion: move.promotion
            };
        }
        chess.undo();
    }

    // If all pieces are in danger, just return the top move (arbitrary).
    return {
        from: topMove.from,
        to: topMove.to,
        promotion: topMove.promotion
    };
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
    const chessMoveResult = chess.move(move);

    // Check if a piece was captured during the move
    if (chessMoveResult && chessMoveResult.captured) {
        player.capturedPieces.push(chessMoveResult.captured);
    }
    const { board, castling } = FENToBoard(chess.fen());
    game.board = board;
    game.castling = castling;
    game.moves.push(move);

    if (chess.isCheckmate()) {
        const winningPlayerIndex = game.players.findIndex(p => p.id === playerId); 
        game.state = winningPlayerIndex === 0 ? "player0-wins" : "player1-wins";
        notifyDiscord(game.id, game.players[winningPlayerIndex].color + " has achieved glorious victory in game " + game.gameName);
    } else {
        const otherPlayer = game.players.find(p => p.id !== playerId); // Find the other player
        game.currentPlayer = otherPlayer.id; // Set the currentPlayer to the other player's id
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

function createChessGame(gameName, fenPosition = null, autoplay=false) {
    if (!gameName) {
        throw new Error("Game name is required.");
    }

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
    game.autoplay = autoplay;
    game.moves = []; // latest moves last
    const gameId = game.id;
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
    suggestMove,
    notifyDiscord,
};