const { checkGameState } = require('../../server/mfercastle/state');

describe('checkGameState', () => {

    test('should declare player X as the winner when X has towerStrength >= 100', () => {
        const game = {
            decks: {'X': {count: 5}, 'O': {count: 5}},
            players: [{symbol: 'X', towerStrength: 100}, {symbol: 'O', towerStrength: 50}]
        };
        expect(checkGameState(game)).toBe('X-wins');
    });

    test('should declare player O as the winner when O has towerStrength >= 100', () => {
        const game = {
            decks: {'X': {count: 5}, 'O': {count: 5}},
            players: [{symbol: 'X', towerStrength: 50}, {symbol: 'O', towerStrength: 100}]
        };
        expect(checkGameState(game)).toBe('O-wins');
    });

    test('should declare a draw when both players’ decks count are 0', () => {
        const game = {
            decks: {'X': {count: 0}, 'O': {count: 0}},
            players: [{symbol: 'X', towerStrength: 50}, {symbol: 'O', towerStrength: 50}]
        };
        expect(checkGameState(game)).toBe('draw');
    });

    test('should return ongoing when both players have towerStrength > 0 and towerStrength < 100', () => {
        const game = {
            decks: {'X': {count: 5}, 'O': {count: 5}},
            players: [{symbol: 'X', towerStrength: 50}, {symbol: 'O', towerStrength: 50}]
        };
        expect(checkGameState(game)).toBe('ongoing');
    });

    test('should declare player X as the winner when O has towerStrength = 0', () => {
        const game = {
            decks: {'X': {count: 5}, 'O': {count: 5}},
            players: [{symbol: 'X', towerStrength: 50}, {symbol: 'O', towerStrength: 0}]
        };
        expect(checkGameState(game)).toBe('X-wins');
    });

    test('should declare player O as the winner when X has towerStrength = 0', () => {
        const game = {
            decks: {'X': {count: 5}, 'O': {count: 5}},
            players: [{symbol: 'X', towerStrength: 0}, {symbol: 'O', towerStrength: 50}]
        };
        expect(checkGameState(game)).toBe('O-wins');
    });
});
