import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useParams } from 'react-router-dom';
import './GameTicTacToe.css';
import { Howl } from 'howler';

function GameTicTacToe() {
  let { gameId } = useParams();
  const [socket, setSocket] = useState(null);
  const [board, setBoard] = useState([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]);
  const [gameState, setGameState] = useState("waiting for other player");
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3001";
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

    const newSocket = io.connect(SERVER_URL);
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
    fetch(`/api/game/${gameId}`)
      .then((response) => response.json())
      .then((game) => {
        if (game.message && game.message === "Game does not exist") {
            setGameState("error");
        } else {
            setBoard(game.board);
            setCurrentPlayer(game.currentPlayer);
            setGameState(game.state);    
        }
      })
      .catch((error) => console.error('Error fetching the game:', error));
  }, [gameId]);

  const makeMove = (row, col) => {
    console.log("in make move", currentPlayer, playerSymbol);
    if (board[row][col] || gameState !== "ongoing" || currentPlayer !== playerSymbol) return;
    socket.emit("makeMove", gameId, row, col);
  };

  return gameState === "error" ? (
    <div className="game-info">
        <p>An Error Occurred</p>
        <p>
            <a href="/" className="back-button">
                Back to Home
            </a>
        </p>
    </div>
) : (
    <div className="game-container">
        <h1 className="title">Mfer Mfer Toe</h1>
        <p className="game-info">Your Team: {playerSymbol === 'X' ? 'Team Zombie' : playerSymbol === 'O' ? 'Team Ape' : playerSymbol}</p>

        {gameState === "waiting for other player" && (
            <p>Game State: {gameState} 
            
            <button 
                className="depress-button" 
                onClick={() => { 
                    const el = document.createElement('textarea');
                    el.value = `${window.location.origin}/game/${gameId}`;
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
            <div className="grid">
                {board.map((row, rowIndex) =>
                    row.map((cell, cellIndex) => (
                        <div
                            key={`${rowIndex}-${cellIndex}`}
                            className="cell"
                            onClick={() => makeMove(rowIndex, cellIndex)}
                        >
                            {cell === 'X' && <img src="/images/heads/3.png" alt="Zombie" className="cell-img" />}
                            {cell === 'O' && <img src="/images/heads/7146.png" alt="Ape" className="cell-img" />}
                        </div>
                    ))
                )}
            </div>
        </div>
        <p>
            <a href="/" className="back-button">
                Back to Home
            </a>
        </p>
    </div>
)

}

export default GameTicTacToe;
