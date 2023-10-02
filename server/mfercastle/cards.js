const express = require('express');
const router = express.Router();

const drawCard = (game, playerSymbol, ignoreLimits=false) => {
  const player = game.players.find(p => p.symbol === playerSymbol);
  if (game.decks[player.symbol] && game.decks[player.symbol].count > 0) {

      if (player.drawsLeft <= 0 && !ignoreLimits) {
          return "No more draws left";
      }

      if (game.hands[player.symbol].count >= 5 && !ignoreLimits) {
          return "Hand is full, cannot draw any more cards";
      }
      let card = game.decks[player.symbol]["cards"].pop();
      game.decks[player.symbol]["count"] = game.decks[player.symbol]["cards"].length;
      game.hands[player.symbol]["cards"].push(card);
      game.hands[player.symbol]["count"] += 1;
      if (!ignoreLimits) {
          player.drawsLeft -= 1;
      }
  } else {
      return "No more cards in deck";
  }
  return null;
};

class Card {
  constructor(cardid, name, cost, text, color, effect) {
    this.cardid = cardid;
    this.name = name;
    this.cost = cost;
    this.text = text;
    this.color = color;
    this.effect = effect;
  }

  setID(playerID, index) {
    this.id = `${playerID}_${index}_${this.name.replace(/\s+/g, '_').toLowerCase()}`;
  }

  serialize() {
    return JSON.stringify(this);
  }

  // This method is optional. It can be used to call the effect function (if it exists) with given parameters.
  applyEffect(game, playerSymbol) {
    if (this.effect) {
      let errMessage = this.effect(game, playerSymbol);
      return errMessage;
    }
    return null;
  }
}

function conjureGeneratorEffect(game, playerSymbol) {
  const otherPlayerSymbol = playerSymbol === "X" ? "O" : "X";
  const otherPlayer = game.players.find(p => p.symbol === otherPlayerSymbol);
  const player = game.players.find(p => p.symbol === playerSymbol);
  player.generators += 1;
}

function getPlayers(game, playerSymbol) {
  const otherPlayerSymbol = playerSymbol === "X" ? "O" : "X";
  const otherPlayer = game.players.find(p => p.symbol === otherPlayerSymbol);
  const player = game.players.find(p => p.symbol === playerSymbol);
  
  return {
    otherPlayerSymbol,
    otherPlayer,
    player
  };
}

// returns total damage dealt
function dealDamage(game, playerSymbol, damage, ignoreWall = false, wallDamageMultiplier = 1) {

  const { otherPlayer } = getPlayers(game, playerSymbol);
  let wallStrength = otherPlayer.wallStrength;
  let towerStrength = otherPlayer.towerStrength;
  if(game.persistentEffects) {
    game.persistentEffects.forEach(effect => {
      if(effect.turnNumber === game.turnNumber && effect.type === 'damageModifier') {
        damage = effect.effectFunc(damage);
      }
    });
  }
  let totalDamage = 0;
  let effectiveWallDamage;
  let remainingDamage = 0;

  if (ignoreWall) {
    remainingDamage = damage; // if we are ignoring the wall, all damage goes to the tower.
  } else {
    effectiveWallDamage = damage * wallDamageMultiplier; // amplify damage applied to the wall
    
    if (effectiveWallDamage < wallStrength) {
      wallStrength -= effectiveWallDamage; // subtract the amplified damage from wall strength
      totalDamage += effectiveWallDamage;
    } else {
      remainingDamage = (effectiveWallDamage - wallStrength) / wallDamageMultiplier; // convert the excess damage back to original scale
      totalDamage += wallStrength;
      wallStrength = 0; // wall is broken, remaining damage will go to the tower
    }

  }
  if (towerStrength > remainingDamage) {
    towerStrength -= remainingDamage; // Apply the remaining damage to the towerStrength normally.
    totalDamage += remainingDamage;
  } else {
    totalDamage += towerStrength;
    towerStrength = 0;
  }

  otherPlayer.wallStrength = wallStrength;
  otherPlayer.towerStrength = towerStrength;
  return totalDamage;

}

function violentGeneratorEffect(game, playerSymbol) {
  const { otherPlayer, player } = getPlayers(game, playerSymbol);
  player.generators += 1;
  dealDamage(game, playerSymbol, 10);
}

function stealEffect(game, playerSymbol) {
  const { otherPlayerSymbol, otherPlayer, player } = getPlayers(game, playerSymbol);

  if (otherPlayer.generators > 0) {
    player.generators += 1;
    otherPlayer.generators -= 1;
  }
  if (otherPlayer.spendingResources > 0) {
    player.spendingResources += 1;
    otherPlayer.spendingResources -= 1;
  }
}

function sneakEffect(game, playerSymbol) {
  const { otherPlayerSymbol, otherPlayer, player } = getPlayers(game, playerSymbol);

  dealDamage(game, playerSymbol, 7, ignoreWall=true);
}

function assassinEffect(game, playerSymbol) {
  const { otherPlayerSymbol, otherPlayer, player } = getPlayers(game, playerSymbol);

  dealDamage(game, playerSymbol, 20, ignoreWall=true);
}

function bloodyBricksEffect(game, playerSymbol) {
  const { otherPlayerSymbol, otherPlayer, player } = getPlayers(game, playerSymbol);
  dealDamage(game, playerSymbol, player.wallStrength);
}

function explosionEffect(game, playerSymbol) {
  const { otherPlayerSymbol, otherPlayer, player } = getPlayers(game, playerSymbol);

  dealDamage(game, playerSymbol, 25);
  player.generators += 1;
}

function levyEffect(game, playerSymbol) {
  const { otherPlayer, player } = getPlayers(game, playerSymbol);
  otherPlayer.towerStrength -= (otherPlayer.towerStrength >= 10 ? 10 : otherPlayer.towerStrength);
  player.towerStrength += 10;
}

function conjureResourcesEffectBase(game, playerSymbol) {
  const { player } = getPlayers(game, playerSymbol);

  console.log("executing conjureResourcesEffectBase ", " for player ", playerSymbol);
  player.spendingResources += 7;
}


function splinterEffect(game, playerSymbol) {
  let { otherPlayer } = getPlayers(game, playerSymbol);

  dealDamage(game, playerSymbol, 2);

  function nextTurnEffect(game, playerSymbol) {
    const { otherPlayerSymbol, otherPlayer, player } = getPlayers(game, playerSymbol);
    player.spendingResources += 1;
  }

  game.delayedEffects.push({turnNumber: game.turnNumber + 2, effectFunc: nextTurnEffect});
}

function preparationEffect(game, playerSymbol) {
  let { otherPlayer } = getPlayers(game, playerSymbol);

  function nextTurnEffect(game, playerSymbol) {
    const { otherPlayerSymbol, otherPlayer, player } = getPlayers(game, playerSymbol);
    player.spendingResources += player.generators;
    drawCard(game, playerSymbol, ignoreLimits=true);
    drawCard(game, playerSymbol, ignoreLimits=true);
  }

  function persistentDamageEffect(damage) {
    return damage + 2;
  }

  game.persistentEffects.push({turnNumber: game.turnNumber + 2, type: "damageModifier", effectFunc: persistentDamageEffect});
  game.delayedEffects.push({turnNumber: game.turnNumber + 2, effectFunc: nextTurnEffect});
}

function bloodyRitualEffect(game, playerSymbol) {
  const { player } = getPlayers(game, playerSymbol);

  if (player.towerStrength > 10) {
    player.towerStrength -= 10;
    player.spendingResources += 5;
  } else if (player.towerStrength > 1) {
    player.towerStrength = 1;
    player.spendingResources += 5;
  } else {
    return "towerStrength is at 1"
  }
  return null; // no error
}

function brickBreakEffect(game, playerSymbol) {
  const { otherPlayerSymbol, otherPlayer, player } = getPlayers(game, playerSymbol);
  dealDamage(game, playerSymbol, 6, ignoreWall=false, wallDamageMultiplier = 2);

}

function massacreEffect(game, playerSymbol) {
  const { otherPlayerSymbol, otherPlayer, player } = getPlayers(game, playerSymbol);

  dealDamage(game, playerSymbol, 5 * game.graveyards[player.symbol].count);

}

function wallFistEffect(game, playerSymbol) {
  let { otherPlayer, player } = getPlayers(game, playerSymbol);

  dealDamage(game, playerSymbol, 15);

  player.wallStrength += 15;

}

function abandonEffect(game, playerSymbol) {
  let { otherPlayer, player } = getPlayers(game, playerSymbol);

  let n_cards_to_discard = game.hands[player.symbol].count;
  dealDamage(game, playerSymbol, 5 * n_cards_to_discard);
  
  // Move all cards from hand to the graveyard
  const discardedCards = game.hands[player.symbol].cards;
  game.graveyards[player.symbol].cards.push(...discardedCards);
  game.graveyards[player.symbol].count += discardedCards.length;

  // Empty the hand
  game.hands[player.symbol].cards = [];
  game.hands[player.symbol].count = 0;
  return null;
}

function delayEffect( n_turns, baseEffect) {

  function inner(game, playerSymbol) {
    console.log("putting func onto the stack");
    game.delayedEffects.push({turnNumber: game.turnNumber + n_turns, effectFunc: baseEffect});
  }
  return inner;
}

function repurposeEffect(game, playerSymbol) {
  const { otherPlayerSymbol, otherPlayer, player } = getPlayers(game, playerSymbol);

  if (player.towerStrength > 15) {
    player.towerStrength -= 15;
    player.wallStrength += 30;
  } else if (player.towerStrength > 1) {
    player.towerStrength = 1;
    player.wallStrength += 30;  
  } else {
    return "tower strength is at 1"
  }
  return null;
}

// Define Cards
const cardsData = [
  {cardid: 1, name: "Conjure Generator", cost: 2, text: "Add (1) generator", color: "mfer", effect: conjureGeneratorEffect},
  {cardid: 2, name: "Conjure Resources", cost: 3, text: "Gain 7 resources next turn", color: "mfer", effect: delayEffect(2, conjureResourcesEffectBase)},
  {cardid: 3, name: "Violent Generator", cost: 5, text: "Add (1) generator. Deal 10 damage", color: "mfer", effect: violentGeneratorEffect},
  {cardid: 4, name: "Steal", cost: 7, text: "Steal (1) generator from your opponent and (1) of the corresponding spending resource", color: "mfer", effect: stealEffect},
  {cardid: 5, name: "Explosion", cost: 10, text: "Add (1) generator and (3) spending resources. Deal 25 damage", color: "mfer", effect: explosionEffect},
  {cardid: 6, name: "Bloody Bricks", cost: 6, text: "Deal damage equal to your wall", color: "mfer", effect: bloodyBricksEffect},
  {cardid: 7, name: "Sneak", cost: 2, text: "Deal 7 damage. Ignore wall.", color: "mfer", effect: sneakEffect},
  {cardid: 8, name: "Assassin", cost: 5, text: "Deal 20 damage. Ignore wall.", color: "mfer", effect: assassinEffect},
  {cardid: 10, name: "Levy", cost: 5, text: "The enemy tower loses 10. Yours gains 10.", color: "mfer", effect: levyEffect},
  {cardid: 11, name: "Brick Break", cost: 6, text: "Deal 20 damage. Deals double damage to walls.", color: "mfer", effect: brickBreakEffect},
  {cardid: 12, name: "Bloody Ritual", cost: 0, text: "Lose 10 from your tower. Gain (5) spending resources", color: "mfer", effect: bloodyRitualEffect},
  {cardid: 14, name: "Repurpose", cost: 2, text: "Lose 15 tower. Gain 30 wall", color: "mfer", effect: repurposeEffect},
  {cardid: 17, name: "Massacre", cost: 8, text: "Deal 3 damage for every card in your discard pile", color: "mfer", effect: massacreEffect},
  {cardid: 21, name: "Splinter", cost: 1, text: "Deal 2 damage. Gain (1) extra spending resources next turn", color: "mfer", effect: splinterEffect},
  // {cardid: 13, name: "Weaken", cost: 4, text: "Deal 5 damage. Your opponents next wall or castle card is 50% less effective", color: "mfer"},
  {cardid: 15, name: "Wall Fist", cost: 6, text: "Gain 15 wall. Deal 15 damage.", color: "mfer", effect: wallFistEffect},
  // {cardid: 16, name: "Turtle Up", cost: 4, text: "Gain 4 height and 10 wall", color: "mfer"},   
  {cardid: 18, name: "Abandon", cost: 7, text: "Discard your hand. Deal 5 damage for each card discarded.", color: "mfer", effect: abandonEffect},
  {cardid: 19, name: "Preparation", cost: 3, text: "Draw 2 cards next turn. Produce double resources next turn. Your attacks do 2 extra damage next turn.", color: "mfer", effect: preparationEffect},
  // {cardid: 20, name: "Split", cost: 6, text: "Combine yours and your enemies wall and castle. Divide it equally, rounding up.", color: "mfer"},
  // {cardid: 22, name: "Mirror", cost: 4, text: "Copy your opponents next card", color: "mfer"},
  // {cardid: 23, name: "Bunker Down", cost: 5, text: "Add a bunker", color: "mfer"},
  // {cardid: 24, name: "Drill Bit", cost: 1, text: "Whenever you play an attack, deal 1 damage to the enemy castle", color: "mfer"},
  // {cardid: 25, name: "Mfer Ciggy", cost: 4, text: "If you break a wall, the castle takes the full damage of the card played.", color: "mfer"},
  // {cardid: 26, name: "Bastion", cost: 10, text: "Gain 10 wall. At the start of each of your turns, gain 10 wall.", color: "mfer"},
  // {cardid: 27, name: "Brick Thief", cost: 8, text: "When you damage a castle, your castle grows equal to 10% of damage dealt", color: "mfer"},
  // {cardid: 28, name: "Gargoyle", cost: 6, text: "Amplify damage by 10%", color: "mfer"},
  // {cardid: 29, name: "Builder", cost: 5, text: "Adds 2 spending resources each turn", color: "mfer"},
  // {cardid: 30, name: "Reaper", cost: 13, text: "Deal 13 damage each turn", color: "mfer"}
];

const cards = cardsData.map((data, index) => {
  const card = new Card(data.cardid, data.name, data.cost, data.text, data.color, data.effect);
  return card;
});

const cardMap = {};
cards.forEach(card => {
  cardMap[card.cardid] = card;
});

const getCardByID = (id) => {
  return cardMap[id];
};

const generateRandomDeck = (n, playerID) => {
  let deck = [];
  for (let i = 0; i < n; i++) {
    let randomIndex = Math.floor(Math.random() * cards.length);
    let card = new Card(
      cards[randomIndex].cardid,
      cards[randomIndex].name,
      cards[randomIndex].cost,
      cards[randomIndex].text,
      cards[randomIndex].color,
      cards[randomIndex].effect,
    );
    card.setID(playerID, i);
    deck.push(card);
  }
  return deck;
};

const generateSetDeck = (n, playerID) => {
  const cardList = [
    [3, 'Splinter'],
    [3, 'Steal'],
    [3, 'Abandon'],
    [3, 'Wall Fist'],
    [3, 'Repurpose'],
    [3, 'Conjure Generator'],
    [2, 'Bloody Ritual'],
    [2, 'Conjure Resources'],
    [3, 'Violent Generator'],
    [3, 'Preparation'],
    // [2, 'Reaper']
  ];

  let deck = [];

  cardList.forEach(([count, name]) => {
    let cardTemplate;

    for (const [id, card] of Object.entries(cardMap)) {
      if (card.name === name) {
        cardTemplate = card;
        break;
      }
    }

    if (!cardTemplate) {
      throw new Error(`Card with name ${name} not found in cardMap.`);
    }

    for (let i = 0; i < count; i++) {
      let card = new Card(
        cardTemplate.cardid,
        cardTemplate.name,
        cardTemplate.cost,
        cardTemplate.text,
        cardTemplate.color,
        cardTemplate.effect,
      );
      card.setID(playerID, deck.length);
      deck.push(card);
    }
  });

  // Shuffling the deck using Fisher-Yates (aka Knuth) Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};


module.exports = {
  cardMap,
  generateRandomDeck,
  generateSetDeck,
  getCardByID,
  repurposeEffect,
  splinterEffect,
  getPlayers,
  drawCard,
  dealDamage
};