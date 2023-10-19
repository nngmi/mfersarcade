import React, { useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const [gameLink, setGameLink] = useState("");
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const showTestLevels = urlParams.get('showTestLevels') === 'true';

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
                <Link to="/mferchess/">
                  <img src="/images/mferchess.png" alt="Chess" />
                </Link>
                <p>Mfer Chess</p>
            </div>
            <div className="game-item">
                <Link to="/connect4/">
                  <img src="/images/connect4.png" alt="Connect 4" />
                </Link>
                <p>Hoodies vs Top Hats (Connect 4)</p>
            </div>
            <div className="game-item">
              <img onClick={createMferCastleGame} src="/images/mfercastle.png" alt="Mfers Castle" />
              <p>🚧 Mfers Castle 🚧</p>
            </div>
            <div className="game-item">
                <Link to="/mfersshootout/">
                  <img src="/images/mfergalaga.png" alt="Galaga" />
                </Link>
              <p>🚧 Mfers Shootout 🚧</p>
            </div>
        </div>
    </div>
  );
}

export default LandingPage;
