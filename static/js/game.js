const MAX_PARTICLES = 30;
const MAX_DAMAGE_NUMBERS = 15;
const MAX_IMPACT_EFFECTS = 10;
const MAX_ENEMIES = 20;
const MAX_POWERUPS = 5;

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.state = 'waiting';
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
        this.lastEnemySpawnTime = Date.now();
        this.stuckTimeout = 10000;
        this.invalidWaveAttempt = null;
        for (let i = 0; i < 50; i++) {
            this.backgroundParticles.push(new BackgroundParticle());
        }
        
        this.messageDisplay = new MessageDisplay();
        this.comboManager = new ComboManager();
        this.feverManager = new FeverManager();
        this.screenShake = null;
        this.hardModeActivated = false;
        
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
            bossSpawned: false,
            
            startNextWave: () => {
                this.waveManager.currentWave++;
                this.waveManager.bossSpawned = false;
                const hardMode = this.score >= 1000;
                this.waveManager.enemiesToSpawn = SETTINGS.ENEMIES_PER_WAVE_BASE + 
                    (this.waveManager.currentWave - 1) * (hardMode ? SETTINGS.ENEMIES_PER_WAVE_INCREMENT_HARD : SETTINGS.ENEMIES_PER_WAVE_INCREMENT);
                this.waveManager.spawnedEnemiesCount = 0;
                this.waveManager.spawnTimer = 0;
                this.waveManager.waveActive = true;
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
                document.getElementById('wave').textContent = this.waveManager.currentWave;
            },
            
            update: () => {
                const score = this.score;
                const hardMode = score >= 1000;
                let baseSpawnRate = hardMode ? SETTINGS.ENEMY_SPAWN_RATE_HARD : SETTINGS.ENEMY_SPAWN_RATE;
                if (!hardMode) {
                    if (score >= 100) baseSpawnRate = Math.max(30, baseSpawnRate - 10);
                    if (score >= 200) baseSpawnRate = Math.max(20, baseSpawnRate - 10);
                    if (score >= 300) baseSpawnRate = Math.max(15, baseSpawnRate - 5);
                    if (score >= 500) baseSpawnRate = Math.max(10, baseSpawnRate - 5);
                    if (score >= 1000) baseSpawnRate = Math.max(8, baseSpawnRate - 2);
                }
                const minEnemiesOnScreen = Math.min(12, Math.floor(score / 50) + 1 + (hardMode ? 4 : 0));
                if (this.enemies.length < minEnemiesOnScreen) {
                    console.log(`Spawning enemy due to low count: ${this.enemies.length}/${minEnemiesOnScreen}`);
                    this._spawnEnemy();
                }
                this.waveManager.spawnTimer++;
                if (this.waveManager.spawnTimer >= baseSpawnRate) {
                    this.waveManager.spawnTimer = 0;
                    console.log(`Spawning enemy due to timer: baseSpawnRate=${baseSpawnRate}`);
                    this._spawnEnemy();
                }
                this.waveManager.lastScoreCheck = score;
                const newWave = Math.floor(score / 50) + 1;
                if (newWave !== this.waveManager.currentWave) {
                    this.waveManager.currentWave = newWave;
                    document.getElementById('wave').textContent = this.waveManager.currentWave;
                    let baseSpeed = SETTINGS.ENEMY_SPEED + (this.waveManager.currentWave - 1) * 0.15;
                    if (hardMode) {
                        this.waveManager.enemySpeed = SETTINGS.ENEMY_MAX_SPEED_HARD;
                    } else if (this.score <= 100) {
                        this.waveManager.enemySpeed = Math.min(baseSpeed, SETTINGS.SPEED_LIMIT_100);
                    } else if (this.score <= 200) {
                        this.waveManager.enemySpeed = Math.min(baseSpeed, SETTINGS.SPEED_LIMIT_200);
                    } else {
                        this.waveManager.enemySpeed = Math.min(baseSpeed, SETTINGS.SPEED_LIMIT_AFTER_200);
                    }
                    console.log(`Wave updated to ${newWave}, enemy speed: ${this.waveManager.enemySpeed}`);
                }
                if (this.enemies.length === 0 && this.waveManager.spawnTimer > baseSpawnRate * 2) {
                    console.log('Emergency spawn triggered - no enemies for too long');
                    this._spawnEnemy();
                    this.waveManager.spawnTimer = 0;
                }
            }
        };
        
        this.waveManager.startNextWave();
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
    _loadSounds() {
        console.log('Sound loading is handled by main.js');
    }
    _playSound(soundName) {
        console.log(`Playing sound: ${soundName} (placeholder - actual sound playing is handled by main.js)`);
    }
    
    start() {
        console.log('Starting game');
        this.state = 'playing';
        this.score = 0;
        this.waveManager.currentWave = 0;
        this.waveManager.startNextWave();
        document.getElementById('score').textContent = '0';
        document.getElementById('wave').textContent = '1';
        document.getElementById('combo').textContent = '0';
        this._playSound('wave_create');
    }
    
    handleEvent(event) {
        console.log('=== GAME HANDLE EVENT ===');
        console.log('Event type:', event.type);
        console.log('Game state:', this.state);
        console.log('Universal controls exist:', !!window.universalControls);
        
        if (this.state === 'playing') {
            if ((event.type === 'mousedown' || event.type === 'mouseup') && 
                window.universalControls && !window.universalControls.canInteractNow()) {
                console.log('Wave creation blocked by universal controls cooldown');
                return;
            }
            
            if (event.type === 'mousedown') {
                this.startPos = { x: event.clientX, y: event.clientY };
            } else if (event.type === 'mouseup' && this.startPos) {
                const endPos = { x: event.clientX, y: event.clientY };
                
                const distance = Math.sqrt(
                    Math.pow(endPos.x - this.startPos.x, 2) + 
                    Math.pow(endPos.y - this.startPos.y, 2)
                );
                
                const minDistance = 20;
                
                if (distance >= minDistance) {
                    console.log('=== WAVE CREATION ===');
                    console.log('Distance:', distance, 'Min distance:', minDistance);
                    console.log('Wave mode:', this.currentWaveMode);
                    
                    let waveParams = SETTINGS.WAVE_MODE_NORMAL;
                    if (this.currentWaveMode === 'focused') {
                        waveParams = SETTINGS.WAVE_MODE_FOCUSED;
                    } else if (this.currentWaveMode === 'wide') {
                        waveParams = SETTINGS.WAVE_MODE_WIDE;
                    }
                    
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
                    
                    if (window.universalControls) {
                        window.universalControls.recordInteraction();
                        console.log('Interaction recorded in game handleEvent');
                    }
                } else {
                    console.log('Wave creation blocked: distance too short');
                    this.invalidWaveAttempt = {
                        start: this.startPos,
                        end: endPos,
                        timer: 30
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
        
        this.waveManager.update();
        const minEnemiesOnScreen = Math.max(1, Math.min(8, Math.floor(this.score / 50) + 1));
        if (this.enemies.length < minEnemiesOnScreen) {
            const enemiesToSpawn = minEnemiesOnScreen - this.enemies.length;
            console.log(`Spawning ${enemiesToSpawn} enemies due to low count (${this.enemies.length}/${minEnemiesOnScreen})`);
            for (let i = 0; i < enemiesToSpawn; i++) {
                this._spawnEnemy();
            }
        }
        if (this.enemies.length === 0) {
            this._spawnEnemy();
            console.log('Emergency enemy spawn triggered - no enemies on screen');
        }
        if (!this.waveManager.waveActive && this.enemies.length === 0) {
            console.log('Starting next wave due to no enemies and no active wave');
            this.waveManager.startNextWave();
        }
        let stuckEnemies = 0;
        for (const enemy of this.enemies) {
            if (enemy.position && enemy.position.x === enemy.lastPosition?.x && 
                enemy.position.y === enemy.lastPosition?.y) {
                stuckEnemies++;
            }
            if (enemy.position) {
                enemy.lastPosition = { x: enemy.position.x, y: enemy.position.y };
            }
        }
        if (stuckEnemies > this.enemies.length * 0.5 && this.enemies.length > 0) {
            console.log('Too many stuck enemies detected, spawning new ones');
            this._spawnEnemy();
        }
        const currentTime = Date.now();
        if (this.enemies.length === 0 && (currentTime - this.lastEnemySpawnTime) > this.stuckTimeout) {
            console.log('Timeout-based enemy spawn triggered');
            this._spawnEnemy();
            this.lastEnemySpawnTime = currentTime;
        }
        if (this.waveManager.waveActive && this.enemies.length === 0 && this.waveManager.spawnedEnemiesCount >= this.waveManager.enemiesToSpawn) {
            console.log('Wave manager appears stuck, resetting wave state');
            this.waveManager.waveActive = false;
            this.waveManager.spawnedEnemiesCount = 0;
            this.waveManager.spawnTimer = 0;
        }
        const stuckDetectionTime = Date.now();
        const timeSinceLastEnemySpawn = stuckDetectionTime - this.lastEnemySpawnTime;
        const timeSinceLastScore = stuckDetectionTime - (this.lastScoreTime || stuckDetectionTime);
        if (!this.lastScoreTime) this.lastScoreTime = stuckDetectionTime;
        if (this.enemies.length === 0 && timeSinceLastEnemySpawn > 5000) {
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
            for (let i = 0; i < 3; i++) {
                this._spawnEnemy();
            }
            this.lastEnemySpawnTime = stuckDetectionTime;
        }
        if (!this.activePowerups['time_stop_active']) {
            const globalSpeedMultiplier = this.activePowerups['slow_time_active'] ? 0.5 : 1;
            
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                const enemySpeed = this.waveManager.enemySpeed * 
                    (enemy.speedMultiplier || 1) * globalSpeedMultiplier;
                enemy.update(this.core, enemySpeed, this.enemyTrails);
            }
        }
        for (let i = this.waves.length - 1; i >= 0; i--) {
            this.waves[i].update(this.enemies);
            if (!this.waves[i].active) {
                this.waves.splice(i, 1);
            }
        }
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (!this.particles[i].active) {
                this.particles.splice(i, 1);
            }
        }
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            this.powerups[i].update();
            if (!this.powerups[i].active) {
                this.powerups.splice(i, 1);
            }
        }
        for (let i = this.enemyTrails.length - 1; i >= 0; i--) {
            if (!this.enemyTrails[i].update()) {
                this.enemyTrails.splice(i, 1);
            }
        }
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            this.damageNumbers[i].update();
            if (!this.damageNumbers[i].active) {
                this.damageNumbers.splice(i, 1);
            }
        }
        for (let i = this.impactEffects.length - 1; i >= 0; i--) {
            this.impactEffects[i].update();
            if (!this.impactEffects[i].active) {
                this.impactEffects.splice(i, 1);
            }
        }
        for (let i = 0; i < this.backgroundParticles.length; i++) {
            this.backgroundParticles[i].update();
        }
        this.comboManager.update();
        this.feverManager.update();
        this.messageDisplay.update();
        this._updatePowerupTimers();
        this._checkCollisions();
        if (this.echoBurstCooldown > 0) {
            this.echoBurstCooldown--;
            document.getElementById('echo-cooldown').style.width = 
                `${(this.echoBurstCooldown / SETTINGS.ECHO_BURST_COOLDOWN) * 100}%`;
        } else if (this.echoBurstCooldown === 0) {
            document.getElementById('echo-cooldown').style.width = '0%';
        }
        document.getElementById('fever-meter').style.width = 
            `${this.feverManager.getChargePercentage()}%`;
        document.getElementById('score').textContent = this.score;
        document.getElementById('combo').textContent = this.comboManager.comboCount;
    }
    
    draw(ctx) {
        let screenOffset = { x: 0, y: 0 };
        if (this.screenShake) {
            screenOffset = this.screenShake.shake();
            if (this.screenShake.timer <= 0) {
                this.screenShake = null;
            }
        }
        ctx.fillStyle = SETTINGS.BLACK;
        ctx.fillRect(0, 0, SETTINGS.WIDTH, SETTINGS.HEIGHT);
        
        for (const particle of this.backgroundParticles) {
            particle.draw(ctx);
        }
        drawGrid(ctx, screenOffset);
        for (const trail of this.enemyTrails) {
            trail.draw(ctx);
        }
        for (const enemy of this.enemies) {
            enemy.draw(ctx);
        }
        for (const wave of this.waves) {
            wave.draw(ctx);
        }
        for (const particle of this.particles) {
            particle.draw(ctx);
        }
        for (const powerup of this.powerups) {
            powerup.draw(ctx);
        }
        for (const damageNumber of this.damageNumbers) {
            damageNumber.draw(ctx);
        }
        for (const effect of this.impactEffects) {
            effect.draw(ctx);
        }
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
        this.core.draw(ctx, this.feverManager.feverActive);
        this.messageDisplay.draw(ctx);
        this._drawPowerupTimers();
    }
    
    _spawnEnemy() {
        let enemyType = 'basic';
        const score = this.score;
        let possibleTypes = [];
        let isBossWave = false;
        let hardMode = score >= 1000;
        if (hardMode) {
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
            isBossWave = (this.waveManager.currentWave % SETTINGS.BOSS_WAVE_INTERVAL === 0);
            if (hardMode && isBossWave) {
                if (!this.waveManager.bossSpawned) {
                    possibleTypes = ['boss'];
                    this.waveManager.bossSpawned = true;
                } else {
                    return;
                }
            } else if (hardMode) {
                possibleTypes = [
                    'zigzag','ghost','charger','splitter','shielded','teleporter','reflector',
                    'swarm','timebomber','vortex','speedster','slowtank','basic'
                ];
                if (Math.random() < 0.1) possibleTypes.push('boss');
            }
        } else {
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
                possibleTypes = ['boss'];
            }
        }
        console.log('[SPAWN ENEMY] Score:', score, 'HardMode:', hardMode, 'isBossWave:', isBossWave, 'PossibleTypes:', possibleTypes);
        let weights = possibleTypes.map(type => {
            if (hardMode) {
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
        let totalWeight = weights.reduce((a,b)=>a+b,0);
        let rand = Math.random() * totalWeight;
        let idx = 0;
        for (; idx < weights.length; idx++) {
            if (rand < weights[idx]) break;
            rand -= weights[idx];
        }
        enemyType = possibleTypes[idx] || 'basic';
        console.log('[SPAWN ENEMY] Selected enemyType:', enemyType);
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
        if (enemy && !enemy.isBoss) {
            const baseSpeed = this.waveManager.enemySpeed;
            let speedVariation = 0.5 + Math.random() * 1.5;
            if (hardMode) {
                speedVariation = 1.5 + Math.random() * 2.5;
            }
            enemy.speedMultiplier = speedVariation;
            if (Math.random() < (hardMode ? 0.2 : 0.1)) {
                enemy.speedMultiplier = Math.random() < 0.5 ? 0.3 : (hardMode ? 5.0 : 3.0);
            }
            if (score > 100 && Math.random() < (hardMode ? 0.6 : 0.3)) {
                enemy.spin = (Math.random() - 0.5) * (hardMode ? 0.5 : 0.2);
            }
        }
        if (enemy) {
            this.addEnemy(enemy);
            this.lastEnemySpawnTime = Date.now();
            console.log('[SPAWN ENEMY] Enemy created and pushed:', enemy.constructor.name, 'Total enemies:', this.enemies.length);
        } else {
            console.error('[SPAWN ENEMY] Failed to create enemy for type:', enemyType);
        }
    }
    
    _checkCollisions() {
        if (!this.activePowerups['invincibility_active'] && !this.feverManager.feverActive) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                if (this.enemies[i].collidesWith(this.core)) {
                    this._gameOver();
                    return;
                }
            }
        }
        for (let i = this.waves.length - 1; i >= 0; i--) {
            const wave = this.waves[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (wave.collidesWith(enemy)) {
                    let damage = 1 * wave.damageMultiplier;
                    
                    if (this.feverManager.feverActive) {
                        damage *= SETTINGS.FEVER_MODE_PLAYER_WAVE_DAMAGE_MULTIPLIER;
                    }
                    if (enemy instanceof BossEnemy) {
                        const defeated = enemy.takeDamage(damage);
                        if (defeated) {
                            this.enemies.splice(j, 1);
                            this._handleEnemyDefeat(enemy, damage);
                            this.messageDisplay.addMessage(
                                SETTINGS.ACHIEVEMENT_MESSAGES.boss_slayer, 
                                { x: SETTINGS.WIDTH / 2, y: SETTINGS.HEIGHT / 2 - 50 }, 
                                SETTINGS.YELLOW, 
                                36
                            );
                        } else {
                            this.addDamageNumber(new DamageNumber(
                                enemy.position, 
                                Math.round(damage), 
                                SETTINGS.WHITE, 
                                false
                            ));
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
                        if (!enemy.reflectWave(wave)) {
                            this.enemies.splice(j, 1);
                            this._handleEnemyDefeat(enemy, damage);
                        }
                    } else if (enemy instanceof SlowTankEnemy) {
                        const defeated = enemy.takeDamage(damage);
                        if (defeated) {
                            this.enemies.splice(j, 1);
                            this._handleEnemyDefeat(enemy, damage);
                        } else {
                            this.addDamageNumber(new DamageNumber(
                                enemy.position, 
                                Math.round(damage), 
                                SETTINGS.WHITE, 
                                false
                            ));
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
        console.log(`Enemy defeated: type=${enemy.constructor.name}, score=${this.score}, enemies remaining=${this.enemies.length}`);
        this.comboManager.addHit();
        const feverCharge = SETTINGS.FEVER_MODE_CHARGE_PER_HIT;
        const comboBonus = this.comboManager.comboCount >= 5 ? SETTINGS.COMBO_FEVER_BOOST : 0;
        this.feverManager.addCharge(feverCharge + comboBonus);
        const baseScore = enemy.scoreValue || 1;
        this.score += baseScore + this.comboManager.getBonus();
        this.lastScoreTime = Date.now();
        this._playSound('enemy_hit');
        for (let i = 0; i < 10; i++) {
            this.addParticle(new Particle(enemy.position, enemy.color));
        }
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
        const comboMsg = this.comboManager.getComboMessage();
        if (comboMsg) {
            this.messageDisplay.addMessage(
                comboMsg, 
                { x: enemy.position.x, y: enemy.position.y - 20 }, 
                SETTINGS.YELLOW, 
                24
            );
            if (this.comboManager.comboCount >= 20) {
                this.messageDisplay.addMessage(
                    SETTINGS.ACHIEVEMENT_MESSAGES.combo_master, 
                    { x: SETTINGS.WIDTH / 2, y: SETTINGS.HEIGHT / 2 - 50 }, 
                    SETTINGS.YELLOW, 
                    36
                );
            }
        }
        const isCritical = Math.random() < SETTINGS.CRITICAL_HIT_CHANCE;
        if (isCritical) {
            damage *= SETTINGS.CRITICAL_HIT_MULTIPLIER;
        }
        this.addDamageNumber(new DamageNumber(
            enemy.position, 
            Math.round(damage), 
            SETTINGS.WHITE, 
            isCritical
        ));
        this.addImpactEffect(new ImpactEffect(enemy.position, enemy.color));
        if (enemy instanceof BossEnemy && this.enemies.length === 0) {
            this.waveManager.waveActive = false;
            this.waveManager.spawnedEnemiesCount = 0;
            this.waveManager.spawnTimer = 0;
            this.waveManager.bossSpawned = false;
            console.log('Boss defeated, boss wave complete. Ready for next wave.');
        }
    }
    
    _activatePowerup(powerupType) {
        const message = SETTINGS.POWERUP_MESSAGES[powerupType] || '';
        this.messageDisplay.addMessage(
            message, 
            { x: SETTINGS.WIDTH / 2, y: SETTINGS.HEIGHT / 2 }, 
            SETTINGS.YELLOW, 
            36
        );
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
                this._createMultiWaves();
                break;
        }
    }
    
    _createMultiWaves() {
        const center = { x: this.core.position.x, y: this.core.position.y };
        const directions = [
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 1 },
            { x: -1, y: 1 },
            { x: -1, y: 0 },
            { x: -1, y: -1 },
            { x: 0, y: -1 },
            { x: 1, y: -1 }
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
        this._playSound('multi_wave');
        this.addImpactEffect(new ImpactEffect(
            center, 
            SETTINGS.POWERUP_COLOR_MULTI_WAVE,
            SETTINGS.WIDTH / 4
        ));
    }
    
    _activateEchoBurst() {
        this.echoBurstCooldown = SETTINGS.ECHO_BURST_COOLDOWN;
        this._playSound('echo_burst');
        document.getElementById('echo-cooldown').style.width = '100%';
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.position.distanceTo(this.core.position) < SETTINGS.ECHO_BURST_RADIUS) {
                this.enemies.splice(i, 1);
                this._handleEnemyDefeat(enemy, SETTINGS.ECHO_BURST_DAMAGE);
            }
        }
        this.addImpactEffect(new ImpactEffect(this.core.position, SETTINGS.ECHO_BURST_COLOR));
    }
    
    _updatePowerupTimers() {
        for (const powerupType in this.powerupTimers) {
            if (this.powerupTimers[powerupType] > 0) {
                this.powerupTimers[powerupType]--;
                if (this.powerupTimers[powerupType] === 0) {
                    this.activePowerups[`${powerupType}_active`] = false;
                    if (powerupType === 'invincibility') {
                        this.core.setInvincible(false);
                    }
                }
            }
        }
    }
    
    _drawPowerupTimers() {
        const powerupTimersElement = document.getElementById('powerup-timers');
        powerupTimersElement.innerHTML = '';
        for (const powerupType in this.powerupTimers) {
            if (this.powerupTimers[powerupType] > 0) {
                const timerElement = document.createElement('div');
                timerElement.className = 'powerup-timer';
                
                const formattedType = powerupType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const seconds = Math.ceil(this.powerupTimers[powerupType] / SETTINGS.FPS);
                let iconClass = 'fa-bolt';
                
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
        this.screenShake = new ScreenShake(10, 30);
        const gameScreen = document.getElementById('game-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        
        if (gameScreen) {
            gameScreen.classList.add('hidden');
        }
        
        if (gameOverScreen) {
            gameOverScreen.classList.remove('hidden');
            setTimeout(() => {
                gameOverScreen.style.opacity = '1';
                gameOverScreen.style.pointerEvents = 'auto';
            }, 100);
            const restartButton = document.getElementById('restart-button');
            if (restartButton) {
                restartButton.style.display = 'block';
            }
        }
        const finalScoreElement = document.getElementById('final-score');
        if (finalScoreElement && finalScoreElement.querySelector) {
            const scoreSpan = finalScoreElement.querySelector('span');
            if (scoreSpan) {
                scoreSpan.textContent = this.score;
                this._animateScoreCounter(scoreSpan, 0, this.score);
            }
        }
        const playerNameContainer = document.getElementById('player-name-container');
        if (playerNameContainer) {
            playerNameContainer.style.display = 'none';
        }
        const autoSubmitted = this.autoSubmitScore ? this.autoSubmitScore() : false;
        console.log('Auto-submitted score:', autoSubmitted);
        this._loadHighScores();
    }
    _animateScoreCounter(element, start, end) {
        const duration = 1500;
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
            if (!Array.isArray(highscores)) {
                console.error('Highscores is not an array:', typeof highscores);
                highscores = [];
            }
            const leaderboardElements = document.querySelectorAll('#leaderboard-entries');
            console.log('Number of leaderboard elements found:', leaderboardElements.length);
            if (leaderboardElements.length > 1) {
                console.error('Multiple leaderboard elements found with the same ID!');
                for (let i = 1; i < leaderboardElements.length; i++) {
                    leaderboardElements[i].parentNode.removeChild(leaderboardElements[i]);
                }
                console.log('Removed duplicate leaderboard elements, keeping only the first one');
            }
            const leaderboardContainer = document.getElementById('leaderboard');
            if (leaderboardContainer) {
                const oldLeaderboardEntries = document.getElementById('leaderboard-entries');
                if (oldLeaderboardEntries) {
                    oldLeaderboardEntries.parentNode.removeChild(oldLeaderboardEntries);
                }
                const newLeaderboardEntries = document.createElement('div');
                newLeaderboardEntries.id = 'leaderboard-entries';
                leaderboardContainer.appendChild(newLeaderboardEntries);
                const uniqueScores = {};
                highscores.forEach(entry => {
                    if (!entry) return;
                    
                    const name = entry.name || 'Anonymous';
                    const score = entry.score || 0;
                    if (!uniqueScores[name] || score > uniqueScores[name]) {
                        uniqueScores[name] = score;
                    }
                });
                const uniqueHighscores = Object.entries(uniqueScores).map(([name, score]) => ({
                    name,
                    score
                }));
                
                uniqueHighscores.sort((a, b) => b.score - a.score);
                const currentPlayerName = this.playerName || '';
                console.log('Current player for highlighting:', currentPlayerName);
                uniqueHighscores.forEach((entry, index) => {
                    const entryElement = document.createElement('div');
                    entryElement.className = 'leaderboard-entry';
                    if (entry.name === currentPlayerName) {
                        entryElement.classList.add('current-player');
                    }
                    
                    entryElement.innerHTML = `${index + 1}. ${entry.name}<span>${entry.score}</span>`;
                    newLeaderboardEntries.appendChild(entryElement);
                });
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
        const playerName = name || this.playerName || 'Anonymous';
        console.log('Saving high score for:', playerName, 'Score:', this.score);
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
        if (window.mobileControls) {
            window.mobileControls.resetTouchCooldown();
        }
        if (window.universalControls) {
            window.universalControls.resetInteractionCooldown();
        }
        this.waveManager.currentWave = 0;
        this.waveManager.enemiesToSpawn = 0;
        this.waveManager.spawnedEnemiesCount = 0;
        this.waveManager.spawnTimer = 0;
        this.waveManager.waveActive = false;
        this.waveManager.enemySpeed = SETTINGS.ENEMY_SPEED;
        this.waveManager.bossSpawned = false;
        this.waveManager.startNextWave();
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
        const modeDisplay = document.getElementById('wave-mode');
        modeDisplay.classList.add('mode-changed');
        setTimeout(() => {
            modeDisplay.classList.remove('mode-changed');
        }, 500);
    }
} 