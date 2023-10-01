// mfercastle.socket.js
const socketIo = require("socket.io");
const { games, initializePlayer, endTurn, beginTurn, checkGameState, drawCard, discardCard} = require('./state');
const { cards, generateDeck } = require('./cards');


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
    
            initializePlayer(30, game, playerSymbol, socket.id);
            
            if (game.players.length == 2) {
                game.state = "ongoing";
                // beginTurn sets currentPlayer
                beginTurn(game, "X");
            }
            game.lastActivity = Date.now(),
            socket.join(gameId);
            socket.emit("playerSymbol", playerSymbol);
            game.players.forEach((player) => {
                console.log("emitting to player ", player.id);
                mfercastle.to(player.id).emit("gameUpdated", maskGameForPlayer(game, player.symbol));
            });
        });
    
        socket.on("makeMove", (gameId, moveType, moveDetails) => {
            console.log("handling move ", moveType);
            const game = games[gameId];
            if (!game) return socket.emit("error", "Game does not exist");
            if (game.lock) return socket.emit("error", "Game is currently processing another move, please try again shortly");
            game.lock = true;
            try {
                // Find the player object corresponding to this socket.id
                const player = game.players.find(p => p.id === socket.id);
                if (!player) return socket.emit("error", "Not a player in this game");
                console.log("after socket error");

                if (game.state !== "ongoing") {
                    return socket.emit("error", "Game is over");
                }
                
                // Check if it’s this player’s turn
                if (game.currentPlayer !== player.symbol) return socket.emit("error", "Not your turn");
                console.log("it is our turn", game.currentPlayer);
                if (moveType === "draw") {
                    const errMessage = drawCard(game, player.symbol);
                    if (errMessage) {
                        return socket.emit("error", errMessage);
                    } else {
                        game.players.forEach((player) => {
                            if (player.id != socket.id) {
                                console.log("emitting to player ", player.id);
                                mfercastle.to(player.id).emit("notify", "Opponent drew a card");
                            }
                        });
                    }
                } else if (moveType === "yield") {
                    const otherPlayerSymbol = game.currentPlayer === "X" ? "O" : "X";
                    const otherPlayer = game.players.find(p => p.symbol === otherPlayerSymbol);

                    endTurn(game, player.symbol);

                    // notify the player
                    game.players.forEach((player) => {
                        if (player.id != socket.id) {
                            console.log("emitting to player ", player.id);
                            mfercastle.to(player.id).emit("notify", "Opponent has yielded their turn");
                        }
                    });

                    // beginTurn sets currentPlayer
                    beginTurn(game, otherPlayer.symbol);
                    
                } else if (moveType === "discard") {
                    const { cardid } = moveDetails;
                    let errMessage = discardCard(game, cardid, player.symbol);
                    if (errMessage) {
                        return socket.emit("error", errMessage);
                    } else {
                        // notify other players
                        game.players.forEach((player) => {
                            if (player.id != socket.id) {
                                mfercastle.to(player.id).emit("notify", "Opponent discarded card.");
                            }
                        });
                    }
                    
                } else if (moveType === "play") {
                    const { cardid } = moveDetails;
                    console.log(moveDetails);

                    if (!cardid) {
                    return socket.emit("error", "Error with play because cardid does not exist");
                    }
                    
                    const cardIndex = game.hands[player.symbol].cards.findIndex(card => card.id === cardid);
                    
                    if (cardIndex === -1) {
                    console.group(game.hands[player.symbol]);
                    console.group(cardid);
                    return socket.emit("error", "Error with play, card not found in hand");
                    }

                    const card = game.hands[player.symbol].cards[cardIndex];
                    if (card.cost > player.spendingResources) {
                        return socket.emit("error", "Card " + card.name + " costs " + card.cost + " and you only have " + player.spendingResources + " resources");
                    }

                    // notify other players

                    console.log("right before apply effect");
                    let errMessage = card.applyEffect(game, player.symbol);
                    if (errMessage) {
                        return socket.emit("error", "Could not play " + card.name + " because " + errMessage);
                    }
                
                    // spend the resources
                    player.spendingResources -= card.cost;
                    // removing card from hand
                    game.hands[player.symbol].cards.splice(cardIndex, 1);
                    game.hands[player.symbol].count--;
                    
                    // appending card to battlefield
                    game.battlefields[player.symbol].cards.push(card);
                    game.battlefields[player.symbol].count++;

                    // notify the other players
                    game.players.forEach((player) => {
                        if (player.id != socket.id) {
                            mfercastle.to(player.id).emit("notify", "Opponent played card " + card.name);
                        }
                    });

                } else {
                    return socket.emit("error", "Unknown move " + moveType);
                }
                
                game.lastActivity = Date.now(),
                game.state = checkGameState(game) || game.state;
                if (game.state != "ongoing") {
                    socket.emit("error", "Game has ended!!");              
                }
                game.players.forEach((player) => {
                    console.log("emitting to player ", player.id);
                    mfercastle.to(player.id).emit("gameUpdated", maskGameForPlayer(game, player.symbol));
                });
            } finally {
                game.lock = false;
            }           
        });
    });
};