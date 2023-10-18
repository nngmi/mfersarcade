// GalagaGame.js

import React, { useState, useEffect } from 'react';
import { Game } from './GalagaObjects';
import { ShipComponent, EnemyComponent, BlasterComponent } from './GalagaComponents';
import './MferGalaga.css'

const MferGalaga = () => {

  const [game, setGame] = useState(new Game());
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const handleKeyDown = (e) => {
    switch(e.keyCode) {
      case 37: // Left arrow key
        game.ship.move(-10, 0);  // Adjust the number for speed
        break;
      case 39: // Right arrow key
        game.ship.move(10, 0);  // Adjust the number for speed
        break;
      case 32: // Spacebar
        game.playerShoots();
        break;
      default:
        break;
    }
    setGame(prevGame => {
        const newGame = Object.assign(Object.create(Object.getPrototypeOf(prevGame)), prevGame);
        return newGame;
    });
  }
  
  useEffect(() => {
    // Add event listener for keydown
    window.addEventListener('keydown', handleKeyDown);
  
    const intervalId = setInterval(() => {
        if (!game.gameOver) {
      game.tick();
      setGame(prevGame => {
        const newGame = Object.assign(Object.create(Object.getPrototypeOf(prevGame)), prevGame);
        newGame.tick();
        return newGame;
      
    });}
    }, 1000 / 60);
    console.log(game.gameOver);
    if (game.gameOver) {
        setShowGameOverModal(true);
      }
    // Cleanup: Remove the event listener on component unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [game]);
  

  return (
    <div className="gameContainer">
      <div className="gameInfo">
        <span>Health: {game.ship.lives}</span>
        <span>Level: {game.currentLevel}</span>
      </div>
      <div className="gameArea">
        <ShipComponent x={game.ship.x} y={game.ship.y} />
        {game.enemies.map((enemy, idx) => <EnemyComponent key={idx} x={enemy.x} y={enemy.y} type={enemy.type} />)}
        {game.blasters.map((blaster, idx) => <BlasterComponent key={idx} x={blaster.x} y={blaster.y} />)}
      </div>
      {showGameOverModal && (
        <div className="gameOverModal">
          <div className="modalContent">
            <h2>Game Over</h2>
            <button onClick={() => setShowGameOverModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
);
}

export default MferGalaga;
