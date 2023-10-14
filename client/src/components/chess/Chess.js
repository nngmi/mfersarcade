import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useParams } from 'react-router-dom';
import { Howl } from 'howler';
import './Chess.css';
import { ToastContainer } from 'react-toastify';
import { toast } from 'react-toastify';
import PlayerTimer from './PlayerTimer';
import Cookies from 'js-cookie';

function GameInfoComponent({gameState, players}) {
    // Calculate the number of disconnected players
    const disconnectedPlayersCount = players.filter(player => player.disconnected).length;
    const connectedPlayersCount = players.length - disconnectedPlayersCount;

    // Convert the gameState if it ends with '-wins'
    if (gameState.endsWith('-wins')) {
        const winnerColor = gameState === "player0-wins" ? "white" : "black";
        return (
            <p>
                <span>{winnerColor} wins</span>
            </p>
        );
    }

    return (
        <p>
            <span>
                {gameState} ({connectedPlayersCount} players connected
                {disconnectedPlayersCount > 0 ? `, ${disconnectedPlayersCount} players disconnected` : ""})
            </span>
        </p>
    );
}

function GameChess() {
    let { gameId } = useParams();
    const [socket, setSocket] = useState(null);
    const [game, setGame] = useState('');
    //const [board, setBoard] = useState(() => Array(8).fill(0).map(row => Array(8).fill(null)));
    const [gameState, setGameState] = useState("viewing");
    const [playerId, setPlayerId] = useState(null);
    const [joinKey, setJoinKey] = useState(null);
    const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3001";
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [ableToJoin, setAbleToJoin] = useState(false);
    const [joined, setJoined] = useState(false);

    const makeMove = (fromSquare, toSquare) => {
        if (gameState !== "ongoing" || game.currentPlayer !== playerId) return;
        const from = toAlgebraicNotation(fromSquare.row, fromSquare.col);
        const to = toAlgebraicNotation(toSquare.row, toSquare.col);
        socket.emit("makeMove", gameId, { from, to });
    };
    const getPlayerColor = (game, playerId) => {
        const player = game.players.find(p => p.id === playerId);
        return player ? player.color : null; // Returns null if the player isn't found.
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
        'b-white': '/images/chess/1951.png',
        'r-white': '/images/chess/2132.png',
        'q-white': '/images/chess/2670.png',
        'k-white': '/images/chess/3787.png',
        'p-black': '/images/chess/4770.png',
        'n-black': '/images/chess/8161.png',
        'b-black': '/images/chess/2116.png',
        'r-black': '/images/chess/1046.png',
        'q-black': '/images/chess/7791.png',
        'k-black': '/images/chess/931.png',
    }

    const toAlgebraicNotation = (row, col) => {
        const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const playerColor = getPlayerColor(game, playerId); // Assuming you have access to game and playerId in this context.
        
        return playerColor === 'white' ? 
               `${columns[col]}${8 - row}` : 
               `${columns[col]}${row + 1}`;
    };    
    
    const handleSquareClick = (rowIndex, cellIndex) => {
        const actualRow = getPlayerColor(game, playerId) === 'black' ? 7 - rowIndex : rowIndex;
        const selectedPiece = game.board[actualRow][cellIndex];
        console.log("clicking on ", actualRow, cellIndex, selectedPiece);
    
        // If a piece is already selected
        if (selectedSquare) {
            // Execute the move if it's valid (You can add more validation checks here)
            makeMove(selectedSquare, { row: rowIndex, col: cellIndex });
            setSelectedSquare(null);
        } else if (selectedPiece && ((selectedPiece === selectedPiece.toUpperCase() && getPlayerColor(game, playerId) === 'white') || (selectedPiece !== selectedPiece.toUpperCase() && getPlayerColor(game, playerId) === 'black'))) {
            console.log("setting selected piece to ", rowIndex, cellIndex);
            setSelectedSquare({ row: rowIndex, col: cellIndex });

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
        console.log("starting socket");
    
        const newSocket = io.connect(SERVER_URL + '/chess', {
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: 10,
            randomizationFactor: 0.5
        });
    
        setSocket(newSocket);
    
        newSocket.emit("viewGame", gameId);
    
        const joinedListener = (receivedPlayerId) => {
            console.log("successfully joined game as ", receivedPlayerId);
            basicSound.play();
            setPlayerId(receivedPlayerId);
    
            const gameUpdatedListener = (game) => {
                console.log("game updated");
                setGameState(game.state);
                setGame(game);
    
                if (game.state === `${receivedPlayerId}-wins`) {
                    winSound.play();
                } else if (game.state.includes("-wins") && game.state !== `${receivedPlayerId}-wins`) {
                    wrongSound.play();
                }
    
                if (!joined && game.players.length < 2) {
                    setAbleToJoin(true);
                } else {
                    setAbleToJoin(false);
                }
    
                let currentPlayerDetails = game.players.find(p => p.id === receivedPlayerId);
    
                if (currentPlayerDetails) {
                    const cookieKey = `JoinKey-${gameId}`;
                    const cookieValue = {
                        joinKey: currentPlayerDetails.joinKey,
                        color: currentPlayerDetails.color
                    };
    
                    console.log("Stored the joinKey and color", cookieKey, cookieValue);
                    Cookies.set(cookieKey, JSON.stringify(cookieValue));
                    setJoinKey(currentPlayerDetails.joinKey);
                }
            };
    
            const notifyListener = (text) => {
                basicSound.play();
                toast.success(text);
            };
    
            const errorListener = (text) => {
                wrongSound.play();
                toast.error(text);
            };
    
            newSocket.on("gameUpdated", gameUpdatedListener);
            newSocket.on("notify", notifyListener);
            newSocket.on("error", errorListener);
    
            return () => {
                newSocket.off("gameUpdated", gameUpdatedListener);
                newSocket.off("notify", notifyListener);
                newSocket.off("error", errorListener);
            };
        };
    
        newSocket.on("joined", joinedListener);
    
        return () => {
            newSocket.off("joined", joinedListener);
            setJoined(false);
            newSocket.disconnect();
        };
    }, [gameId]);
    

    useEffect(() => {
        if (!gameId || !game || game.state !== "ongoing") return;
    
        const timeCheckInterval = setInterval(() => {
            socket.emit("checkTime", gameId);
        }, 1000);  // for example, every 1 second.
    
        return () => {
            clearInterval(timeCheckInterval);
        };
    }, [gameId, game]);

    useEffect(() => {
        if (!gameId) return;

        
        const storedDetails = Cookies.get(`JoinKey-${gameId}`);
    
        let storedJoinKey, storedColor;
        if (storedDetails) {
            const { joinKey, color } = JSON.parse(storedDetails);
            storedJoinKey = joinKey;
            storedColor = color;
            setJoinKey(joinKey);
        } 
        console.log("Read key", storedJoinKey, storedColor);
    
        fetch(`/api/chess/game/${gameId}`)
            .then(response => response.json())
            .then(game => {
                if (game.message && game.message === "Game does not exist") {
                    setGameState("error");
                } else {
                    // setBoard(game.board);
                    // setCurrentPlayer(game.currentPlayer);
                    setGameState(game.state);
                    setGame(game);
    
                    if (game.players.length < 2) {
                        setAbleToJoin(true);
                    } else if (joinKey) {
                        const matchingPlayer = game.players.find(player => 
                            player.joinKey === joinKey
                        );
    
                        if (matchingPlayer) {
                            setAbleToJoin(true);
                        } else {
                            setAbleToJoin(false);
                        }
                    }
                }
            })
            .catch(error => console.error('Error fetching the game:', error));
    }, [gameId]);
    
    
    
    function displayGameStatus(gameState, currentPlayer, playerId, joined) {
        if (gameState === "ongoing") {
            const whitePlayer = game.players.find(p => p.color === 'white');
            const blackPlayer = game.players.find(p => p.color === 'black');
    
            if (joined) {
                return (
                    <>
                        <p>Turn: {currentPlayer === playerId ? `Your (${getPlayerColor(game, playerId)}) Turn` : `Opponent's Turn`}
                            <button 
                                onClick={() => {
                                    socket.emit("resign", gameId);
                                }}
                                disabled={currentPlayer !== playerId}  // Button is disabled if it's not the player's turn
                            >
                                Resign
                            </button>
                        </p>
                        <div>
                            <PlayerTimer player={whitePlayer} isPlayerTurn={getPlayerColor(game, game.currentPlayer) === 'white'} />
                            <PlayerTimer player={blackPlayer} isPlayerTurn={getPlayerColor(game, game.currentPlayer) === 'black'} />
                        </div>
                    </>
                );
            } else {
                return <p>Turn: {getPlayerColor(game, game.currentPlayer)} Turn</p>;
            }            
        } else if (gameState.includes("-wins")) {
            if (joined) {
                const winningPlayerIndex = gameState === "player0-wins" ? 0 : 1;
                const currentPlayerIndex = game.players.findIndex(player => player.id === playerId);
        
                if (winningPlayerIndex === currentPlayerIndex) {
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
            {gameState === "error" ? (
                // Render only when there's an error
                <>
                    <h2>Mfer Chess {game.gameName}</h2>
                    <p>
                        <span>Game Not Found!</span>
                    </p>
                    <ToastContainer />
                    <p>
                        <a href="/" className="back-button">
                            Back to Home
                        </a>
                    </p>
                </>
            ) : !game ? (
                // Render "Loading" modal if game is null or undefined
                <div className="loading-modal">
                    Loading...
                </div>
            ) : (
                // Render when there's no error
                <>
                    <div>
                        <h2>Mfer Chess: {game.gameName}</h2>
                        <GameInfoComponent gameState={gameState} players={game.players}/>
                        {joined === false && ableToJoin === true && (
                            <button onClick={() => {
                                socket.emit("joinGame", gameId, joinKey);
                                setJoined(true);
                            }}>
                                {joinKey ? "Rejoin" : "Join Game"}
                            </button>
                        )}
    
                        {gameState === "waiting for players" && (
                            <p>
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
                        {displayGameStatus(gameState, game.currentPlayer, playerId, joined)}
                    </div>
                    <div className="chess-container">
                        <div className="row-labels">
                            {(getPlayerColor(game, playerId) === 'black' ? [' ', '1', '2', '3', '4', '5', '6', '7', '8'] : [' ', '8', '7', '6', '5', '4', '3', '2', '1']).map(label => (
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
                                {(getPlayerColor(game, playerId) === 'black' ? game.board.slice().reverse() : game.board).map((row, rowIndex) => (
                                    row.map((cell, cellIndex) => {
                                        const isDarkSquare = getPlayerColor(game, playerId) === 'white'
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
                    <ToastContainer />
                    <p>
                        <a href="/" className="back-button">
                            Back to Home
                        </a>
                    </p>
                </>
            )}
        </div>
    );
    
}

export default GameChess;
