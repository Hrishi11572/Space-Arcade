// version 2 
let screenWidth, screenHeight, obstacleHeight , obstacleWidth;
let spacecraftWidth, spacecraftHeight, spacecraftMoveSpeed;
let imageLoaded = false;
let spacecraftX = 0;
let animationFrameId = null;
let isGameOver = false;
let frameCount = null;
let fallingBlocks = null;
let startTime = null;
let score = null;
let fireballs = [];
let gameLevel = 1;

function startGame() {
    // Hide intro, show game
    document.getElementById("intro-screen").style.display = "none";
    document.getElementById("game-container").style.display = "block";

    // Get user settings
    gameLevel = parseInt(document.getElementById("level").value);
    spacecraftMoveSpeed = parseInt(document.getElementById("moveSpeed").value);
    spacecraftWidth = parseInt(document.getElementById("spaceWidth").value);
    spacecraftHeight = parseInt(document.getElementById("spaceHeight").value);
    const obstaclePercent = parseFloat(document.getElementById("obstacleSize").value);

    // Initialize canvas and game state
    const canvas = document.getElementById("game-canvas");
    const ctxLocal = canvas.getContext("2d");
    window.canvas = canvas;
    window.ctx = ctxLocal;

    screenWidth = canvas.width;
    screenHeight = canvas.height;
    obstacleWidth = screenWidth * (obstaclePercent / 100);
    obstacleHeight = screenHeight * (obstaclePercent / 100);

    spacecraftX = (screenWidth - spacecraftWidth) / 2;
    fireballs = [];
    frameCount = 0;
    fallingBlocks = [];
    isGameOver = false;
    startTime = Date.now();
    score = 0;

    // Load image and start game loop after loading
    spacecraftImg = new Image();
    spacecraftImg.src = "assets/spacecraft.png";
    spacecraftImg.onload = () => {
        imageLoaded = true;
        gameLoop();
    };
}

function drawScore(){
    const elapsed = ((Date.now() - startTime)/1000).toFixed(1);
    const remaining = Math.max(0, (15-elapsed)).toFixed(1); 

    ctx.fillStyle = "white"; 
    ctx.font = "16px Arial"; 
    ctx.fillText(`Time: ${remaining}`, 10, 20); 
    ctx.fillText(`Score: ${score}`, 10, 40);
}

function drawSpacecraft(){
    if (imageLoaded) {

        ctx.drawImage(
            spacecraftImg, 
            spacecraftX , // x-coordinate of space craft 
            screenHeight - spacecraftHeight, 
            spacecraftWidth, spacecraftHeight
        );
    }
}

function InitScreen(){
    /* 
        This function Defines the Screen Dimensions and 
        Obstacle Dimensions.
    */
    screenWidth = canvas.width; 
    screenHeight = canvas.height; 
    obstacleHeight = canvas.height * 0.05; 
    obstacleWidth = canvas.width * 0.05 ; 
    ctx.fillStyle = "red"; 

    spacecraftX = (screenWidth - spacecraftWidth)/2 ; 
}

// keyboard event listner 
window.addEventListener("keydown" , (e)=>{
    if(e.key == 'ArrowLeft' || e.key == 'a'){
        spacecraftX -= spacecraftMoveSpeed; 
        if(spacecraftX < 0) spacecraftX = 0; 
    }else if(e.key == 'ArrowRight' || e.key == 'd'){
        spacecraftX += spacecraftMoveSpeed; 
        if(spacecraftX + spacecraftWidth > screenWidth){
            spacecraftX = screenWidth - spacecraftWidth; 
        }
    }else if(e.key == ' '){
        // fire a fireball 
        fireballs.push(
            {
                x: spacecraftX + spacecraftWidth / 2 - 2, // Centered
                y: screenHeight - spacecraftHeight,
                width: 4,
                height: 10,
                speed: 10
            }
        );
    }
});

function createBlock(){
    return {
        x : Math.floor(Math.random() * (screenWidth - obstacleWidth)),
        y : 0, 
        width : obstacleWidth, 
        height : obstacleHeight,
        hitsRemaining : gameLevel // 1, 2, 3 before destroying (based on level)
    };
}

function checkCollision(block) {
    const spacecraftY = screenHeight - spacecraftHeight;

    return !(
        spacecraftX + spacecraftWidth < block.x ||      // spacecraft is left of block
        spacecraftX > block.x + block.width ||          // spacecraft is right of block
        spacecraftY + spacecraftHeight < block.y ||     // spacecraft is above block
        spacecraftY > block.y + block.height            // spacecraft is below block
    );
}

function gameLoop(){
    if (isGameOver) return;

   ctx.clearRect(0,0,screenWidth, screenHeight); 

    drawSpacecraft();
    drawScore(); 

    // Stop game after 15 seconds
    const elapsed = (Date.now() - startTime) / 1000;
    if (elapsed >= 15 || isGameOver) {
        ctx.fillStyle = "white"; 
        ctx.font = "30px Arial";
        ctx.fillText("Game Over!", screenWidth / 2 - 80, screenHeight / 2);
        return;
    }

    if(frameCount % 50 == 0){  // Add a new block every 100 frames
        fallingBlocks.push(createBlock()); 
    }
    
    frameCount++ ; 

    for(let block of fallingBlocks){
        block.y += 1 * gameLevel ; 
        ctx.fillStyle = "red";
        ctx.fillRect(block.x, block.y, block.width, block.height);

        if(checkCollision(block)){
            console.log("Collision Detected!"); 
            isGameOver = true;
            ctx.fillStyle = "white";
            ctx.font = "30px Arial";
            ctx.fillText("Game Over!", screenWidth / 2 - 80, screenHeight / 2);
            return;
        }
    }

    fallingBlocks = fallingBlocks.filter(block => block.y <= screenHeight); // Remove blocks that fall beyond the canvas
    
    // fireball logic 
    ctx.fillStyle = "orange";

    for (let i = fireballs.length - 1; i >= 0; i--) {
        const fb = fireballs[i];
        fb.y -= fb.speed;

        // Draw fireball
        ctx.fillRect(fb.x, fb.y, fb.width, fb.height);

        // Remove fireballs that go off-screen
        if (fb.y + fb.height < 0) {
            fireballs.splice(i, 1);
            continue;
        }

        // Check collision with blocks
        let hitBlockIndex = -1;
        for (let j = fallingBlocks.length - 1; j >= 0; j--) {
            const block = fallingBlocks[j];
            const hit = !(
                fb.x + fb.width < block.x ||
                fb.x > block.x + block.width ||
                fb.y + fb.height < block.y ||
                fb.y > block.y + block.height
            );

            if (hit) {
                block.hitsRemaining--;
                if (block.hitsRemaining <= 0) {
                    fallingBlocks.splice(j, 1);
                    score++;
                }
                fireballs.splice(i, 1);
                break;
            }
        }
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

function restartGame() {
    cancelAnimationFrame(animationFrameId);
    document.getElementById("intro-screen").style.display = "block";
    document.getElementById("game-container").style.display = "none";
}

function main(){
    InitScreen();
    startTime = Date.now();
    score = 0;
    fallingBlocks = [];
    frameCount = 0; 
    spacecraftX = (screenWidth - spacecraftWidth) / 2;
}


window.onload = () => {
    // Nothing else needed here; everything starts in image onload.
};