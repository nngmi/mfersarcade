const express = require("express");
const router = express.Router();
const {
    createGame,
} = require('../common/playerconnect.functions');
let larvaLegendsGames = require('./state');

const cleanupGames = () => {
    const now = Date.now();
    const timeout = 10 * 60 * 1000; // 10 minutes in milliseconds

    for (const gameId in larvaLegendsGames) {
        const game = larvaLegendsGames[gameId];

        if ((now - game.lastActivity) > timeout) {
            delete larvaLegendsGames[gameId];
            console.log(`Game ${gameId} cleaned up.`);
        }
    }
};

router.post("/game", (req, res) => {
    try {
        const { gameName, autoplay } = req.body;
        console.log(autoplay);


        let game = createGame(gameName);
        const gameId = game.id;
        if (larvaLegendsGames[gameId]) {
            return res.status(400).json({ message: "Game already exists" });
        }

        larvaLegendsGames[gameId] = game;

        res.status(201).json({ gameId });

    } catch (error) {
        console.log(error.message);
        res.status(400).json({ message: error.message });
    }
});

router.get("/game/:gameId", (req, res) => {
    const gameId = req.params.gameId;
    const game = larvaLegendsGames[gameId];
    if (!game) return res.status(404).json({ message: "Game does not exist" });
    res.json(game);
});

router.get("/games", (req, res) => {
    res.json(larvaLegendsGames);
});

module.exports = router;
