import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

function Connect4LandingPage() {
    const [games, setGames] = useState([]);
    const navigate = useNavigate();
    useEffect(() => {
        // Fetch the list of all games
        fetch(`/api/connect4/games`)
            .then((response) => response.json())
            .then((data) => { console.log(data); setGames(data)})
            .catch((error) => console.error('Error fetching the games list:', error));
    }, []);

    const createConnectFour = async () => {
        try {
          const response = await fetch("/api/connect4/game", { method: "POST" });
          console.log(response);
          if (!response.ok) throw new Error("Failed to create game");
          const game = await response.json();
          const gameLink = `/connect4/${game.gameId}`;
          navigate(gameLink); // to redirect
        } catch (error) {
          console.error("Error creating game:", error);
        }
      };

    const joinGame = (uuid) => {
        window.location.href = `/connect4/${uuid}`;
    };

    return (
        <div className="game-container">
            <h1 className="title">Connect 4 - Hoodies vs Top Hats</h1>
            <p>Games in Progress:</p>
            
            <ul className="games-list">
            {Object.entries(games)
            .filter(([, game]) => game.state === "waiting for other player" || game.state === "ongoing")
            .sort(([, gameA], [, gameB]) => {
                if (gameA.state === "waiting for other player" && gameB.state !== "waiting for other player") return -1;
                if (gameB.state === "waiting for other player" && gameA.state !== "waiting for other player") return 1;
                return gameB.lastActivity - gameA.lastActivity; // Assuming lastActivity is a timestamp. Adjust accordingly.
            })
            .map(([uuid, game]) => (
                <li key={uuid}>
                    Game ({game.state})
                    {game.players && game.players.length === 1 ? (
                        <button onClick={() => joinGame(uuid)}>Join</button>
                    ) : null}
                </li>
            ))}

            </ul>

            <button className="create-game-button" onClick={createConnectFour}>
                Create New Game
            </button>

            <p>
                <a href="/" className="back-button">
                    Back to Home
                </a>
            </p>
        </div>
    );
}

export default Connect4LandingPage;
