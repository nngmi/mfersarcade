import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useParams } from 'react-router-dom';
import './MferCastle.css';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; 
import { ToastContainer } from 'react-toastify';
import { PlayerGraveyard, PlayerDeck, PlayerHand, OtherPlayerHand, OtherPlayerDeck, StateArea } from './PlayAreas';
import { basicSound, winSound, wrongSound } from './Sounds';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';

function MferCastle() {
  let { gameId } = useParams();
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState("waiting for other player");
  const [game, setGame] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3001";

  useEffect(() => {
    if (!gameId) return;
    let playerSymbolLocal = null;

    const newSocket = io.connect(SERVER_URL + '/mfercastle');
    setSocket(newSocket);
    console.log("before emit");
    newSocket.emit("joinGame", gameId);

    newSocket.on("gameUpdated", (game) => {
      console.log("got game", game);
      setCurrentPlayer(game.currentPlayer);
      setGameState(game.state);
      setGame(game);
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
    newSocket.on("error", (error) => {
      toast.error(error);
    });
    newSocket.on("notify", (info) => {
      toast.info(info);
    });

    return () => newSocket.disconnect();
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;
    // Here you would typically fetch the existing game state from the backend
    // and update your component state accordingly.
    fetch(`/api/mfercastle/game/${gameId}`)
      .then((response) => response.json())
      .then((game) => {
        if (game.message && game.message === "Game does not exist") {
            setGameState("error");
        } else {
            setCurrentPlayer(game.currentPlayer);
            setGameState(game.state); 
            setGame(game);   
        }
      })
      .catch((error) => console.error('Error fetching the game:', error));
  }, [gameId]);

  const makeMove = (moveType, moveDetails) => {
    console.log("in make move", currentPlayer, playerSymbol);
    socket.emit("makeMove", gameId, moveType, moveDetails);
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
        <h1 className="title">Mfer Castle</h1>
        {gameState === "ongoing" && (
          <StateArea game={game} playerSymbol={playerSymbol} currentPlayer={currentPlayer}/>
        )}
        {gameState === "waiting for other player" ? (
            <div>
            <p>Waiting for Another Player to Start Game... </p> 
            
            <button 
                className="depress-button" 
                onClick={() => { 
                    const el = document.createElement('textarea');
                    el.value = `${window.location.origin}/mfercastle/${gameId}`;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    alert('Game Link saved! Now share it with friends.');
                }}
            >
                Copy Game Link to Share
            </button>
            </div>
        ) : (
      <div className="game-board">
        <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>

        <div className="player-area">
          <OtherPlayerHand game={game} playerSymbol={playerSymbol ? (playerSymbol === 'X' ? 'O' : 'X') : null} />
          <OtherPlayerDeck game={game} playerSymbol={playerSymbol ? (playerSymbol === 'X' ? 'O' : 'X') : null} />
          <PlayerGraveyard game={game} playerSymbol={playerSymbol ? (playerSymbol === 'X' ? 'O' : 'X') : null} isOpponent={true} makeMove={makeMove} />
        </div>
        <div className="player-area">
            <PlayerHand game={game} playerSymbol={playerSymbol}/>
            <PlayerDeck game={game} playerSymbol={playerSymbol}/>
            <PlayerGraveyard game={game} playerSymbol={playerSymbol} isOpponent={false} makeMove={makeMove}/>
        </div>
        <div className="player-action-area">
            <button 
                onClick={() => makeMove("draw")}
                disabled={currentPlayer !== playerSymbol || gameState !== "ongoing"}
            >
                Draw Card
            </button>
            <button 
                onClick={() => makeMove("yield")}
                disabled={currentPlayer !== playerSymbol || gameState !== "ongoing"}
            >
                Yield Turn
            </button>
        </div>
          
        <p>
            <a href="/" className="back-button">
                Back to Home
            </a>
        </p>
        <ToastContainer />
        </DndProvider>
        </div>
        )}
      
    </div>
)

}

export default MferCastle;
