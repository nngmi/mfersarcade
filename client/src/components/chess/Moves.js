import { graphics, ChessColor } from './ChessLib';
import './CapturedPieces.css';

function Moves({ game }) {
    if (!game) return null; // Return null for React components when nothing should be rendered
    const whitePlayer = game.players.find(p => p.color === ChessColor.WHITE);
    const blackPlayer = game.players.find(p => p.color === ChessColor.BLACK);
    if (!whitePlayer || !blackPlayer) return null;

    const returnPlayerMoves = (player) => {
        return player.moves.map(move => (
            <div>piece {move.piece} from {move.from} to {move.to}</div>
        ))
    }

    return (
        <div>
            <h2 className="legend-title">Captured Pieces</h2>
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