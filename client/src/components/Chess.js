import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useParams } from 'react-router-dom';
import './Chess.css'; // You should have a similar CSS for Chess
import { Howl } from 'howler';

function GameChess() {
    let { gameId } = useParams();
    const [socket, setSocket] = useState(null);
    const [board, setBoard] = useState(() => Array(8).fill(0).map(row => Array(8).fill(null)));
    const [gameState, setGameState] = useState("waiting for other player");
    const [currentPlayer, setCurrentPlayer] = useState("white");
    const [playerColor, setPlayerColor] = useState(null);
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
        let playerColorLocal = null;
        console.log("starting socket");
    
        const newSocket = io.connect(SERVER_URL + '/chess'); // Updated the namespace to 'chess'
        setSocket(newSocket);
    
        newSocket.emit("joinGame", gameId);
        console.log("emit joinGame");
        newSocket.on("gameUpdated", (game) => {
            console.log("got game", game);
            setBoard(game.board);
            setCurrentPlayer(game.currentPlayer);
            setGameState(game.state);
            if (game.state === `${playerColorLocal}-wins`) {
                winSound.play();
            } else if (game.state.includes("-wins") && game.state !== `${playerColorLocal}-wins`) {
                wrongSound.play();
            } else {
                basicSound.play();
            }
        });
    
        newSocket.on("playerColor", (color) => {  // Replaced 'playerSymbol' with 'playerColor'
            setPlayerColor(color);   // Updated to set the player's color
            playerColorLocal = color;
        });
    
        return () => newSocket.disconnect();
    }, [gameId]);
    
    useEffect(() => {
        console.log("at beginning of useefect");
        if (!gameId) return;
        fetch(`/api/chess/game/${gameId}`) // Updated the endpoint to 'chess'
            .then((response) => {console.log(response); response.json();})
            .then((game) => {
                console.log("at beginning of game");
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
    
    const makeMove = (fromSquare, toSquare) => { // For chess, we'll be dealing with two squares: the source and destination
        if (gameState !== "ongoing" || currentPlayer !== playerColor) return;
        socket.emit("makeMove", gameId, fromSquare, toSquare, playerColor);
    };    

    return (
        <div className="game-container">

            <h1 className="title">Chess - Challenge Your Mind</h1>
            <p className="game-info">You play as: {playerColor}</p>

            {gameState === "waiting for other player" && (
                <p>Game State: {gameState} 
                
                <button 
                    className="depress-button" 
                    onClick={() => { 
                        const el = document.createElement('textarea');
                        el.value = `${window.location.origin}/chess/${gameId}`;
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
                <p>Game State: {currentPlayer === playerColor ? 'Your Turn' : "Opponent's Turn"}</p>
            )}
            
            <div className="chessboard">
                {board.map((row, rowIndex) => (
                    row.map((cell, cellIndex) => (
                        <div
                            key={`${rowIndex}-${cellIndex}`}
                            className="square"
                        >
                            {cell && <img src={`/images/chess/${cell}.png`} alt={cell} className="piece-img" />}
                        </div>
                    ))
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

export default GameChess;
