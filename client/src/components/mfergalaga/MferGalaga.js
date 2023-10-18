// GalagaGame.js

import React, { useState, useEffect } from 'react';
import { Game } from './GalagaObjects';
import { ShipComponent, EnemyComponent, BlasterComponent } from './GalagaComponents';
import './MferGalaga.css'
import { Howl } from 'howler';
const MferGalaga = () => {

  const [game, setGame] = useState(new Game());
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);
      // Function to handle touch start
      const handleTouchStart = (e) => {
        const touchX = e.touches[0].clientX;
        if (touchX < window.innerWidth / 2) { // Touch is on the left side
            setLeftPressed(true);
        } else {
            setRightPressed(true);
        }
    };

    // Function to handle touch move
    const handleTouchMove = (e) => {
        const touchX = e.touches[0].clientX;
        if (touchX < window.innerWidth / 2) { // Touch has moved to the left side
            setLeftPressed(true);
            setRightPressed(false);
        } else {
            setRightPressed(true);
            setLeftPressed(false);
        }
    };

    // Function to handle touch end
    const handleTouchEnd = (e) => {
        setLeftPressed(false);
        setRightPressed(false);
    };
  const handleKeyDown = (e) => {
    switch(e.keyCode) {
        case 37: // Left arrow key
            setLeftPressed(true);
            break;
        case 39: // Right arrow key
            setRightPressed(true);
            break;
        case 32: // Spacebar
            game.playerShoots();
            break;
        default:
            break;
    }
}

const handleKeyUp = (e) => {
    switch(e.keyCode) {
        case 37: // Left arrow key
            setLeftPressed(false);
            break;
        case 39: // Right arrow key
            setRightPressed(false);
            break;
        default:
            break;
    }
}


  
  useEffect(() => {
    // Add event listener for keydown
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const intervalId = setInterval(() => {
        if (!game.gameOver) {
            if (leftPressed) {
                game.ship.move(-10, 0);
            }
            if (rightPressed) {
                game.ship.move(10, 0);
            }
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
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [game, leftPressed, rightPressed]);
  

  return (
    <div className="gameContainer">
      <div className="gameInfo">
        <span>Health: {game.ship.lives}</span>
        <span>Level: {game.currentLevel}</span>
      </div>
      <div className="gameArea">
        <ShipComponent x={game.ship.x} y={game.ship.y} />
        {game.enemies.map((enemy, idx) => <EnemyComponent key={idx} x={enemy.x} y={enemy.y} type={enemy.type} />)}
        {game.blasters.map((blaster, idx) => <BlasterComponent key={idx} x={blaster.x} y={blaster.y} fromEnemy={blaster.fromEnemy}/>)}
      </div>
      <div className="controlPad leftControl" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}></div>
            <div className="controlPad rightControl" onTouchStart={game.playerShoots}></div>

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
