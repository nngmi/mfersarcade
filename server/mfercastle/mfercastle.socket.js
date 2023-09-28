// mfercastle.socket.js
const socketIo = require("socket.io");
let games = require('./state');
const { cards, generateDeck } = require('./cards');
function checkGameState() {
    return "ongoing";
}

function maskGameForPlayer(game, playerSymbol) {
    const maskedGame = JSON.parse(JSON.stringify(game)); // deep copy
    maskedGame.players.forEach((player) => {
        delete maskedGame.decks[player.symbol]["cards"];
        if (player.symbol !== playerSymbol) {
            delete maskedGame.hands[player.symbol]["cards"];
        }
    });
    return maskedGame;
}


module.exports = (io) => {
    const mfercastle = io.of('/mfercastle');

    mfercastle.on("connection", (socket) => {
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
            // shuffle a deck of cards for the user
            game.decks[playerSymbol] = {"count": 30, "cards": generateDeck(30)};
            game.hands[playerSymbol] = {"count": 0, "cards": []};
            if (game.players.length == 2) {
                game.state = "ongoing";
            }
            game.lastActivity = Date.now(),
            console.log(game);
            socket.join(gameId);
            //smfercastle.to(gameId).emit("gameUpdated", game);
            socket.emit("playerSymbol", playerSymbol);
            game.players.forEach((player) => {
                console.log("emitting to player ", player.id);
                mfercastle.to(player.id).emit("gameUpdated", maskGameForPlayer(game, player.symbol));
            });
        });
    
        socket.on("makeMove", (gameId, moveType) => {
            console.log("handling move ", moveType);
            const game = games[gameId];
            if (!game) return socket.emit("error", "Game does not exist");
            
            // Find the player object corresponding to this socket.id
            const player = game.players.find(p => p.id === socket.id);
            if (!player) return socket.emit("error", "Not a player in this game");
            console.log("after socket error");
            
            // Check if it’s this player’s turn
            if (game.currentPlayer !== player.symbol) return socket.emit("error", "Not your turn");
            console.log("it is our turn", game.currentPlayer);
            if (moveType === "draw") {
                console.log(game.decks[game.currentPlayer]);
                if (game.decks[game.currentPlayer] && game.decks[game.currentPlayer].count > 0) {
                    console.log("drawing a card");
                    let card = game.decks[game.currentPlayer]["cards"].pop();
                    game.decks[game.currentPlayer]["count"] = game.decks[game.currentPlayer]["cards"].length;
                    game.hands[game.currentPlayer]["cards"].push(card);
                    game.hands[game.currentPlayer]["count"] += 1;
                } else {
                    return socket.emit("error", "No more cards");
                }
            } else if (moveType === "yield") {
                game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
            }
            
            game.lastActivity = Date.now(),
            game.state = checkGameState() || game.state;
            console.log(game);
            game.players.forEach((player) => {
                console.log("emitting to player ", player.id);
                mfercastle.to(player.id).emit("gameUpdated", maskGameForPlayer(game, player.symbol));
            });            
        });
    });
};