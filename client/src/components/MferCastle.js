import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useParams } from 'react-router-dom';
import './MferCastle.css';
import { Howl } from 'howler';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; 
import { ToastContainer } from 'react-toastify';
import { Card, CardBack } from './Card';

function MferCastle() {
  let { gameId } = useParams();
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState("waiting for other player");
  const [game, setGame] = useState(null);
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
  const PlayerHand = ({ game, playerSymbol }) => {
    if (!playerSymbol) return;

    const playerHand = game.hands[playerSymbol] || {};
    console.log(playerHand);
    const { cards = [], count = 0 } = playerHand;

    return (
      <div className="hand game-info">
        <div className="count">
          {count > 0 ? `Your Hand Count: ${count}` : "Your Hand is Empty"}
        </div>
        <div className="cards-container">
          {cards.map((card, index) => (
            <Card card={card}/>
          ))}
        </div>
      </div>
    );
    
  }
  const PlayerDeck = ({ game, playerSymbol }) => {
    if (!playerSymbol) return;

    const playerDeck = game.decks[playerSymbol] || {};
    console.log(playerDeck);
    const { cards = [], count = 0 } = playerDeck;

    return (
      <div className="hand game-info">
        <div className="count">Your Deck: {count} Cards</div>
        <CardBack/>
      </div>
    );
  }

  const OtherPlayerHand = ({ game, playerSymbol }) => {
    if (!playerSymbol) return null;
  
    const playerHand = game.hands[playerSymbol] || {};
    console.log(playerHand);
    const { count = 0 } = playerHand;
  
    return (
      <div className="hand game-info">
        <div className="count">
          {count > 0 ? `Opponent Hand Count: ${count} Cards` : "Opponent Hand Empty"}
        </div>
        <div className="cards-container">
          {Array.from({ length: count }).map((_, index) => (
            <CardBack/>
          ))}
        </div>
      </div>
    );    
  };
  const OtherPlayerDeck = ({ game, playerSymbol }) => {
    if (!playerSymbol) return null;
  
    const playerDeck = game.decks[playerSymbol] || {};
    const { count = 0 } = playerDeck;
  
    return (
      <div className="other-deck hand game-info">
        <div className="count">Opponent Deck: {count} Cards</div>
        <CardBack/>
      </div>
    );
  };
    


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

  const makeMove = (moveType) => {
    console.log("in make move", currentPlayer, playerSymbol);
    socket.emit("makeMove", gameId, moveType);
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
            <p>Game State: {currentPlayer === playerSymbol ? 'Your Turn' : "Other Player's Turn"}</p>
        )}
        {gameState === "draw" && <p>Game State: Draw</p>}
        {gameState === "X-wins" && playerSymbol === 'X' && <p>Game State: You Win! </p>}
        {gameState === "X-wins" && playerSymbol === 'O' && <p>Game State: You Lose </p>}
        {gameState === "O-wins" && playerSymbol === 'X' && <p>Game State: You Lose </p>}
        {gameState === "O-wins" && playerSymbol === 'O' && <p>Game State: You Win! </p>}
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
        <div className="player-area">
          <OtherPlayerHand game={game} playerSymbol={playerSymbol ? (playerSymbol === 'X' ? 'O' : 'X') : null} />
          <OtherPlayerDeck game={game} playerSymbol={playerSymbol ? (playerSymbol === 'X' ? 'O' : 'X') : null} />
        </div>
        <div className="player-area">
            <PlayerHand game={game} playerSymbol={playerSymbol}/>
            <PlayerDeck game={game} playerSymbol={playerSymbol}/>
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
        </div>
        )}
    </div>
)

}

export default MferCastle;
