class GameObject {
    constructor(x, y) {
      this.x = x;  // X position
      this.y = y;  // Y position
      this.isAlive = true;  // Whether the object is still active in the game
    }
    
    move(dx, dy) {
      this.x += dx;
      this.y += dy;
    }
    
    destroy() {
      this.isAlive = false;
    }
  }

  class Ship extends GameObject {
    constructor(x, y) {
      super(x, y);
      this.lives = 3;  // Example: Start with 3 lives
    }
    
    shoot() {
      // Create a blaster object starting at the ship's position
      return new Blaster(this.x, this.y - 1);  // "-1" to shoot upwards
    }
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    
        // Optional: add boundary checks to prevent the ship from moving out of screen bounds
        this.x = Math.min(Math.max(this.x, 0), window.innerWidth - 50);  // assuming a ship width of 50
      }
    loseLife() {
      this.lives -= 1;
      if (this.lives <= 0) {
        this.destroy();
      }
    }
  }
  
  class Enemy extends GameObject {
    constructor(x, y, type) {
      super(x, y);
      this.type = type;  // Different enemy types may have different behaviors or attributes
      this.speed = 1;    // Example speed
    }
    
    movePattern() {
      // Define some movement pattern based on the enemy type
      // This is just a basic example; Galaga has complex patterns
      this.move(this.speed, 0);  // Move horizontally by speed
    }
  }
  class Blaster extends GameObject {
    constructor(x, y, fromEnemy = false) {
      super(x, y);
      this.speed = 2;     // Blaster speed
      this.fromEnemy = fromEnemy; // If true, this is a shot from the enemy. If false, from the player.
    }
    
    move() {
      if (this.fromEnemy) {
        this.y += this.speed;  // Move downwards if shot by enemy
      } else {
        this.y -= this.speed;  // Move upwards if shot by player
      }
    }
  }
  
  // galaga.js

  class Game {
    constructor() {
      this.ship = new Ship(window.innerWidth / 2, window.innerHeight - 30);
      this.enemies = this.generateInitialEnemies();
      this.blasters = [];
    }
  
    // Initial setup: for simplicity, let's add a few enemies in a row
    generateInitialEnemies() {
      const enemies = [];
      for (let i = 0; i < 5; i++) {
        enemies.push(new Enemy(i * 50, 10, 'basic'));
      }
      return enemies;
    }
  
    // Add a blaster when the player shoots
    playerShoots() {
      this.blasters.push(this.ship.shoot());
    }
  
    // Check for collisions
    checkCollisions() {
      for (let blaster of this.blasters) {
        for (let enemy of this.enemies) {
          if (blaster.x === enemy.x && blaster.y === enemy.y) {
            blaster.destroy();
            enemy.destroy();
          }
        }
  
        // Remove blasters that have left the screen or collided with enemies
        if (blaster.y < 0 || !blaster.isAlive) {
          this.blasters = this.blasters.filter(b => b !== blaster);
        }
      }
  
      // Remove defeated enemies
      this.enemies = this.enemies.filter(enemy => enemy.isAlive);
    }
  
    // The main game update function
    tick() {
      // Update blasters
      for (let blaster of this.blasters) {
        blaster.move();
      }
  
      // Update enemy patterns (for simplicity, only moving them horizontally)
      for (let enemy of this.enemies) {
        enemy.movePattern();
      }
  
      // Check for collisions
      this.checkCollisions();
    }
  }
  
  export { Game, Ship, Enemy, Blaster };
