import React, { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const [gameLink, setGameLink] = useState("");
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const showTestLevels = urlParams.get('showTestLevels') === 'true';

  const createTicTacToeGame = async () => {
    try {
      const response = await fetch("/api/tictactoe/game", { method: "POST" });
      console.log(response);
      if (!response.ok) throw new Error("Failed to create game");
      const game = await response.json();
      const gameLink = `/mfermfertoe/${game.gameId}`;
      setGameLink(gameLink); // if you need to set the state
      navigate(gameLink); // to redirect
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const createMferCastleGame = async () => {
    try {
      const response = await fetch("/api/mfercastle/game", { method: "POST" });
      console.log(response);
      if (!response.ok) throw new Error("Failed to create game");
      const game = await response.json();
      const gameLink = `/mfercastle/${game.gameId}`;
      setGameLink(gameLink); // if you need to set the state
      navigate(gameLink); // to redirect
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const createConnectFour = async () => {
    try {
      const response = await fetch("/api/connect4/game", { method: "POST" });
      console.log(response);
      if (!response.ok) throw new Error("Failed to create game");
      const game = await response.json();
      const gameLink = `/connect4/${game.gameId}`;
      setGameLink(gameLink); // if you need to set the state
      navigate(gameLink); // to redirect
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  return (
    <div className="landingPageContainer">
      <div className="header-content">
          <img src="/images/heads/3.png" className="logo-image" />
          <h2>Mfers Arcade</h2>
      </div>
      <div className="games-container">
          <div className="game-item">
            <Link to="https://nngmi.github.io/mfersbeheaded">
              <img src="/images/mfersbeheaded.png" alt="Mfers Beheaded" />
            </Link>
            <p>Mfers Beheaded</p>
          </div>
          <div className="game-item">
            <img onClick={createTicTacToeGame} src="/images/mfermfertoe.png" alt="Mfer Mfer Toe" />
            <p>Mfer Mfer Toe</p>
          </div>
          { showTestLevels && (
            <div className="game-item">
              <img onClick={createMferCastleGame} src="/images/mfercastle.png" alt="Mfers Castle" />
              <p>Mfers Castle</p>
            </div>
          )}
            <div className="game-item">
              <img onClick={createConnectFour} src="/images/connect4.png" alt="Connect 4" />
              <p>Connect 4 - Hoodies vs Top Hats</p>
            </div>
        </div>
    </div>
  );
}

export default LandingPage;
