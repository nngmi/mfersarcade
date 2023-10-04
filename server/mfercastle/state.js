const { cards, generateRandomDeck, generateSetDeck } = require('./cards');

let games = {};

function checkGameState(game) {

    // Checking for a draw scenario based on deck counts
    if (game.decks['X'].count === 0 && game.decks['O'].count === 0) {
        return "draw";
    }

    let draw = true;
    let winner = null;
    
    for (const player of game.players) {
        if (player.towerStrength >= 100) {
            return `${player.symbol}-wins`; // If a player’s towerStrength is 100 or more, they win.
        }

        if (player.towerStrength > 0) {
            if (winner === null) {
                winner = player.symbol; // assuming player has a property 'symbol' which could be 'X' or 'O'
                draw = false;
            } else {
                // If we find another player with towerStrength > 0, the game is ongoing
                draw = false;
                winner = null;
            }
        }
    }
    
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
        bunkers: {},
        graveyards: {}, 
        currentPlayer: "X",
        state: "waiting for other player",
        lastActivity: Date.now(),
        delayedEffects: [], // trigger on certain turns
        persistentEffects: [], // type is "damageModifier", playerSymbol, effect is a function which take in damage
        lock: false,
    };
};

const initializePlayer = (n_cards, game, playerSymbol, socketid) => {
    game.players.push({ id: socketid, symbol: playerSymbol, towerStrength: 50, wallStrength: 30, generators: 1, spendingResources: 3, drawsLeft: 1, discardsLeft: 1 });
    
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
    game.bunkers[playerSymbol] = [{"count": 0, "cards": []}, {"count": 0, "cards": []}];
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

    // clean up any persistent effects that are past
    // Execute effects and remove them after they have been run
    game.persistentEffects = game.persistentEffects.filter((effect) => {
        if (game.turnNumber >= effect.turnNumber) {
            return false; // This effect should be removed (not included in the new array)
        }
        return true; // Keep the effect in the array
    });
};

const beginTurn = (game, playerSymbol) => {
    const player = game.players.find(p => p.symbol === playerSymbol);
    game.turnNumber += 1;
    player.spendingResources += player.generators;
    player.drawsLeft = 1;
    player.discardsLeft = 1;

    game.currentPlayer = player.symbol;

    // Execute effects and remove them after they have been run
    game.delayedEffects = game.delayedEffects.filter((effect) => {
        if (game.turnNumber === effect.turnNumber) {
            effect.effectFunc(game, player.symbol);
            return false; // This effect should be removed (not included in the new array)
        }
        return true; // Keep the effect in the array
    });
    game.state = checkGameState(game) || game.state;
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

const bunkerizeCard = (game, cardid, bunkerIndex, playerSymbol) => {
    const player = game.players.find(p => p.symbol === playerSymbol);

    if (!cardid) {
        return "Error with bunkerize because cardid does not exist";
    }

    const cardIndex = game.hands[player.symbol].cards.findIndex(card => card.id === cardid);

    if (cardIndex === -1) {
        return "Error with bunkerize, card not found in hand";
    }

    // Check the type of the card
    const card = game.hands[player.symbol].cards[cardIndex];
    if (card.type !== 'familiar') {
        return "Error with bunkerize, card is not of type familiar";
    }

    if (card.cost > player.spendingResources) {
        return `Card ${card.name} costs ${card.cost} and you only have ${player.spendingResources} resources`;
    }

    // Check bunker index validity
    if (bunkerIndex < 0 || bunkerIndex >= game.bunkers[player.symbol].length) {
        return "Error with bunkerize, provided bunker index is out of range";
    }

    // Place card into the bunker at the specified index if it's empty
    const targetBunker = game.bunkers[player.symbol][bunkerIndex];
    if (targetBunker.cards.length === 0) {
        // Remove card from hand
        game.hands[player.symbol].cards.splice(cardIndex, 1);
        game.hands[player.symbol].count--;

        // Add card to bunker
        targetBunker.cards.push(card);
        targetBunker.count++;
        player.spendingResources -= card.cost;
        return null; // Successfully placed the card into the bunker
    } else {
        return "Error with bunkerize, the target bunker is already occupied";
    }
};


const playCard = (game, cardid, playerSymbol) => {
    const player = game.players.find(p => p.symbol === playerSymbol);
    if (!cardid) {
        return "Error with play because cardid does not exist";
    }
    const cardIndex = game.hands[player.symbol].cards.findIndex(card => card.id === cardid);
    const card = game.hands[player.symbol].cards[cardIndex];
    if (card.type !== 'spell' && card.type !== undefined) {
        return "Error with play, card is not of type spell";
    }
    if (card.cost > player.spendingResources) {
        return "Card " + card.name + " costs " + card.cost + " and you only have " + player.spendingResources + " resources";
    }

    let errMessage = card.applyEffect(game, player.symbol);
    if (errMessage) {
        return "Could not play " + card.name + " because " + errMessage;
    }

    player.spendingResources -= card.cost;
    // removing card from hand
    game.hands[player.symbol].cards.splice(cardIndex, 1);
    game.hands[player.symbol].count--;
    
    // appending card to battlefield
    game.battlefields[player.symbol].cards.push(card);
    game.battlefields[player.symbol].count++;
    return null;


}


module.exports = {
    games,
    getInitialGameState,
    initializePlayer,
    endTurn,
    beginTurn,
    checkGameState,
    discardCard,
    playCard,
    bunkerizeCard,
};
