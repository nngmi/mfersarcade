const socketIo = require("socket.io");
let chessGames = require('./state');
const { processMove, joinExistingGame, playerResign, handleDisconnect, createChessGame} = require('./chess.functions');

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
        
            const result = handleDisconnect(chessGames, socket.id);
        
            if (result.gameUpdated) {
                chessSocket.to(result.gameId).emit("gameUpdated", chessGames[result.gameId]);
                chessSocket.to(result.gameId).emit("notify", result.disconnectedColor + " disconnected, " + result.winningColor + " wins!");
            }
        });

        socket.on("checkTime", (gameId) => {
            const game = chessGames[gameId];
            if (!game) return socket.emit("error", "Game does not exist");
            console.log("checkign time");
            
            // Check if any player's time has run out and update the game state accordingly
            const currentTime = Date.now();
            game.players.forEach(player => {
                const timeElapsed = currentTime - game.lastActivity;
                player.timeLeft -= timeElapsed;
                if (player.timeLeft <= 0) {
                    player.timeLeft = 0;
                    game.state = `${player.color === "white" ? "black" : "white"}-wins`;
                    socket.emit("gameUpdated", game); // Notify about the updated game state
                    game.lastActivity = currentTime;
                }
            });
        });



        socket.on("joinGame", (gameId) => {
            const game = chessGames[gameId];
            const result = joinExistingGame(game, socket.id);
        
            if (result.error) {
                socket.emit("error", result.error);
            } else {
                socket.join(gameId);
                chessSocket.to(gameId).emit("gameUpdated", game);
                socket.emit("playerColor", result.playerColor);
            }
        });
        
    
        socket.on("makeMove", (gameId, move) => {
            const game = chessGames[gameId];
            if (!game) return socket.emit("error", "Game does not exist");
            const player = game.players.find(p => p.id === socket.id);
            if (!player) return socket.emit("error", "Not a player in this game");
        
            const result = processMove(game, move, socket.id);
            if (result.error) {
                socket.emit("error", result.error);
            } else {
                chessSocket.to(gameId).emit("notify", player.color + " made a move from " + move["from"] + " to " + move["to"]);
                chessSocket.to(gameId).emit("gameUpdated", game);
            }
        });

        socket.on("resign", (gameId) => {
            const game = chessGames[gameId];
            const result = playerResign(game, socket.id);
        
            if (result.error) {
                socket.emit("error", result.error);
            } else {
                chessSocket.to(gameId).emit("notify", result.resignedPlayer + " resigned, " + result.winningPlayer + " wins!");
                chessSocket.to(gameId).emit("gameUpdated", game);
            }
        });        


    });
};
