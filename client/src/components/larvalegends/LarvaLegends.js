// External Libraries
import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { ToastContainer, toast } from 'react-toastify';

// React Router
import { useParams, useNavigate } from 'react-router-dom';
import GameInfoComponent from './GameInfoComponent';

// Assets/Styles
import './LarvaLegends.css';

function LarvaLegends() {

    const navigate = useNavigate();

    let { gameId } = useParams();
    const [socket, setSocket] = useState(null);
    const [game, setGame] = useState('');
    const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3001";
    //const [board, setBoard] = useState(() => Array(8).fill(0).map(row => Array(8).fill(null)));
    const [gameState, setGameState] = useState("viewing");
    const [playerId, setPlayerId] = useState(null);
    const [joinKey, setJoinKey] = useState(null);

    const [ableToJoin, setAbleToJoin] = useState(false);
    const [joined, setJoined] = useState(false);

    const navigateToHome = () => {
        navigate("/larvalegends");
    };

    useEffect(() => {
        if (!gameId) return;
        console.log("starting socket");

        const newSocket = io.connect(SERVER_URL + '/larvalegends', {
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
            toast.success(text);
        };

        const errorListener = (text) => {
            toast.error(text);
        };

        newSocket.on("gameUpdated", gameUpdatedListenerBasic);
        newSocket.on("notify", notifyListener);
        newSocket.on("error", errorListener);

        const joinedListener = (receivedPlayerId) => {
            console.log("successfully joined game as ", receivedPlayerId);
            setPlayerId(receivedPlayerId);

            const gameUpdatedListener = (game) => {


                if (game.state === `${receivedPlayerId}-wins`) {
                } else if (game.state.includes("-wins") && game.state !== `${receivedPlayerId}-wins`) {
                }

                if (!joined && game.players.length < 2) {
                    setAbleToJoin(true);
                } else {
                    setAbleToJoin(false);
                }

                let currentPlayerDetails = game.players.find(p => p.id === receivedPlayerId);
                console.log(currentPlayerDetails);

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
        if (!gameId) return;

        fetch(`/api/larvalegends/game/${gameId}`)
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
                    }
                }
            })
            .catch(error => console.error('Error fetching the game:', error));
    }, [gameId]);

    return (
        <>
            <h1> Larva Legends!</h1>
            <div>
                <h2>Larva Legends: {game.gameName}</h2>
                <GameInfoComponent game={game} />
                {joined === false && ableToJoin === true && (
                    <button onClick={() => {
                        socket.emit("joinGame", gameId, null);
                        setJoined(true);
                    }}>
                        Join Game
                    </button>
                )}

                {gameState === "waiting for players" && (
                    <p>
                        Tell your friend the game name and to join from mfersarcade larva legends lobby.
                    </p>
                )}
            </div>
            <ToastContainer limit={3} />
        </>
    )

}

export default LarvaLegends;
