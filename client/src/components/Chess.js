import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useParams } from 'react-router-dom';
import { Howl } from 'howler';
import './Chess.css';

function GameChess() {
    let { gameId } = useParams();
    const [socket, setSocket] = useState(null);
    const [board, setBoard] = useState(() => Array(8).fill(0).map(row => Array(8).fill(null)));
    const [gameState, setGameState] = useState("waiting for other player");
    const [currentPlayer, setCurrentPlayer] = useState("white");
    const [playerColor, setPlayerColor] = useState(null);
    const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3001";
    const [selectedSquare, setSelectedSquare] = useState(null);

    const makeMove = (fromSquare, toSquare) => {
        if (gameState !== "ongoing" || currentPlayer !== playerColor) return;
        const from = toAlgebraicNotation(fromSquare.row, fromSquare.col);
        const to = toAlgebraicNotation(toSquare.row, toSquare.col);
        socket.emit("makeMove", gameId, { from, to });
    };

    const pieceLegend = [
        { name: 'Pawn', notation: 'p' },
        { name: 'Knight', notation: 'n' },
        { name: 'Bishop', notation: 'b' },
        { name: 'Rook', notation: 'r' },
        { name: 'Queen', notation: 'q' },
        { name: 'King', notation: 'k' },
    ];

    const toAlgebraicNotation = (row, col) => {
        const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        return playerColor === 'white' ? 
               `${columns[col]}${8 - row}` : 
               `${columns[col]}${row + 1}`;
    };
    
    const handleSquareClick = (rowIndex, cellIndex) => {
        const actualRow = playerColor === 'black' ? 7 - rowIndex : rowIndex;
        const selectedPiece = board[actualRow][cellIndex];
        console.log("clicking on ", actualRow, cellIndex, selectedPiece);
    
        // If a piece is already selected
        if (selectedSquare) {
            // Execute the move if it's valid (You can add more validation checks here)
            makeMove(selectedSquare, { row: rowIndex, col: cellIndex });
            setSelectedSquare(null);
        } else if (selectedPiece && ((selectedPiece === selectedPiece.toUpperCase() && playerColor === 'white') || (selectedPiece !== selectedPiece.toUpperCase() && playerColor === 'black'))) {
            console.log("setting selected piece to ", rowIndex, cellIndex);
            setSelectedSquare({ row: rowIndex, col: cellIndex });
            
            // Compute valid moves for the selected piece (Placeholder for now)
            // setValidMoves(computeValidMoves(selectedPiece, actualRow, cellIndex));
        }
    };
    

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
                console.log(game);
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
    


    return (
        <div className="game-container">

            <h1 className="title">Mfer Chess</h1>
            <p className="game-info">You play as: {playerColor}</p>

            {gameState === "waiting for other player" && (
                <p>Game State: {gameState} 
                
                <button 
                    className="depress-button" 
                    onClick={() => { 
                        const el = document.createElement('textarea');
                        el.value = `${window.location.origin}/mferchess/${gameId}`;
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
            {
                gameState === "ongoing" && (
                    <p>Game State: {currentPlayer === playerColor ? 'Your Turn' : "Opponent's Turn"}</p>
                )
            }
            {
                (gameState === "white-wins" && playerColor === "white") && (
                    <p>You Win!</p>
                )
            }
            {
                (gameState === "black-wins" && playerColor === "black") && (
                    <p>You Win!</p>
                )
            }
            {
                (gameState === "white-wins" && playerColor === "black") && (
                    <p>You Lose!</p>
                )
            }
            {
                (gameState === "black-wins" && playerColor === "white") && (
                    <p>You Lose!</p>
                )
            }
            <div className="chess-container">
                <div className="row-labels">
                    {(playerColor === 'black' ? [' ', '1', '2', '3', '4', '5', '6', '7', '8'] : [' ', '8', '7', '6', '5', '4', '3', '2', '1']).map(label => (
                        <div key={label} className="row-label">{label}</div>
                    ))}
                </div>
                <div className="chessboard-wrapper">
                    <div className="column-labels">
                        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(label => (
                            <div key={label} className="column-label">{label}</div>
                        ))}
                    </div>
                    <div className="chessboard">
                        {(playerColor === 'black' ? board.slice().reverse() : board).map((row, rowIndex) => (
                            row.map((cell, cellIndex) => {
                                // If player is white, then the normal board orientation is used
                                // If player is black, then reverse the board orientation
                                const isDarkSquare = playerColor === 'white'
                                    ? (rowIndex + cellIndex) % 2 !== 0
                                    : (rowIndex + cellIndex) % 2 === 0;

                                return (
                                    <div
                                        key={`${rowIndex}-${cellIndex}`}
                                        className={`
                                            square 
                                            ${isDarkSquare ? 'black-square' : 'white-square'}
                                            ${selectedSquare && selectedSquare.row === rowIndex && selectedSquare.col === cellIndex ? 'selected' : ''}
                                        `}
                                        onClick={() => handleSquareClick(rowIndex, cellIndex)}
                                    >
                                        {cell && (
                                            <img
                                                src={`/images/chess/${cell.toLowerCase()}-${cell === cell.toUpperCase() ? 'white' : 'black'}.png`}
                                                alt={cell}
                                                className="piece-img"
                                            />
                                        )}
                                    </div>
                                );
                            })
                        ))}
                    </div>


                </div>
            </div>
            <div className="legend-section">
                <h2 className="legend-title">Legend</h2>
                <table className="legend-table">
                    <thead>
                        <tr>
                            {pieceLegend.map(piece => (
                                <th key={piece.name}>{piece.name}</th>
                            ))}
                        </tr>
                        <tr>
                            {pieceLegend.map(piece => (
                                <th key={piece.name + '-white'}>
                                    <img src={`/images/chess/${piece.notation}-white.png`} alt={`${piece.name} White`} />
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {pieceLegend.map(piece => (
                                <th key={piece.name + '-black'}>
                                    <img src={`/images/chess/${piece.notation}-black.png`} alt={`${piece.name} Black`} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                </table>
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
