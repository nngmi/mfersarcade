import { Howl } from 'howler';
const GAME_WIDTH = 400;
const GAME_HEIGHT = 500;

const basicSound = new Howl({
    src: ["/audio/blaster.mp3"], // Replace with your sound file path
    autoplay: false, // Play the sound right away
    loop: false, // Do not loop the sound
    volume: 0.5, // Set the volume to 50%
  });
  const winSound = new Howl({
    src: ["/audio/success.mp3"], // Replace with your sound file path
    autoplay: false, // Play the sound right away
    loop: false, // Do not loop the sound
    volume: 0.5, // Set the volume to 50%
  });
  const wrongSound = new Howl({
    src: ["/audio/wrong_sound.mp3"], // Replace with your sound file path
    autoplay: false, // Play the sound right away
    loop: false, // Do not loop the sound
    volume: 0.5, // Set the volume to 50%
  });

class Level {
    constructor(levelNumber) {
        this.levelNumber = levelNumber;
        this.enemies = this.generateEnemiesForLevel();
        this.isCompleted = false; 
    }

    generateEnemiesForLevel() {
        const enemiesPerRow = 5;
        const rows = this.levelNumber; // Number of enemy rows increases with level number
        const spacing = 50; // space between enemies
        const enemies = [];

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < enemiesPerRow; col++) {
                const x = col * spacing + spacing;
                const y = row * spacing + 10; // Adjust as per the enemy height to prevent overlap
                enemies.push(new Enemy(x, y, 'basic'));
            }
        }
        return enemies;
    }

    checkCompletion() {
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
    constructor(x, y) {
        super(x, y);
        this.lives = 5;
        this.radius = 25; // Half of the ship's width (assuming it's 50 as per previous info)
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
        if (this.lives > 0) {
            this.lives -=1;
            wrongSound.play(); // Play the sound when firing
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

  

class Game {
    constructor() {
        this.currentLevel = 1;
        this.level = new Level(this.currentLevel);
        this.ship = new Ship(window.innerWidth / 2, window.innerHeight - 30, this);
        this.enemies = this.level.enemies;
        this.blasters = [];
        this.gameOver = false;
    }

    generateInitialEnemies() {
        const enemies = [];
        for (let i = 0; i < 5; i++) {
            enemies.push(new Enemy(i * 50, 10, 'basic'));
        }
        return enemies;
    }

    playerShoots() {
        this.blasters.push(this.ship.shoot());
        basicSound.play(); // Play the sound when firing
    }

    checkCollisions() {
        for (let blaster of this.blasters) {
            for (let enemy of this.enemies) {
                const enemyWidth = 50;
                const enemyHeight = 50;

                const blasterWidth = 10;
                const blasterHeight = 10;

                const isOverlappingX = blaster.x + blasterWidth > enemy.x && blaster.x < enemy.x + enemyWidth;
                const isOverlappingY = blaster.y + blasterHeight > enemy.y && blaster.y < enemy.y + enemyHeight;

                if (blaster.fromEnemy) {
                    continue;
                }

                if (isOverlappingX && isOverlappingY) {
                    blaster.destroy();
                    enemy.destroy();
                }
            }
            
            for (let blaster of this.blasters) {
                if (blaster.fromEnemy) {
                    const dx = blaster.x - this.ship.x;
                    const dy = blaster.y - this.ship.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.ship.radius + blaster.radius) {
                        blaster.destroy();
                        this.ship.loseLife();
                    }
                }
            }

            this.blasters = this.blasters.filter(b => b.isAlive);
        }

        this.enemies = this.enemies.filter(enemy => enemy.isAlive);
    }

    endGame() {
        this.gameOver = true;
    }

    tick() {
        if (this.gameOver) {
            return;
        }
        if (this.ship.lives === 0) {
            this.gameOver = true;
            return;
        }

        for (let blaster of this.blasters) {
            blaster.move();
        }

        for (let enemy of this.enemies) {
            enemy.movePattern();
        }

        if (Math.random() < 0.03) {
            const shootingEnemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];
            if (shootingEnemy) {
                this.blasters.push(shootingEnemy.shoot());
            }
        }

        this.checkCollisions();

        if (this.level.checkCompletion()) {
            this.advanceToNextLevel();
        }
    }

    advanceToNextLevel() {
        this.currentLevel += 1;
        this.level = new Level(this.currentLevel);
        this.enemies = this.level.enemies;
        this.blasters = [];
        this.ship.x = window.innerWidth / 2;
        this.ship.y = window.innerHeight - 30;
        this.ship.lives = 5;
    }
}


  
export { Game, Ship, Enemy, Blaster };
