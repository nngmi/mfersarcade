const express = require('express');
const router = express.Router();

// Define Cards
const cards = [
  { cardid: 1, name: "Forest", color: "green" },
  { cardid: 2, name: "Mountain", color: "red" },
  { cardid: 3, name: "Dark Ritual", color: "black" },
  { cardid: 4, name: "Counterspell", color: "blue" },
  { cardid: 5, name: "Serra Angel", color: "white" },
];

// Function to generate a deck of N cards
const generateDeck = (n, playerID) => {
  let deck = [];
  for (let i = 0; i < n; i++) {
    let randomIndex = Math.floor(Math.random() * cards.length);
    let card = {...cards[randomIndex]};
    card.id = playerID + i;
    deck.push(card);
  }
  return deck;
};

module.exports = {
  cards,
  generateDeck
};
