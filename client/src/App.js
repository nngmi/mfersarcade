import React, { useState, useEffect } from "react";
import io from "socket.io-client";

function App() {
  const [gameId, setGameId] = useState("");
  const [socket, setSocket] = useState(null);
  const [board, setBoard] = useState([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]);
  const [gameState, setGameState] = useState("waiting");
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [playerSymbol, setPlayerSymbol] = useState(null);

  useEffect(() => {
    const newSocket = io.connect("http://localhost:3001");
    setSocket(newSocket);

    newSocket.on("gameUpdated", (game) => {
      setBoard(game.board);
      setCurrentPlayer(game.currentPlayer);
      setGameState(game.state);
    });

    return () => newSocket.disconnect();
  }, []);

  const createGame = () => {
    const id = prompt("Enter game id:");
    if (!id) return;
    setGameId(id);
    setPlayerSymbol("X");
    socket.emit("createGame", id);
  };

  const joinGame = () => {
    const id = prompt("Enter game id:");
    if (!id) return;
    setGameId(id);
    setPlayerSymbol("O");
    socket.emit("joinGame", id);
  };

  const makeMove = (row, col) => {
    if (board[row][col] || gameState !== "ongoing" || currentPlayer !== playerSymbol) return;
    socket.emit("makeMove", gameId, row, col);
  };

  return (
    <div>
      <h1>Tic Tac Toe</h1>
      <p>Game State: {gameState}</p>
      <p>Current Player: {currentPlayer}</p>
      <p>Your Symbol: {playerSymbol}</p>
      <div>
        <button onClick={createGame}>Create Game</button>
        <button onClick={joinGame}>Join Game</button>
      </div>
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

export default App;
