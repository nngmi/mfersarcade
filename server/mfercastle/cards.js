const express = require('express');
const router = express.Router();

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
    console.log("runing applyeffect");
    if (this.effect) {
      this.effect(game, playerSymbol);
    }
  }
}

function conjureGeneratorEffect(game, playerSymbol) {
  const otherPlayerSymbol = playerSymbol === "X" ? "O" : "X";
  const otherPlayer = game.players.find(p => p.symbol === otherPlayerSymbol);
  const player = game.players.find(p => p.symbol === playerSymbol);
  player.generators += 1;
  console.log(player.generators);
}

function dealDamage(damage, wallStrength, castleStrength, ignoreWall = false) {
  let remainingDamage;

  if(ignoreWall) {
    remainingDamage = damage; // if we are ignoring the wall, all damage goes to the castle.
  } else {
    if(damage < wallStrength) {
      wallStrength -= damage;
      remainingDamage = 0;
    } else {
      remainingDamage = damage - wallStrength;
      wallStrength = 0;
    }
  }

  castleStrength -= remainingDamage;
  if(castleStrength < 0) castleStrength = 0;

  return {wallStrength, castleStrength};
}

function violentGeneratorEffect(game, playerSymbol) {
  const otherPlayerSymbol = playerSymbol === "X" ? "O" : "X";
  const otherPlayer = game.players.find(p => p.symbol === otherPlayerSymbol);
  const player = game.players.find(p => p.symbol === playerSymbol);
  player.generators += 1;
  let { wallStrength, castleStrength } = dealDamage(10, otherPlayer.wallStrength, otherPlayer.castleStrength);
  otherPlayer.wallStrength = wallStrength;
  otherPlayer.castleStrength = castleStrength;
}

function stealEffect(game, playerSymbol) {
  const otherPlayerSymbol = playerSymbol === "X" ? "O" : "X";
  const otherPlayer = game.players.find(p => p.symbol === otherPlayerSymbol);
  const player = game.players.find(p => p.symbol === playerSymbol);
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
  const otherPlayerSymbol = playerSymbol === "X" ? "O" : "X";
  const otherPlayer = game.players.find(p => p.symbol === otherPlayerSymbol);
  const player = game.players.find(p => p.symbol === playerSymbol);
  let { wallStrength, castleStrength } = dealDamage(7, otherPlayer.wallStrength, otherPlayer.castleStrength, ignoreWall=true);
  otherPlayer.wallStrength = wallStrength;
  otherPlayer.castleStrength = castleStrength;
}

function bloodyBricksEffect(game, playerSymbol) {
  const otherPlayerSymbol = playerSymbol === "X" ? "O" : "X";
  const otherPlayer = game.players.find(p => p.symbol === otherPlayerSymbol);
  const player = game.players.find(p => p.symbol === playerSymbol);
  let { wallStrength, castleStrength } = dealDamage(player.wallStrength, otherPlayer.wallStrength, otherPlayer.castleStrength);
  otherPlayer.wallStrength = wallStrength;
  otherPlayer.castleStrength = castleStrength;
}

function conjureResourcesEffectBase(game, playerSymbol) {
  const otherPlayerSymbol = playerSymbol === "X" ? "O" : "X";
  const otherPlayer = game.players.find(p => p.symbol === otherPlayerSymbol);
  const player = game.players.find(p => p.symbol === playerSymbol);
  console.log("executing conjureResourcesEffectBase ", " for player ", playerSymbol);
  player.spendingResources += 7;
}

function delayEffect( n_turns, baseEffect) {

  function inner(game, playerSymbol) {
    console.log("putting func onto the stack");
    game.delayedEffects.push({turnNumber: game.turnNumber + n_turns, effectFunc: baseEffect});
  }
  return inner;
}


// Define Cards
const cardsData = [
  {cardid: 1, name: "Conjure Generator", cost: 2, text: "Add (1) generator", color: "mfer", effect: conjureGeneratorEffect},
  {cardid: 2, name: "Conjure Resources", cost: 3, text: "Gain 7 resources next turn", color: "mfer", effect: delayEffect(2, conjureResourcesEffectBase)},
  {cardid: 3, name: "Violent Generator", cost: 5, text: "Add (1) generator. Deal 10 damage", color: "mfer", effect: violentGeneratorEffect},
  {cardid: 4, name: "Steal", cost: 7, text: "Steal (1) generator from your opponent and (1) of the corresponding spending resource", color: "mfer", effect: stealEffect},
  // {cardid: 5, name: "Explosion", cost: 10, text: "Add (1) generator and (3) spending resources. Deal 25 damage", color: "mfer"},
  {cardid: 6, name: "Bloody Bricks", cost: 6, text: "Deal damage equal to your wall", color: "mfer", effect: bloodyBricksEffect},
  {cardid: 7, name: "Sneak", cost: 2, text: "Deal 7 damage. Ignore wall.", color: "mfer", effect: sneakEffect},
  // {cardid: 8, name: "Assassin", cost: 5, text: "Deal 20 damage. Ignore wall.", color: "mfer"},
  // {cardid: 9, name: "Trinity", cost: 333, text: "Costs 3 less for each damage you have dealt to enemy walls or towers this game. Deal 33 damage. Gain 33 wall and 33 tower.", color: "mfer"},
  // {cardid: 10, name: "Levy", cost: 5, text: "The enemy castle loses 10. Yours gains 10.", color: "mfer"},
  // {cardid: 11, name: "Brick Break", cost: 6, text: "Deal 20 damage. Deals double damage to towers.", color: "mfer"},
  // {cardid: 12, name: "Bloody Ritual", cost: 0, text: "Lose 10 from your tower. Gain (5) spending resources", color: "mfer"},
  // {cardid: 13, name: "Weaken", cost: 4, text: "Deal 5 damage. Your opponents next wall or castle card is 50% less effective", color: "mfer"},
  // {cardid: 14, name: "Repurpose", cost: 2, text: "Lose 15 castle. Gain 30 wall", color: "mfer"},
  // {cardid: 15, name: "Wall Fist", cost: 6, text: "Gain 15 wall. Deal 15 damage.", color: "mfer"},
  // {cardid: 16, name: "Turtle Up", cost: 4, text: "Gain 4 height and 10 wall", color: "mfer"},
  // {cardid: 17, name: "Massacre", cost: 8, text: "Deal 3 damage for every card in your discard pile", color: "mfer"},
  // {cardid: 18, name: "Abandon", cost: 7, text: "Discard your hand. Deal 5 damage for each card discarded.", color: "mfer"},
  // {cardid: 19, name: "Preparation", cost: 3, text: "Draw 2 cards next turn. Produce double resources next turn. Your attacks do 2 extra damage next turn.", color: "mfer"},
  // {cardid: 20, name: "Split", cost: 6, text: "Combine yours and your enemies wall and castle. Divide it equally, rounding up.", color: "mfer"},
  // {cardid: 21, name: "Splinter", cost: 1, text: "Deal 2 damage. Gain (1) extra spending resources next turn", color: "mfer"},
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
  cardMap[card.id] = card;
});

const getCardByID = (id) => {
  return cardMap[id];
};

const generateDeck = (n, playerID) => {
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

module.exports = {
  cards,
  generateDeck,
  getCardByID
};