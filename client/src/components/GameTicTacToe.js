import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useParams } from 'react-router-dom';
import './GameTicTacToe.css';

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

  useEffect(() => {
    if (!gameId) return;

    const newSocket = io.connect(SERVER_URL);
    setSocket(newSocket);
    console.log("before emit");
    newSocket.emit("joinGame", gameId);

    newSocket.on("gameUpdated", (game) => {
      console.log("got game", game);
      setBoard(game.board);
      setCurrentPlayer(game.currentPlayer);
      setGameState(game.state);
    });
    newSocket.on("playerSymbol", (symbol) => {
        setPlayerSymbol(symbol);
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
            <p>Game State: {gameState} <button onClick={() => navigator.clipboard.writeText(window.location.href)}>Copy Game Link to Share</button></p>
        )}
        {gameState === "ongoing" && (
            <p>Game State: {currentPlayer === playerSymbol ? 'Your Turn' : "Other Player's Turn"}</p>
        )}
        {gameState === "ended" && <p>Game State: Ended</p>}
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
                            {cell === 'O' && <img src="/images/heads/357.png" alt="Ape" className="cell-img" />}
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
