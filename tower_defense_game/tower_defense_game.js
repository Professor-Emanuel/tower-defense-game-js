const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

//global variables
const cellSize = 100;
const cellGap = 3;
let numberOfResources = 300;
let enemiesInterval = 600;
let frame = 0;
let gameOver = false;
let score = 0;
const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];

//mouse
const mouse = {
    x:undefined,
    y:undefined,
    width: 0.1,
    height: 0.1
}

//get information about the size of the element relative to view port
let canvasPosition = canvas.getBoundingClientRect();
//console.log(canvasPosition);
canvas.addEventListener('mousemove', function(event){
    //the correct mouse coords are offset buy the left and top space on the page
    mouse.x = event.x - canvasPosition.left;
    mouse.y = event.y - canvasPosition.top;
})

canvas.addEventListener('mouseleave', function(){
    mouse.x = undefined;
    mouse.y = undefined;
})

//game board
const controlBar = {
    width: canvas.width,
    height: cellSize
}

class Cell{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }

    draw(){
        if(mouse.x && mouse.y && collision(this, mouse)){
            ctx.strokeStyle = "black";
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

function createGrid(){
    for(let y = cellSize; y < canvas.height; y += cellSize){
        for(let x = 0; x < canvas.width; x += cellSize){
            gameGrid.push(new Cell(x, y));
        }
    }
}
//call function to create the cell grid
createGrid();

function handleGameGrid(){
    for(let i = 0; i < gameGrid.length; i++){
        gameGrid[i].draw();
    }
}

//projectiles
class Projectiles{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.power = 20;
        this.speed = 5;
    }

    update(){
        this.x += this.speed;
    }

    draw(){
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.fill();
    }
}

function handleProjectiles(){
    for(let i = 0; i < projectiles.length; i++){
        projectiles[i].update();
        projectiles[i].draw();

        for(let j = 0; j < enemies.length; j++){
            if(enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])){
                enemies[j].health -=projectiles[i].power;
                projectiles.splice(i, 1);
                i--;
            }
        }

        if(projectiles[i] && projectiles[i].x > canvas.width - cellSize){
            projectiles.splice(i, 1);
            i--;
        }
        //console.log('projectiles ' + projectiles.length);
    }
}

//defenders
class Defender{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
        this.shooting = false;
        this.health = 100;
        this.projectiles = [];
        this.timer = 0;
    }

    draw(){
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '30px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
    }

    update(){
        this.timer++;
        if(this.timer % 100 === 0){
            projectiles.push(new Projectiles(this.x + 70, this.y + 50));
        }
    }
}

canvas.addEventListener('click', function(){
    //the value of the closest horizontal grid position to the left
    const gridPositionX = mouse.x - (mouse.x %cellSize);
    //the value of the closest vertical grid position to the top
    const gridPositionY = mouse.y - (mouse.y %cellSize);
    if(gridPositionY < cellSize) return;
    //before placing a new defender, check if the cell grid is free
    for(let i = 0; i < defenders.length; i++){
        if(defenders[i].x === gridPositionX && defenders[i].y === gridPositionY){
            return;
        }
    }
    let defenderCost = 100;
    if(numberOfResources >= defenderCost){
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfResources -= defenderCost;
    }
});

function handleDefenders(){
    for(let i = 0; i < defenders.length; i++){
        defenders[i].draw();
        defenders[i].update();
        for(let j = 0; j < enemies.length; j++){
            if(defenders[i] && collision(defenders[i], enemies[j])){
                enemies[j].movement = 0;
                defenders[i].health -= 0.2;
            }
            if(defenders[i] && defenders[i].health <= 0){
                //remove defender, splice is a build in js method
                defenders.splice(i, 1);
                i--;
                enemies[j].movement = enemies[j].speed;
            }
        }
    }
}


//enemies
class Enemy{
    constructor(verticalPosition){
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize;
        this.height = cellSize;
        this.speed = Math.random() * 0.2 + 0.4;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
    }

    update(){
        this.x -= this.movement;
    }

    draw(){
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black';
        ctx.font = '30px Orbitron';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
    }
}

function handleEnemies(){
    for(let i = 0; i < enemies.length; i++){
        enemies[i].update();
        enemies[i].draw();
        //check if any enemies has x coord less than 0, meaning they hit the defender
        if(enemies[i].x < 0){
            gameOver = true;
        }
        if(enemies[i].health <= 0){
            let gainedResources = enemies[i].maxHealth/10;
            numberOfResources += gainedResources;
            score += gainedResources;
            enemies.splice(i, 1);
            i--;
        }
    }
    if(frame % enemiesInterval === 0){
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize;
        enemies.push(new Enemy(verticalPosition));
        enemyPositions.push(verticalPosition);
        //after the 1st enemy appears, the 2nd will appear after 600 frames, next at 500 frames
        //make them appear faster, till enemiesInterval gets at 100
        if(enemiesInterval > 120){
            enemiesInterval -= 50;
        }
    }
}

//resources

//utilities
function handleGameStatus(){
    fillStyle = 'gold';
    ctx.font = '30px Orbitron';
    ctx.fillText("Score: " + score, 20, 40);
    ctx.fillText("Resources: " + numberOfResources, 20, 80);
    if(gameOver){
        ctx.fillStyle ='black';
        ctx.font = '90px Orbitron';
        ctx.fillText("Game Over!", 145, 330);
    }
}

function animate(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, controlBar.width, controlBar.height);
    handleGameGrid();
    handleDefenders();
    handleProjectiles();
    handleEnemies();
    handleGameStatus();
    
    frame++;
    if(!gameOver){
        requestAnimationFrame(animate);
    }
}

animate();

function collision(first, second){
    if( !(
        first.x > second.x + second.width ||
        first.x + first.width < second.x  ||
        first.y > second.y + second.height||
        first.y + first.height < second.y)
    ){
        return true;
    }
    return false;
}