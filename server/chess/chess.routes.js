const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
let chessGames = require('./state');

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
    const gameId = uuidv4();
    if (chessGames[gameId]) return res.status(400).json({ message: "Game already exists" });

    // Initialize a chess board
    chessGames[gameId] = {
        players: [],
        board: [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ],
        currentPlayer: "white", // Players are 'white' and 'black' in chess
        state: "waiting for other player",
        lastActivity: Date.now(),
    };
    res.status(201).json({ gameId });
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
