// Enemy classes for the game

// Helper function to draw enemy shapes
function drawEnemyShape(ctx, fillColor, outlineColor, radius, lineWidth = 2) {
    // Draw the main body
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    // Draw outline
    if (outlineColor) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
}

// Base Enemy class
class Enemy {
    constructor() {
        this.radius = SETTINGS.ENEMY_RADIUS;
        this.position = this.getRandomEdgePosition();
        this.color = SETTINGS.ENEMY_COLORS.Enemy;
        this.outlineColor = SETTINGS.WHITE;
        this.pulseTimer = 0;
        this.isBoss = false;
        this.scoreValue = 1;
    }

    getRandomEdgePosition() {
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;

        switch (edge) {
            case 0: // top
                x = Math.random() * SETTINGS.WIDTH;
                y = -this.radius;
                break;
            case 1: // right
                x = SETTINGS.WIDTH + this.radius;
                y = Math.random() * SETTINGS.HEIGHT;
                break;
            case 2: // bottom
                x = Math.random() * SETTINGS.WIDTH;
                y = SETTINGS.HEIGHT + this.radius;
                break;
            case 3: // left
                x = -this.radius;
                y = Math.random() * SETTINGS.HEIGHT;
                break;
        }

        return new Vector(x, y);
    }

    update(core, speed, enemyTrails = null) {
        // Move towards the core
        const dirVec = new Vector(
            core.position.x - this.position.x,
            core.position.y - this.position.y
        );
        
        if (dirVec.length() > 0) {
            const normalized = dirVec.normalize();
            this.position = this.position.add(normalized.multiply(speed));
        }

        // Add enemy trail
        if (enemyTrails) {
            enemyTrails.push(new EnemyTrail(this.position, this.color, this.radius / 2));
        }
        
        // Update pulse timer for visual effects
        this.pulseTimer = (this.pulseTimer + 1) % 60;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Draw pulsating effect for visual interest
        const pulseScale = 1 + 0.1 * Math.sin(this.pulseTimer / 60 * 2 * Math.PI);
        
        // Draw speed indicator if enemy has speed multiplier
        if (this.speedMultiplier && this.speedMultiplier !== 1) {
            const speedColor = this.speedMultiplier > 1.5 ? '#ff0000' : 
                              this.speedMultiplier > 1.2 ? '#ff6600' : 
                              this.speedMultiplier < 0.7 ? '#0066ff' : '#ffffff';
            
            // Draw speed ring
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.4, 0, Math.PI * 2);
            ctx.strokeStyle = speedColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw speed arrows for fast enemies
            if (this.speedMultiplier > 1.2) {
                for (let i = 0; i < 3; i++) {
                    const angle = (i / 3) * Math.PI * 2;
                    ctx.save();
                    ctx.rotate(angle);
                    ctx.beginPath();
                    ctx.moveTo(this.radius * 0.8, 0);
                    ctx.lineTo(this.radius * 1.2, -3);
                    ctx.lineTo(this.radius * 1.2, 3);
                    ctx.closePath();
                    ctx.fillStyle = speedColor;
                    ctx.fill();
                    ctx.restore();
                }
            }
        }
        
        drawEnemyShape(ctx, this.color, this.outlineColor, this.radius, 2);
        
        // Draw subtle glow
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * pulseScale * 1.2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + 0.1 * Math.sin(this.pulseTimer / 60 * 2 * Math.PI)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }

    collidesWith(other) {
        return this.position.distanceTo(other.position) < this.radius + other.radius;
    }
    
    onDestroy() {
        // Chain reaction effect
        if (SETTINGS.CHAIN_REACTION_ENABLED && 
            window.game && 
            window.game.activePowerups && 
            window.game.activePowerups['chain_reaction_active']) {
            
            this.triggerChainReaction();
        }
        
        return this.scoreValue;
    }
    
    triggerChainReaction() {
        if (!window.game) return;
        
        // Find nearby enemies and damage them
        for (let i = 0; i < window.game.enemies.length; i++) {
            const enemy = window.game.enemies[i];
            if (enemy === this) continue;
            
            const distance = this.position.distanceTo(enemy.position);
            if (distance < SETTINGS.CHAIN_REACTION_RADIUS) {
                // Create chain reaction effect
                const effect = new ImpactEffect(
                    this.position,
                    SETTINGS.POWERUP_COLOR_CHAIN_REACTION,
                    SETTINGS.CHAIN_REACTION_RADIUS
                );
                window.game.impactEffects.push(effect);
                
                // Handle enemy defeat
                window.game.enemies.splice(i, 1);
                window.game._handleEnemyDefeat(enemy);
                i--; // Adjust index since we removed an element
            }
        }
    }
}

// ZigzagEnemy class - moves in a zigzag pattern
class ZigzagEnemy extends Enemy {
    constructor() {
        super();
        this.color = SETTINGS.ENEMY_COLORS.ZigzagEnemy;
        this.zigzagTimer = 0;
        this.zigzagFrequency = 30;
        this.zigzagAmplitude = 5;
        this.scoreValue = 2;
    }

    update(core, speed, enemyTrails = null) {
        // Move towards the core with zigzag motion
        const dirVec = new Vector(
            core.position.x - this.position.x,
            core.position.y - this.position.y
        );
        
        if (dirVec.length() > 0) {
            const normalized = dirVec.normalize();
            
            // Add zigzag motion
            this.zigzagTimer++;
            const perpendicularVec = new Vector(-normalized.y, normalized.x);
            const zigzagOffset = perpendicularVec.multiply(
                Math.sin(this.zigzagTimer / this.zigzagFrequency) * this.zigzagAmplitude
            );
            
            const moveVec = normalized.add(zigzagOffset);
            this.position = this.position.add(moveVec.multiply(speed));
        }

        // Add enemy trail
        if (enemyTrails) {
            enemyTrails.push(new EnemyTrail(this.position, this.color, this.radius / 2));
        }
        
        // Update pulse timer for visual effects
        this.pulseTimer = (this.pulseTimer + 1) % 60;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Draw the zigzag enemy
        drawEnemyShape(ctx, this.color, this.outlineColor, this.radius, 2);
        
        // Draw zigzag pattern indicator
        const zigzagSize = this.radius * 0.7;
        ctx.beginPath();
        ctx.moveTo(-zigzagSize, -zigzagSize/2);
        ctx.lineTo(-zigzagSize/2, zigzagSize/2);
        ctx.lineTo(zigzagSize/2, -zigzagSize/2);
        ctx.lineTo(zigzagSize, zigzagSize/2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}

// GhostEnemy class - requires multiple hits to destroy
class GhostEnemy extends Enemy {
    constructor() {
        super();
        this.color = SETTINGS.ENEMY_COLORS.GhostEnemy;
        this.hitsRemaining = SETTINGS.GHOST_ENEMY_HITS_REQUIRED;
        this.opacity = 0.7;
        this.scoreValue = 3;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.globalAlpha = this.opacity;
        
        // Draw the ghost enemy with transparency
        drawEnemyShape(ctx, this.color, this.outlineColor, this.radius, 2);
        
        // Draw hit indicator
        for (let i = 0; i < this.hitsRemaining; i++) {
            ctx.beginPath();
            const x = (i - (SETTINGS.GHOST_ENEMY_HITS_REQUIRED - 1) / 2) * 8;
            ctx.arc(x, this.radius / 2, 3, 0, Math.PI * 2);
            ctx.fillStyle = SETTINGS.YELLOW;
            ctx.fill();
        }
        
        // Draw ghost trail effect
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(150, 150, 255, ${0.3 + 0.2 * Math.sin(this.pulseTimer / 60 * 2 * Math.PI)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
    
    update(core, speed, enemyTrails = null) {
        super.update(core, speed * 0.9, enemyTrails); // Ghosts move slightly slower
        
        // Fade in and out
        this.opacity = 0.5 + 0.3 * Math.sin(this.pulseTimer / 60 * 2 * Math.PI);
    }
}

// ChargerEnemy class - charges at the core when close enough
class ChargerEnemy extends Enemy {
    constructor() {
        super();
        this.color = SETTINGS.ENEMY_COLORS.ChargerEnemy;
        this.isCharging = false;
        this.chargeDirection = null;
        this.chargeTimer = 0;
        this.scoreValue = 3;
    }

    update(core, speed, enemyTrails = null) {
        const distToCore = this.position.distanceTo(core.position);
        
        if (!this.isCharging && distToCore < SETTINGS.CHARGER_ENEMY_CHARGE_DISTANCE) {
            // Start charging
            this.isCharging = true;
            this.chargeDirection = new Vector(
                core.position.x - this.position.x,
                core.position.y - this.position.y
            ).normalize();
            this.chargeTimer = 0;
        }
        
        if (this.isCharging) {
            // Continue charging in the same direction
            const chargeSpeed = speed * SETTINGS.CHARGER_ENEMY_CHARGE_SPEED_MULTIPLIER;
            this.position = this.position.add(this.chargeDirection.multiply(chargeSpeed));
            
            // Increment charge timer
            this.chargeTimer++;
            
            // Reset charge after a while
            if (this.chargeTimer > 60) {
                this.isCharging = false;
            }
        } else {
            // Normal movement towards core
            super.update(core, speed, enemyTrails);
        }
        
        // Add enemy trail
        if (enemyTrails) {
            // Add more trails when charging for visual effect
            const trailCount = this.isCharging ? 3 : 1;
            for (let i = 0; i < trailCount; i++) {
                enemyTrails.push(new EnemyTrail(this.position, this.color, this.radius / 2));
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Draw the charger enemy
        drawEnemyShape(ctx, this.color, this.outlineColor, this.radius, 2);
        
        // Draw charging indicator if charging
        if (this.isCharging) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.3, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 100, 0, ${0.5 + 0.5 * Math.sin(Date.now() / 100)})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw directional indicator
            if (this.chargeDirection) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(
                    this.chargeDirection.x * this.radius * 1.5,
                    this.chargeDirection.y * this.radius * 1.5
                );
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
}

// SplitterEnemy class - splits into smaller enemies when hit
class SplitterEnemy extends Enemy {
    constructor(radius = SETTINGS.ENEMY_RADIUS) {
        super();
        this.radius = radius;
        this.color = SETTINGS.ENEMY_COLORS.SplitterEnemy;
        this.scoreValue = radius === SETTINGS.ENEMY_RADIUS ? 2 : 1;
        this.rotationAngle = 0;
    }

    update(core, speed, enemyTrails = null) {
        super.update(core, speed, enemyTrails);
        
        // Rotate the splitter enemy for visual effect
        this.rotationAngle += 0.05;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotationAngle);
        
        // Draw the splitter enemy
        drawEnemyShape(ctx, this.color, this.outlineColor, this.radius, 2);
        
        // Draw split indicator
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.7, 0);
        ctx.lineTo(this.radius * 0.7, 0);
        ctx.moveTo(0, -this.radius * 0.7);
        ctx.lineTo(0, this.radius * 0.7);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }

    split() {
        const newEnemies = [];
        
        if (this.radius * SETTINGS.SPLITTER_ENEMY_RADIUS_MULTIPLIER > 5) {
            for (let i = 0; i < SETTINGS.SPLITTER_ENEMY_COUNT; i++) {
                const newEnemy = new SplitterEnemy(this.radius * SETTINGS.SPLITTER_ENEMY_RADIUS_MULTIPLIER);
                newEnemy.position = new Vector(this.position.x, this.position.y);
                
                // Add slight randomness to position
                const angle = Math.random() * Math.PI * 2;
                const distance = this.radius * 0.5;
                newEnemy.position.x += Math.cos(angle) * distance;
                newEnemy.position.y += Math.sin(angle) * distance;
                
                newEnemies.push(newEnemy);
            }
        }
        
        return newEnemies;
    }
}

// ShieldedEnemy class - has a shield that absorbs hits
class ShieldedEnemy extends Enemy {
    constructor() {
        super();
        this.color = SETTINGS.ENEMY_COLORS.ShieldedEnemy;
        this.shieldHealth = SETTINGS.SHIELDED_ENEMY_SHIELD_HEALTH;
        this.shieldRotation = 0;
        this.scoreValue = 4;
    }

    update(core, speed, enemyTrails = null) {
        super.update(core, speed, enemyTrails);
        this.shieldRotation += 0.03;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Draw the shielded enemy
        drawEnemyShape(ctx, this.color, this.outlineColor, this.radius, 2);
        
        // Draw rotating shield
        ctx.rotate(this.shieldRotation);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.4, 0, Math.PI * 2);
        ctx.strokeStyle = SETTINGS.SHIELDED_ENEMY_SHIELD_COLOR;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw shield segments
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.2, -Math.PI / 4, Math.PI / 4);
            ctx.strokeStyle = `rgba(200, 200, 200, ${0.8 - this.shieldHealth * 0.2})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// TeleporterEnemy class - teleports around randomly
class TeleporterEnemy extends Enemy {
    constructor() {
        super();
        this.color = '#8A2BE2'; // Purple
        this.teleportTimer = 0;
        this.teleportCooldown = 120; // Teleport every 2 seconds
        this.teleportRange = 100;
        this.scoreValue = 3;
        this.teleportEffect = 0;
    }

    update(core, speed, enemyTrails = null) {
        super.update(core, speed * 0.8, enemyTrails);
        
        this.teleportTimer++;
        if (this.teleportTimer >= this.teleportCooldown) {
            this.teleport();
            this.teleportTimer = 0;
        }
        
        // Update teleport effect
        if (this.teleportEffect > 0) {
            this.teleportEffect -= 0.1;
        }
    }

    teleport() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.teleportRange;
        
        this.position.x += Math.cos(angle) * distance;
        this.position.y += Math.sin(angle) * distance;
        
        // Keep within bounds
        this.position.x = Math.max(this.radius, Math.min(SETTINGS.WIDTH - this.radius, this.position.x));
        this.position.y = Math.max(this.radius, Math.min(SETTINGS.HEIGHT - this.radius, this.position.y));
        
        this.teleportEffect = 1;
        
        // Create teleport particles
        if (window.game) {
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const pos = new Vector(
                    this.position.x + Math.cos(angle) * this.radius,
                    this.position.y + Math.sin(angle) * this.radius
                );
                window.game.particles.push(new Particle(pos, this.color));
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Teleport effect
        if (this.teleportEffect > 0) {
            ctx.globalAlpha = this.teleportEffect;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        // Draw the teleporter enemy
        drawEnemyShape(ctx, this.color, this.outlineColor, this.radius, 2);
        
        // Draw teleport indicator
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw teleport cooldown indicator
        const cooldownProgress = this.teleportTimer / this.teleportCooldown;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.2, -Math.PI / 2, -Math.PI / 2 + cooldownProgress * Math.PI * 2);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}

// ReflectorEnemy class - reflects waves back at the player
class ReflectorEnemy extends Enemy {
    constructor() {
        super();
        this.color = '#FFD700'; // Gold
        this.reflectCooldown = 0;
        this.maxReflectCooldown = 60;
        this.scoreValue = 4;
        this.reflectCharge = 0;
    }

    update(core, speed, enemyTrails = null) {
        super.update(core, speed * 0.7, enemyTrails);
        
        if (this.reflectCooldown > 0) {
            this.reflectCooldown--;
        }
        
        // Charge up reflection ability
        this.reflectCharge = Math.min(1, this.reflectCharge + 0.02);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Draw the reflector enemy
        drawEnemyShape(ctx, this.color, this.outlineColor, this.radius, 2);
        
        // Draw reflection surface
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + this.reflectCharge * 0.5})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw reflection indicator
        if (this.reflectCharge > 0.5) {
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.5, -this.radius * 0.5);
            ctx.lineTo(this.radius * 0.5, this.radius * 0.5);
            ctx.moveTo(this.radius * 0.5, -this.radius * 0.5);
            ctx.lineTo(-this.radius * 0.5, this.radius * 0.5);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.restore();
    }

    // This will be called when hit by a wave
    reflectWave(wave) {
        if (this.reflectCooldown === 0 && this.reflectCharge > 0.5) {
            this.reflectCooldown = this.maxReflectCooldown;
            this.reflectCharge = 0;
            
            // Create a reflected wave back at the player
            if (window.game && window.game.core) {
                const reflectedWave = new SoundWave(
                    this.position,
                    window.game.core.position,
                    false,
                    false,
                    1.5, // Reflected waves are stronger
                    0.8
                );
                window.game.waves.push(reflectedWave);
                
                // Visual effect
                for (let i = 0; i < 5; i++) {
                    window.game.particles.push(new Particle(this.position, this.color));
                }
            }
            
            return true; // Wave was reflected
        }
        return false; // Wave was not reflected
    }
}

// SwarmEnemy class - spawns smaller enemies around it
class SwarmEnemy extends Enemy {
    constructor() {
        super();
        this.color = '#FF4500'; // Orange Red
        this.radius = SETTINGS.ENEMY_RADIUS * 1.5;
        this.spawnTimer = 0;
        this.spawnCooldown = 180; // Spawn every 3 seconds
        this.maxMinions = 3;
        this.minions = [];
        this.scoreValue = 5;
    }

    update(core, speed, enemyTrails = null) {
        super.update(core, speed * 0.6, enemyTrails);
        
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnCooldown && this.minions.length < this.maxMinions) {
            this.spawnMinion();
            this.spawnTimer = 0;
        }
        
        // Update minions
        for (let i = this.minions.length - 1; i >= 0; i--) {
            this.minions[i].update(core, speed * 1.2, enemyTrails);
            
            // Remove minions that are too far or destroyed
            const distance = this.position.distanceTo(this.minions[i].position);
            if (distance > 200 || !this.minions[i].active) {
                this.minions.splice(i, 1);
            }
        }
    }

    spawnMinion() {
        const minion = new Enemy();
        minion.radius = SETTINGS.ENEMY_RADIUS * 0.6;
        minion.color = '#FF6347';
        minion.position = new Vector(this.position.x, this.position.y);
        
        // Spawn at random angle around the swarm enemy
        const angle = Math.random() * Math.PI * 2;
        const distance = this.radius + 10;
        minion.position.x += Math.cos(angle) * distance;
        minion.position.y += Math.sin(angle) * distance;
        
        this.minions.push(minion);
        
        // Visual effect
        if (window.game) {
            for (let i = 0; i < 3; i++) {
                window.game.particles.push(new Particle(minion.position, minion.color));
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Draw the swarm enemy
        drawEnemyShape(ctx, this.color, this.outlineColor, this.radius, 2);
        
        // Draw spawn indicator
        const spawnProgress = this.spawnTimer / this.spawnCooldown;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.3, -Math.PI / 2, -Math.PI / 2 + spawnProgress * Math.PI * 2);
        ctx.strokeStyle = '#FF6347';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw minion count indicator
        for (let i = 0; i < this.minions.length; i++) {
            const angle = (Math.PI * 2 * i) / this.maxMinions;
            const x = Math.cos(angle) * this.radius * 0.8;
            const y = Math.sin(angle) * this.radius * 0.8;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#FF6347';
            ctx.fill();
        }
        
        ctx.restore();
        
        // Draw minions
        for (let minion of this.minions) {
            minion.draw(ctx);
        }
    }
}

// TimeBomberEnemy class - explodes after a certain time
class TimeBomberEnemy extends Enemy {
    constructor() {
        super();
        this.color = '#FF0000'; // Red
        this.explosionTimer = 300; // 5 seconds
        this.maxExplosionTimer = 300;
        this.scoreValue = 6;
        this.warningPhase = false;
    }

    update(core, speed, enemyTrails = null) {
        super.update(core, speed * 0.9, enemyTrails);
        
        this.explosionTimer--;
        
        // Warning phase when timer is low
        if (this.explosionTimer < 60) {
            this.warningPhase = true;
        }
        
        // Explode when timer reaches 0
        if (this.explosionTimer <= 0) {
            this.explode();
        }
    }

    explode() {
        if (window.game) {
            // Create explosion effect
            for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 * i) / 20;
                const pos = new Vector(
                    this.position.x + Math.cos(angle) * this.radius * 2,
                    this.position.y + Math.sin(angle) * this.radius * 2
                );
                window.game.particles.push(new Particle(pos, this.color));
            }
            
            // Damage nearby enemies
            for (let i = window.game.enemies.length - 1; i >= 0; i--) {
                const enemy = window.game.enemies[i];
                if (enemy !== this) {
                    const distance = this.position.distanceTo(enemy.position);
                    if (distance < this.radius * 3) {
                        window.game.enemies.splice(i, 1);
                        window.game._handleEnemyDefeat(enemy, 2);
                    }
                }
            }
            
            // Remove this enemy
            const index = window.game.enemies.indexOf(this);
            if (index > -1) {
                window.game.enemies.splice(index, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Draw the time bomber enemy
        drawEnemyShape(ctx, this.color, this.outlineColor, this.radius, 2);
        
        // Draw timer indicator
        const timerProgress = this.explosionTimer / this.maxExplosionTimer;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.2, -Math.PI / 2, -Math.PI / 2 + timerProgress * Math.PI * 2);
        ctx.strokeStyle = timerProgress > 0.2 ? '#00ff00' : '#ff0000';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Warning effect
        if (this.warningPhase) {
            const flash = Math.sin(Date.now() / 100) > 0;
            if (flash) {
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        
        // Draw bomb indicator
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}

// VortexEnemy class - creates a vortex that pulls waves and enemies
class VortexEnemy extends Enemy {
    constructor() {
        super();
        this.color = '#4B0082'; // Indigo
        this.vortexRadius = 80;
        this.vortexStrength = 0.5;
        this.vortexRotation = 0;
        this.scoreValue = 7;
    }

    update(core, speed, enemyTrails = null) {
        super.update(core, speed * 0.5, enemyTrails);
        
        this.vortexRotation += 0.1;
        
        // Apply vortex effect to nearby enemies
        if (window.game) {
            for (let enemy of window.game.enemies) {
                if (enemy !== this) {
                    const distance = this.position.distanceTo(enemy.position);
                    if (distance < this.vortexRadius) {
                        const pullStrength = (1 - distance / this.vortexRadius) * this.vortexStrength;
                        const pullDirection = new Vector(
                            this.position.x - enemy.position.x,
                            this.position.y - enemy.position.y
                        ).normalize();
                        
                        enemy.position = enemy.position.add(pullDirection.multiply(pullStrength));
                    }
                }
            }
            
            // Apply vortex effect to waves
            for (let wave of window.game.waves) {
                const distance = this.position.distanceTo(wave.position);
                if (distance < this.vortexRadius) {
                    const pullStrength = (1 - distance / this.vortexRadius) * this.vortexStrength * 0.5;
                    const pullDirection = new Vector(
                        this.position.x - wave.position.x,
                        this.position.y - wave.position.y
                    ).normalize();
                    
                    wave.position = wave.position.add(pullDirection.multiply(pullStrength));
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Draw vortex effect
        ctx.rotate(this.vortexRotation);
        for (let i = 0; i < 3; i++) {
            ctx.rotate(Math.PI * 2 / 3);
            ctx.beginPath();
            ctx.arc(0, 0, this.vortexRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(75, 0, 130, ${0.3 - i * 0.1})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Draw the vortex enemy
        drawEnemyShape(ctx, this.color, this.outlineColor, this.radius, 2);
        
        // Draw spiral indicator
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = this.radius * (0.5 + i * 0.1);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}

// SpeedsterEnemy class - extremely fast but fragile
class SpeedsterEnemy extends Enemy {
    constructor() {
        super();
        this.color = '#FF1493'; // Deep Pink
        this.speedMultiplier = 4.0; // Very fast
        this.radius = SETTINGS.ENEMY_RADIUS * 0.8; // Smaller
        this.scoreValue = 8;
        this.speedTrail = [];
        this.maxTrailLength = 10;
    }

    update(core, speed, enemyTrails = null) {
        super.update(core, speed * this.speedMultiplier, enemyTrails);
        
        // Add to speed trail
        this.speedTrail.push({ x: this.position.x, y: this.position.y });
        if (this.speedTrail.length > this.maxTrailLength) {
            this.speedTrail.shift();
        }
    }

    draw(ctx) {
        // Draw speed trail
        if (this.speedTrail.length > 1) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.speedTrail[0].x, this.speedTrail[0].y);
            for (let i = 1; i < this.speedTrail.length; i++) {
                ctx.lineTo(this.speedTrail[i].x, this.speedTrail[i].y);
            }
            ctx.stroke();
            ctx.restore();
        }
        
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Draw the speedster enemy
        drawEnemyShape(ctx, this.color, this.outlineColor, this.radius, 2);
        
        // Draw speed lines
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(this.radius * 0.6, 0);
            ctx.lineTo(this.radius * 1.5, -2);
            ctx.lineTo(this.radius * 1.5, 2);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.restore();
        }
        
        ctx.restore();
    }
}

// SlowTankEnemy class - very slow but tough
class SlowTankEnemy extends Enemy {
    constructor() {
        super();
        this.color = '#8B4513'; // Saddle Brown
        this.speedMultiplier = 0.3; // Very slow
        this.radius = SETTINGS.ENEMY_RADIUS * 2.0; // Much larger
        this.scoreValue = 10;
        this.armor = 3; // Takes multiple hits
        this.maxArmor = 3;
    }

    update(core, speed, enemyTrails = null) {
        super.update(core, speed * this.speedMultiplier, enemyTrails);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Draw armor plates
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate((i / 4) * Math.PI * 2);
            ctx.beginPath();
            ctx.rect(-this.radius * 0.3, -this.radius * 0.8, this.radius * 0.6, this.radius * 1.6);
            ctx.fillStyle = '#654321';
            ctx.fill();
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
        
        // Draw the tank enemy
        drawEnemyShape(ctx, this.color, this.outlineColor, this.radius, 3);
        
        // Draw armor indicator
        for (let i = 0; i < this.armor; i++) {
            const angle = (i / this.maxArmor) * Math.PI * 2;
            const x = Math.cos(angle) * this.radius * 0.6;
            const y = Math.sin(angle) * this.radius * 0.6;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ff0000';
            ctx.fill();
        }
        
        ctx.restore();
    }

    takeDamage(damage) {
        this.armor--;
        if (this.armor <= 0) {
            return true; // Enemy is defeated
        }
        return false; // Enemy survives
    }
}

// BossEnemy class - powerful enemy with high health that appears every few waves
class BossEnemy extends Enemy {
    constructor() {
        super();
        this.radius = SETTINGS.BOSS_ENEMY_RADIUS;
        this.color = SETTINGS.BOSS_ENEMY_COLOR;
        this.health = SETTINGS.BOSS_ENEMY_HEALTH;
        this.maxHealth = SETTINGS.BOSS_ENEMY_HEALTH;
        this.isBoss = true;
        this.scoreValue = SETTINGS.BOSS_ENEMY_SCORE_MULTIPLIER;
        this.rotationAngle = 0;
        this.outerRotationAngle = 0;
        this.spawnTime = Date.now();
    }

    update(core, speed, enemyTrails = null) {
        // Bosses move slower
        super.update(core, speed * SETTINGS.BOSS_ENEMY_SPEED_MULTIPLIER, enemyTrails);
        
        // Update rotation angles
        this.rotationAngle += 0.01;
        this.outerRotationAngle -= 0.005;
        
        // Add more enemy trails for visual effect
        if (enemyTrails) {
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = this.radius * 0.8;
                const trailPos = new Vector(
                    this.position.x + Math.cos(angle) * distance,
                    this.position.y + Math.sin(angle) * distance
                );
                enemyTrails.push(new EnemyTrail(trailPos, this.color, this.radius / 3));
            }
        }
        
        // Spawn minions periodically
        if (Date.now() - this.spawnTime > 5000 && window.game) { // Every 5 seconds
            this.spawnMinions();
            this.spawnTime = Date.now();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        // Draw outer glow
        const gradient = ctx.createRadialGradient(
            0, 0, this.radius * 0.8,
            0, 0, this.radius * 1.5
        );
        gradient.addColorStop(0, 'rgba(255, 62, 127, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 62, 127, 0)');
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw the boss enemy
        drawEnemyShape(ctx, this.color, this.outlineColor, this.radius, 3);
        
        // Draw inner core
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        
        // Draw rotating inner energy ring
        ctx.rotate(this.rotationAngle);
        
        for (let i = 0; i < 8; i++) {
            const angle = i * (Math.PI / 4);
            const x = this.radius * 0.4 * Math.cos(angle);
            const y = this.radius * 0.4 * Math.sin(angle);
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }
        
        // Reset rotation and set up for outer ring
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.outerRotationAngle);
        
        // Draw rotating outer energy ring
        for (let i = 0; i < 12; i++) {
            const angle = i * (Math.PI / 6);
            const x = this.radius * 0.8 * Math.cos(angle);
            const y = this.radius * 0.8 * Math.sin(angle);
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }
        
        // Reset transformation
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(this.position.x, this.position.y);
        
        // Draw health bar
        const healthBarWidth = this.radius * 2;
        const healthBarHeight = 6;
        const healthPercentage = this.health / this.maxHealth;
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(-healthBarWidth / 2, -this.radius - 15, healthBarWidth, healthBarHeight);
        
        ctx.fillStyle = '#ff3e7f';
        ctx.fillRect(
            -healthBarWidth / 2, 
            -this.radius - 15, 
            healthBarWidth * healthPercentage, 
            healthBarHeight
        );
        
        ctx.restore();
    }
    
    spawnMinions() {
        if (!window.game) return;
        
        // Spawn 2-3 minions around the boss
        const minionCount = 2 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < minionCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.radius * 2;
            const position = new Vector(
                this.position.x + Math.cos(angle) * distance,
                this.position.y + Math.sin(angle) * distance
            );
            
            // Create a random minion
            let minion;
            const minionType = Math.random();
            
            if (minionType < 0.4) {
                minion = new Enemy();
            } else if (minionType < 0.7) {
                minion = new ZigzagEnemy();
            } else {
                minion = new GhostEnemy();
            }
            
            minion.position = position;
            window.game.enemies.push(minion);
            
            // Create spawn effect
            window.game.impactEffects.push(new ImpactEffect(position, minion.color));
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }
}

class EnemyTrail {
    constructor(x, y, size, color = null) {
        // Handle both position as object and separate x,y coordinates
        if (typeof x === 'object' && x !== null) {
            this.position = new Vector(x.x, x.y);
            this.color = y || '#ff0055';
            this.size = size || 5;
        } else {
            this.position = new Vector(x, y);
            this.color = color || '#ff0055';
            this.size = size || 5;
        }
        this.alpha = 0.5;
    }
    
    update() {
        this.alpha *= SETTINGS.ENEMY_TRAIL_DECAY;
        return this.alpha > 0.01;
    }
    
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hexToRgb(this.color)}, ${this.alpha})`;
        ctx.fill();
    }
}

// Helper function to convert hex color to rgb for rgba usage
function hexToRgb(hex) {
    // Remove the # if present
    hex = hex.replace(/^#/, '');
    
    // Parse the hex values
    let r, g, b;
    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }
    
    return `${r}, ${g}, ${b}`;
} 