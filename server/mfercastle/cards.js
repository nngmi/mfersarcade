const express = require('express');
const router = express.Router();

// Define Cards
const cards = [
  {cardid: 1, name: "Conjure Generator", cost: 2, text: "Add (1) generator", color: "mfer"},
  {cardid: 2, name: "Conjure Resources", cost: 3, text: "Gain 7 resources next turn", color: "mfer"},
  {cardid: 3, name: "Violent Generator", cost: 5, text: "Add (1) generator. Deal 10 damage", color: "mfer"},
  {cardid: 4, name: "Steal", cost: 7, text: "Steal (1) generator from your opponent and (1) of the corresponding spending resource", color: "mfer"},
  {cardid: 5, name: "Explosion", cost: 10, text: "Add (1) generator and (3) spending resources. Deal 25 damage", color: "mfer"},
  {cardid: 6, name: "Bloody Bricks", cost: 6, text: "Deal damage equal to your wall", color: "mfer"},
  {cardid: 7, name: "Sneak", cost: 2, text: "Deal 7 damage. Ignore wall.", color: "mfer"},
  {cardid: 8, name: "Assassin", cost: 5, text: "Deal 20 damage. Ignore wall.", color: "mfer"},
  {cardid: 9, name: "Trinity", cost: 333, text: "Costs 3 less for each damage you have dealt to enemy walls or towers this game. Deal 33 damage. Gain 33 wall and 33 tower.", color: "mfer"},
  {cardid: 10, name: "Levy", cost: 5, text: "The enemy tower less 10. Yours gains 10.", color: "mfer"},
  {cardid: 11, name: "Brick Break", cost: 6, text: "Deal 20 damage. Deals double damage to towers.", color: "mfer"},
  {cardid: 12, name: "Bloody Ritual", cost: 0, text: "Lose 10 from your tower. Gain (5) spending resources", color: "mfer"},
  {cardid: 13, name: "Weaken", cost: 4, text: "Deal 5 damage. Your opponents next wall or castle card is 50% less effective", color: "mfer"},
  {cardid: 14, name: "Repurpose", cost: 2, text: "Lose 15 castle. Gain 30 wall", color: "mfer"},
  {cardid: 15, name: "Wall Fist", cost: 6, text: "Gain 15 wall. Deal 15 damage.", color: "mfer"},
  {cardid: 16, name: "Turtle Up", cost: 4, text: "Gain 4 height and 10 wall", color: "mfer"},
  {cardid: 17, name: "Massacre", cost: 8, text: "Deal 3 damage for every card in your discard pile", color: "mfer"},
  {cardid: 18, name: "Abandon", cost: 7, text: "Discard your hand. Deal 5 damage for each card discarded.", color: "mfer"},
  {cardid: 19, name: "Preparation", cost: 3, text: "Draw 2 cards next turn. Produce double resources next turn. Your attacks do 2 extra damage next turn.", color: "mfer"},
  {cardid: 20, name: "Split", cost: 6, text: "Combine yours and your enemies wall and castle. Divide it equally, rounding up.", color: "mfer"},
  {cardid: 21, name: "Splinter", cost: 1, text: "Deal 2 damage. Gain (1) extra spending resources next turn", color: "mfer"},
  {cardid: 22, name: "Mirror", cost: 4, text: "Copy your opponents next card", color: "mfer"},
  {cardid: 23, name: "Bunker Down", cost: 5, text: "Add a bunker", color: "mfer"},
  {cardid: 24, name: "Drill Bit", cost: 1, text: "Whenever you play an attack, deal 1 damage to the enemy castle", color: "mfer"},
  {cardid: 25, name: "Mfer Ciggy", cost: 4, text: "If you break a wall, the castle takes the full damage of the card played.", color: "mfer"},
  {cardid: 26, name: "Bastion", cost: 10, text: "Gain 10 wall. At the start of each of your turns, gain 10 wall.", color: "mfer"},
  {cardid: 27, name: "Brick Thief", cost: 8, text: "When you damage a castle, your castle grows equal to 10% of damage dealt", color: "mfer"},
  {cardid: 28, name: "Gargoyle", cost: 6, text: "Amplify damage by 10%", color: "mfer"},
  {cardid: 29, name: "Builder", cost: 5, text: "Adds 2 spending resources each turn", color: "mfer"},
  {cardid: 30, name: "Reaper", cost: 13, text: "Deal 13 damage each turn", color: "mfer"}
];


// Function to generate a deck of N cards
const generateDeck = (n, playerID) => {
  let deck = [];
  for (let i = 0; i < n; i++) {
    let randomIndex = Math.floor(Math.random() * cards.length);
    let card = {...cards[randomIndex]};
    card.id = playerID + "_" + i + "_" + card.name.replace(/\s+/g, '_').toLowerCase();
    deck.push(card);
  }
  return deck;
};

module.exports = {
  cards,
  generateDeck
};
