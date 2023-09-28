// mfercastle.socket.js
const socketIo = require("socket.io");
let games = require('./state');

function checkGameState() {
    return "ongoing";
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
            game.decks[socket.id] = [{"cardid":1, "name":"Card 1"}, {"cardid":1, "name":"Card 2"}];
            game.hands[socket.id] = [];
            if (game.players.length == 2) {
                game.state = "ongoing";
            }
            game.lastActivity = Date.now(),
            console.log(game);
            socket.join(gameId);
            mfercastle.to(gameId).emit("gameUpdated", game);
            socket.emit("playerSymbol", playerSymbol);
        });
    
        socket.on("makeMove", (gameId, moveType) => {
            const game = games[gameId];
            if (!game) return socket.emit("error", "Game does not exist");
            
            // Find the player object corresponding to this socket.id
            const player = game.players.find(p => p.id === socket.id);
            if (!player) return socket.emit("error", "Not a player in this game");
            
            // Check if it’s this player’s turn
            if (game.currentPlayer !== player.symbol) return socket.emit("error", "Not your turn");

            // if moveType = 'draw'
            if (moveType === "draw") {
                if (!game.decks[socket.id].empty()) {
                    let card = game.decks[socket.id].pop();
                    game.hands[socket.id].push(card);
                } else {
                    return socket.emit("error", "No more cards");
                }
            }
            game.lastActivity = Date.now(),
            game.state = checkGameState() || game.state;
            
            // Switch the current player
            game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
            mfercastle.to(gameId).emit("gameUpdated", game);
        });
    });
};