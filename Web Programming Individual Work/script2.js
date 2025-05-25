function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        if (!bullet.isEnemy) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                
                const enemySize = enemy.isBoss ? 40 : 25;
                const dx = bullet.x - (enemy.x + enemySize);
                const dy = bullet.y - (enemy.y + enemySize);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < enemySize + 5) {
                    enemy.health -= bullet.damage;
                    
                    if (enemy.health <= 0) {
                        createExplosion(enemy.x + enemySize, enemy.y + enemySize, enemy.isBoss);
                        if (enemy.element.parentNode) {
                            enemyContainer.removeChild(enemy.element);
                        }
                        enemies.splice(j, 1);
                        
                        score += enemy.isBoss ? 100 : 10;
                        scoreDisplay.textContent = `Xal: ${score}`;
                        
                        if (score % 500 === 0) {
                            playerHealth = Math.min(100, playerHealth + 10);
                            healthDisplay.textContent = `Can: ${playerHealth}`;
                        }
                    }
                    
                    if (bullet.element.parentNode) {
                        bulletContainer.removeChild(bullet.element);
                    }
                    bullets.splice(i, 1);
                    
                    playSound('hit');
                    break;
                }
            }
        } 
        else if (bullet.isEnemy && !playerInvincible) {
            const dx = bullet.x - (playerX + 25);
            const dy = bullet.y - (playerY + 25);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 30) {
                playerHealth -= bullet.damage;
                healthDisplay.textContent = `Can: ${playerHealth}`;
                
                makePlayerInvincible(1000);
                
                if (bullet.element.parentNode) {
                    bulletContainer.removeChild(bullet.element);
                }
                bullets.splice(i, 1);
                
                if (playerHealth <= 0) {
                    endGame();
                    return;
                }
                
                playSound('hit');
                break;
            }
        }
    }
    
    if (!playerInvincible) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            const enemySize = enemy.isBoss ? 40 : 25;
            
            const dx = playerX + 25 - (enemy.x + enemySize);
            const dy = playerY + 25 - (enemy.y + enemySize);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < enemySize + 25) {
                playerHealth -= enemy.isBoss ? 5 : 1;
                healthDisplay.textContent = `Can: ${playerHealth}`;
                
                makePlayerInvincible(1500);
                
                if (playerHealth <= 0) {
                    endGame();
                    return;
                }
                
                playSound('hit');
            }
        }
    }
    
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        
        const dx = playerX + 25 - (powerup.x + 15);
        const dy = playerY + 25 - (powerup.y + 15);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 40) {
            applyPowerup(powerup.type);
            
            if (powerup.element.parentNode) {
                powerupContainer.removeChild(powerup.element);
            }
            powerups.splice(i, 1);
            
            playSound('powerup');
        }
    }
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function radToDeg(radians) {
    return radians * 180 / Math.PI;
}

function makePlayerInvincible(duration) {
    playerInvincible = true;
    
    if (playerInvincibleTimer) {
        clearTimeout(playerInvincibleTimer);
    }
    
    playerInvincibleTimer = setTimeout(() => {
        playerInvincible = false;
        player.style.opacity = '1';
    }, duration);
}

function applyPowerup(type) {
    switch (type) {
        case 'health':
            playerHealth = Math.min(100, playerHealth + 20);
            healthDisplay.textContent = `Can: ${playerHealth}`;
            break;
        case 'speed':
            playerSpeed = PLAYER_SPEED_BASE * 1.5;
            setTimeout(() => {
                playerSpeed = PLAYER_SPEED_BASE;
            }, 10000);
            break;
        case 'damage':
            playerBulletDamage = 2;
            fireRate = 200;
            setTimeout(() => {
                playerBulletDamage = 1;
                fireRate = 300;
            }, 10000);
            break;
    }
}

let paused = false;
let animationFrameId;
const pauseButton = document.getElementById('pause-button');

function startGame() {
    gameStartOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    resetGame();
    gameRunning = true;
    paused = false;
    pauseButton.textContent = 'PAUSE';
    pauseButton.style.display = 'block';
    gameLoop();
    enemySpawnTimer = setInterval(spawnEnemy, enemySpawnInterval);
    
    if (isMobileDevice()) {
        mobileControls.classList.remove('hidden');
    }
    
    setupLevel(level);
}

function togglePause() {
    if (!gameRunning) return;
    
    paused = !paused;
    
    if (paused) {
        pauseButton.textContent = 'RESUME';
        clearInterval(enemySpawnTimer);
        cancelAnimationFrame(animationFrameId);
    } else {
        pauseButton.textContent = 'PAUSE';
        enemySpawnTimer = setInterval(spawnEnemy, enemySpawnInterval);
        gameLoop();
    }
}

function gameLoop() {
    if (!gameRunning || paused) return;
    
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
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    paused = false;
    clearInterval(enemySpawnTimer);
    cancelAnimationFrame(animationFrameId);
    
    finalScoreDisplay.textContent = `Xal: ${score}`;
    gameOverOverlay.classList.remove('hidden');
    pauseButton.style.display = 'none';
    mobileControls.classList.add('hidden');
}

pauseButton.addEventListener('click', togglePause);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameRunning) {
        togglePause();
    }
    
    keysPressed[e.key.toLowerCase()] = true;
    
    if (e.code === 'Space' && gameRunning && !paused) {
        fireBullet();
    }
});


function createExplosion(x, y, isBoss = false) {
    const size = isBoss ? 80 : 50;
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = `${x - size/2}px`;
    explosion.style.top = `${y - size/2}px`;
    explosion.style.width = `${size}px`;
    explosion.style.height = `${size}px`;
    
    explosionContainer.appendChild(explosion);
    
    setTimeout(() => {
        if (explosion.parentNode) {
            explosionContainer.removeChild(explosion);
        }
    }, 500);
    
    playSound('explosion');
}

function endGame() {
    gameRunning = false;
    clearInterval(enemySpawnTimer);
    
    finalScoreDisplay.textContent = `Xal: ${score}`;
    gameOverOverlay.classList.remove('hidden');
    
    mobileControls.classList.add('hidden');
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

function radToDeg(radians) {
    return radians * 180 / Math.PI;
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
    keysPressed[e.key.toLowerCase()] = true;
    console.log(`Basılan düymə: ${e.key}`);

    if (e.code === 'Space' && gameRunning) {
        fireBullet();
    }
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key.toLowerCase()] = false;
});

btnUp.addEventListener('mousedown', () => keysPressed['arrowup'] = true);
btnUp.addEventListener('mouseup', () => keysPressed['arrowup'] = false);
btnUp.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keysPressed['arrowup'] = true;
});
btnUp.addEventListener('touchend', (e) => {
    e.preventDefault();
    keysPressed['arrowup'] = false;
});

btnDown.addEventListener('mousedown', () => keysPressed['arrowdown'] = true);
btnDown.addEventListener('mouseup', () => keysPressed['arrowdown'] = false);
btnDown.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keysPressed['arrowdown'] = true;
});
btnDown.addEventListener('touchend', (e) => {
    e.preventDefault();
    keysPressed['arrowdown'] = false;
});

btnLeft.addEventListener('mousedown', () => keysPressed['arrowleft'] = true);
btnLeft.addEventListener('mouseup', () => keysPressed['arrowleft'] = false);
btnLeft.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keysPressed['arrowleft'] = true;
});
btnLeft.addEventListener('touchend', (e) => {
    e.preventDefault();
    keysPressed['arrowleft'] = false;
});

btnRight.addEventListener('mousedown', () => keysPressed['arrowright'] = true);
btnRight.addEventListener('mouseup', () => keysPressed['arrowright'] = false);
btnRight.addEventListener('touchstart', (e) => {
    e.preventDefault();
    keysPressed['arrowright'] = true;
});
btnRight.addEventListener('touchend', (e) => {
    e.preventDefault();
    keysPressed['arrowright'] = false;
});

btnFire.addEventListener('click', fireBullet);
btnFire.addEventListener('touchstart', (e) => {
    e.preventDefault();
    fireBullet();
});

gameContainer.addEventListener('click', (e) => {
    if (gameRunning && !gameStartOverlay.contains(e.target) && !gameOverOverlay.contains(e.target)) {
        fireBullet();
    }
});

window.addEventListener('resize', () => {
    if (isMobileDevice()) {
        mobileControls.classList.remove('hidden');
    } else {
        mobileControls.classList.add('hidden');
    }
});