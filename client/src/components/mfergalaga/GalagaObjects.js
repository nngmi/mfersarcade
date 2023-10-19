import { Howl } from 'howler';
const GAME_WIDTH = 400;
const GAME_HEIGHT = 500;

const basicSound = new Howl({
    src: ["/audio/shot.wav"], // Replace with your sound file path
    autoplay: false, // Play the sound right away
    loop: false, // Do not loop the sound
    volume: 0.25, // Set the volume to 50%
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

const LEVELS = [
    [
        { type: 'normal', count: 5 },
        { type: 'normal', count: 5 }
    ],
    [
        { type: 'normal', count: 5 },
        { type: 'normal2', count: 5 }
    ],
    [
        { type: 'normal', count: 5 },
        { type: 'normal', count: 5 },
        { type: 'normal2', count: 5 }
    ],
    [
        { type: 'normal', count: 5 },
        { type: 'normal2', count: 5 },
        { type: 'normal2', count: 5 }
    ],
    [
        { type: 'normal2', count: 5 },
        { type: 'normal2', count: 5 },
        { type: 'normal3', count: 5 }
    ],
    [
        { type: 'normal3', count: 5 },
        { type: 'normal3', count: 5 }
    ],
    [
        { type: 'normal', count: 5 },
        { type: 'normal2', count: 5 },
        { type: 'normal3', count: 5 },
        { type: 'normal3', count: 5 }
    ],
    [
        { type: 'normal2', count: 5 },
        { type: 'normal2', count: 5 },
        { type: 'normal2', count: 5 },
        { type: 'normal2b', count: 5 },
        { type: 'normal3', count: 5 },
        { type: 'normal3b', count: 5 }
    ],
    [
        { type: 'normal2', count: 5 },
        { type: 'normal2', count: 5 },
        { type: 'normal2b', count: 5 },
        { type: 'normal2', count: 5 },
        { type: 'normal2b', count: 5 },
        { type: 'normal2', count: 5 },
        { type: 'normal3b', count: 5 },
        { type: 'normal3', count: 5 },
        { type: 'normal3b', count: 5 }
    ],
    [
        { type: 'normal3', count: 7 },
        { type: 'normal3', count: 7 },
        { type: 'normal3b', count: 9 },
        { type: 'normal3', count: 9 },
        { type: 'normal3b', count: 9 }
    ],
];


class Level {
    constructor(levelNumber) {
        this.levelNumber = levelNumber;
        this.enemies = this.generateEnemiesForLevel();
        this.isCompleted = false; 
    }

    generateEnemiesForLevel() {
        const spacing = 50;
        const enemies = [];

        // Get the configuration for the current level
        const currentLevelConfig = LEVELS[this.levelNumber - 1];

        let y = 10; // Starting position for the first row

        for (let rowConfig of currentLevelConfig) {
            for (let col = 0; col < rowConfig.count; col++) {
                const x = col * spacing + spacing;

                // Use the enemy type specified in the rowConfig
                const enemyType = rowConfig.type;
                enemies.push(new Enemy(x, y, enemyType));
            }

            // Adjust y for the next row
            y += spacing;
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
        this.radius = 15; // Half of the ship's width (assuming it's 50 as per previous info)
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
        this.type = type;

        // Configure enemy based on its type
        switch (this.type) {
            case 'normal':
                this.strength = 1;
                this.shootingRate = 1;
                this.speed = 1;
                this.direction = 1;  
                break;
            case 'normal2':
                this.strength = 1;
                this.shootingRate = 2;
                this.speed = 2;
                this.direction = -1;  
                break;
            case 'normal2b':
                this.strength = 1;
                this.shootingRate = 2;
                this.speed = 2;
                this.direction = 1;  
                break;
            case 'normal3':
                this.strength = 4;
                this.shootingRate = 3;
                this.speed = 3;
                this.direction = 1;  
                break;
            case 'normal3b':
                this.strength = 4;
                this.shootingRate = 3;
                this.speed = 3;
                this.direction = -1;  
                break;
            
            default:
                throw new Error("Unknown enemy type");
        }

        
    }

    shoot() {
        // If the enemy doesn't shoot (like the ape), then return nothing.
        if (this.shootingRate === 0) return null;

        return new Blaster(this.x, this.y + 1, true); 
    }

    hit() {
        // Decrement the strength of the enemy when hit
        this.strength--;

        // Check if enemy is destroyed after being hit
        return this.strength <= 0;
    }

    movePattern() {
        // Your existing movement logic
        this.move(this.speed * this.direction, 0);
        if (this.x >= GAME_WIDTH - 50) {
            this.direction = -1;
            this.x = GAME_WIDTH - 50;
        } else if (this.x <= 0) {
            this.direction = 1;
            this.x = 0;
        }
    }
  }


  class Blaster extends GameObject {
    constructor(x, y, fromEnemy = false) {
      
      super(x, y);
      this.fromEnemy = fromEnemy;
      this.radius = 3;
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
        this.gamestate = "notyetbegun";
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
        this.gamestate = "gameover";
    }
    startGame() {
        this.gamestate = "ongoing";
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

        const shootingEnemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];

        if (shootingEnemy) {
            if (Math.random() < 0.03 * shootingEnemy.shootingRate) {
                this.blasters.push(shootingEnemy.shoot());
            }
        }

        this.checkCollisions();

        if (this.level.checkCompletion()) {
            if (this.level.levelNumber === 9) {
                console.log("you won!");
                this.gamestate = "victory";
            } else {
                this.advanceToNextLevel();
            }
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
