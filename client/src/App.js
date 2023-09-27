import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [games, setGames] = useState({});
    const [selectedGame, setSelectedGame] = useState(null);
    const [board, setBoard] = useState(Array(3).fill(Array(3).fill(null)));
    const [currentPlayer, setCurrentPlayer] = useState('X');
    const [gameState, setGameState] = useState('ongoing');

    const createGame = async () => {
        try {
            const res = await axios.post('/api/game');
            const gameId = res.data.gameId;
            setGames((prev) => ({ ...prev, [gameId]: { board, currentPlayer, gameState } }));
            setSelectedGame(gameId);
        } catch (error) {
            console.error("Error creating game", error);
        }
    };

    const makeMove = async (row, col) => {
        if (!selectedGame || board[row][col] || gameState !== 'ongoing') return;
        try {
            const res = await axios.post(`/api/game/${selectedGame}/move`, { row, col, player: currentPlayer });
            const updatedGame = res.data;
            setBoard(updatedGame.board);
            setCurrentPlayer(updatedGame.currentPlayer);
            setGameState(updatedGame.state);
        } catch (error) {
            console.error("Error making move", error);
        }
    };

    const getGame = async (gameId) => {
        try {
            const res = await axios.get(`/api/game/${gameId}`);
            const game = res.data;
            setSelectedGame(gameId);
            setBoard(game.board);
            setCurrentPlayer(game.currentPlayer);
            setGameState(game.state);
        } catch (error) {
            console.error("Error getting game", error);
        }
    };

    useEffect(() => {
        // Optionally, load existing games when the component mounts
    }, []);

    return (
        <div>
            <button onClick={createGame}>Create Game</button>
            <div>
                <h2>Games</h2>
                <ul>
                    {Object.keys(games).map((gameId) => (
                        <li key={gameId} onClick={() => getGame(gameId)}>
                            Game {gameId}
                        </li>
                    ))}
                </ul>
            </div>
            {selectedGame && (
                <div>
                    <h2>Game {selectedGame}</h2>
                    <div>
                        {board.map((row, rowIndex) => (
                            <div key={rowIndex}>
                                {row.map((cell, colIndex) => (
                                    <button
                                        key={colIndex}
                                        onClick={() => makeMove(rowIndex, colIndex)}
                                        disabled={cell !== null}
                                    >
                                        {cell}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                    <p>Current Player: {currentPlayer}</p>
                    <p>Game State: {gameState}</p>
                </div>
            )}
        </div>
    );
}

export default App;
