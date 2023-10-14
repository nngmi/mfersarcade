import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import './ChessLandingPage.css';

function ChessLandingPage() {
    const [games, setGames] = useState([]);
    const [gameName, setGameName] = useState(''); // New state for game name
    const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3001";
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch the list of all games
        fetch(`${SERVER_URL}/api/chess/games`)
            .then((response) => response.json())
            .then((data) => { console.log(data); setGames(data)})
            .catch((error) => console.error('Error fetching the games list:', error));
    }, []);
    const validateGameName = (name) => {
        const trimmedName = name.trim();
        return trimmedName.length > 0 && trimmedName.length <= 50;
    };
    
    const createChessGame = async () => {
        if (!validateGameName(gameName)) {
            alert('Please enter a valid game name (1-50 characters).');
            return;
        }
        try {
            const response = await fetch("/api/chess/game", { 
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameName }) // Pass game name and player name in POST request
            });
            console.log(response);
            if (!response.ok) throw new Error("Failed to create game");
            const game = await response.json();
            const gameLink = `/mferchess/${game.gameId}`;
            console.log("navigating to game link");
            navigate(gameLink); // to redirect
        } catch (error) {
            console.error("Error creating game:", error);
        }
    };

    const joinGame = (uuid) => {
        window.location.href = `/mferchess/${uuid}`;
    };

    return (
        <div className="game-container">
            <h1 className="title">Mfer Chess</h1>

            <section>
                <h3>Games in Progress:</h3>
                {games && Object.keys(games).length > 0 ? (
                <>
                    <ul className="games-list">
                        {Object.entries(games)
                        .filter(([, game]) => game.state === "waiting for players" || game.state === "ongoing")
                        .sort(([, gameA], [, gameB]) => {
                            if (gameA.state === "waiting for players" && gameB.state !== "waiting for players") return -1;
                            if (gameB.state === "waiting for players" && gameA.state !== "waiting for players") return 1;
                            return gameB.lastActivity - gameA.lastActivity; // Assuming lastActivity is a timestamp. Adjust accordingly.
                        })
                        .map(([uuid, game]) => (
                            <li key={uuid}>
                                {game.gameName} - ({game.state})
                                {game.players && game.players.length < 2 ? (
                                    <button onClick={() => joinGame(uuid)}>Join</button>
                                ) : <button onClick={() => joinGame(uuid)}>View Game</button>}
                            </li>
                        ))}
                    </ul>
                </>
            ) : (
                <p>No active games.</p>
            )}
            </section>

            <section>
                <h3>Create a New Game</h3>
                <p>
                    <label>Game Name: 
                        <input 
                            type="text" 
                            placeholder="Enter a Name for New Game" 
                            value={gameName} 
                            onChange={(e) => setGameName(e.target.value)} 
                        />
                    </label>
                </p>
                <button className="create-game-button" onClick={createChessGame}>
                    Create New Game
                </button>
            </section>

            <p>
                <a href="/" className="back-button">
                    Back to Home
                </a>
            </p>
        </div>
    );
}

export default ChessLandingPage;
