const { cards, generateDeck } = require('./cards');

let games = {};

const getInitialGameState = () => {
    return {
        players: [],
        turnNumber: 0,
        decks: {},
        battlefields: {},
        hands: {},
        graveyards: {}, 
        currentPlayer: "X",
        state: "waiting for other player",
        lastActivity: Date.now(),
        delayedEffects: [],
    };
};

const initializePlayer = (n_cards, game, playerSymbol, socketid) => {
    game.players.push({ id: socketid, symbol: playerSymbol, castleStrength: 20, wallStrength: 5, generators: 1, spendingResources: 3, drawsLeft: 1, discardsLeft: 1 });
    
    // shuffle a deck of cards for the user
    const deck = generateDeck(n_cards, socketid);
    game.decks[playerSymbol] = {"count": n_cards, "cards": deck};
    
    // draw the top 5 cards from the deck and put them in the hand
    const handCards = deck.slice(0, 5);
    game.hands[playerSymbol] = {"count": 5, "cards": handCards};
    
    // remove the drawn cards from the deck
    game.decks[playerSymbol].cards = deck.slice(5);
    game.decks[playerSymbol].count = n_cards - 5;
    
    game.battlefields[playerSymbol] = {"count": 0, "cards": []};
    game.graveyards[playerSymbol] = {"count": 0, "cards": []};
};



module.exports = {
    games,
    getInitialGameState,
    initializePlayer,
};
