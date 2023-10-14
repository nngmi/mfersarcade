const { dealDamage } = require('../../server/mfercastle/cards');

const { getInitialGameState, initializePlayer } = require('../../server/mfercastle/state');


describe('dealDamage', () => {
    let game;
    const playerSymbol = 'X';
    const otherPlayerSymbol = 'O';
    
    beforeEach(() => {
        game = getInitialGameState();
        initializePlayer(30, game, playerSymbol, "1234");
        initializePlayer(30, game, otherPlayerSymbol, "3456");

        const otherPlayer = game.players.find(player => player.symbol === otherPlayerSymbol);
        otherPlayer.towerStrength = 50;
        otherPlayer.wallStrength = 30;

    });
    
    test('should deal damage ignoring the wall when ignoreWall is true', () => {
        const damageDealt = dealDamage(game, playerSymbol, 20, true);
        
        const otherPlayer = game.players.find(player => player.symbol === otherPlayerSymbol);
        expect(damageDealt).toBe(20);
        expect(otherPlayer.wallStrength).toBe(30); // Wall should not be damaged
        expect(otherPlayer.towerStrength).toBe(30); // All damage should be dealt to the tower
    });

    test('should deal damage to the wall and the tower when ignoreWall is false', () => {
        const damageDealt = dealDamage(game, playerSymbol, 20);
        
        const otherPlayer = game.players.find(player => player.symbol === otherPlayerSymbol);
        expect(damageDealt).toBe(20);
        expect(otherPlayer.wallStrength).toBe(10); // Wall should be damaged
        expect(otherPlayer.towerStrength).toBe(50); // no remaining damage to tower
    });

    test('should modify damage according to persistentEffects', () => {
        game.persistentEffects.push({
            turnNumber: 0,
            type: 'damageModifier',
            effectFunc: (damage) => damage * 2 // Double the damage
        });

        const damageDealt = dealDamage(game, playerSymbol, 20);
        
        const otherPlayer = game.players.find(player => player.symbol === otherPlayerSymbol);
        expect(damageDealt).toBe(40); // Damage should be doubled due to persistentEffects
        expect(otherPlayer.wallStrength).toBe(0); // Wall should be damaged
        expect(otherPlayer.towerStrength).toBe(40); // Remaining damage should be dealt to the tower
    });

    test('should not let towerStrength go below 0', () => {
        const damageDealt = dealDamage(game, playerSymbol, 10000);
        
        const otherPlayer = game.players.find(player => player.symbol === otherPlayerSymbol);
        expect(damageDealt).toBe(80);
        expect(otherPlayer.wallStrength).toBe(0);
        expect(otherPlayer.towerStrength).toBe(0); // Tower strength should not go below 0
    });
});
