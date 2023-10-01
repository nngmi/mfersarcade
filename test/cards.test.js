const { repurposeEffect } = require('../server/mfercastle/cards');
const { initializePlayer, getInitialGameState } = require('../server/mfercastle/state');
describe('repurposeEffect function', () => {
  let game;
  const playerSymbol = "X";
  const otherPlayerSymbol = "O";

  beforeEach(() => {
    game = getInitialGameState();
    initializePlayer(30, game, playerSymbol, "1234");
    initializePlayer(30, game, otherPlayerSymbol, "3456");
    game.players.find(p => p.symbol === playerSymbol).wallStrength = 5;
    
  });

  test('should decrease castleStrength by 15 and increase wallStrength by 30 when castleStrength > 15', () => {
    game.players.find(p => p.symbol === playerSymbol).castleStrength = 20;
    repurposeEffect(game, playerSymbol);
    const player = game.players.find(p => p.symbol === playerSymbol);
    
    expect(player.castleStrength).toBe(5);
    expect(player.wallStrength).toBe(35);
  });

  test('should set castleStrength to 1 and increase wallStrength by 30 when 1 < castleStrength <= 15', () => {
    game.players.find(p => p.symbol === playerSymbol).castleStrength = 10;
    
    repurposeEffect(game, playerSymbol);
    const player = game.players.find(p => p.symbol === playerSymbol);

    expect(player.castleStrength).toBe(1);
    expect(player.wallStrength).toBe(35);
  });

  test('should not change castleStrength and wallStrength when castleStrength <= 1', () => {
    game.players.find(p => p.symbol === playerSymbol).castleStrength = 1;
    
    repurposeEffect(game, playerSymbol);
    const player = game.players.find(p => p.symbol === playerSymbol);
    
    expect(player.castleStrength).toBe(1);
    expect(player.wallStrength).toBe(5);
  });
});
