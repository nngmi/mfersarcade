import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useParams } from 'react-router-dom';

function GameTicTacToe() {
  let { gameId } = useParams();
  const [socket, setSocket] = useState(null);
  const [board, setBoard] = useState([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]);
  const [gameState, setGameState] = useState("waiting");
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
        setBoard(game.board);
        setCurrentPlayer(game.currentPlayer);
        setGameState(game.state);
      })
      .catch((error) => console.error('Error fetching the game:', error));
  }, [gameId]);

  const makeMove = (row, col) => {
    console.log("in make move", currentPlayer, playerSymbol);
    if (board[row][col] || gameState !== "ongoing" || currentPlayer !== playerSymbol) return;
    socket.emit("makeMove", gameId, row, col);
  };

  return (
    <div>
      <h1>Tic Tac Toe</h1>
      <p>Game ID: {gameId}</p>
      <p>Game State: {gameState}</p>
      <p>Current Player: {currentPlayer}</p>
      <p>Your Symbol: {playerSymbol}</p>
      <div style={{ display: "grid", gridTemplate: "repeat(3, 1fr) / repeat(3, 1fr)" }}>
        {board.map((row, rowIndex) =>
          row.map((cell, cellIndex) => (
            <div
              key={`${rowIndex}-${cellIndex}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "60px",
                height: "60px",
                border: "1px solid #000",
                cursor: "pointer",
              }}
              onClick={() => makeMove(rowIndex, cellIndex)}
            >
              {cell}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default GameTicTacToe;
