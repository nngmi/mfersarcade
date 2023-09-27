const express = require("express");
const path = require('path');
const PORT = process.env.PORT || 3001;

const app = express();
let games = {};

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../client/build')));
app.get("/api", (req, res) => {
    res.json({ message: "Mfer Castle!" });
});

app.use(express.json()); // to parse JSON body

app.post("/api/game", (req, res) => {
    const id = Date.now().toString();
    games[id] = {
        board: [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ],
        currentPlayer: 'X', // X starts the game
        state: "ongoing", // game status: ongoing, draw, X-wins, O-wins
    };
    res.status(201).json({ gameId: id });
});

app.get("/api/game/:id", (req, res) => {
    const game = games[req.params.id];
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json(game);
});

app.post("/api/game/:id/move", (req, res) => {
    const game = games[req.params.id];
    if (!game) return res.status(404).json({ message: "Game not found" });

    const { row, col, player } = req.body;
    if (row == null || col == null || player == null) return res.status(400).json({ message: "Row, column, and player are required" });
    if (game.board[row][col] !== null) return res.status(400).json({ message: "Cell is already occupied" });
    if (player !== game.currentPlayer) return res.status(400).json({ message: "Not your turn" });
    if (game.state !== "ongoing") return res.status(400).json({ message: "Game is already finished" });

    game.board[row][col] = player;
    game.currentPlayer = player === 'X' ? 'O' : 'X'; // switch player

    // Check game state and update accordingly
    game.state = checkGameState(game.board, player);

    res.json(game);
});

function checkGameState(board, player) {
    // Check rows, columns, and diagonals for a win
    for (let i = 0; i < 3; i++) {
        if (board[i].every(cell => cell === player) ||
            [0, 1, 2].every(col => board[col][i] === player)) {
            return `${player}-wins`;
        }
    }
    if ([0, 1, 2].every(i => board[i][i] === player) ||
        [0, 1, 2].every(i => board[i][2 - i] === player)) {
        return `${player}-wins`;
    }
    // Check for a draw
    if (board.flat().every(cell => cell !== null)) return 'draw';

    return 'ongoing';
}


app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
