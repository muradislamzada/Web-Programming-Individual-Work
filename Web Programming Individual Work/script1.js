const gameContainer = document.querySelector('.game-container');
const player = document.getElementById('player');
const bulletContainer = document.getElementById('bullet-container');
const enemyContainer = document.getElementById('enemy-container');
const explosionContainer = document.getElementById('explosion-container');
const powerupContainer = document.getElementById('powerup-container');
const scoreDisplay = document.getElementById('score');
const healthDisplay = document.getElementById('health');
const levelDisplay = document.getElementById('level');
const gameStartOverlay = document.getElementById('game-start');
const gameOverOverlay = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

const mobileControls = document.getElementById('controls-mobile');
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnFire = document.getElementById('btn-fire');

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED_BASE = 4;
const PLAYER_ROTATION_SPEED = 5;
const BULLET_SPEED = 10;
const ENEMY_SPEED_BASE = 1.5;
const ENEMY_SPAWN_INTERVAL_BASE = 2000;
const MAX_ENEMIES_BASE = 10;
const ENEMY_SHOOT_CHANCE = 0.005;
const POWERUP_SPAWN_CHANCE = 0.002;

let playerRotation = 0;
let gameRunning = false;
let score = 0;
let playerHealth = 100;
let playerSpeed = PLAYER_SPEED_BASE;
let playerBulletDamage = 1;
let enemySpeed = ENEMY_SPEED_BASE;
let enemySpawnInterval = ENEMY_SPAWN_INTERVAL_BASE;
let maxEnemies = MAX_ENEMIES_BASE;
let level = 1;
let enemySpawnTimer;
let enemies = [];
let bullets = [];
let powerups = [];
window.keysPressed = {};
let lastFired = 0;
let fireRate = 300;
let playerInvincible = false;
let playerInvincibleTimer = null;
let bossFight = false;
let bossHealth = 0;

let playerX = GAME_WIDTH / 2 - 25;
let playerY = GAME_HEIGHT / 2 - 25;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function startGame() {
    gameStartOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    resetGame();
    gameRunning = true;
    gameLoop();
    enemySpawnTimer = setInterval(spawnEnemy, enemySpawnInterval);
    
    if (isMobileDevice()) {
        mobileControls.classList.remove('hidden');
    }
    
    setupLevel(level);
}

function resetGame() {
    score = 0;
    playerHealth = 100;
    playerSpeed = PLAYER_SPEED_BASE;
    playerBulletDamage = 1;
    enemySpeed = ENEMY_SPEED_BASE;
    enemySpawnInterval = ENEMY_SPAWN_INTERVAL_BASE;
    maxEnemies = MAX_ENEMIES_BASE;
    level = 1;
    bossFight = false;
    
    playerX = GAME_WIDTH / 2 - 25;
    playerY = GAME_HEIGHT / 2 - 25;
    playerRotation = 0;
    
    scoreDisplay.textContent = `Xal: ${score}`;
    healthDisplay.textContent = `Can: ${playerHealth}`;
    levelDisplay.textContent = `Səviyyə: ${level}`;
    
    clearGameElements();
    
    enemies = [];
    bullets = [];
    powerups = [];
    
    updatePlayerPosition();
}

function clearGameElements() {
    while (enemyContainer.firstChild) {
        enemyContainer.removeChild(enemyContainer.firstChild);
    }
    while (bulletContainer.firstChild) {
        bulletContainer.removeChild(bulletContainer.firstChild);
    }
    while (explosionContainer.firstChild) {
        explosionContainer.removeChild(explosionContainer.firstChild);
    }
    while (powerupContainer.firstChild) {
        powerupContainer.removeChild(powerupContainer.firstChild);
    }
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function playSound(type) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
        case 'shoot':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(300, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'explosion':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'powerup':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'levelup':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'hit':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(100, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
    }
}

function setupLevel(level) {
    if (level % 5 === 0) {
        startBossFight(level);
    } else {
        enemySpeed = ENEMY_SPEED_BASE * (1 + level * 0.1);
        maxEnemies = MAX_ENEMIES_BASE + Math.floor(level * 1.5);
        enemySpawnInterval = Math.max(500, ENEMY_SPAWN_INTERVAL_BASE - level * 100);
        
        clearInterval(enemySpawnTimer);
        enemySpawnTimer = setInterval(spawnEnemy, enemySpawnInterval);
    }
    
    const levelUpNotif = document.createElement('div');
    levelUpNotif.className = 'level-up';
    levelUpNotif.textContent = `Səviyyə ${level}!`;
    gameContainer.appendChild(levelUpNotif);
    
    setTimeout(() => {
        if (levelUpNotif.parentNode) {
            gameContainer.removeChild(levelUpNotif);
        }
    }, 2000);
    
    playSound('levelup');
}

function startBossFight(level) {
    bossFight = true;
    bossHealth = 10 + level * 2;
    
    clearInterval(enemySpawnTimer);
    enemies.forEach(enemy => {
        if (enemy.element.parentNode) {
            enemyContainer.removeChild(enemy.element);
        }
    });
    enemies = [];
    
    const boss = document.createElement('div');
    boss.className = 'tank enemy enemy-boss';
    
    const bossX = GAME_WIDTH / 2 - 40;
    const bossY = 50;
    
    boss.style.left = `${bossX}px`;
    boss.style.top = `${bossY}px`;
    
    enemyContainer.appendChild(boss);
    
    enemies.push({
        element: boss,
        x: bossX,
        y: bossY,
        rotation: 0,
        health: bossHealth,
        isBoss: true,
        lastShot: 0,
        fireRate: 1000
    });
}

function nextLevel() {
    level++;
    levelDisplay.textContent = `Səviyyə: ${level}`;
    setupLevel(level);
}

function gameLoop() {
    if (!gameRunning) return;
    
    handlePlayerMovement();
    updateBullets();
    updateEnemies();
    updatePowerups();
    checkCollisions();
    
    if (bossFight && enemies.length === 0) {
        bossFight = false;
        nextLevel();
    }
    
    if (Math.random() < POWERUP_SPAWN_CHANCE && !bossFight) {
        spawnPowerup();
    }
    
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    if (key === 'escape' && gameRunning) {
        togglePause();
    }
    
    if (['w', 'ц', 'arrowup', 's', 'ы', 'arrowdown', 'a', 'ф', 'arrowleft', 'd', 'в', 'arrowright'].includes(key)) {
        keysPressed[key] = true;
    }
    
    if (e.code === 'Space' && gameRunning && !paused) {
        fireBullet();
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (['w', 'ц', 'arrowup', 's', 'ы', 'arrowdown', 'a', 'ф', 'arrowleft', 'd', 'в', 'arrowright'].includes(key)) {
        keysPressed[key] = false;
    }
});

function handlePlayerMovement() {
    if (keysPressed['w'] || keysPressed['ц'] || keysPressed['arrowup']) {
        const moveX = Math.cos(degToRad(playerRotation)) * playerSpeed;
        const moveY = Math.sin(degToRad(playerRotation)) * playerSpeed;
        
        playerX += moveX;
        playerY += moveY;
    }
    
    if (keysPressed['s'] || keysPressed['ы'] || keysPressed['arrowdown']) {
        const moveX = Math.cos(degToRad(playerRotation)) * playerSpeed;
        const moveY = Math.sin(degToRad(playerRotation)) * playerSpeed;
        
        playerX -= moveX;
        playerY -= moveY;
    }
    
    if (keysPressed['a'] || keysPressed['ф'] || keysPressed['arrowleft']) {
        playerRotation -= PLAYER_ROTATION_SPEED;
    }
    
    if (keysPressed['d'] || keysPressed['в'] || keysPressed['arrowright']) {
        playerRotation += PLAYER_ROTATION_SPEED;
    }
    
    playerX = Math.max(0, Math.min(GAME_WIDTH - 50, playerX));
    playerY = Math.max(0, Math.min(GAME_HEIGHT - 50, playerY));
    
    updatePlayerPosition();
}

function updatePlayerPosition() {
    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
    player.style.transform = `rotate(${playerRotation}deg) translateZ(0)`;
    
    console.log(`Position: X=${playerX.toFixed(1)}, Y=${playerY.toFixed(1)}, Rotation=${playerRotation.toFixed(1)}`);
    
    if (playerInvincible) {
        player.style.opacity = (Date.now() % 200 < 100) ? '0.5' : '1';
    } else {
        player.style.opacity = '1';
    }
}

function fireBullet() {
    if (!gameRunning) return;
    
    const now = Date.now();
    if (now - lastFired < fireRate) return;
    
    lastFired = now;
    
    const bullet = document.createElement('div');
    bullet.className = 'bullet';
    
    const bulletAngle = playerRotation;
    const bulletX = playerX + 25 + Math.cos(degToRad(bulletAngle)) * 30;
    const bulletY = playerY + 25 + Math.sin(degToRad(bulletAngle)) * 30;
    
    bullet.style.left = `${bulletX - 5}px`;
    bullet.style.top = `${bulletY - 5}px`;
    
    bulletContainer.appendChild(bullet);
    
    bullets.push({
        element: bullet,
        x: bulletX,
        y: bulletY,
        angle: bulletAngle,
        speed: BULLET_SPEED,
        damage: playerBulletDamage,
        isEnemy: false
    });
    
    playSound('shoot');
}

function enemyFire(enemy) {
    if (!gameRunning) return;
    
    const bullet = document.createElement('div');
    bullet.className = 'bullet enemy-bullet';
    
    const bulletAngle = enemy.rotation;
    const enemyWidth = enemy.isBoss ? 40 : 25;
    const bulletX = enemy.x + enemyWidth + Math.cos(degToRad(bulletAngle)) * 30;
    const bulletY = enemy.y + enemyWidth + Math.sin(degToRad(bulletAngle)) * 30;
    
    bullet.style.left = `${bulletX - 5}px`;
    bullet.style.top = `${bulletY - 5}px`;
    
    bulletContainer.appendChild(bullet);
    
    bullets.push({
        element: bullet,
        x: bulletX,
        y: bulletY,
        angle: bulletAngle,
        speed: BULLET_SPEED * 0.7,
        damage: enemy.isBoss ? 2 : 1,
        isEnemy: true
    });
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        bullet.x += Math.cos(degToRad(bullet.angle)) * bullet.speed;
        bullet.y += Math.sin(degToRad(bullet.angle)) * bullet.speed;
        
        bullet.element.style.left = `${bullet.x - 5}px`;
        bullet.element.style.top = `${bullet.y - 5}px`;
        
        if (bullet.x < 0 || bullet.x > GAME_WIDTH || bullet.y < 0 || bullet.y > GAME_HEIGHT) {
            if (bullet.element.parentNode) {
                bulletContainer.removeChild(bullet.element);
            }
            bullets.splice(i, 1);
        }
    }
}

function spawnPowerup() {
    const types = ['health', 'speed', 'damage'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const powerup = document.createElement('div');
    powerup.className = `powerup ${type}-powerup`;
    
    const powerupX = Math.random() * (GAME_WIDTH - 100) + 50;
    const powerupY = Math.random() * (GAME_HEIGHT - 100) + 50;
    
    powerup.style.left = `${powerupX}px`;
    powerup.style.top = `${powerupY}px`;
    
    powerupContainer.appendChild(powerup);
    
    powerups.push({
        element: powerup,
        x: powerupX,
        y: powerupY,
        type: type
    });
    
    setTimeout(() => {
        const index = powerups.findIndex(p => p.element === powerup);
        if (index !== -1) {
            if (powerup.parentNode) {
                powerupContainer.removeChild(powerup);
            }
            powerups.splice(index, 1);
        }
    }, 10000);
}

function updatePowerups() {
}

function spawnEnemy() {
    if (!gameRunning || enemies.length >= maxEnemies || bossFight) return;
    
    const enemy = document.createElement('div');
    enemy.className = 'tank enemy';
    
    let enemyX, enemyY;
    const side = Math.floor(Math.random() * 4);
    
    switch (side) {
        case 0:
            enemyX = Math.random() * (GAME_WIDTH - 50);
            enemyY = -50;
            break;
        case 1:
            enemyX = GAME_WIDTH;
            enemyY = Math.random() * (GAME_HEIGHT - 50);
            break;
        case 2:
            enemyX = Math.random() * (GAME_WIDTH - 50);
            enemyY = GAME_HEIGHT;
            break;
        case 3:
            enemyX = -50;
            enemyY = Math.random() * (GAME_HEIGHT - 50);
            break;
    }
    
    enemy.style.left = `${enemyX}px`;
    enemy.style.top = `${enemyY}px`;
    
    enemyContainer.appendChild(enemy);
    
    enemies.push({
        element: enemy,
        x: enemyX,
        y: enemyY,
        rotation: 0,
        health: 1 + Math.floor(level / 3),
        lastShot: 0,
        isBoss: false
    });
}

function updateEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        
        const dx = playerX + 25 - (enemy.x + (enemy.isBoss ? 40 : 25));
        const dy = playerY + 25 - (enemy.y + (enemy.isBoss ? 40 : 25));
        const angle = radToDeg(Math.atan2(dy, dx));
        
        enemy.rotation = angle;
        enemy.element.style.transform = `rotate(${angle}deg)`;
        
        const currentSpeed = enemy.isBoss ? enemySpeed * 0.6 : enemySpeed;
        enemy.x += Math.cos(degToRad(angle)) * currentSpeed;
        enemy.y += Math.sin(degToRad(angle)) * currentSpeed;
        
        enemy.element.style.left = `${enemy.x}px`;
        enemy.element.style.top = `${enemy.y}px`;
        
        const now = Date.now();
        if (enemy.isBoss && now - enemy.lastShot > enemy.fireRate) {
            enemy.lastShot = now;
            enemyFire(enemy);
        } 
        else if (!enemy.isBoss && Math.random() < ENEMY_SHOOT_CHANCE) {
            enemyFire(enemy);
        }
    }
}
