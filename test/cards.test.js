const { cardMap, getPlayers } = require('../server/mfercastle/cards');
const { initializePlayer, getInitialGameState } = require('../server/mfercastle/state');

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
    let { player } = getPlayers(game, playerSymbol);
    player.wallStrength = 5;
  });

  test('should decrease castleStrength by 15 and increase wallStrength by 30 when castleStrength > 15', () => {
    let { player } = getPlayers(game, playerSymbol);
    player.castleStrength = 20;
    repurposeCard.effect(game, playerSymbol);
    expect(player.castleStrength).toBe(5);
    expect(player.wallStrength).toBe(35);
  });

  test('should set castleStrength to 1 and increase wallStrength by 30 when 1 < castleStrength <= 15', () => {
    let { player } = getPlayers(game, playerSymbol);
    player.castleStrength = 10;
    repurposeCard.effect(game, playerSymbol);
    expect(player.castleStrength).toBe(1);
    expect(player.wallStrength).toBe(35);
  });

  test('should not change castleStrength and wallStrength when castleStrength <= 1', () => {
    let { player } = getPlayers(game, playerSymbol);
    player.castleStrength = 1;
    repurposeCard.effect(game, playerSymbol);    
    expect(player.castleStrength).toBe(1);
    expect(player.wallStrength).toBe(5);
  });
});


describe('splinterEffect function', () => {
  let game;
  const playerSymbol = "X";
  const otherPlayerSymbol = "O";
  const splinterCard = cardMap[21];

  beforeEach(() => {
    console.log(splinterCard);
    expect(splinterCard.name === "Splinter");
    game = getInitialGameState();
    initializePlayer(30, game, playerSymbol, "1234");
    initializePlayer(30, game, otherPlayerSymbol, "3456");
  });

  test('should deal 2 damage to other player and add a delayed effect', () => {
    console.log(game);
    let { otherPlayer } = getPlayers(game, playerSymbol);
    console.log("hello", otherPlayer.castleStrength);
    const initialWallStrength = otherPlayer.wallStrength;
    const initialCastleStrength = otherPlayer.castleStrength;

    
    splinterCard.effect(game, playerSymbol);
    
    // Check that the damage has been dealt correctly
    expect(otherPlayer.wallStrength).toBe(Math.max(0, initialWallStrength - 2));
    expect(otherPlayer.castleStrength).toBe(Math.max(0, initialCastleStrength - Math.max(0, 2 - initialWallStrength)));
    
    // Check that a delayed effect has been added
    expect(game.delayedEffects).toHaveLength(1);
    expect(game.delayedEffects[0].turnNumber).toBe(game.turnNumber + 2);
    
    // Simulate the execution of the delayed effect and check its result
    const { player } = getPlayers(game, playerSymbol);
    const initialResources = player.spendingResources;
    game.delayedEffects[0].effectFunc(game, playerSymbol); // This is invoking the delayed effect manually
    expect(player.spendingResources).toBe(initialResources + 1);
  });
});