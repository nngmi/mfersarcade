import { pieceLegend, graphics } from './ChessLib';

function Legend() {

    return (
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
    )
}

export default Legend;
