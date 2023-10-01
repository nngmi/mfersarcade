const { cardMap, getPlayers } = require('../server/mfercastle/cards');
const { initializePlayer, getInitialGameState, beginTurn, endTurn} = require('../server/mfercastle/state');

describe('repurposeEffect function', () => {
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
    endTurn(game, "X");
    beginTurn(game, "O");
    expect(game.turnNumber).toBe(2);
    expect(game.currentPlayer).toBe("O");
    expect(game.state).toBe("ongoing");
    endTurn(game, "O");

  });

});