const { cardMap, getPlayers } = require('../server/mfercastle/cards');
const { initializePlayer, getInitialGameState, beginTurn, endTurn, drawCard, discardCard} = require('../server/mfercastle/state');

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