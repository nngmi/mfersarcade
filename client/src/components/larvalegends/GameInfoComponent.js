function GameInfoComponent({ game }) {
    if (!game) return;
    // Calculate the number of disconnected players
    const disconnectedPlayersCount = game.players.filter(player => player.disconnected).length;
    const connectedPlayersCount = game.players.length - disconnectedPlayersCount;

    return (
        <div>
            <span>
                {game.state} ({connectedPlayersCount} players connected
                {disconnectedPlayersCount > 0 ? `, ${disconnectedPlayersCount} players disconnected` : ""})
            </span>
        </div>
    );
}

export default GameInfoComponent;
