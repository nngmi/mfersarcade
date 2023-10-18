
const GAME_WIDTH = 400;
const GAME_HEIGHT = 500;

class Level {
    constructor(levelNumber) {
      this.levelNumber = levelNumber;
      this.enemies = this.generateEnemiesForLevel();
      this.isCompleted = false; // Flag to check if the level is completed
    }
  
    generateEnemiesForLevel() {
      // Here, we generate enemies based on the current level number.
      // The logic can be extended to generate more enemies, different types, etc., based on the level.
      const enemies = [];
      for (let i = 0; i < this.levelNumber * 5; i++) { // Example: each level has 5 more enemies than the previous
        enemies.push(new Enemy(i * 50, 10, 'basic')); // Placeholder enemy creation
      }
      return enemies;
    }
  
    checkCompletion() {
      // If all enemies are defeated, the level is considered completed
      this.isCompleted = this.enemies.every(enemy => !enemy.isAlive);
      return this.isCompleted;
    }
  }
  

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
    constructor(x, y, game) {
        super(x, y);
        this.lives = 3;
        this.radius = 25; // Half of the ship's width (assuming it's 50 as per previous info)
        this.game = game;
    }
    shoot() {
      // Create a blaster object starting at the ship's position
      return new Blaster(this.x, this.y - 1);  // "-1" to shoot upwards
    }

    move(dx, dy) {
        this.x = Math.max(0, Math.min(this.x + dx, GAME_WIDTH - 50));  // Assuming ship width is 50
        this.y = Math.max(0, Math.min(this.y + dy, GAME_HEIGHT - 50)); // Assuming ship height is 50
    }
    loseLife() {
      this.lives -= 1;
        if (this.lives <= 0) {
            this.game.endGame();  // Assuming you have a reference to the game instance
            console.log("after triggering end game");
            this.destroy();
          }
      
    }
  }
  
  class Enemy extends GameObject {
    constructor(x, y, type) {
      super(x, y);
      this.type = type;  // Different enemy types may have different behaviors or attributes
      this.speed = 1;    // Example speed
      this.direction = 1;  // 1 for right, -1 for left
    }
    shoot() {
        return new Blaster(this.x, this.y + 1, true); // +1 to shoot downwards, and 'true' to indicate it's from an enemy
      }
    movePattern() {
      // Move horizontally by speed
      this.move(this.speed * this.direction, 0);

      // If the enemy hits the right edge
      if (this.x >= GAME_WIDTH - 50) {  // Assuming enemy width is 50
        this.direction = -1;  // Change direction to left
        this.x = GAME_WIDTH - 50;  // Adjust position to ensure it's within the boundary
      }
      // If the enemy hits the left edge
      else if (this.x <= 0) {
        this.direction = 1;  // Change direction to right
        this.x = 0;  // Adjust position to ensure it's within the boundary
      }

      // In this example, the vertical position remains constant, but you can add similar checks for vertical boundaries if needed.
    }
  }

  class Blaster extends GameObject {
    constructor(x, y, fromEnemy = false) {
      
      super(x, y);
      this.fromEnemy = fromEnemy;
      this.radius = 5;
      this.speed = 2;     // Blaster speed
      this.isAlive = true; // Initially, the blaster is alive
    }
    
    move() {
      if (this.fromEnemy) {
        this.y += this.speed;  // Move downwards if shot by enemy
      } else {
        this.y -= this.speed;  // Move upwards if shot by player
      }

      // Check if the blaster is off-screen vertically
      if (this.y < 0 || this.y > GAME_HEIGHT) {
        this.isAlive = false; // Mark blaster as not alive
        return; // No need to continue with the remaining code if the blaster is out of bounds
      }

      // This part of the code constrains the blaster's position, but with the above conditions, 
      // the blaster shouldn't ever go out of horizontal bounds. 
      // Still, I'm retaining this for completeness.
      this.x = Math.max(0, Math.min(this.x, GAME_WIDTH - 10));  // Assuming blaster width is 10
    }
}

  
  // galaga.js

  class Game {
    constructor() {
        this.currentLevel = 1;
        this.level = new Level(this.currentLevel);
        this.ship = new Ship(window.innerWidth / 2, window.innerHeight - 30, this);
        this.enemies = this.level.enemies;
        this.blasters = [];
        this.gameOver = false;
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
        // Assuming enemy width and height are 50 (adjust these values as needed)
        const enemyWidth = 50;
        const enemyHeight = 50;
  
        const blasterWidth = 10; // Assuming blaster width is 10 (adjust as needed)
        const blasterHeight = 10; // Similarly, adjust as needed
  
        const isOverlappingX = blaster.x + blasterWidth > enemy.x && blaster.x < enemy.x + enemyWidth;
        const isOverlappingY = blaster.y + blasterHeight > enemy.y && blaster.y < enemy.y + enemyHeight;

        // Check if the blaster is from the enemy and skip this iteration of the loop
        if (blaster.fromEnemy) {
          continue;
        }
  
        if (isOverlappingX && isOverlappingY) {
          blaster.destroy();
          enemy.destroy();
        }
      }
          // Check for blasters colliding with the player's ship
    for (let blaster of this.blasters) {
        if (blaster.fromEnemy) {
            const dx = blaster.x - this.ship.x;
            const dy = blaster.y - this.ship.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.ship.radius + blaster.radius) {  // assuming blaster.radius is defined
                blaster.destroy();
                this.ship.loseLife();
            }
        }
    }
  
      // Remove blasters that have left the screen or collided with enemies
      if (!blaster.isAlive) {
        this.blasters = this.blasters.filter(b => b !== blaster);
      }
    }
  
    // Remove defeated enemies
    this.enemies = this.enemies.filter(enemy => enemy.isAlive);
}


  endGame() {
    this.gameOver = true;
    // Any additional cleanup logic, stopping timers, etc.
  }
  
    // The main game update function
    tick() {
      // Update blasters
      if (this.gameOver) {
        console.log("game is over");
        return;
      }
      for (let blaster of this.blasters) {
        blaster.move();
      }
  
      // Update enemy patterns (for simplicity, only moving them horizontally)
      for (let enemy of this.enemies) {
        enemy.movePattern();
      }
  

      // enemies can shoot
  // Randomly select an enemy to shoot with some probability
  if (Math.random() < 0.01) {  // 1% chance every tick
    const shootingEnemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];
    if (shootingEnemy) {
      this.blasters.push(shootingEnemy.shoot());
    }
  }
      // Check for collisions
      this.checkCollisions();

      if (this.level.checkCompletion()) {
        this.advanceToNextLevel();
      }
    }
    advanceToNextLevel() {
        this.currentLevel += 1;
        this.level = new Level(this.currentLevel);
        this.enemies = this.level.enemies;
        // Optionally, reset player position, health, etc.
      }
  }
  
  export { Game, Ship, Enemy, Blaster };
