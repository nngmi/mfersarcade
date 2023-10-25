import { graphics, ChessColor } from './ChessLib';
import './CapturedPieces.css';

function Moves({ game }) {
    if (!game) return null; // Return null for React components when nothing should be rendered
    const whitePlayer = game.players.find(p => p.color === ChessColor.WHITE);
    const blackPlayer = game.players.find(p => p.color === ChessColor.BLACK);
    if (!whitePlayer || !blackPlayer) return null;

    const returnPlayerMoves = (player) => {
        console.log("render moves");
        console.log(player.moves);

        return player.moves.slice().reverse().map(move => (
            <div>
                {move.piece && (
                    <img
                        src={graphics[`${move.piece.toLowerCase()}-${move.color === ChessColor.WHITE ? "white" : "black"}`]}
                        alt={`piece ${move.piece}`}
                        className="piece-img"
                    />
                )}
                from {move.from} to {move.to}
            </div>
        ))
    }

    return (
        <div>
            <h2 className="legend-title">Moves</h2>
            <table className="captured-table">
                <thead>
                    <tr>
                        <th>Plain:</th>
                        <th>
                            {returnPlayerMoves(whitePlayer)}
                        </th>
                    </tr>
                    <hr></hr>
                    <tr>
                        <th>Charcoal:</th>
                        <th>
                            {returnPlayerMoves(blackPlayer)}
                        </th>
                    </tr>
                </thead>
            </table>
        </div>
    );
}

export default Moves;