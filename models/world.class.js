/**
 * @class World
 */
class World{
    /**
     * Create a new Character (Sharkie)
     * @type {object}
     */
    character = new Character();

     /**
     * Canvas Context
     * @type {CanvasRenderingContext2D}
     */
    ctx;

     /**
     * Constant <strong>LEVEL1</strong> contains the objects for the world @see LEVEL1
     * @type {Object}
     */
    level = LEVEL1;

    /**
     * Canvas element
     * @type {HTMLElement}
     */
    canvas;

    /**
     * @see Keyboard
     * @type {object}
     */
    keyboard;

    /**
     * Position of the camera at the x axis
     * @type {number}
     */
    camera_x = 0;
    
    throwable_objects = [];
    poison_bottles = [];

    health_empty = false;
    coins_full = false;
    poisons_full = false;
    poisons_empty = false;

    start = false;
    stop = false;

    win_img = new Image();
    lose_img = new Image();
    try_again_img = new Image();

    hurt_sound = new Audio("audio/hurt.mp3");
    slap_sound = new Audio("audio/slap.mp3");
    bubble_sound = new Audio("audio/bubble.mp3");
    electro_sound = new Audio("audio/electro.mp3");
    bottle_sound = new Audio("audio/bottle.mp3");
    coin_sound = new Audio("audio/coin.mp3");
    life_sound = new Audio("audio/life.mp3");
    win_sound = new Audio("audio/win.mp3");
    gameover_sound = new Audio("audio/gameover.mp3");
    endboss_appears_sound = new Audio("audio/endboss_appears.mp3");
    endboss_hurt_sound = new Audio("audio/endboss_hurt.mp3");
    
    /**
     * Set the values of {@link World#canvas} and {@link World#keyboard}.
     * @param {HTMLElement} canvas - Canvas element
     * @param {object} keyboard - @see Keyboard
     */
    constructor(canvas,keyboard){
        this.ctx = canvas.getContext("2d");
        this.canvas = canvas;
        this.win_img.src = "img/6.Botones/Try again/Mesa de trabajo 1.png";
        this.lose_img.src = "img/6.Botones/Tittles/Game Over/Recurso 13.png";
        this.try_again_img.src = "img/6.Botones/Try again/Recurso 17.png";
        this.keyboard = keyboard;
        this.draw();
        this.setWorld();
        this.checkCollisions();
        this.throwBubbles();
        this.endbossAppearsSound();  
    }

    /**
     * Set {@link World} as variable in {@link Character} 
     */
    setWorld(){
        this.character.world = this;
    }
    
    /**
     * Draw all the objects in the canvas
     */
    draw(){
        let self = this;
        this.ctx.clearRect(0,0, this.canvas.width,this.canvas.height);
        this.ctx.translate(this.camera_x,0);
        this.fillMap();
        this.ctx.translate(-this.camera_x,0);
        let req = requestAnimationFrame(function() {
            self.draw()
        })
        if(this.stop){
            cancelAnimationFrame(req);
        }
    }
    
    fillMap(){
        this.addGroupsOfObjectsToMap();
        this.addToMap(this.level.endboss);
        this.addToMap(this.character);
    }
    
    addGroupsOfObjectsToMap(){
        this.addObjectsToMap(this.level.background_objects);
        this.addObjectsToMap(this.level.enemies);
        this.addObjectsToMap(this.level.items.coins);
        this.addObjectsToMap(this.level.items.poisons);
        this.addObjectsToMap(this.level.items.hearts);
        this.addObjectsToMap(this.level.statusbars);
        this.addObjectsToMap(this.throwable_objects);
    }
    
    /**
     * Check if the hitbox from each {@link Enemy} is colliding with the hitbox from the {@link Character}
     */
    checkCollisions(){
        this.collisionWithEnemy();
        this.editHealthbar();
        this.collisionWithCoin();
        this.collisionWithPoison();
        this.collisionWithHeart();
        this.bubbleCollisionWithEnemies();
        this.bubbleCollisionWithEndboss();
        this.slapEnemies();
    }

    increaseStatusbar(i){
        this.level.statusbars[i].current_img ++;
        this.level.statusbars[i].img = this.level.statusbars[i].image_cache[this.level.statusbars[i].IMAGES[this.level.statusbars[i].current_img]];
    }

    decreaseStatusbar(i){
        this.level.statusbars[i].current_img --;
        this.level.statusbars[i].img = this.level.statusbars[i].image_cache[this.level.statusbars[i].IMAGES[this.level.statusbars[i].current_img]];
    }
    
    collisionWithEnemy(){
        let interval = setInterval(() => {
            this.level.enemies.forEach(enemy =>{
                if(this.character.sharkieIsColliding(enemy) && !this.character.isSlapping() && !this.level.endboss.dead){
                    this.checkEnemy(enemy);
                }
                this.collisionWithEndboss()
            })
        }, 150);
    }
    
    checkEnemy(enemy){
        if(enemy instanceof PufferFish && !enemy.dead && !this.character.killed && !this.character.dead){
            this.character.hit();
            this.hurt_sound.play();
        }
        if(enemy instanceof JellyFish && !enemy.dead && !this.character.killed && !this.character.dead){
            this.character.shock();
            this.electro_sound.play();
        }
    }

    collisionWithEndboss(){
        if(this.character.sharkieIsCollidingWithEndboss(this.level.endboss) && !this.character.killed && !this.character.dead && !this.level.endboss.dead){
            this.character.kill();
        }
    }

    editHealthbar(){
        let interval = setInterval(() => {
            this.level.enemies.forEach(enemy => {
                if(this.character.sharkieIsColliding(enemy) && !this.character.isSlapping() && !this.level.endboss.dead){
                    this.checkHealth();  
                }
                })
                if(this.character.sharkieIsCollidingWithEndboss(this.level.endboss) && !this.level.endboss.dead){
                    this.hurt_sound.play();
                    for (let i = 0; i < 3; i++) {this.checkHealth()};
                }
        }, 500);
    }
    
    checkHealth(){
        if(this.level.statusbars[0].current_img <= 0){
            this.level.statusbars[0].current_img = 0;
            this.health_empty = true;
            this.checkIfSharkieIsBeingKilled();
            this.checkIfSharkieIsDying();
        }
        if(!this.health_empty){
            this.decreaseStatusbar(0)
        } 
    }
    
    checkIfSharkieIsDying(){
         if(this.character.isHurt() && !this.character.killed || this.character.isElectrocuted() && !this.character.killed){
             this.character.dead = true;
             this.gameOver()
         }
     }

     checkIfSharkieIsBeingKilled(){
         if(this.character.isKilled()){
             this.character.killed = true;
             this.gameOver()
         }   
     }

     gameOver(){
         setTimeout(() => {
             this.stop = true;
             setTimeout(() => {
                 this.drawGameOverImage();
                 game_sound.pause();
                }, 300);
            }, 3000);
            checkIfRestartIsPressed();
    }
        
    drawGameOverImage(){
        if(this.level.endboss.dead){
            this.ctx.drawImage(this.win_img ,0,0,720,480);  
            this.ctx.drawImage(this.try_again_img,210,360,300,80);  
            this.win_sound.play();      
            } else{
                this.ctx.drawImage(this.lose_img ,20,80,670,200);        
                this.ctx.drawImage(this.try_again_img,210,360,300,80);
                this.gameover_sound.play();        
        }      
     }
    
    collisionWithCoin(){
        let interval = setInterval(() => {
            this.level.items.coins.forEach(coin =>{
                if(this.character.sharkieIsColliding(coin)){
                   this.checkCoins(coin);
                }
            })
        }, 200);
    }

    checkCoins(coin){
        if(this.level.statusbars[2].current_img == 5){
            this.level.statusbars[2].current_img = 4;
            this.coins_full = true;
        }
        if(!this.coins_full){
            coin.y = -50
            this.increaseStatusbar(2);
            this.coin_sound.play();
        }
    }

    collisionWithHeart(){
        let interval = setInterval(() => {
            this.level.items.hearts.forEach(heart =>{
                if(this.character.sharkieIsColliding(heart)){
                    if(this.level.statusbars[0].current_img < 5){
                    heart.y = -50
                    this.increaseStatusbar(0);
                    this.life_sound.play();
                    }
                }
            })
        }, 200);
    }

    collisionWithPoison(){
        let interval = setInterval(() => {
            this.level.items.poisons.forEach(poison =>{
                if(this.character.sharkieIsColliding(poison)){
                    this.checkPoisons(poison);
                }
            })
        }, 200);
    }

    checkPoisons(poison){
        if(this.level.statusbars[1].current_img == 5){
            this.poisons_full = true;
        }
        if(this.level.statusbars[1].current_img < 5){
            this.poisons_full = false;
        }
        if(!this.poisons_full){
            poison.y = -100
            this.increaseStatusbar(1);
            this.poison_bottles.push("bottle");
            this.bottle_sound.play();
        }
    }


    bubbleCollisionWithEnemies(){
        let interval = setInterval(() => {
            this.throwable_objects.forEach(bubble =>{
                this.level.enemies.forEach(enemy =>{
                    this.checkIfBubbleIsCollidingWithEnemy(enemy,bubble);
                })
            })
        }, 50);
    }

    checkIfBubbleIsCollidingWithEnemy(enemy,bubble){
        if(bubble.isColliding(enemy)){
            bubble.y = -100;
            setInterval(() => {
                this.enemyDeadAnimation(enemy);
            }, 50);
        } else{
            setTimeout(() => {
                bubble.y = -100;
            }, 500);
        }
    }
    
    enemyDeadAnimation(enemy){
        enemy.drawImages(enemy.IMG_DEAD);
                enemy.dead = true;
                if(enemy.y > -200){
                    enemy.y -= 20;
                    enemy.x -= 50;
                }
    }

    bubbleCollisionWithEndboss(){
        let interval = setInterval(() => {
            this.throwable_objects.forEach(bubble => {
                if(bubble.isCollidingWithEndboss(this.level.endboss)){
                    bubble.y = -100;
                    this.endboss_hurt_sound.play();
                    this.level.endboss.hit();
                    this.editEndbossbar();
                }
            });
        }, 50);
    }

    editEndbossbar(){
        if(this.level.statusbars[3].current_img > 0){
            this.decreaseStatusbar(3);
        } else{
            this.level.endboss.dead = true;
            this.gameOver()
        }
    }


    throwBubbles(){
        setInterval(() => {
            if(this.keyboard.D){
                if(!this.character.isAttacking()){
                    this.character.attack();
                    this.setNewBubble();
                    setTimeout(() => {
                     this.bubble_sound.play();
                     }, 400);  
                }
            }
        }, 100);
    }

    setNewBubble(){
        if(this.poison_bottles.length != 0){
            this.poison_bottles.pop();
            this.decreaseStatusbar(1);
            setTimeout(() => {
                if(this.character.other_direction){
                    this.throwable_objects.push(new ThrowableObject(this.character.x - 250,this.character.y,true))
                } else{
                    this.throwable_objects.push(new ThrowableObject(this.character.x,this.character.y,false))
                }
            }, 600);
        }
    }

    slapEnemies(){
        setInterval(() => {
            if(this.keyboard.SPACE){
                if(!this.character.isSlapping()){
                    this.character.slap();
                    this.checkSlapCollision();
                    setTimeout(() => {
                        this.slap_sound.play();
                    }, 400);
                }
            }
        }, 100);
    }

    checkSlapCollision(){
        this.level.enemies.forEach(enemy =>{
            if(this.character.sharkieIsInRange(enemy)){
               setTimeout(() => {
                setInterval(() => {
                    this.enemyDeadAnimation(enemy);
                }, 50);
               }, 500);
            }
        })
    }

    endbossAppearsSound(){
        let interval = setInterval(() => {
            if(this.character.x > 3550){
                this.endboss_appears_sound.play();
                clearInterval(interval)
            }
        }, 300);
    }

    /**
     * Draw the objects from an array.
     * @param {array} objects - array with different objects.
     */
    addObjectsToMap(objects){
        objects.forEach(obj => {
            this.addToMap(obj)
        })
    }

    /**
     * Draw the object and his hitbox.
     * @param {object} mo - Movable object @see {@link MovableObject}.
     */
    addToMap(mo) {
        if(mo.other_direction){
           this.flipImage(mo);
        } 
        mo.draw(this.ctx);
        if(mo.other_direction){
           this.flipImageBack(mo);
        } 
    }

    /**
     * Flip the object to the other direction.
     * @param {object} mo - Movable object @see {@link MovableObject}
     */
    flipImage(mo){
        this.ctx.save();
        this.ctx.translate(mo.width,0);
        this.ctx.scale(-1,1);
        mo.x = mo.x * -1;
    }
    
     /**
     * Flip the object to his initial direction.
     * @param {object} mo - Movable object @see {@link MovableObject}
     */
    flipImageBack(mo){
        mo.x = mo.x * -1;
        this.ctx.restore();
    }
}