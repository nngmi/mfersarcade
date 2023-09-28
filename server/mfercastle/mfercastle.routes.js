// mfercastle.routes.js
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
let games = require('./state');

const cleanupGames = () => {
    const now = Date.now();
    const timeout = 10 * 60 * 1000; // 10 minutes in milliseconds

    for (const gameId in games) {
        const game = games[gameId];
        
        // Assume game has a `lastActivity` timestamp and a `status` property
        if ((now - game.lastActivity) > timeout) {
            delete games[gameId];
            console.log(`Game ${gameId} cleaned up.`);
        }
    }
};

router.post("/game", (req, res) => {
    const gameId = uuidv4();
    if (games[gameId]) return res.status(400).json({ message: "Game already exists" }); // This check is technically redundant now, as UUIDs are unique.
    games[gameId] = {
        players: [],
        decks: {},
        hands: {},
        currentPlayer: "X",
        state: "waiting for other player",
        lastActivity: Date.now(),
    };
    res.status(201).json({ gameId });
});

router.get("/game/:gameId", (req, res) => {
    const gameId = req.params.gameId;
    const game = games[gameId];
    if (!game) return res.status(404).json({ message: "Game does not exist" });
    res.json(game);
});


module.exports = router;
