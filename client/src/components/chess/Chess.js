// External Libraries
import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { Howl } from 'howler';
import Cookies from 'js-cookie';
import { ToastContainer, toast } from 'react-toastify';

// React Router
import { useParams, useNavigate } from 'react-router-dom';

// Components
import ChessContainer from './ChessContainer';
import CapturedPieces from './CapturedPieces';
import GameInfoComponent from './GameInfoComponent';
import Legend from './Legend';

// Utilities/Helpers
import { pieceLegend, getPlayerColor, ChessColor } from './ChessLib';

// Assets/Styles
import './Chess.css';

function GameChess() {

    const navigate = useNavigate();
    const navigateToHome = () => {
        navigate("/mferchess");
    };

    let { gameId } = useParams();
    const [socket, setSocket] = useState(null);
    const [game, setGame] = useState('');
    //const [board, setBoard] = useState(() => Array(8).fill(0).map(row => Array(8).fill(null)));
    const [gameState, setGameState] = useState("viewing");
    const [playerId, setPlayerId] = useState(null);
    const [joinKey, setJoinKey] = useState(null);
    const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3001";
    const [ableToJoin, setAbleToJoin] = useState(false);
    const [joined, setJoined] = useState(false);

    const makeMove = (fromSquare, toSquare) => {
        if (gameState !== "ongoing" || game.currentPlayer !== playerId) return;
        const from = toAlgebraicNotation(fromSquare.row, fromSquare.col);
        const to = toAlgebraicNotation(toSquare.row, toSquare.col);
        socket.emit("makeMove", gameId, { from, to });
    };



    const toAlgebraicNotation = (row, col) => {
        const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const playerColor = getPlayerColor(game, playerId); // Assuming you have access to game and playerId in this context.

        return playerColor === ChessColor.WHITE ?
            `${columns[col]}${8 - row}` :
            `${columns[col]}${row + 1}`;
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

        const disconnectListener = () => {
            console.log("Socket disconnected, refresh page");
            window.location.reload();
        };

        newSocket.on("disconnect", disconnectListener);

        const gameUpdatedListenerBasic = (game) => {
            console.log("game updated");
            setGameState(game.state);
            setGame(game);
        };

        const notifyListener = (text) => {
            basicSound.play();
            toast.success(text);
        };

        const errorListener = (text) => {
            wrongSound.play();
            toast.error(text);
        };

        newSocket.on("gameUpdated", gameUpdatedListenerBasic);
        newSocket.on("notify", notifyListener);
        newSocket.on("error", errorListener);

        const joinedListener = (receivedPlayerId) => {
            console.log("successfully joined game as ", receivedPlayerId);
            basicSound.play();
            setPlayerId(receivedPlayerId);

            const gameUpdatedListener = (game) => {


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
                console.log(currentPlayerDetails);

                if (currentPlayerDetails) {
                    const cookieKey = `JoinKey-${gameId}`;
                    const cookieValue = {
                        joinKey: currentPlayerDetails.joinKey,
                        color: currentPlayerDetails.color
                    };

                    console.log("Stored the joinKey and color", cookieKey, cookieValue);
                    Cookies.set(cookieKey, JSON.stringify(cookieValue));
                }
            };

            newSocket.on("gameUpdated", gameUpdatedListener);


            return () => {
                newSocket.off("gameUpdated", gameUpdatedListener);
            };
        };

        newSocket.on("joined", joinedListener);

        return () => {
            newSocket.off("joined", joinedListener);
            newSocket.off("gameUpdated", gameUpdatedListenerBasic);
            newSocket.off("notify", notifyListener);
            newSocket.off("error", errorListener);
            newSocket.off("disconnect", disconnectListener);
            newSocket.disconnect();
        };
    }, [gameId]);


    useEffect(() => {
        if (!gameId || !game || game.state !== "ongoing") return;

        const timeCheckInterval = setInterval(() => {
            socket.emit("checkTime", gameId);
        }, 3000);

        return () => {
            clearInterval(timeCheckInterval);
        };
    }, [gameId, game]);

    useEffect(() => {
        if (!gameId) return;


        const storedDetails = Cookies.get(`JoinKey-${gameId}`);

        let storedJoinKey, storedColor;
        console.log("storedDetails", storedDetails);
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
                    } else if (storedJoinKey) {
                        const matchingPlayer = game.players.find(player =>
                            player.joinKey === storedJoinKey &&
                            player.color === storedColor &&
                            player.disconnected === true  // check if the player is disconnected
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

                    </>
                );
            } else {
                return <p>Turn: {getPlayerColor(game, game.currentPlayer)} Turn</p>;
            }
        } else if (gameState.includes("-wins")) {
            if (joined) {
                const winningPlayerIndex = gameState === "player0-wins" ? 0 : 1;
                const currentPlayerIndex = game.players.findIndex(player => player.id === playerId);

                const imageStyle = {
                    maxWidth: '200px',
                    maxHeight: '200px'
                };

                if (winningPlayerIndex === currentPlayerIndex) {
                    return (
                        <>
                            <img src="/images/chess/aww_ya.gif" alt="Aww Ya" style={imageStyle} />
                            <p>You Win!</p>
                        </>
                    );
                } else {
                    return (
                        <>
                            <img src="/images/chess/alienmferchick.jpg" alt="Alien Mfer" style={imageStyle} />
                            <p>You should rethink your strategy!</p>
                        </>
                    );
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
                    <ToastContainer limit={3} />
                    <p>
                        <button onClick={navigateToHome} className="back-button">
                            Back to Home
                        </button>
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
                        <GameInfoComponent game={game} />
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
                                Tell your friend the game name and to join from mfersarcade chess lobby.
                            </p>
                        )}
                        {displayGameStatus(gameState, game.currentPlayer, playerId, joined)}
                    </div>
                    <ChessContainer game={game} playerId={playerId} makeMove={makeMove} />
                    <div>
                        <button onClick={navigateToHome} className="back-button">
                            Back to Home
                        </button>
                    </div>
                    <CapturedPieces game={game} />
                    <Legend pieceLegend={pieceLegend} />
                    <ToastContainer limit={3} />
                </>
            )}
        </div>
    );

}

export default GameChess;
