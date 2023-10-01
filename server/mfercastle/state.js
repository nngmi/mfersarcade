const { cards, generateRandomDeck, generateSetDeck } = require('./cards');

let games = {};
function checkGameState(game) {
    let draw = true;
    let winner = null;
    
    game.players.forEach((player) => {
        if (player.castleStrength > 0) {
            if (winner === null) {
                winner = player.symbol; // assuming player has a property 'symbol' which could be 'X' or 'O'
                draw = false;
            } else {
                // If we find another player with castleStrength > 0, the game is ongoing
                draw = false;
                winner = null;
                return "ongoing";
            }
        }
    });
    
    if (draw) {
        return "draw";
    } else if (winner !== null) {
        return `${winner}-wins`;
    } else {
        return "ongoing";
    }
}

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
        lock: false,
    };
};

const initializePlayer = (n_cards, game, playerSymbol, socketid) => {
    game.players.push({ id: socketid, symbol: playerSymbol, castleStrength: 100, wallStrength: 30, generators: 1, spendingResources: 3, drawsLeft: 1, discardsLeft: 1 });
    
    // shuffle a deck of cards for the user
    const deck = generateSetDeck(n_cards, socketid);
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

const endTurn = (game, playerSymbol) => {
    // clean up move everything from battlefield onto the graveyard
    // Combine the two arrays
    game.graveyards[playerSymbol].cards = [...game.graveyards[playerSymbol].cards, ...game.battlefields[playerSymbol].cards];

    // Update the count
    game.graveyards[playerSymbol].count += game.battlefields[playerSymbol].count;

    // Reset the battlefield cards and count
    game.battlefields[playerSymbol].cards = [];
    game.battlefields[playerSymbol].count = 0;
};

const beginTurn = (game, playerSymbol) => {
    const player = game.players.find(p => p.symbol === playerSymbol);
    game.turnNumber += 1;
    player.spendingResources += player.generators;
    player.drawsLeft = 1;
    player.discardsLeft = 1;

    game.currentPlayer = player.symbol;
    game.delayedEffects.forEach((effect) => {
        console.log(effect);
        console.log(game.turnNumber);
        if (game.turnNumber === effect.turnNumber) {
            effect.effectFunc(game, player.symbol);
        }
    });
    game.state = checkGameState(game) || game.state;
};

const drawCard = (game, playerSymbol) => {
    const player = game.players.find(p => p.symbol === playerSymbol);
    if (game.decks[player.symbol] && game.decks[player.symbol].count > 0) {

        if (player.drawsLeft <= 0) {
            return "No more draws left";
        }

        if (game.hands[player.symbol].count >= 5) {
            return "Hand is full, cannot draw any more cards";
        }
        let card = game.decks[player.symbol]["cards"].pop();
        game.decks[player.symbol]["count"] = game.decks[player.symbol]["cards"].length;
        game.hands[player.symbol]["cards"].push(card);
        game.hands[player.symbol]["count"] += 1;
        player.drawsLeft -= 1;
    } else {
        return "No more cards in deck";
    }
    return null;
};

const discardCard = (game, cardid, playerSymbol) => {
    const player = game.players.find(p => p.symbol === playerSymbol);
    if (!cardid) {
        return "Error with discard because cardid does not exist";
    }
    
    const cardIndex = game.hands[player.symbol].cards.findIndex(card => card.id === cardid);
    
    if (cardIndex === -1) {
    return "Error with discard, card not found in hand";
    }

    if (player.discardsLeft == 0) {
        return "error", "No more discards left";
    }
    
    // removing card from hand
    const [card] = game.hands[player.symbol].cards.splice(cardIndex, 1);
    game.hands[player.symbol].count--;
    
    // appending card to graveyard
    game.graveyards[player.symbol].cards.push(card);
    game.graveyards[player.symbol].count++;
    player.discardsLeft -= 1;
    return null;
};


module.exports = {
    games,
    getInitialGameState,
    initializePlayer,
    endTurn,
    beginTurn,
    checkGameState,
    drawCard,
    discardCard,
};
