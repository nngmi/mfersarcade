import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useParams } from 'react-router-dom';
import { Howl } from 'howler';
import './Chess.css';

function GameChess() {
    let { gameId } = useParams();
    const [socket, setSocket] = useState(null);
    const [board, setBoard] = useState(() => Array(8).fill(0).map(row => Array(8).fill(null)));
    const [gameState, setGameState] = useState("viewing");
    const [currentPlayer, setCurrentPlayer] = useState("white");
    const [playerColor, setPlayerColor] = useState(null);
    const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3001";
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [ableToJoin, setAbleToJoin] = useState(false);
    const [joined, setJoined] = useState(false);
    const [players, setPlayers] = useState([]);

    const makeMove = (fromSquare, toSquare) => {
        if (gameState !== "ongoing" || currentPlayer !== playerColor) return;
        const from = toAlgebraicNotation(fromSquare.row, fromSquare.col);
        const to = toAlgebraicNotation(toSquare.row, toSquare.col);
        socket.emit("makeMove", gameId, { from, to });
    };

    const pieceLegend = [
        { name: 'Pawn', notation: 'p',  },
        { name: 'Knight', notation: 'n' },
        { name: 'Bishop', notation: 'b' },
        { name: 'Rook', notation: 'r' },
        { name: 'Queen', notation: 'q' },
        { name: 'King', notation: 'k' },
    ];

    const graphics = {
        'p-white': '/images/chess/5666.png',
        'n-white': '/images/chess/3432.png',
        'b-white': '/images/chess/2151.png',
        'r-white': '/images/chess/2132.png',
        'q-white': '/images/chess/2670.png',
        'k-white': '/images/chess/3787.png',
        'p-black': '/images/chess/4770.png',
        'n-black': '/images/chess/8161.png',
        'b-black': '/images/chess/4031.png',
        'r-black': '/images/chess/1046.png',
        'q-black': '/images/chess/7791.png',
        'k-black': '/images/chess/931.png',
    }

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
    
        newSocket.emit("viewGame", gameId);

        newSocket.on("gameUpdated", (game) => {
            console.log("got game", game);
            setBoard(game.board);
            setCurrentPlayer(game.currentPlayer);
            setGameState(game.state);
            console.log(game.players);
            setPlayers(game.players);
            if (game.state === `${playerColorLocal}-wins`) {
                winSound.play();
            } else if (game.state.includes("-wins") && game.state !== `${playerColorLocal}-wins`) {
                wrongSound.play();
            } else {
                basicSound.play();
            }
            if (!joined && game.players.length < 2) {
                // User can join the game
                setAbleToJoin(true);
            } else {
                setAbleToJoin(false);
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
            .then((response) => {console.log(response); return response.json();})
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
                    setPlayers(game.players);
                    if (game.players.length < 2) {
                        setAbleToJoin(true);
                    }
                }
            })
            .catch((error) => console.error('Error fetching the game:', error));
    }, [gameId]);
    
    function displayGameStatus(gameState, currentPlayer, playerColor, joined) {
        if (gameState === "ongoing") {
            if (joined) {  // Explicitly checks if the user has joined
                return (
                    <>
                        <p>Turn: {currentPlayer === playerColor ? `Your (${playerColor}) Turn` : `Opponent's (${currentPlayer}) Turn`}
                            <button 
                                onClick={() => {
                                    socket.emit("resign", gameId);
                                }}
                                disabled={currentPlayer !== playerColor}  // Button is disabled if it's not the player's turn
                            >
                                Resign
                            </button>
                        </p>
                    </>
                );
            } else {
                return <p>Turn: {currentPlayer} Turn</p>;
            }            
        } else if (gameState.includes("-wins")) {
            if (joined) {
                if (gameState === `${playerColor}-wins`) {
                    return <p>You Win!</p>;
                } else {
                    return <p>You Lose!</p>;
                }
            }
        }
        return null; // Default return for all other cases
    }

    return (
        <div className="game-container">
                <div>
                <h2>Mfer Chess</h2>
                <p>
                    <span>Game State: {gameState} ({players.length} in game)</span>
                </p>
                {joined === false && ableToJoin === true && (
                    <button onClick={() => {
                        socket.emit("joinGame", gameId);
                        setJoined(true);
                    }}>
                        Join Game
                    </button>
                )}

                {gameState === "waiting for players" && joined === true && (
                    <p>You have joined but waiting for other player.
                    
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
                {displayGameStatus(gameState, currentPlayer, playerColor, joined)}
             </div>
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
                                                src={graphics[`${cell.toLowerCase()}-${cell === cell.toUpperCase() ? 'white' : 'black'}`]}
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
                                    <img src={graphics[`${piece.notation}-white`]} alt={`${piece.name} White`} />
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {pieceLegend.map(piece => (
                                <th key={piece.name + '-black'}>
                                    <img src={graphics[`${piece.notation}-black`]} alt={`${piece.name} Black`} />
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
