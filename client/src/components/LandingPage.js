import React, { useState } from "react";
import { useHistory } from 'react-router-dom';

function LandingPage() {
  const [gameLink, setGameLink] = useState("");

  const createGame = async () => {
    try {
      const response = await fetch("/api/game", { method: "POST" });
      console.log(response);
      if (!response.ok) throw new Error("Failed to create game");
      const game = await response.json();
      setGameLink(`/game/${game.gameId}`);
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  return (
    <div>
      <h1>Create a Tic Tac Toe Game</h1>
      <button onClick={createGame}>Create Game</button>
      {gameLink && (
        <p>
          <a href={gameLink}>Go to your game</a>
        </p>
      )}
    </div>
  );
}

export default LandingPage;
