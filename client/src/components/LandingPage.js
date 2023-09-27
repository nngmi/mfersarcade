import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const [gameLink, setGameLink] = useState("");
  const navigate = useNavigate();

  const createGame = async () => {
    try {
      const response = await fetch("/api/game", { method: "POST" });
      console.log(response);
      if (!response.ok) throw new Error("Failed to create game");
      const game = await response.json();
      const gameLink = `/game/${game.gameId}`;
      setGameLink(gameLink); // if you need to set the state
      navigate(gameLink); // to redirect
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  return (
    <div className="landingPageContainer">
      <h1>Mfers Arcade</h1>
      <button onClick={createGame}>Play Mfer Mfer Toe (Multiplayer)</button>
      {gameLink && (
        <p>
          <a href={gameLink}>Go to your game</a>
        </p>
      )}
    </div>
  );
}

export default LandingPage;
