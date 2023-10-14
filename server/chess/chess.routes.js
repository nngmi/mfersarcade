const express = require("express");
const router = express.Router();

let chessGames = require('./state');

const { createChessGame} = require('./chess.functions');

const cleanupGames = () => {
    const now = Date.now();
    const timeout = 10 * 60 * 1000; // 10 minutes in milliseconds

    for (const gameId in chessGames) {
        const game = chessGames[gameId];
        
        if ((now - game.lastActivity) > timeout) {
            delete chessGames[gameId];
            console.log(`Game ${gameId} cleaned up.`);
        }
    }
};

router.post("/game", (req, res) => {
    try {
        const { gameName, autoplay } = req.body;
        console.log(autoplay);

        const { gameId, game } = createChessGame(gameName, null, autoplay);

        if (chessGames[gameId]) {
            return res.status(400).json({ message: "Game already exists" });
        }

        chessGames[gameId] = game;

        res.status(201).json({ gameId });

    } catch (error) {
        console.log(error.message);
        res.status(400).json({ message: error.message });
    }
});

router.get("/game/:gameId", (req, res) => {
    const gameId = req.params.gameId;
    const game = chessGames[gameId];
    if (!game) return res.status(404).json({ message: "Game does not exist" });
    res.json(game);
});

router.get("/games", (req, res) => {
    res.json(chessGames);
});

module.exports = router;
