const { cardMap, getPlayers } = require('../server/mfercastle/cards');
const { initializePlayer, getInitialGameState, playCard, beginTurn, endTurn } = require('../server/mfercastle/state');

describe('repurposeEffect function', () => {
  let game;
  const playerSymbol = "X";
  const otherPlayerSymbol = "O";
  const repurposeCard = cardMap[14];

  beforeEach(() => {
    expect(repurposeCard.name === "Repurpose");

    game = getInitialGameState();
    initializePlayer(30, game, playerSymbol, "1234");
    initializePlayer(30, game, otherPlayerSymbol, "3456");
    repurposeCard.setID("1234", 100);
    let { player } = getPlayers(game, playerSymbol);
    player.wallStrength = 5;
    player.spendingResources = repurposeCard.cost;
    game.hands[playerSymbol].cards.push(repurposeCard);
    game.hands[playerSymbol].count++;
  });

  test('should decrease castleStrength by 15 and increase wallStrength by 30 when castleStrength > 15', () => {
    let { player } = getPlayers(game, playerSymbol);
    player.castleStrength = 20;
    const initialResources = player.spendingResources;
    expect(playCard(game, repurposeCard.id, playerSymbol)).toBe(null);
    expect(player.castleStrength).toBe(5);
    expect(player.wallStrength).toBe(35);
    expect(player.spendingResources).toBe(initialResources - repurposeCard.cost);
  });

  test('should set castleStrength to 1 and increase wallStrength by 30 when 1 < castleStrength <= 15', () => {
    let { player } = getPlayers(game, playerSymbol);
    player.castleStrength = 10;
    expect(playCard(game, repurposeCard.id, playerSymbol)).toBe(null);
    expect(player.castleStrength).toBe(1);
    expect(player.wallStrength).toBe(35);

  });

  test('should not change castleStrength and wallStrength when castleStrength <= 1', () => {
    let { player } = getPlayers(game, playerSymbol);
    player.castleStrength = 1;
    const initialResources = player.spendingResources;
    expect(playCard(game, repurposeCard.id, playerSymbol)).toBe("Could not play Repurpose because tower strength is at 1");
    expect(player.castleStrength).toBe(1);
    expect(player.wallStrength).toBe(5);
    expect(player.spendingResources).toBe(initialResources);
  });
});


describe('splinterEffect function', () => {
  let game;
  const playerSymbol = "X";
  const otherPlayerSymbol = "O";
  const splinterCard = cardMap[21];

  beforeEach(() => {
    // Assert the name of the card to avoid misconfiguration
    expect(splinterCard.name).toBe("Splinter");

    game = getInitialGameState();
    initializePlayer(30, game, playerSymbol, "1234");
    initializePlayer(30, game, otherPlayerSymbol, "3456");
    splinterCard.setID("1234", 101);

    let { player } = getPlayers(game, playerSymbol);
    game.hands[playerSymbol].cards.push(splinterCard); // Add splinterCard to player's hand
    game.hands[playerSymbol].count += 1;
    player.spendingResources = 5; // Set spendingResources properly
    
    // Call setID on splinterCard

  });

  test('should deal 2 damage to other player and add a delayed effect', () => {
    // Arrange
    let { otherPlayer, player } = getPlayers(game, playerSymbol);
    const initialWallStrength = otherPlayer.wallStrength;
    const initialCastleStrength = otherPlayer.castleStrength;
    const initialResources = player.spendingResources; 

    // Act: Play the splinterCard
    expect(playCard(game, splinterCard.id, playerSymbol)).toBe(null);

    // Assert: Check that the immediate damage has been dealt correctly
    expect(otherPlayer.wallStrength).toBe(Math.max(0, initialWallStrength - 2));
    expect(otherPlayer.castleStrength).toBe(Math.max(0, initialCastleStrength - Math.max(0, 2 - initialWallStrength)));

    // Assert: Verify that a delayed effect has been correctly added to the game state
    expect(game.delayedEffects).toHaveLength(1);
    expect(game.delayedEffects[0].turnNumber).toBe(game.turnNumber + 2);

    // Act & Assert: Simulate turns to eventually execute the delayed effect and verify game state changes
    endTurn(game, playerSymbol);
    beginTurn(game, otherPlayerSymbol);
    expect(game.delayedEffects[0].turnNumber).toBe(game.turnNumber + 1);

    endTurn(game, otherPlayerSymbol);
    beginTurn(game, playerSymbol);

    expect(game.delayedEffects).toHaveLength(0); // No delayed effects remaining
    expect(player.spendingResources).toBe(initialResources - splinterCard.cost + 1 + player.generators); // Ensure spendingResources have changed appropriately by the cost of the card
  });
});


describe('levyEffect function', () => {
  let game;
  const playerSymbol = "X";
  const otherPlayerSymbol = "O";
  const levyCard = cardMap[10];

  beforeEach(() => {
    expect(levyCard.name === "Splinter");
    game = getInitialGameState();
    initializePlayer(30, game, playerSymbol, "1234");
    initializePlayer(30, game, otherPlayerSymbol, "3456");
  });

  test('should decrease otherPlayer castleStrength by 10 and increase player castleStrength by 10 when otherPlayer castleStrength >= 10', () => {
    let { otherPlayer, player } = getPlayers(game, playerSymbol);
    otherPlayer.castleStrength = 20;
    player.castleStrength = 20;
    levyCard.effect(game, playerSymbol);
    expect(otherPlayer.castleStrength).toBe(10);
    expect(player.castleStrength).toBe(30);
  });

  test('should set otherPlayer castleStrength to 0 and increase player castleStrength by 10 when 0 < otherPlayer castleStrength < 10', () => {
    let { otherPlayer, player } = getPlayers(game, playerSymbol);
    otherPlayer.castleStrength = 5;
    player.castleStrength = 20;
    levyCard.effect(game, playerSymbol);
    expect(otherPlayer.castleStrength).toBe(0);
    expect(player.castleStrength).toBe(30);
  });

  test('should not change otherPlayer castleStrength and increase player castleStrength by 10 when otherPlayer castleStrength <= 0', () => {
    let { otherPlayer, player } = getPlayers(game, playerSymbol);
    otherPlayer.castleStrength = 0;
    player.castleStrength = 20;
    levyCard.effect(game, playerSymbol);
    expect(otherPlayer.castleStrength).toBe(0);
    expect(player.castleStrength).toBe(30);
  });
});

describe('bloodyRitualEffect function', () => {
  let game;
  const playerSymbol = "X";
  const bloodyRitualCard = cardMap[12];

  beforeEach(() => {
    expect(bloodyRitualCard.name).toBe("Bloody Ritual"); // Assuming the card name is "Bloody Ritual"
    game = getInitialGameState();
    initializePlayer(30, game, playerSymbol, "1234");
  });

  test('should decrease player castleStrength by 10 and increase spendingResources by 5 when player castleStrength > 10', () => {
    let { player } = getPlayers(game, playerSymbol);
    player.castleStrength = 20;
    expect(bloodyRitualCard.effect(game, playerSymbol)).toBe(null);
    expect(player.castleStrength).toBe(10);
    expect(player.spendingResources).toBe(8);
  });

  test('should set player castleStrength to 1 and increase spendingResources by 5 when 1 < player castleStrength <= 10', () => {
    let { player } = getPlayers(game, playerSymbol);
    player.castleStrength = 10;
    expect(bloodyRitualCard.effect(game, playerSymbol)).toBe(null);
    expect(player.castleStrength).toBe(1);
    expect(player.spendingResources).toBe(8);
  });

  test('should not change player castleStrength and spendingResources when player castleStrength <= 1', () => {
    let { player } = getPlayers(game, playerSymbol);
    player.castleStrength = 1;
    expect(bloodyRitualCard.effect(game, playerSymbol)).toBe("towerStrength is at 1");
    expect(player.castleStrength).toBe(1);
    expect(player.spendingResources).toBe(3);
  });
});

describe('abandonEffect function', () => {
  let game;
  const playerSymbol = "X";
  const otherPlayerSymbol = "O";
  const abandonCardId = 18; // replace with the actual ID of your Abandon card
  let abandonCard;

  beforeEach(() => {
    game = getInitialGameState();
    initializePlayer(30, game, playerSymbol, "1234");
    initializePlayer(30, game, otherPlayerSymbol, "3456");
    abandonCard = cardMap[abandonCardId];
    expect(abandonCard.name).toBe("Abandon");
  });

  test('should deal damage to the other player and move all cards to the graveyard', () => {
    let { otherPlayer, player } = getPlayers(game, playerSymbol);
    otherPlayer.wallStrength = 1;
    otherPlayer.castleStrength = 25;

    expect(abandonCard.effect(game, playerSymbol)).toBe(null);

    expect(otherPlayer.castleStrength).toBe(1); // Assuming there were 5 cards in hand, so 2*5 = 10 damage
    expect(game.hands[player.symbol].count).toBe(0); // Hand should be empty
    expect(game.graveyards[player.symbol].count).toBe(5); // 5 cards should be in the graveyard
  });
});
