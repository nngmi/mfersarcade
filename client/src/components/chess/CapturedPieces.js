import { graphics, ChessColor } from './ChessLib';
import './CapturedPieces.css';

function CapturedPieces({ game }) {
    if (!game) return null; // Return null for React components when nothing should be rendered
    const whitePlayer = game.players.find(p => p.color === ChessColor.WHITE);
    const blackPlayer = game.players.find(p => p.color === ChessColor.BLACK);
    if (!whitePlayer || !blackPlayer) return null;

    // Helper function to determine the value of the piece
    const pieceValue = (piece) => {
        switch (piece) {
            case 'q': return 5;
            case 'r': return 4;
            case 'b': return 3;
            case 'n': return 2;
            case 'p': return 1;
            default: return 0;
        }
    }

    // Sort the captured pieces based on their value
    whitePlayer.capturedPieces.sort((a, b) => pieceValue(b) - pieceValue(a));
    blackPlayer.capturedPieces.sort((a, b) => pieceValue(b) - pieceValue(a));

    return (
        <div>
            <h2 className="legend-title">Captured Pieces</h2>
            <table className="captured-table">
                <thead>
                    <tr>
                        <th>Plain:</th>
                        <th>
                            {whitePlayer.capturedPieces.map(piece => (
                                <img src={graphics[`${piece}-black`]} alt={`${piece} black`} />
                            ))}
                        </th>
                    </tr>
                    <tr>
                        <th>Charcoal:</th>
                        <th>
                            {blackPlayer.capturedPieces.map(piece => (
                                <img src={graphics[`${piece}-white`]} alt={`${piece} white`} />
                            ))}
                        </th>
                    </tr>
                </thead>
            </table>
        </div>
    );
}

export default CapturedPieces;