const Chess = require('chess.js').Chess;
const { v4: uuidv4 } = require('uuid');

function createGame(gameName = null) {
    let game = {
        players: [],
        currentPlayer: null, // current player should be common
        state: "waiting for players",
        lastActivity: Date.now(),
        gameName: gameName,
    };
    return game;
}

function joinExistingGame(game, playerId, joinKey, newPlayerFunction) {
    if (!game) return { error: "Game does not exist" };

    // Check if a player with the provided joinKey exists
    const existingPlayer = game.players.find(player => player.joinKey === joinKey);

    if (existingPlayer) {
        existingPlayer.id = playerId;
        existingPlayer.disconnected = false;
        return { success: true, joinedPlayer: existingPlayer.id };
    }

    if (game.players.length >= 2) return { error: "Game is full" };
    
    let player = { 
        id: playerId, 
        disconnected: false,
        joinKey: uuidv4() // Save the joinKey with the player
    };
    newPlayerFunction(player, game);
    
    game.players.push(player);

    if (game.players.length === 2) {
        game.state = "ongoing";
        game.currentPlayer = game.players[0].id;
    }
    
    game.lastActivity = Date.now();

    return { success: true, joinedPlayer: player.id };
}


function playerResign(game, playerId) {
    if (!game) return { error: "Game does not exist" };

    const playerIndex = game.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return { error: "Not a player in this game" };

    if (game.currentPlayer !== playerId) return { error: "Not your turn" }; // Check turn using playerId
    if (game.state !== "ongoing") return { error: "Game is not ongoing" };

    const opposingPlayerIndex = playerIndex === 0 ? 1 : 0;
    const winningPlayerId = game.players[opposingPlayerIndex].id;

    game.state = opposingPlayerIndex === 1 ? "player1-wins" : "player0-wins";
    game.lastActivity = Date.now();

    return { success: true, resignedPlayer: playerId, winningPlayer: winningPlayerId };
}

function handleDisconnect(games, playerId) {
    for (const gameId in games) {
        const game = games[gameId];

        const disconnectingPlayer = game.players.find(p => p.id === playerId);

        if (disconnectingPlayer) {
            disconnectingPlayer.disconnected = true;

            return {
                gameUpdated: true,
                gameId: gameId,
                disconnectingPlayer: disconnectingPlayer.id,
            };
    
        }        
    }
    return { gameUpdated: false };
}


module.exports = {
    joinExistingGame,
    playerResign,
    handleDisconnect,
    createGame,
};