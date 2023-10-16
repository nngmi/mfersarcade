import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useParams } from 'react-router-dom';
import './Connect4.css';
import { Howl } from 'howler';

function GameConnect4() {
    let { gameId } = useParams();
    const [socket, setSocket] = useState(null);
    const [board, setBoard] = useState(() => Array(7).fill(0).map(row => Array(6).fill(null)));
    const [gameState, setGameState] = useState("waiting for other player");
    const [currentPlayer, setCurrentPlayer] = useState("X");
    const [playerSymbol, setPlayerSymbol] = useState(null);

    const basicSound = new Howl({
        src: ["/audio/correct.mp3"], // Replace with your sound file path
        autoplay: false, // Play the sound right away
        loop: false, // Do not loop the sound
        volume: 0.5, // Set the volume to 50%
      });
      const winSound = new Howl({
        src: ["/audio/success.mp3"], // Replace with your sound file path
        autoplay: false, // Play the sound right away
        loop: false, // Do not loop the sound
        volume: 0.5, // Set the volume to 50%
      });
      const wrongSound = new Howl({
        src: ["/audio/wrong_sound.mp3"], // Replace with your sound file path
        autoplay: false, // Play the sound right away
        loop: false, // Do not loop the sound
        volume: 0.5, // Set the volume to 50%
      });
      useEffect(() => {
        if (!gameId) return;
        let playerSymbolLocal = null;
    
        const newSocket = io.connect('/connect4');
        setSocket(newSocket);
        console.log("before emit");
        newSocket.emit("joinGame", gameId);
    
        newSocket.on("gameUpdated", (game) => {
          console.log("got game", game);
          setBoard(game.board);
          setCurrentPlayer(game.currentPlayer);
          setGameState(game.state);
          console.log(game.state);
          console.log(playerSymbolLocal);
          if (game.state === `${playerSymbolLocal}-wins`) {
            winSound.play();
          } else if (game.state === "X-wins" || game.state === "O-wins") {
            wrongSound.play();
          } else {
            basicSound.play();
          }
        });
        newSocket.on("playerSymbol", (symbol) => {
            setPlayerSymbol(symbol);
            playerSymbolLocal = symbol;
        });
    
        return () => newSocket.disconnect();
      }, [gameId]);
    
      useEffect(() => {
        if (!gameId) return;
        // Here you would typically fetch the existing game state from the backend
        // and update your component state accordingly.
        fetch(`/api/connect4/game/${gameId}`)
          .then((response) => response.json())
          .then((game) => {
            if (game.message && game.message === "Game does not exist") {
                setGameState("error");
            } else {
                console.log(game);
                setBoard(game.board);
                setCurrentPlayer(game.currentPlayer);
                setGameState(game.state);    
            }
          })
          .catch((error) => console.error('Error fetching the game:', error));
      }, [gameId]);

      const makeMove = (col) => {
        const newRow = board[col].lastIndexOf(null);
        if (newRow === -1 || gameState !== "ongoing" || currentPlayer !== playerSymbol) return;
        socket.emit("makeMove", gameId, col, playerSymbol);
    };
    return (
        <div className="game-container">

    <h1 className="title">Connect 4 - Hoodies vs Top Hats</h1>
            <p className="game-info">Your Team: {playerSymbol === 'X' ? 'Team Top Hat' : playerSymbol === 'O' ? 'Team Hoodie' : playerSymbol}</p>

            {gameState === "waiting for other player" && (
                <p>Game State: {gameState} 
                
                <button 
                    className="depress-button" 
                    onClick={() => { 
                        const el = document.createElement('textarea');
                        el.value = `${window.location.origin}/connect4/${gameId}`;
                        document.body.appendChild(el);
                        el.select();
                        document.execCommand('copy');
                        document.body.removeChild(el);
                        alert('Game Link saved! Now share it with friends.');
                    }}
                >
                    Copy Game Link to Share
                </button>

                </p>
            )}
            {gameState === "ongoing" && (
                <p>Game State: {currentPlayer === playerSymbol ? 'Your Turn' : "Other Player's Turn"}</p>
            )}
            {gameState === "draw" && <p>Game State: Draw</p>}
            {gameState === "X-wins" && playerSymbol === 'X' && <p>Game State: You Win! </p>}
            {gameState === "X-wins" && playerSymbol === 'O' && <p>Game State: You Lose </p>}
            {gameState === "O-wins" && playerSymbol === 'X' && <p>Game State: You Lose </p>}
            {gameState === "O-wins" && playerSymbol === 'O' && <p>Game State: You Win! </p>}
            
            <div className="grid-container">
                {board.map((column, colIndex) => (
                    <div key={colIndex} className="column" onClick={() => makeMove(colIndex)}>
                        {column.map((cell, rowIndex) => (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className="cell"
                            >
                                {cell === 'X' && <img src="/images/heads/7235.png" alt="Top Hat" className="cell-img" />}
                                {cell === 'O' && <img src="/images/heads/1704.png" alt="Hoodie" className="cell-img" />}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <p>
                <a href="/" className="back-button">
                    Back to Home
                </a>
            </p>
        </div>
    );
    
    
}

export default GameConnect4;

