import PlayerTimer from './PlayerTimer';
import {getPlayerColor} from './ChessLib';

function GameInfoComponent({game}) {
    if (!game) return;
    // Calculate the number of disconnected players
    const disconnectedPlayersCount = game.players.filter(player => player.disconnected).length;
    const connectedPlayersCount = game.players.length - disconnectedPlayersCount;
    const whitePlayer = game.players.find(p => p.color === 'white');
    const blackPlayer = game.players.find(p => p.color === 'black');

    // Convert the gameState if it ends with '-wins'
    if (game.state.endsWith('-wins')) {
        const winnerColor = game.state === "player0-wins" ? "white" : "black";
        return (
            <p>
                <span>{winnerColor} wins</span>
            </p>
        );
    }

    return (
        <div>
            <span>
                {game.state} ({connectedPlayersCount} players connected
                {disconnectedPlayersCount > 0 ? `, ${disconnectedPlayersCount} players disconnected` : ""})
            </span>
            <div>
                {whitePlayer && blackPlayer && (<PlayerTimer player={whitePlayer} isPlayerTurn={getPlayerColor(game, game.currentPlayer) === 'white'} />)}
                {whitePlayer && blackPlayer && (<PlayerTimer player={blackPlayer} isPlayerTurn={getPlayerColor(game, game.currentPlayer) === 'black'} />)}
            </div>
        </div>
    );
}

export default GameInfoComponent;
