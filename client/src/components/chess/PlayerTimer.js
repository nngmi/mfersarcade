import { useState, useEffect } from 'react';

function PlayerTimer({ player, isPlayerTurn }) {
    const [timeLeft, setTimeLeft] = useState(player.timeLeft);

    useEffect(() => {
        setTimeLeft(player.timeLeft);
    }, [player.timeLeft]);

    useEffect(() => {
        let timer;
        if (isPlayerTurn) {
            timer = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1000) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prevTime - 1000;
                });
            }, 1000);
        }

        return () => clearInterval(timer);
    }, [isPlayerTurn]);

    const formatTime = (milliseconds) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return <span>{player.color}: {formatTime(timeLeft)} </span>;
}
export default PlayerTimer;
