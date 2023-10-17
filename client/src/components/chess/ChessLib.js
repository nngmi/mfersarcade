const ChessColor = {
    WHITE: 'plain',
    BLACK: 'charcoal',
};

const pieceLegend = [
    { name: 'Pawn', notation: 'p',  },
    { name: 'Knight', notation: 'n' },
    { name: 'Bishop', notation: 'b' },
    { name: 'Rook', notation: 'r' },
    { name: 'Queen', notation: 'q' },
    { name: 'King', notation: 'k' },
];

const getPlayerColor = (game, playerId) => {
    const player = game.players.find(p => p.id === playerId);
    return player ? player.color : null; // Returns null if the player isn't found.
};

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

module.exports = {
    pieceLegend,
    graphics,
    getPlayerColor,
    ChessColor,
};