// Game class - Manages the game state and logic

// Add caps for clutter control
const MAX_PARTICLES = 30;
const MAX_DAMAGE_NUMBERS = 15;
const MAX_IMPACT_EFFECTS = 10;
const MAX_ENEMIES = 20;
const MAX_POWERUPS = 5;

class Game {
    constructor(canvas) {
        // Initialize game properties
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.state = 'waiting'; // waiting, playing, game_over
        this.score = 0;
        this.highScore = 0;
        this.core = new Core(this.width / 2, this.height / 2, 30);
        this.enemies = [];
        this.waves = [];
        this.particles = [];
        this.powerups = [];
        this.backgroundParticles = [];
        this.enemyTrails = [];
        this.damageNumbers = [];
        this.impactEffects = [];
        
        // Anti-stuck mechanism
        this.lastEnemySpawnTime = Date.now();
        this.stuckTimeout = 10000; // 10 seconds timeout
        
        // Visual feedback for invalid wave attempts
        this.invalidWaveAttempt = null;
        
        // Initialize background particles
        for (let i = 0; i < 50; i++) {
            this.backgroundParticles.push(new BackgroundParticle());
        }
        
        this.messageDisplay = new MessageDisplay();
        this.comboManager = new ComboManager();
        this.feverManager = new FeverManager();
        this.screenShake = null;
        this.hardModeActivated = false; // Add this line to track hard mode activation
        
        this.powerupTimers = {
            'invincibility': 0,
            'wave_boost': 0,
            'slow_time': 0,
            'wave_width': 0,
            'time_stop': 0,
            'wave_magnet': 0
        };
        
        this.activePowerups = {};
        this.echoBurstCooldown = 0;
        this.currentWaveMode = 'normal';
        this.startPos = null;
        this.playerName = this._getCookie('playerName') || '';
        
        this.waveManager = {
            currentWave: 1,
            enemiesToSpawn: 0,
            spawnedEnemiesCount: 0,
            spawnTimer: 0,
            waveActive: false,
            enemySpeed: SETTINGS.ENEMY_SPEED,
            lastScoreCheck: 0,
            bossSpawned: false, // Add this flag
            
            startNextWave: () => {
                this.waveManager.currentWave++;
                this.waveManager.bossSpawned = false; // Reset bossSpawned for every new wave
                // Hard mode: more enemies per wave
                const hardMode = this.score >= 1000;
                this.waveManager.enemiesToSpawn = SETTINGS.ENEMIES_PER_WAVE_BASE + 
                    (this.waveManager.currentWave - 1) * (hardMode ? SETTINGS.ENEMIES_PER_WAVE_INCREMENT_HARD : SETTINGS.ENEMIES_PER_WAVE_INCREMENT);
                this.waveManager.spawnedEnemiesCount = 0;
                this.waveManager.spawnTimer = 0;
                this.waveManager.waveActive = true;
                
                // Update enemy speed for the new wave
                if (hardMode) {
                    this.waveManager.enemySpeed = SETTINGS.ENEMY_MAX_SPEED_HARD;
                } else {
                    this.waveManager.enemySpeed = SETTINGS.ENEMY_SPEED + 
                        (this.waveManager.currentWave - 1) * 0.2;
                    if (this.waveManager.enemySpeed > SETTINGS.ENEMY_MAX_SPEED) {
                        this.waveManager.enemySpeed = SETTINGS.ENEMY_MAX_SPEED;
                    }
                }
                
                console.log(`Starting Wave ${this.waveManager.currentWave} with ${this.waveManager.enemiesToSpawn} enemies.`);
                
                // Update UI
                document.getElementById('wave').textContent = this.waveManager.currentWave;
            },
            
            update: () => {
                // Score-based enemy spawning - ensure enemies always spawn
                const score = this.score;
                const hardMode = score >= 1000;
                // Base spawn rate based on score
                let baseSpawnRate = hardMode ? SETTINGS.ENEMY_SPAWN_RATE_HARD : SETTINGS.ENEMY_SPAWN_RATE;
                // Decrease spawn rate as score increases (more frequent spawning)
                if (!hardMode) {
                    if (score >= 100) baseSpawnRate = Math.max(30, baseSpawnRate - 10);
                    if (score >= 200) baseSpawnRate = Math.max(20, baseSpawnRate - 10);
                    if (score >= 300) baseSpawnRate = Math.max(15, baseSpawnRate - 5);
                    if (score >= 500) baseSpawnRate = Math.max(10, baseSpawnRate - 5);
                    if (score >= 1000) baseSpawnRate = Math.max(8, baseSpawnRate - 2);
                }
                // Ensure minimum enemies on screen based on score
                const minEnemiesOnScreen = Math.min(12, Math.floor(score / 50) + 1 + (hardMode ? 4 : 0));
                // Spawn enemies if we have too few
                if (this.enemies.length < minEnemiesOnScreen) {
                    console.log(`Spawning enemy due to low count: ${this.enemies.length}/${minEnemiesOnScreen}`);
                    this._spawnEnemy();
                }
                // Regular spawn timer
                this.waveManager.spawnTimer++;
                if (this.waveManager.spawnTimer >= baseSpawnRate) {
                    this.waveManager.spawnTimer = 0;
                    console.log(`Spawning enemy due to timer: baseSpawnRate=${baseSpawnRate}`);
                    this._spawnEnemy();
                }
                // Update last score check
                this.waveManager.lastScoreCheck = score;
                // Update wave number based on score (for UI purposes)
                const newWave = Math.floor(score / 50) + 1;
                if (newWave !== this.waveManager.currentWave) {
                    this.waveManager.currentWave = newWave;
                    document.getElementById('wave').textContent = this.waveManager.currentWave;
                    // Increase enemy speed with score (with limits)
                    let baseSpeed = SETTINGS.ENEMY_SPEED + (this.waveManager.currentWave - 1) * 0.15;
                    // Apply speed limits based on score
                    if (hardMode) {
                        this.waveManager.enemySpeed = SETTINGS.ENEMY_MAX_SPEED_HARD;
                    } else if (this.score <= 100) {
                        // Limit to 1.5x till score 100
                        this.waveManager.enemySpeed = Math.min(baseSpeed, SETTINGS.SPEED_LIMIT_100);
                    } else if (this.score <= 200) {
                        // Limit to 2.0x till score 200
                        this.waveManager.enemySpeed = Math.min(baseSpeed, SETTINGS.SPEED_LIMIT_200);
                    } else {
                        // After score 200, use normal max speed
                        this.waveManager.enemySpeed = Math.min(baseSpeed, SETTINGS.SPEED_LIMIT_AFTER_200);
                    }
                    console.log(`Wave updated to ${newWave}, enemy speed: ${this.waveManager.enemySpeed}`);
                }
                // Emergency failsafe: If no enemies for too long, force spawn
                if (this.enemies.length === 0 && this.waveManager.spawnTimer > baseSpawnRate * 2) {
                    console.log('Emergency spawn triggered - no enemies for too long');
                    this._spawnEnemy();
                    this.waveManager.spawnTimer = 0;
                }
            }
        };
        
        // Start the first wave
        this.waveManager.startNextWave();
        
        // Load high scores
        this._loadHighScores();
    }

    addParticle(particle) {
        if (this.particles.length < MAX_PARTICLES) {
            this.particles.push(particle);
        }
    }
    addDamageNumber(damageNumber) {
        if (this.damageNumbers.length < MAX_DAMAGE_NUMBERS) {
            this.damageNumbers.push(damageNumber);
        }
    }
    addImpactEffect(effect) {
        if (this.impactEffects.length < MAX_IMPACT_EFFECTS) {
            this.impactEffects.push(effect);
        }
    }
    addEnemy(enemy) {
        if (this.enemies.length < MAX_ENEMIES) {
            this.enemies.push(enemy);
        }
    }
    addPowerup(powerup) {
        if (this.powerups.length < MAX_POWERUPS) {
            this.powerups.push(powerup);
        }
    }
    
    // Cookie helper methods
    _getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    }
    
    _setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
    }
    
    // Sound handling - this is a placeholder since sounds are managed in main.js
    _loadSounds() {
        // This is just a placeholder - actual sound loading is done in main.js
        console.log('Sound loading is handled by main.js');
    }
    
    // Default sound playing method - will be overridden by main.js
    _playSound(soundName) {
        console.log(`Playing sound: ${soundName} (placeholder - actual sound playing is handled by main.js)`);
    }
    
    start() {
        console.log('Starting game');
        this.state = 'playing';
        this.score = 0;
        this.waveManager.currentWave = 0;  // Will be incremented to 1 in startNextWave
        this.waveManager.startNextWave();
        
        // Update UI
        document.getElementById('score').textContent = '0';
        document.getElementById('wave').textContent = '1';
        document.getElementById('combo').textContent = '0';
        
        // Play a sound to initialize audio context (helps with mobile devices)
        this._playSound('wave_create');
    }
    
    handleEvent(event) {
        console.log('=== GAME HANDLE EVENT ===');
        console.log('Event type:', event.type);
        console.log('Game state:', this.state);
        console.log('Universal controls exist:', !!window.universalControls);
        
        if (this.state === 'playing') {
            // Check universal controls cooldown for wave creation
            if ((event.type === 'mousedown' || event.type === 'mouseup') && 
                window.universalControls && !window.universalControls.canInteractNow()) {
                console.log('Wave creation blocked by universal controls cooldown');
                return;
            }
            
            if (event.type === 'mousedown') {
                this.startPos = { x: event.clientX, y: event.clientY };
            } else if (event.type === 'mouseup' && this.startPos) {
                const endPos = { x: event.clientX, y: event.clientY };
                
                // Calculate distance between start and end positions
                const distance = Math.sqrt(
                    Math.pow(endPos.x - this.startPos.x, 2) + 
                    Math.pow(endPos.y - this.startPos.y, 2)
                );
                
                // Minimum distance required to create a wave (prevents accidental center touches)
                const minDistance = 20;
                
                if (distance >= minDistance) {
                    console.log('=== WAVE CREATION ===');
                    console.log('Distance:', distance, 'Min distance:', minDistance);
                    console.log('Wave mode:', this.currentWaveMode);
                    
                    // Determine wave parameters based on current mode
                    let waveParams = SETTINGS.WAVE_MODE_NORMAL;
                    if (this.currentWaveMode === 'focused') {
                        waveParams = SETTINGS.WAVE_MODE_FOCUSED;
                    } else if (this.currentWaveMode === 'wide') {
                        waveParams = SETTINGS.WAVE_MODE_WIDE;
                    }
                    
                    // Create a new wave
                    const newWave = new SoundWave(
                        this.startPos,
                        endPos,
                        this.activePowerups['wave_width_active'] || false,
                        this.activePowerups['wave_magnet_active'] || false,
                        waveParams.damage_multiplier,
                        waveParams.width_multiplier
                    );
                    
                    this.waves.push(newWave);
                    this._playSound('wave_create');
                    console.log('Wave created successfully');
                    
                    // Record interaction for universal controls
                    if (window.universalControls) {
                        window.universalControls.recordInteraction();
                        console.log('Interaction recorded in game handleEvent');
                    }
                } else {
                    console.log('Wave creation blocked: distance too short');
                    // Show visual feedback for invalid attempt
                    this.invalidWaveAttempt = {
                        start: this.startPos,
                        end: endPos,
                        timer: 30 // Show for 30 frames
                    };
                }
                
                this.startPos = null;
            } else if (event.type === 'keydown') {
                if (event.key === ' ' && this.echoBurstCooldown === 0) {
                    this._activateEchoBurst();
                } else if (event.key === '1') {
                    this.currentWaveMode = 'normal';
                    document.getElementById('current-mode').textContent = 'Normal';
                } else if (event.key === '2') {
                    this.currentWaveMode = 'focused';
                    document.getElementById('current-mode').textContent = 'Focused';
                } else if (event.key === '3') {
                    this.currentWaveMode = 'wide';
                    document.getElementById('current-mode').textContent = 'Wide';
                }
            }
        }
    }
    
    update() {
        if (this.state !== 'playing') return;
        
        // Debug: Log game state every 120 frames (about 2 seconds)
        if (this.score % 120 === 0 && this.score > 0) {
            console.log('=== GAME STATE DEBUG ===');
            console.log('Score:', this.score);
            console.log('Enemies on screen:', this.enemies.length);
            console.log('Waves active:', this.waves.length);
            console.log('Wave manager state:', {
                currentWave: this.waveManager.currentWave,
                waveActive: this.waveManager.waveActive,
                enemiesToSpawn: this.waveManager.enemiesToSpawn,
                spawnedEnemiesCount: this.waveManager.spawnedEnemiesCount,
                spawnTimer: this.waveManager.spawnTimer
            });
            console.log('Min enemies required:', Math.max(1, Math.min(8, Math.floor(this.score / 50) + 1)));
        }
        
        // Update wave manager
        this.waveManager.update();
        
        // Enhanced failsafe: Always ensure enemies are present and game is playable
        const minEnemiesOnScreen = Math.max(1, Math.min(8, Math.floor(this.score / 50) + 1));
        
        // If we have too few enemies, spawn more immediately
        if (this.enemies.length < minEnemiesOnScreen) {
            const enemiesToSpawn = minEnemiesOnScreen - this.enemies.length;
            console.log(`Spawning ${enemiesToSpawn} enemies due to low count (${this.enemies.length}/${minEnemiesOnScreen})`);
            for (let i = 0; i < enemiesToSpawn; i++) {
                this._spawnEnemy();
            }
        }
        
        // Emergency failsafe: If no enemies for too long, force spawn
        if (this.enemies.length === 0) {
            this._spawnEnemy();
            console.log('Emergency enemy spawn triggered - no enemies on screen');
        }
        
        // If wave is not active and no enemies, start next wave
        if (!this.waveManager.waveActive && this.enemies.length === 0) {
            console.log('Starting next wave due to no enemies and no active wave');
            this.waveManager.startNextWave();
        }
        
        // Additional failsafe: Ensure game doesn't get stuck by checking for stuck enemies
        let stuckEnemies = 0;
        for (const enemy of this.enemies) {
            if (enemy.position && enemy.position.x === enemy.lastPosition?.x && 
                enemy.position.y === enemy.lastPosition?.y) {
                stuckEnemies++;
            }
            // Update last position for next check
            if (enemy.position) {
                enemy.lastPosition = { x: enemy.position.x, y: enemy.position.y };
            }
        }
        
        // If too many enemies are stuck, spawn new ones
        if (stuckEnemies > this.enemies.length * 0.5 && this.enemies.length > 0) {
            console.log('Too many stuck enemies detected, spawning new ones');
            this._spawnEnemy();
        }
        
        // Timeout-based failsafe: If no enemies for too long, force spawn
        const currentTime = Date.now();
        if (this.enemies.length === 0 && (currentTime - this.lastEnemySpawnTime) > this.stuckTimeout) {
            console.log('Timeout-based enemy spawn triggered');
            this._spawnEnemy();
            this.lastEnemySpawnTime = currentTime;
        }
        
        // Additional failsafe: If wave manager seems stuck, reset it
        if (this.waveManager.waveActive && this.enemies.length === 0 && this.waveManager.spawnedEnemiesCount >= this.waveManager.enemiesToSpawn) {
            console.log('Wave manager appears stuck, resetting wave state');
            this.waveManager.waveActive = false;
            this.waveManager.spawnedEnemiesCount = 0;
            this.waveManager.spawnTimer = 0;
        }
        
        // Comprehensive stuck detection system
        const stuckDetectionTime = Date.now();
        const timeSinceLastEnemySpawn = stuckDetectionTime - this.lastEnemySpawnTime;
        const timeSinceLastScore = stuckDetectionTime - (this.lastScoreTime || stuckDetectionTime);
        
        // Track last score time
        if (!this.lastScoreTime) this.lastScoreTime = stuckDetectionTime;
        
        // Detect if game is stuck
        if (this.enemies.length === 0 && timeSinceLastEnemySpawn > 5000) { // 5 seconds without enemies
            console.log('=== GAME STUCK DETECTED ===');
            console.log('Time since last enemy spawn:', timeSinceLastEnemySpawn);
            console.log('Time since last score:', timeSinceLastScore);
            console.log('Wave manager state:', {
                currentWave: this.waveManager.currentWave,
                waveActive: this.waveManager.waveActive,
                enemiesToSpawn: this.waveManager.enemiesToSpawn,
                spawnedEnemiesCount: this.waveManager.spawnedEnemiesCount,
                spawnTimer: this.waveManager.spawnTimer
            });
            console.log('Forcing enemy spawn...');
            
            // Force spawn multiple enemies
            for (let i = 0; i < 3; i++) {
                this._spawnEnemy();
            }
            this.lastEnemySpawnTime = stuckDetectionTime;
        }
        
        // Update enemies if time is not stopped
        if (!this.activePowerups['time_stop_active']) {
            // Apply slow time effect if active
            const globalSpeedMultiplier = this.activePowerups['slow_time_active'] ? 0.5 : 1;
            
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                // Use individual enemy speed multiplier
                const enemySpeed = this.waveManager.enemySpeed * 
                    (enemy.speedMultiplier || 1) * globalSpeedMultiplier;
                enemy.update(this.core, enemySpeed, this.enemyTrails);
            }
        }
        
        // Update waves
        for (let i = this.waves.length - 1; i >= 0; i--) {
            this.waves[i].update(this.enemies);
            if (!this.waves[i].active) {
                this.waves.splice(i, 1);
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (!this.particles[i].active) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            this.powerups[i].update();
            if (!this.powerups[i].active) {
                this.powerups.splice(i, 1);
            }
        }
        
        // Update enemy trails
        for (let i = this.enemyTrails.length - 1; i >= 0; i--) {
            if (!this.enemyTrails[i].update()) {
                this.enemyTrails.splice(i, 1);
            }
        }
        
        // Update damage numbers
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            this.damageNumbers[i].update();
            if (!this.damageNumbers[i].active) {
                this.damageNumbers.splice(i, 1);
            }
        }
        
        // Update impact effects
        for (let i = this.impactEffects.length - 1; i >= 0; i--) {
            this.impactEffects[i].update();
            if (!this.impactEffects[i].active) {
                this.impactEffects.splice(i, 1);
            }
        }
        
        // Update background particles
        for (let i = 0; i < this.backgroundParticles.length; i++) {
            this.backgroundParticles[i].update();
        }
        
        // Update managers
        this.comboManager.update();
        this.feverManager.update();
        this.messageDisplay.update();
        
        // Update powerup timers
        this._updatePowerupTimers();
        
        // Check for collisions
        this._checkCollisions();
        
        // Update echo burst cooldown
        if (this.echoBurstCooldown > 0) {
            this.echoBurstCooldown--;
            // Update UI
            document.getElementById('echo-cooldown').style.width = 
                `${(this.echoBurstCooldown / SETTINGS.ECHO_BURST_COOLDOWN) * 100}%`;
        } else if (this.echoBurstCooldown === 0) {
            document.getElementById('echo-cooldown').style.width = '0%';
        }
        
        // Update fever meter
        document.getElementById('fever-meter').style.width = 
            `${this.feverManager.getChargePercentage()}%`;
            
        // Update score display
        document.getElementById('score').textContent = this.score;
        document.getElementById('combo').textContent = this.comboManager.comboCount;
    }
    
    draw(ctx) {
        // Apply screen shake if active
        let screenOffset = { x: 0, y: 0 };
        if (this.screenShake) {
            screenOffset = this.screenShake.shake();
            if (this.screenShake.timer <= 0) {
                this.screenShake = null;
            }
        }
        
        // Clear screen
        ctx.fillStyle = SETTINGS.BLACK;
        ctx.fillRect(0, 0, SETTINGS.WIDTH, SETTINGS.HEIGHT);
        
        // Draw background particles
        for (const particle of this.backgroundParticles) {
            particle.draw(ctx);
        }
        
        // Draw grid
        drawGrid(ctx, screenOffset);
        
        // Draw enemy trails
        for (const trail of this.enemyTrails) {
            trail.draw(ctx);
        }
        
        // Draw enemies
        for (const enemy of this.enemies) {
            enemy.draw(ctx);
        }
        
        // Draw waves
        for (const wave of this.waves) {
            wave.draw(ctx);
        }
        
        // Draw particles
        for (const particle of this.particles) {
            particle.draw(ctx);
        }
        
        // Draw powerups
        for (const powerup of this.powerups) {
            powerup.draw(ctx);
        }
        
        // Draw damage numbers
        for (const damageNumber of this.damageNumbers) {
            damageNumber.draw(ctx);
        }
        
        // Draw impact effects
        for (const effect of this.impactEffects) {
            effect.draw(ctx);
        }
        
        // Draw invalid wave attempt feedback
        if (this.invalidWaveAttempt && this.invalidWaveAttempt.timer > 0) {
            const alpha = this.invalidWaveAttempt.timer / 30;
            ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(this.invalidWaveAttempt.start.x, this.invalidWaveAttempt.start.y);
            ctx.lineTo(this.invalidWaveAttempt.end.x, this.invalidWaveAttempt.end.y);
            ctx.stroke();
            ctx.setLineDash([]);
            
            this.invalidWaveAttempt.timer--;
            if (this.invalidWaveAttempt.timer <= 0) {
                this.invalidWaveAttempt = null;
            }
        }
        
        // Draw core
        this.core.draw(ctx, this.feverManager.feverActive);
        
        // Draw messages
        this.messageDisplay.draw(ctx);
        
        // Draw powerup timers
        this._drawPowerupTimers();
    }
    
    _spawnEnemy() {
        // Determine enemy type and difficulty based on score
        let enemyType = 'basic';
        const score = this.score;
        let possibleTypes = [];
        let isBossWave = false;
        let hardMode = score >= 1000;

        // Hard mode: after 1k score, increase difficulty and variety
        if (hardMode) {
            // Show hard mode message once
            if (!this.hardModeActivated) {
                this.messageDisplay.addMessage(
                    'HARD MODE!',
                    { x: SETTINGS.WIDTH / 2, y: SETTINGS.HEIGHT / 2 },
                    SETTINGS.YELLOW,
                    48
                );
                this.screenShake = new ScreenShake(10, 60);
                this._playSound('boss_spawn');
                this.hardModeActivated = true;
            }
            // Boss wave logic: every BOSS_WAVE_INTERVAL waves
            isBossWave = (this.waveManager.currentWave % SETTINGS.BOSS_WAVE_INTERVAL === 0);
            if (hardMode && isBossWave) {
                if (!this.waveManager.bossSpawned) {
                    possibleTypes = ['boss'];
                    this.waveManager.bossSpawned = true;
                } else {
                    // Already spawned boss for this wave, do not spawn more
                    return;
                }
            } else if (hardMode) {
                // All tough enemies + rare boss
                possibleTypes = [
                    'zigzag','ghost','charger','splitter','shielded','teleporter','reflector',
                    'swarm','timebomber','vortex','speedster','slowtank','basic'
                ];
                // 10% chance to spawn a boss even on non-boss waves
                if (Math.random() < 0.1) possibleTypes.push('boss');
            }
        } else {
            // Define enemy types by score ranges (original logic)
            if (score >= 0 && score < 10) {
                possibleTypes = ['basic'];
            } else if (score >= 10 && score < 20) {
                possibleTypes = ['zigzag'];
            } else if (score >= 20 && score < 45) {
                possibleTypes = ['ghost'];
            } else if (score >= 45 && score < 90) {
                possibleTypes = ['charger'];
            } else if (score >= 90 && score < 150) {
                possibleTypes = ['splitter'];
            } else if (score >= 150 && score < 220) {
                possibleTypes = ['shielded'];
            } else if (score >= 220 && score < 300) {
                possibleTypes = ['teleporter'];
            } else if (score >= 300 && score < 390) {
                possibleTypes = ['reflector'];
            } else if (score >= 390 && score < 490) {
                possibleTypes = ['swarm'];
            } else if (score >= 490 && score < 600) {
                possibleTypes = ['timebomber'];
            } else if (score >= 600 && score < 720) {
                possibleTypes = ['vortex'];
            } else if (score >= 720 && score < 850) {
                possibleTypes = ['speedster'];
            } else if (score >= 850 && score < 1000) {
                possibleTypes = ['slowtank'];
            } else if (score >= 1000) {
                possibleTypes = ['boss']; // fallback for non-hard mode
            }
        }

        // Debug: Log possibleTypes and hardMode
        console.log('[SPAWN ENEMY] Score:', score, 'HardMode:', hardMode, 'isBossWave:', isBossWave, 'PossibleTypes:', possibleTypes);

        // Weight probabilities for harder types as score increases within each range
        let weights = possibleTypes.map(type => {
            if (hardMode) {
                // In hard mode, make special enemies and bosses more likely
                switch(type) {
                    case 'boss': return isBossWave ? 10 : 2;
                    case 'swarm':
                    case 'vortex':
                    case 'reflector':
                    case 'timebomber':
                    case 'speedster':
                    case 'slowtank': return 5;
                    case 'zigzag':
                    case 'ghost':
                    case 'charger':
                    case 'splitter':
                    case 'shielded':
                    case 'teleporter': return 4;
                    case 'basic': return 1;
                    default: return 2;
                }
            } else {
                switch(type) {
                    case 'basic': return 10;
                    case 'zigzag': return 8;
                    case 'ghost': return 6;
                    case 'charger': return 5;
                    case 'splitter': return 4;
                    case 'shielded': return 3;
                    case 'teleporter': return 3;
                    case 'reflector': return 2;
                    case 'swarm': return 2;
                    case 'timebomber': return 2;
                    case 'vortex': return 1;
                    case 'speedster': return 1;
                    case 'slowtank': return 1;
                    case 'boss': return 5;
                    default: return 1;
                }
            }
        });
        // Normalize weights
        let totalWeight = weights.reduce((a,b)=>a+b,0);
        let rand = Math.random() * totalWeight;
        let idx = 0;
        for (; idx < weights.length; idx++) {
            if (rand < weights[idx]) break;
            rand -= weights[idx];
        }
        enemyType = possibleTypes[idx] || 'basic';

        // Debug: Log selected enemyType
        console.log('[SPAWN ENEMY] Selected enemyType:', enemyType);

        // Create enemy based on type, with random speed/spin for challenge
        let enemy;
        switch (enemyType) {
            case 'zigzag':
                enemy = new ZigzagEnemy();
                break;
            case 'ghost':
                enemy = new GhostEnemy();
                break;
            case 'charger':
                enemy = new ChargerEnemy();
                break;
            case 'splitter':
                enemy = new SplitterEnemy();
                break;
            case 'shielded':
                enemy = new ShieldedEnemy();
                break;
            case 'teleporter':
                enemy = new TeleporterEnemy();
                break;
            case 'reflector':
                enemy = new ReflectorEnemy();
                break;
            case 'swarm':
                enemy = new SwarmEnemy();
                break;
            case 'timebomber':
                enemy = new TimeBomberEnemy();
                break;
            case 'vortex':
                enemy = new VortexEnemy();
                break;
            case 'speedster':
                enemy = new SpeedsterEnemy();
                break;
            case 'slowtank':
                enemy = new SlowTankEnemy();
                break;
            case 'boss':
                enemy = new BossEnemy();
                this.messageDisplay.addMessage(
                    'BOSS INCOMING!',
                    { x: SETTINGS.WIDTH / 2, y: SETTINGS.HEIGHT / 2 },
                    SETTINGS.BOSS_ENEMY_COLOR,
                    48
                );
                this.screenShake = new ScreenShake(5, 30);
                this._playSound('boss_spawn');
                break;
            default:
                enemy = new Enemy();
                break;
        }
        // Add random speed/spin for extra challenge
        if (enemy && !enemy.isBoss) {
            // Hard mode: increase speed and add more spin
            const baseSpeed = this.waveManager.enemySpeed;
            let speedVariation = 0.5 + Math.random() * 1.5;
            if (hardMode) {
                speedVariation = 1.5 + Math.random() * 2.5; // 1.5x to 4x speed
            }
            enemy.speedMultiplier = speedVariation;
            // Extreme speed chance
            if (Math.random() < (hardMode ? 0.2 : 0.1)) {
                enemy.speedMultiplier = Math.random() < 0.5 ? 0.3 : (hardMode ? 5.0 : 3.0);
            }
            // Add spin property for visual challenge
            if (score > 100 && Math.random() < (hardMode ? 0.6 : 0.3)) {
                enemy.spin = (Math.random() - 0.5) * (hardMode ? 0.5 : 0.2);
            }
        }
        if (enemy) {
            this.addEnemy(enemy);
            this.lastEnemySpawnTime = Date.now(); // Update spawn time
            // Debug: Log enemy creation
            console.log('[SPAWN ENEMY] Enemy created and pushed:', enemy.constructor.name, 'Total enemies:', this.enemies.length);
        } else {
            // Debug: Log failure to create enemy
            console.error('[SPAWN ENEMY] Failed to create enemy for type:', enemyType);
        }
    }
    
    _checkCollisions() {
        // Check if core is hit by enemy
        if (!this.activePowerups['invincibility_active'] && !this.feverManager.feverActive) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                if (this.enemies[i].collidesWith(this.core)) {
                    this._gameOver();
                    return;
                }
            }
        }
        
        // Check if waves hit enemies
        for (let i = this.waves.length - 1; i >= 0; i--) {
            const wave = this.waves[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (wave.collidesWith(enemy)) {
                    let damage = 1 * wave.damageMultiplier;
                    
                    if (this.feverManager.feverActive) {
                        damage *= SETTINGS.FEVER_MODE_PLAYER_WAVE_DAMAGE_MULTIPLIER;
                    }
                    
                    // Handle boss enemy differently
                    if (enemy instanceof BossEnemy) {
                        const defeated = enemy.takeDamage(damage);
                        if (defeated) {
                            this.enemies.splice(j, 1);
                            this._handleEnemyDefeat(enemy, damage);
                            
                            // Achievement for defeating a boss
                            this.messageDisplay.addMessage(
                                SETTINGS.ACHIEVEMENT_MESSAGES.boss_slayer, 
                                { x: SETTINGS.WIDTH / 2, y: SETTINGS.HEIGHT / 2 - 50 }, 
                                SETTINGS.YELLOW, 
                                36
                            );
                        } else {
                            // Show damage number but don't remove boss
                            this.addDamageNumber(new DamageNumber(
                                enemy.position, 
                                Math.round(damage), 
                                SETTINGS.WHITE, 
                                false
                            ));
                            
                            // Create impact effect
                            this.addImpactEffect(new ImpactEffect(
                                enemy.position, 
                                enemy.color
                            ));
                        }
                    } else if (enemy instanceof ShieldedEnemy) {
                        enemy.shieldHealth -= damage;
                        if (enemy.shieldHealth <= 0) {
                            this.enemies.splice(j, 1);
                            this._handleEnemyDefeat(enemy, damage);
                        }
                    } else if (enemy instanceof ReflectorEnemy) {
                        // Check if wave was reflected
                        if (!enemy.reflectWave(wave)) {
                            // If not reflected, destroy the enemy
                            this.enemies.splice(j, 1);
                            this._handleEnemyDefeat(enemy, damage);
                        }
                    } else if (enemy instanceof SlowTankEnemy) {
                        const defeated = enemy.takeDamage(damage);
                        if (defeated) {
                            this.enemies.splice(j, 1);
                            this._handleEnemyDefeat(enemy, damage);
                        } else {
                            // Show damage number but don't remove tank
                            this.addDamageNumber(new DamageNumber(
                                enemy.position, 
                                Math.round(damage), 
                                SETTINGS.WHITE, 
                                false
                            ));
                            
                            // Create impact effect
                            this.addImpactEffect(new ImpactEffect(
                                enemy.position, 
                                enemy.color
                            ));
                        }
                    } else if (enemy instanceof GhostEnemy) {
                        enemy.hitsRemaining -= damage;
                        if (enemy.hitsRemaining <= 0) {
                            this.enemies.splice(j, 1);
                            this._handleEnemyDefeat(enemy, damage);
                        }
                    } else if (enemy instanceof SplitterEnemy) {
                        const newEnemies = enemy.split();
                        newEnemies.forEach(e => this.addEnemy(e));
                        this.enemies.splice(j, 1);
                        this._handleEnemyDefeat(enemy, damage);
                    } else {
                        this.enemies.splice(j, 1);
                        this._handleEnemyDefeat(enemy, damage);
                    }
                }
            }
        }
        
        // Check if powerups are collected
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            if (this.powerups[i].collidesWith(this.core)) {
                const powerupType = this.powerups[i].type;
                this.powerups.splice(i, 1);
                this._playSound('powerup_collect');
                this._activatePowerup(powerupType);
            }
        }
    }
    
    _handleEnemyDefeat(enemy, damage = 0) {
        // Debug: Log enemy defeat
        console.log(`Enemy defeated: type=${enemy.constructor.name}, score=${this.score}, enemies remaining=${this.enemies.length}`);
        
        // Add combo
        this.comboManager.addHit();
        
        // Add fever charge - extra charge during combos
        const feverCharge = SETTINGS.FEVER_MODE_CHARGE_PER_HIT;
        const comboBonus = this.comboManager.comboCount >= 5 ? SETTINGS.COMBO_FEVER_BOOST : 0;
        this.feverManager.addCharge(feverCharge + comboBonus);
        
        // Get score value from enemy
        const baseScore = enemy.scoreValue || 1;
        
        // Increase score with combo bonus
        this.score += baseScore + this.comboManager.getBonus();
        
        // Update last score time for stuck detection
        this.lastScoreTime = Date.now();
        
        // Play sound
        this._playSound('enemy_hit');
        
        // Create particles
        for (let i = 0; i < 10; i++) {
            this.addParticle(new Particle(enemy.position, enemy.color));
        }
        
        // Chance to spawn powerup - increased chance for boss enemies
        const powerupChance = enemy.isBoss ? 
            SETTINGS.POWERUP_SPAWN_CHANCE * 2 : 
            SETTINGS.POWERUP_SPAWN_CHANCE;
            
        if (Math.random() < powerupChance) {
            const powerupTypes = [
                'invincibility', 'wave_boost', 'slow_time', 'clear_screen', 
                'wave_width', 'time_stop', 'wave_magnet', 'chain_reaction', 'multi_wave'
            ];
            const powerupType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
            this.addPowerup(new PowerUp(enemy.position, powerupType));
        }
        
        // Display combo message if available
        const comboMsg = this.comboManager.getComboMessage();
        if (comboMsg) {
            this.messageDisplay.addMessage(
                comboMsg, 
                { x: enemy.position.x, y: enemy.position.y - 20 }, 
                SETTINGS.YELLOW, 
                24
            );
            
            // Achievement for high combos
            if (this.comboManager.comboCount >= 20) {
                this.messageDisplay.addMessage(
                    SETTINGS.ACHIEVEMENT_MESSAGES.combo_master, 
                    { x: SETTINGS.WIDTH / 2, y: SETTINGS.HEIGHT / 2 - 50 }, 
                    SETTINGS.YELLOW, 
                    36
                );
            }
        }
        
        // Check for critical hit
        const isCritical = Math.random() < SETTINGS.CRITICAL_HIT_CHANCE;
        if (isCritical) {
            damage *= SETTINGS.CRITICAL_HIT_MULTIPLIER;
        }
        
        // Create damage number
        this.addDamageNumber(new DamageNumber(
            enemy.position, 
            Math.round(damage), 
            SETTINGS.WHITE, 
            isCritical
        ));
        
        // Create impact effect
        this.addImpactEffect(new ImpactEffect(enemy.position, enemy.color));

        // === BOSS WAVE PROGRESSION FIX ===
        // If a boss was defeated and there are no more enemies, end the wave and reset bossSpawned
        if (enemy instanceof BossEnemy && this.enemies.length === 0) {
            this.waveManager.waveActive = false;
            this.waveManager.spawnedEnemiesCount = 0;
            this.waveManager.spawnTimer = 0;
            this.waveManager.bossSpawned = false;
            console.log('Boss defeated, boss wave complete. Ready for next wave.');
        }
    }
    
    _activatePowerup(powerupType) {
        // Display message
        const message = SETTINGS.POWERUP_MESSAGES[powerupType] || '';
        this.messageDisplay.addMessage(
            message, 
            { x: SETTINGS.WIDTH / 2, y: SETTINGS.HEIGHT / 2 }, 
            SETTINGS.YELLOW, 
            36
        );
        
        // Apply powerup effect
        switch (powerupType) {
            case 'invincibility':
                this.powerupTimers['invincibility'] = SETTINGS.POWERUP_DURATION_INVINCIBILITY;
                this.activePowerups['invincibility_active'] = true;
                this.core.setInvincible(true);
                break;
                
            case 'wave_boost':
                this.powerupTimers['wave_boost'] = SETTINGS.POWERUP_DURATION_WAVE_BOOST;
                this.activePowerups['wave_boost_active'] = true;
                break;
                
            case 'slow_time':
                this.powerupTimers['slow_time'] = SETTINGS.POWERUP_DURATION_SLOW_TIME;
                this.activePowerups['slow_time_active'] = true;
                break;
                
            case 'clear_screen':
                // Destroy all enemies
                for (const enemy of this.enemies) {
                    this._handleEnemyDefeat(enemy);
                }
                this.enemies = [];
                this.powerups = [];
                break;
                
            case 'wave_width':
                this.powerupTimers['wave_width'] = SETTINGS.POWERUP_DURATION_WAVE_WIDTH;
                this.activePowerups['wave_width_active'] = true;
                break;
                
            case 'time_stop':
                this.powerupTimers['time_stop'] = SETTINGS.POWERUP_DURATION_TIME_STOP;
                this.activePowerups['time_stop_active'] = true;
                break;
                
            case 'wave_magnet':
                this.powerupTimers['wave_magnet'] = SETTINGS.POWERUP_DURATION_WAVE_MAGNET;
                this.activePowerups['wave_magnet_active'] = true;
                break;
                
            case 'chain_reaction':
                this.powerupTimers['chain_reaction'] = SETTINGS.POWERUP_DURATION_CHAIN_REACTION;
                this.activePowerups['chain_reaction_active'] = true;
                break;
                
            case 'multi_wave':
                this.powerupTimers['multi_wave'] = SETTINGS.POWERUP_DURATION_MULTI_WAVE;
                this.activePowerups['multi_wave_active'] = true;
                
                // Create multiple waves in different directions
                this._createMultiWaves();
                break;
        }
    }
    
    _createMultiWaves() {
        // Create 8 waves in different directions
        const center = { x: this.core.position.x, y: this.core.position.y };
        const directions = [
            { x: 1, y: 0 },    // right
            { x: 1, y: 1 },    // down-right
            { x: 0, y: 1 },    // down
            { x: -1, y: 1 },   // down-left
            { x: -1, y: 0 },   // left
            { x: -1, y: -1 },  // up-left
            { x: 0, y: -1 },   // up
            { x: 1, y: -1 }    // up-right
        ];
        
        for (const dir of directions) {
            const endPos = {
                x: center.x + dir.x * 100,
                y: center.y + dir.y * 100
            };
            
            const wave = new SoundWave(
                center,
                endPos,
                this.activePowerups['wave_width_active'] || false,
                this.activePowerups['wave_magnet_active'] || false,
                SETTINGS.WAVE_MODE_NORMAL.damage_multiplier,
                SETTINGS.WAVE_MODE_NORMAL.width_multiplier
            );
            
            this.waves.push(wave);
        }
        
        // Play sound
        this._playSound('multi_wave');
        
        // Add visual effect
        this.addImpactEffect(new ImpactEffect(
            center, 
            SETTINGS.POWERUP_COLOR_MULTI_WAVE,
            SETTINGS.WIDTH / 4
        ));
    }
    
    _activateEchoBurst() {
        this.echoBurstCooldown = SETTINGS.ECHO_BURST_COOLDOWN;
        this._playSound('echo_burst');
        
        // Update UI
        document.getElementById('echo-cooldown').style.width = '100%';
        
        // Destroy enemies within range
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.position.distanceTo(this.core.position) < SETTINGS.ECHO_BURST_RADIUS) {
                this.enemies.splice(i, 1);
                this._handleEnemyDefeat(enemy, SETTINGS.ECHO_BURST_DAMAGE);
            }
        }
        
        // Create impact effect
        this.addImpactEffect(new ImpactEffect(this.core.position, SETTINGS.ECHO_BURST_COLOR));
    }
    
    _updatePowerupTimers() {
        // Update each powerup timer
        for (const powerupType in this.powerupTimers) {
            if (this.powerupTimers[powerupType] > 0) {
                this.powerupTimers[powerupType]--;
                
                // If timer reaches zero, deactivate the powerup
                if (this.powerupTimers[powerupType] === 0) {
                    this.activePowerups[`${powerupType}_active`] = false;
                    
                    // Special handling for invincibility
                    if (powerupType === 'invincibility') {
                        this.core.setInvincible(false);
                    }
                }
            }
        }
    }
    
    _drawPowerupTimers() {
        // Clear existing timers
        const powerupTimersElement = document.getElementById('powerup-timers');
        powerupTimersElement.innerHTML = '';
        
        // Add active powerup timers
        for (const powerupType in this.powerupTimers) {
            if (this.powerupTimers[powerupType] > 0) {
                const timerElement = document.createElement('div');
                timerElement.className = 'powerup-timer';
                
                const formattedType = powerupType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const seconds = Math.ceil(this.powerupTimers[powerupType] / SETTINGS.FPS);
                
                // Add appropriate icon based on powerup type
                let iconClass = 'fa-bolt'; // default
                
                switch(powerupType) {
                    case 'invincibility':
                        iconClass = 'fa-shield-alt';
                        break;
                    case 'wave_boost':
                        iconClass = 'fa-tachometer-alt';
                        break;
                    case 'slow_time':
                        iconClass = 'fa-hourglass-half';
                        break;
                    case 'wave_width':
                        iconClass = 'fa-expand';
                        break;
                    case 'time_stop':
                        iconClass = 'fa-clock';
                        break;
                    case 'wave_magnet':
                        iconClass = 'fa-magnet';
                        break;
                }
                
                timerElement.innerHTML = `<i class="fas ${iconClass}"></i> ${formattedType}: ${seconds}s`;
                powerupTimersElement.appendChild(timerElement);
            }
        }
    }
    
    _gameOver() {
        console.log('Game over called');
        this.state = 'game_over';
        this._playSound('game_over');
        
        // Create screen shake effect
        this.screenShake = new ScreenShake(10, 30);
        
        // Update UI - ensure proper screen toggling
        const gameScreen = document.getElementById('game-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        
        if (gameScreen) {
            gameScreen.classList.add('hidden');
        }
        
        if (gameOverScreen) {
            gameOverScreen.classList.remove('hidden');
            
            // Add fade-in animation
            setTimeout(() => {
                gameOverScreen.style.opacity = '1';
                gameOverScreen.style.pointerEvents = 'auto';
            }, 100);
            
            // Ensure restart button is visible
            const restartButton = document.getElementById('restart-button');
            if (restartButton) {
                restartButton.style.display = 'block';
            }
        }
        
        // Update final score
        const finalScoreElement = document.getElementById('final-score');
        if (finalScoreElement && finalScoreElement.querySelector) {
            const scoreSpan = finalScoreElement.querySelector('span');
            if (scoreSpan) {
                scoreSpan.textContent = this.score;
                
                // Add score animation
                this._animateScoreCounter(scoreSpan, 0, this.score);
            }
        }
        
        // Hide the name input container completely since we already asked for it at the start
        const playerNameContainer = document.getElementById('player-name-container');
        if (playerNameContainer) {
            playerNameContainer.style.display = 'none';
        }
        
        // Try to auto-submit the score
        const autoSubmitted = this.autoSubmitScore ? this.autoSubmitScore() : false;
        console.log('Auto-submitted score:', autoSubmitted);
        
        // Always load high scores
        this._loadHighScores();
    }
    
    // Animate score counter for visual appeal
    _animateScoreCounter(element, start, end) {
        const duration = 1500; // ms
        const frameDuration = 1000 / 60;
        const totalFrames = Math.round(duration / frameDuration);
        const increment = (end - start) / totalFrames;
        
        let currentFrame = 0;
        let currentValue = start;
        
        const animate = () => {
            currentFrame++;
            currentValue += increment;
            
            if (currentFrame === totalFrames) {
                element.textContent = end;
            } else {
                element.textContent = Math.floor(currentValue);
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    async _loadHighScores() {
        try {
            const response = await fetch('/api/highscores');
            let highscores = await response.json();
            
            console.log('Loaded highscores (raw data):', highscores);
            
            // Ensure highscores is an array
            if (!Array.isArray(highscores)) {
                console.error('Highscores is not an array:', typeof highscores);
                highscores = [];
            }
            
            // Check for duplicate leaderboard elements
            const leaderboardElements = document.querySelectorAll('#leaderboard-entries');
            console.log('Number of leaderboard elements found:', leaderboardElements.length);
            if (leaderboardElements.length > 1) {
                console.error('Multiple leaderboard elements found with the same ID!');
                // Keep only the first one and remove others
                for (let i = 1; i < leaderboardElements.length; i++) {
                    leaderboardElements[i].parentNode.removeChild(leaderboardElements[i]);
                }
                console.log('Removed duplicate leaderboard elements, keeping only the first one');
            }
            
            // Get the leaderboard container
            const leaderboardContainer = document.getElementById('leaderboard');
            if (leaderboardContainer) {
                // Find the existing leaderboard entries div
                const oldLeaderboardEntries = document.getElementById('leaderboard-entries');
                if (oldLeaderboardEntries) {
                    // Remove it completely
                    oldLeaderboardEntries.parentNode.removeChild(oldLeaderboardEntries);
                }
                
                // Create a brand new leaderboard entries div
                const newLeaderboardEntries = document.createElement('div');
                newLeaderboardEntries.id = 'leaderboard-entries';
                leaderboardContainer.appendChild(newLeaderboardEntries);
                
                // Deduplicate entries by name (keep highest score for each name)
                const uniqueScores = {};
                highscores.forEach(entry => {
                    if (!entry) return;
                    
                    const name = entry.name || 'Anonymous';
                    const score = entry.score || 0;
                    
                    // If we haven't seen this name yet, or this score is higher than the previous one
                    if (!uniqueScores[name] || score > uniqueScores[name]) {
                        uniqueScores[name] = score;
                    }
                });
                
                // Convert back to array and sort
                const uniqueHighscores = Object.entries(uniqueScores).map(([name, score]) => ({
                    name,
                    score
                }));
                
                uniqueHighscores.sort((a, b) => b.score - a.score);
                
                // Get current player name for highlighting
                const currentPlayerName = this.playerName || '';
                console.log('Current player for highlighting:', currentPlayerName);
                
                // Add entries to the new leaderboard div
                uniqueHighscores.forEach((entry, index) => {
                    const entryElement = document.createElement('div');
                    entryElement.className = 'leaderboard-entry';
                    if (entry.name === currentPlayerName) {
                        entryElement.classList.add('current-player');
                    }
                    
                    entryElement.innerHTML = `${index + 1}. ${entry.name}<span>${entry.score}</span>`;
                    newLeaderboardEntries.appendChild(entryElement);
                });
                
                // If no entries, show a message
                if (uniqueHighscores.length === 0) {
                    const emptyElement = document.createElement('div');
                    emptyElement.className = 'leaderboard-entry';
                    emptyElement.textContent = 'No high scores yet!';
                    newLeaderboardEntries.appendChild(emptyElement);
                }
            }
        } catch (error) {
            console.error('Error loading high scores:', error);
        }
    }
    
    async saveHighScore(name) {
        // Use the name passed in, or the one from cookie, or 'Anonymous'
        const playerName = name || this.playerName || 'Anonymous';
        console.log('Saving high score for:', playerName, 'Score:', this.score);
        
        // Update the cookie with the player name
        this._setCookie('playerName', playerName, 30);
        
        try {
            const response = await fetch('/api/highscores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: playerName,
                    score: this.score
                })
            });
            
            if (response.ok) {
                this.autoSubmitted = true;
                console.log('Auto-submitted score:', this.autoSubmitted);
                
                // Reload high scores after submission
                await this._loadHighScores();
                return true;
            } else {
                console.error('Error submitting high score:', response.statusText);
                return false;
            }
        } catch (error) {
            console.error('Error submitting high score:', error);
            return false;
        }
    }
    
    reset() {
        // Reset game state
        this.state = 'playing';
        this.score = 0;
        this.enemies = [];
        this.waves = [];
        this.particles = [];
        this.powerups = [];
        this.enemyTrails = [];
        this.damageNumbers = [];
        this.impactEffects = [];
        
        this.core = new Core(this.width / 2, this.height / 2, 30);
        this.comboManager = new ComboManager();
        this.feverManager = new FeverManager();
        this.messageDisplay = new MessageDisplay();
        
        this.powerupTimers = {
            'invincibility': 0,
            'wave_boost': 0,
            'slow_time': 0,
            'wave_width': 0,
            'time_stop': 0,
            'wave_magnet': 0
        };
        
        this.activePowerups = {};
        this.echoBurstCooldown = 0;
        this.currentWaveMode = 'normal';
        this.startPos = null;
        this.invalidWaveAttempt = null;
        this.lastEnemySpawnTime = Date.now();
        
        // Reset mobile controls if they exist
        if (window.mobileControls) {
            window.mobileControls.resetTouchCooldown();
        }
        
        // Reset universal controls if they exist
        if (window.universalControls) {
            window.universalControls.resetInteractionCooldown();
        }
        
        // Don't reset playerName to preserve it between games
        
        // Reset wave manager
        this.waveManager.currentWave = 0;
        this.waveManager.enemiesToSpawn = 0;
        this.waveManager.spawnedEnemiesCount = 0;
        this.waveManager.spawnTimer = 0;
        this.waveManager.waveActive = false;
        this.waveManager.enemySpeed = SETTINGS.ENEMY_SPEED;
        this.waveManager.bossSpawned = false; // Reset bossSpawned on reset
        
        // Start first wave
        this.waveManager.startNextWave();
        
        // Update UI
        const scoreElement = document.getElementById('score');
        if (scoreElement) scoreElement.textContent = '0';
        
        const waveElement = document.getElementById('wave');
        if (waveElement) waveElement.textContent = '1';
        
        const comboElement = document.getElementById('combo');
        if (comboElement) comboElement.textContent = '0';
        
        const modeElement = document.getElementById('current-mode');
        if (modeElement) modeElement.textContent = 'Normal';
        
        const echoCooldownElement = document.getElementById('echo-cooldown');
        if (echoCooldownElement) echoCooldownElement.style.width = '0%';
        
        const feverMeterElement = document.getElementById('fever-meter');
        if (feverMeterElement) feverMeterElement.style.width = '0%';
        
        const powerupTimersElement = document.getElementById('powerup-timers');
        if (powerupTimersElement) powerupTimersElement.innerHTML = '';
        
        // Show game screen, hide game over screen
        const gameOverScreen = document.getElementById('game-over-screen');
        const gameScreen = document.getElementById('game-screen');
        
        if (gameOverScreen) {
            gameOverScreen.classList.add('hidden');
            gameOverScreen.style.opacity = '0';
            gameOverScreen.style.pointerEvents = 'none';
        }
        
        if (gameScreen) {
            gameScreen.classList.remove('hidden');
        }
    }
    
    cycleWaveMode() {
        // Cycle through wave modes: normal -> focused -> wide -> normal
        if (this.currentWaveMode === 'normal') {
            this.currentWaveMode = 'focused';
            document.getElementById('current-mode').textContent = 'Focused';
        } else if (this.currentWaveMode === 'focused') {
            this.currentWaveMode = 'wide';
            document.getElementById('current-mode').textContent = 'Wide';
        } else {
            this.currentWaveMode = 'normal';
            document.getElementById('current-mode').textContent = 'Normal';
        }
        
        // Add visual feedback for mode change
        const modeDisplay = document.getElementById('wave-mode');
        modeDisplay.classList.add('mode-changed');
        setTimeout(() => {
            modeDisplay.classList.remove('mode-changed');
        }, 500);
    }
} 