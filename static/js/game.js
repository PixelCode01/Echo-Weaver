// Game class - Manages the game state and logic

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
        
        // Initialize background particles
        for (let i = 0; i < 50; i++) {
            this.backgroundParticles.push(new BackgroundParticle());
        }
        
        this.messageDisplay = new MessageDisplay();
        this.comboManager = new ComboManager();
        this.feverManager = new FeverManager();
        this.screenShake = null;
        
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
            
            startNextWave: () => {
                this.waveManager.currentWave++;
                this.waveManager.enemiesToSpawn = SETTINGS.ENEMIES_PER_WAVE_BASE + 
                    (this.waveManager.currentWave - 1) * SETTINGS.ENEMIES_PER_WAVE_INCREMENT;
                this.waveManager.spawnedEnemiesCount = 0;
                this.waveManager.spawnTimer = 0;
                this.waveManager.waveActive = true;
                
                // Update enemy speed for the new wave
                this.waveManager.enemySpeed = SETTINGS.ENEMY_SPEED + 
                    (this.waveManager.currentWave - 1) * 0.2;
                    
                if (this.waveManager.enemySpeed > SETTINGS.ENEMY_MAX_SPEED) {
                    this.waveManager.enemySpeed = SETTINGS.ENEMY_MAX_SPEED;
                }
                
                console.log(`Starting Wave ${this.waveManager.currentWave} with ${this.waveManager.enemiesToSpawn} enemies.`);
                
                // Update UI
                document.getElementById('wave').textContent = this.waveManager.currentWave;
            },
            
            update: () => {
                // Score-based enemy spawning - ensure enemies always spawn
                const score = this.score;
                const scoreIncrease = score - this.waveManager.lastScoreCheck;
                
                // Base spawn rate based on score
                let baseSpawnRate = SETTINGS.ENEMY_SPAWN_RATE;
                
                // Decrease spawn rate as score increases (more frequent spawning)
                if (score >= 100) baseSpawnRate = Math.max(30, baseSpawnRate - 10);
                if (score >= 200) baseSpawnRate = Math.max(20, baseSpawnRate - 10);
                if (score >= 300) baseSpawnRate = Math.max(15, baseSpawnRate - 5);
                if (score >= 500) baseSpawnRate = Math.max(10, baseSpawnRate - 5);
                if (score >= 1000) baseSpawnRate = Math.max(8, baseSpawnRate - 2);
                
                // Ensure minimum enemies on screen based on score
                const minEnemiesOnScreen = Math.min(8, Math.floor(score / 50) + 1);
                
                // Spawn enemies if we have too few
                if (this.enemies.length < minEnemiesOnScreen) {
                    this._spawnEnemy();
                }
                
                // Regular spawn timer
                this.waveManager.spawnTimer++;
                if (this.waveManager.spawnTimer >= baseSpawnRate) {
                    this.waveManager.spawnTimer = 0;
                    this._spawnEnemy();
                }
                
                // Update last score check
                this.waveManager.lastScoreCheck = score;
                
                // Update wave number based on score (for UI purposes)
                const newWave = Math.floor(score / 50) + 1;
                if (newWave !== this.waveManager.currentWave) {
                    this.waveManager.currentWave = newWave;
                    document.getElementById('wave').textContent = this.waveManager.currentWave;
                    
                    // Increase enemy speed with score
                    this.waveManager.enemySpeed = SETTINGS.ENEMY_SPEED + 
                        (this.waveManager.currentWave - 1) * 0.15;
                        
                    if (this.waveManager.enemySpeed > SETTINGS.ENEMY_MAX_SPEED) {
                        this.waveManager.enemySpeed = SETTINGS.ENEMY_MAX_SPEED;
                    }
                }
            }
        };
        
        // Start the first wave
        this.waveManager.startNextWave();
        
        // Load high scores
        this._loadHighScores();
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
        if (this.state === 'playing') {
            if (event.type === 'mousedown') {
                this.startPos = { x: event.clientX, y: event.clientY };
            } else if (event.type === 'mouseup' && this.startPos) {
                const endPos = { x: event.clientX, y: event.clientY };
                
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
        
        // Update wave manager
        this.waveManager.update();
        
        // If wave is not active and no enemies, start next wave
        if (!this.waveManager.waveActive && this.enemies.length === 0) {
            this.waveManager.startNextWave();
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
        
        // Define enemy types by score ranges
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

        // Weight probabilities for harder types as score increases within each range
        let weights = possibleTypes.map(type => {
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
            // Give each enemy a unique speed variation
            const baseSpeed = this.waveManager.enemySpeed;
            const speedVariation = 0.5 + Math.random() * 1.5; // 0.5x to 2x speed
            enemy.speedMultiplier = speedVariation;
            
            // Some enemies get extreme speed variations
            if (Math.random() < 0.1) { // 10% chance for extreme speed
                enemy.speedMultiplier = Math.random() < 0.5 ? 0.3 : 3.0; // Very slow or very fast
            }
            
            // Add spin property for visual challenge
            if (score > 100 && Math.random() < 0.3) {
                enemy.spin = (Math.random() - 0.5) * 0.2;
            }
        }
        if (enemy) this.enemies.push(enemy);
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
                            this.damageNumbers.push(new DamageNumber(
                                enemy.position, 
                                Math.round(damage), 
                                SETTINGS.WHITE, 
                                false
                            ));
                            
                            // Create impact effect
                            this.impactEffects.push(new ImpactEffect(
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
                            this.damageNumbers.push(new DamageNumber(
                                enemy.position, 
                                Math.round(damage), 
                                SETTINGS.WHITE, 
                                false
                            ));
                            
                            // Create impact effect
                            this.impactEffects.push(new ImpactEffect(
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
                        this.enemies.push(...newEnemies);
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
        
        // Play sound
        this._playSound('enemy_hit');
        
        // Create particles
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(enemy.position, enemy.color));
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
            this.powerups.push(new PowerUp(enemy.position, powerupType));
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
        this.damageNumbers.push(new DamageNumber(
            enemy.position, 
            Math.round(damage), 
            SETTINGS.WHITE, 
            isCritical
        ));
        
        // Create impact effect
        this.impactEffects.push(new ImpactEffect(enemy.position, enemy.color));
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
        this.impactEffects.push(new ImpactEffect(
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
        this.impactEffects.push(new ImpactEffect(this.core.position, SETTINGS.ECHO_BURST_COLOR));
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
        // Don't reset playerName to preserve it between games
        
        // Reset wave manager
        this.waveManager.currentWave = 0;
        this.waveManager.enemiesToSpawn = 0;
        this.waveManager.spawnedEnemiesCount = 0;
        this.waveManager.spawnTimer = 0;
        this.waveManager.waveActive = false;
        this.waveManager.enemySpeed = SETTINGS.ENEMY_SPEED;
        
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