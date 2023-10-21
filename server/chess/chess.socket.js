let chessGames = require('./state');
const { processMove, suggestMove, joinExistingGame, playerResign, handleDisconnect, notifyDiscord } = require('./chess.functions');

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
                const game = chessGames[result.gameId];
                const disconnectedPlayer = game.players.find(p => p.id === socket.id);

                if (disconnectedPlayer) {
                    const playerColor = disconnectedPlayer.color;
                    chessSocket.to(result.gameId).emit("gameUpdated", game);
                    chessSocket.to(result.gameId).emit("notify", playerColor + " disconnected, waiting for reconnect.");
                }
            }
        });

        socket.on("checkTime", (gameId) => {
            const game = chessGames[gameId];
            if (!game || game.state !== 'ongoing') return;
            console.log("checking time on game ", gameId);

            const currentPlayerIndex = game.players.findIndex(player => player.id === game.currentPlayer);
            if (currentPlayerIndex === -1) return; // Ensure a current player is found

            const currentPlayer = game.players[currentPlayerIndex];

            // Check if the current player's time has run out and update the game state accordingly
            const currentTime = Date.now();
            const timeElapsed = currentTime - game.lastActivity;
            if (currentPlayer.timeLeft <= timeElapsed) {
                currentPlayer.timeLeft = 0;

                // Determine the winner based on currentPlayer's index
                game.state = currentPlayerIndex === 0 ? "player1-wins" : "player0-wins";

                // Notify which player ran out of time
                const playerColor = currentPlayer.color;
                chessSocket.to(gameId).emit("notify", playerColor + " ran out of time.");
                notifyDiscord(gameId, playerColor + " ran out of time in " + game.gameName);
                game.lastActivity = currentTime;
            } else {
                currentPlayer.timeLeft -= timeElapsed;
                game.lastActivity = currentTime;
            }
            chessSocket.to(gameId).emit("gameUpdated", game);
        });

        socket.on("joinGame", (gameId, joinKey) => {
            try {
                const game = chessGames[gameId];
                const result = joinExistingGame(game, socket.id, joinKey);

                if (result.error) {
                    socket.emit("error", result.error);
                } else {
                    socket.join(gameId);
                    socket.emit("joined", result.joinedPlayer);
                    const joinedPlayer = game.players.find(p => p.id === result.joinedPlayer);
                    setTimeout(() => {
                        chessSocket.to(gameId).emit("notify", joinedPlayer.color + " joined the game.");
                        chessSocket.to(gameId).emit("gameUpdated", game);

                        if (game.autoplay && game.players.length === 1) {
                            console.log("auto play joining");
                            const result = joinExistingGame(game, "AI" + gameId, null);
                            chessSocket.to(gameId).emit("notify", "charcoal (AI) joined the game.");
                            chessSocket.to(gameId).emit("gameUpdated", game);
                        }
                        if (game.players.length == 2) {
                            notifyDiscord(gameId, game.gameName + " is now underway!");
                        }
                    }, 100);  // Add a 100ms delay before emitting gameUpdated event
                }
            } catch (err) {
                console.error(`Error processing move for game ${gameId}:`, err);
                chessSocket.to(gameId).emit("error", "Unknown error, please report to dev");
            }
        });

        socket.on("makeMove", (gameId, move) => {
            try {
                const game = chessGames[gameId];
                if (!game) return socket.emit("error", "Game does not exist");
                const player = game.players.find(p => p.id === socket.id);
                if (!player) return socket.emit("error", "Not a player in this game, if you think error, try refreshing page to rejoin.");

                const result = processMove(game, move, socket.id);
                if (result.error) {
                    socket.emit("error", result.error);
                } else {
                    chessSocket.to(gameId).emit("notify", player.color + " made a move from " + move["from"] + " to " + move["to"]);
                    chessSocket.to(gameId).emit("gameUpdated", game);
                    if (game.autoplay) {
                        let suggestedMove = suggestMove(game, 'black');
                        
                        if (suggestedMove !== null) {
                            // Validate the move
                            processMove(game, suggestedMove, game.players[1].id);
                            chessSocket.to(gameId).emit("notify", game.players[1].color + " made a move from " + suggestedMove["from"] + " to " + suggestedMove["to"]);
                            chessSocket.to(gameId).emit("gameUpdated", game);
                        } else {

                            chessSocket.to(gameId).emit("error", game.players[1].color + " has no more possible moves!");
                        }

                    }
                }
            } catch (err) {
                console.error(`Error processing move for game ${gameId}:`, err);
                chessSocket.to(gameId).emit("error", "Unknown error, please report to dev");
            }
        });

        socket.on("resign", (gameId) => {
            const game = chessGames[gameId];
            const result = playerResign(game, socket.id);

            if (result.error) {
                socket.emit("error", result.error);
            } else {
                const resignedPlayerColor = game.players.find(p => p.id === result.resignedPlayer).color;
                const winningPlayerColor = game.players.find(p => p.id === result.winningPlayer).color;

                chessSocket.to(gameId).emit("notify", resignedPlayerColor + " resigned, " + winningPlayerColor + " wins!");
                chessSocket.to(gameId).emit("gameUpdated", game);
                notifyDiscord(gameId, resignedPlayerColor + " resigned from game " + game.gameName);
            }
        });
    });
};
