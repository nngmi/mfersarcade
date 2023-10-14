const { cardMap, getPlayers, drawCard } = require('../../server/mfercastle/cards');
const { initializePlayer, getInitialGameState, beginTurn, endTurn, discardCard, bunkerizeCard, playCard} = require('../../server/mfercastle/state');

describe('basicTest function', () => {
  let game;
  const playerSymbol = "X";
  const otherPlayerSymbol = "O";

  beforeEach(() => {
    game = getInitialGameState();
    initializePlayer(30, game, playerSymbol, "1234");
    initializePlayer(30, game, otherPlayerSymbol, "3456");
  });

  test('yield turns, turn number should increment', () => {
    beginTurn(game, "X");
    expect(game.turnNumber).toBe(1);
    expect(game.currentPlayer).toBe("X");
    expect(game.state).toBe("ongoing");
    expect(game.hands["X"].count).toBe(5);
    expect(drawCard(game, game.currentPlayer)).toBe("Hand is full, cannot draw any more cards");
    expect(discardCard(game, game.hands["X"].cards[0].id, "X")).toBe(null);
    expect(game.hands["X"].count).toBe(4);
    expect(discardCard(game, game.hands["X"].cards[0].id, "X")).toBe("No more discards left");
    expect(game.hands["X"].count).toBe(4);
    expect(drawCard(game, game.currentPlayer)).toBe(null);
    expect(game.hands["X"].count).toBe(5);
    endTurn(game, "X");

    beginTurn(game, "O");
    expect(game.turnNumber).toBe(2);
    expect(game.currentPlayer).toBe("O");
    expect(game.state).toBe("ongoing");

    expect(game.hands["O"].count).toBe(5);
    expect(drawCard(game, game.currentPlayer)).toBe("Hand is full, cannot draw any more cards");
    expect(discardCard(game, game.hands["O"].cards[0].id, "O")).toBe(null);
    expect(game.hands["O"].count).toBe(4);
    expect(discardCard(game, game.hands["O"].cards[0].id, "O")).toBe("No more discards left");
    expect(game.hands["O"].count).toBe(4);
    expect(drawCard(game, game.currentPlayer)).toBe(null);
    expect(game.hands["O"].count).toBe(5);

    endTurn(game, "O");

  });

});


describe('playCard function', () => {
  let game;
  const playerSymbol = "X";
  const otherPlayerSymbol = "O";
  let playableCardId;
  let playableCard;

  beforeEach(() => {
    game = getInitialGameState();
    initializePlayer(30, game, playerSymbol, "1234");
    initializePlayer(30, game, otherPlayerSymbol, "3456");
    
    playableCard = Object.values(cardMap)[0]; // Assume that this card can be played
    playableCard.setID("1234", 1);
    playableCardId = playableCard.id; 
    
    // Adding playable card to player's hand artificially
    game.hands[playerSymbol].cards.push(playableCard);
    game.hands[playerSymbol].count++;
    
    // Setting player's resources to be enough to play the card
    game.players.find(p => p.symbol === playerSymbol).spendingResources = playableCard.cost;
  });

  test('should play the card correctly and move it to the battlefield', () => {
    const { player } = getPlayers(game, playerSymbol);
    expect(game.hands[playerSymbol].count).toBe(6);
    expect(playCard(game, playableCardId, playerSymbol)).toBe(null);
    expect(game.hands[playerSymbol].cards).not.toContain(playableCard);
    expect(game.hands[playerSymbol].count).toBe(5);
    expect(game.battlefields[playerSymbol].cards).toContain(playableCard);
    expect(game.battlefields[playerSymbol].count).toBe(1);
    expect(player.spendingResources).toBe(0); // Assume the cost of the card was equal to player's resources

    // cannot discard card
    expect(discardCard(game, playableCardId, playerSymbol)).toBe("Error with discard, card not found in hand");    
  });

  test('should return error message if not enough resources to play the card', () => {
    const { player } = getPlayers(game, playerSymbol);
    player.spendingResources = 0; // Player has no resources
    expect(playCard(game, playableCardId, playerSymbol)).toBe(`Card ${playableCard.name} costs ${playableCard.cost} and you only have 0 resources`);
  });
});


describe('bunkerizeCard function', () => {
  let game;
  const playerSymbol = "X";
  const otherPlayerSymbol = "O";
  let reaperCardId;
  let reaperCard;

  beforeEach(() => {
    game = getInitialGameState();
    initializePlayer(30, game, playerSymbol, "1234");
    initializePlayer(30, game, otherPlayerSymbol, "3456");
    
    reaperCard = Object.values(cardMap).find(card => card.name === "Reaper"); // Assume this card is of type "familiar" and can be bunkerized
    reaperCard.setID("1234", 1);
    reaperCardId = reaperCard.id; 
    
    // Adding Reaper card to player's hand artificially
    game.hands[playerSymbol].cards.push(reaperCard);
    game.hands[playerSymbol].count++;
    
    // Setting player's resources to be enough to bunkerize the card
    game.players.find(p => p.symbol === playerSymbol).spendingResources = reaperCard.cost;
  });

  test('should bunkerize the card correctly and move it to a bunker', () => {
    const bunkerIndex = 0; // Assuming the first bunker
    expect(game.hands[playerSymbol].count).toBe(6); // Assuming player had 5 cards initially
    expect(bunkerizeCard(game, reaperCardId, bunkerIndex, playerSymbol)).toBe(null);
    expect(game.hands[playerSymbol].cards).not.toContain(reaperCard);
    expect(game.hands[playerSymbol].count).toBe(5);
    expect(game.bunkers[playerSymbol][bunkerIndex].cards).toContain(reaperCard);
    expect(game.bunkers[playerSymbol][bunkerIndex].count).toBe(1);
    expect(game.players.find(p => p.symbol === playerSymbol).spendingResources).toBe(0);
  });

  test('should return error message if not enough resources to bunkerize the card', () => {
    const bunkerIndex = 0;
    game.players.find(p => p.symbol === playerSymbol).spendingResources = 0; // Player has no resources
    expect(bunkerizeCard(game, reaperCardId, bunkerIndex, playerSymbol)).toBe(`Card ${reaperCard.name} costs ${reaperCard.cost} and you only have 0 resources`);
  });

  test('should return error message if bunker index is out of range', () => {
    const invalidBunkerIndex = 100; // Assuming this index is out of range
    expect(bunkerizeCard(game, reaperCardId, invalidBunkerIndex, playerSymbol)).toBe("Error with bunkerize, provided bunker index is out of range");
  });

  test('should return error message if the target bunker is already occupied', () => {
    const bunkerIndex = 0;
    game.bunkers[playerSymbol][bunkerIndex].cards.push({}); // Artificially filling the bunker
    expect(bunkerizeCard(game, reaperCardId, bunkerIndex, playerSymbol)).toBe("Error with bunkerize, the target bunker is already occupied");
  });
});
