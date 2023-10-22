let larvaLegendsGames = require('./state');

const {
    joinExistingGame,
    playerResign,
    handleDisconnect,
    createGame,
} = require('../common/playerconnect.functions');

function newPlayerFunction(newplayer, game) {
    // for larva legends, game state to be defined
}

module.exports = (io) => {
    const larvaSocket = io.of('/larvalegends');

    larvaSocket.on("connection", (socket) => {
        console.log("New client connected", socket.id);

        socket.on("viewGame", (gameId) => {
            const game = larvaLegendsGames[gameId];
            if (!game) return socket.emit("error", "Game does not exist");
            socket.join(gameId);
        });

        socket.on("disconnect", (reason) => {
            console.log("Client disconnected", socket.id, "Reason:", reason);

            const result = handleDisconnect(larvaLegendsGames, socket.id);

            if (result.gameUpdated) {
                const game = larvaLegendsGames[result.gameId];
                const disconnectedPlayer = game.players.find(p => p.id === socket.id);

                if (disconnectedPlayer) {
                    const playerColor = disconnectedPlayer.color;
                    larvaSocket.to(result.gameId).emit("gameUpdated", game);
                    larvaSocket.to(result.gameId).emit("notify", playerColor + " disconnected, waiting for reconnect.");
                }
            }
        });

        socket.on("joinGame", (gameId, joinKey) => {
            try {
                const game = larvaLegendsGames[gameId];

                const result = joinExistingGame(game, socket.id, joinKey, newPlayerFunction);

                if (result.error) {
                    socket.emit("error", result.error);
                } else {
                    socket.join(gameId);
                    socket.emit("joined", result.joinedPlayer);
                    const joinedPlayer = game.players.find(p => p.id === result.joinedPlayer);
                    setTimeout(() => {
                        larvaSocket.to(gameId).emit("notify", joinedPlayer.color + " joined the game.");
                        larvaSocket.to(gameId).emit("gameUpdated", game);
                    }, 100);  // Add a 100ms delay before emitting gameUpdated event
                }
            } catch (err) {
                console.error(`Error processing move for game ${gameId}:`, err);
                larvaSocket.to(gameId).emit("error", "Unknown error, please report to dev");
            }
        });

        socket.on("makeMove", (gameId, move) => {
            try {
                const game = larvaLegendsGames[gameId];
                if (!game) return socket.emit("error", "Game does not exist");
                const player = game.players.find(p => p.id === socket.id);
                if (!player) return socket.emit("error", "Not a player in this game, if you think error, try refreshing page to rejoin.");
                larvaSocket.to(gameId).emit("notify", " tried to make a move ");

            } catch (err) {
                console.error(`Error processing move for game ${gameId}:`, err);
                larvaSocket.to(gameId).emit("error", "Unknown error, please report to dev");
            }
        });
    });
};
