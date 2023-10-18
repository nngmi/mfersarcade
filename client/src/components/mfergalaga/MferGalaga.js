// GalagaGame.js

import React, { useState, useEffect } from 'react';
import { Game } from './GalagaObjects';
import { ShipComponent, EnemyComponent, BlasterComponent } from './GalagaComponents';

const MferGalaga = () => {
  const GAME_WIDTH = 400;
  const GAME_HEIGHT = 500;
  const [game, setGame] = useState(new Game());
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
      game.tick();
      setGame(prevGame => {
        const newGame = Object.assign(Object.create(Object.getPrototypeOf(prevGame)), prevGame);
        newGame.tick();
        return newGame;
    });
    }, 1000 / 60); 
  
    // Cleanup: Remove the event listener on component unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [game]);
  

  return (
    <div>
      <ShipComponent x={game.ship.x} y={game.ship.y} />
      {game.enemies.map((enemy, idx) => <EnemyComponent key={idx} x={enemy.x} y={enemy.y} type={enemy.type} />)}
      {game.blasters.map((blaster, idx) => <BlasterComponent key={idx} x={blaster.x} y={blaster.y} />)}
    </div>
  );
}

export default MferGalaga;
