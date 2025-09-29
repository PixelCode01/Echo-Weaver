class BossEnemy extends Enemy {
    constructor() {
        super();
        this.isBoss = true;
        this.radius = SETTINGS.BOSS_ENEMY_RADIUS || 40;
        this.health = SETTINGS.BOSS_ENEMY_HEALTH || 20;
        this.maxHealth = this.health;
        this.color = SETTINGS.BOSS_ENEMY_COLOR || '#ff0055';
        this.scoreValue = SETTINGS.BOSS_ENEMY_SCORE || 10;
        this.pulseTime = 0;
        this.pulseDirection = 1;
        this.pulseSpeed = 0.05;
        this.pulseAmount = 0.2;
        this.pulseValue = 0;
        this.attackTimer = 0;
        this.attackInterval = SETTINGS.BOSS_ATTACK_INTERVAL || 120;
        this.attackType = 'none';
        this.orbitRadius = 200;
        this.orbitSpeed = 0.01;
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.orbitCenter = null;
        this.orbitTime = 0;
        this.phase = 1;
        this.phaseThresholds = [0.7, 0.4, 0.2];
    }
    
    update(core, speed, trails) {
        if (!this.orbitCenter) {
            this.orbitCenter = { 
                x: SETTINGS.WIDTH / 2, 
                y: SETTINGS.HEIGHT / 2 
            };
        }
        const healthPercent = this.health / this.maxHealth;
        let newPhase = 1;
        
        for (let i = 0; i < this.phaseThresholds.length; i++) {
            if (healthPercent <= this.phaseThresholds[i]) {
                newPhase = i + 2;
            }
        }
        if (newPhase !== this.phase) {
            this.phase = newPhase;
            this.onPhaseChange();
        }
        switch(this.phase) {
            case 1:
                this.orbitTime += this.orbitSpeed;
                this.position.x = this.orbitCenter.x + Math.cos(this.orbitTime) * this.orbitRadius;
                this.position.y = this.orbitCenter.y + Math.sin(this.orbitTime) * this.orbitRadius;
                break;
                
            case 2:
                this.orbitTime += this.orbitSpeed * 1.5;
                this.position.x = this.orbitCenter.x + Math.cos(this.orbitTime) * this.orbitRadius;
                this.position.y = this.orbitCenter.y + Math.sin(this.orbitTime) * this.orbitRadius;
                if (Math.random() < 0.01) {
                    this.attackType = 'charge';
                    this.attackTimer = 30;
                }
                break;
                
            case 3:
                if (Math.random() < 0.05) {
                    this.velocity.x = (Math.random() - 0.5) * 8;
                    this.velocity.y = (Math.random() - 0.5) * 8;
                }
                this.position.x += this.velocity.x;
                this.position.y += this.velocity.y;
                if (this.position.x < this.radius || this.position.x > SETTINGS.WIDTH - this.radius) {
                    this.velocity.x *= -1;
                }
                if (this.position.y < this.radius || this.position.y > SETTINGS.HEIGHT - this.radius) {
                    this.velocity.y *= -1;
                }
                break;
                
            case 4:
                const dx = core.position.x - this.position.x;
                const dy = core.position.y - this.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    this.position.x += (dx / dist) * speed * 1.5;
                    this.position.y += (dy / dist) * speed * 1.5;
                }
                break;
        }
        this.attackTimer++;
        if (this.attackTimer >= this.attackInterval) {
            this.attackTimer = 0;
            this.performAttack(core);
        }
        this.pulseTime += this.pulseDirection * this.pulseSpeed;
        if (this.pulseTime > 1) {
            this.pulseTime = 1;
            this.pulseDirection = -1;
        } else if (this.pulseTime < 0) {
            this.pulseTime = 0;
            this.pulseDirection = 1;
        }
        
        this.pulseValue = this.pulseAmount * Math.sin(this.pulseTime * Math.PI);
        if (trails && Math.random() < 0.3) {
            trails.push(new EnemyTrail(
                this.position.x, 
                this.position.y, 
                this.radius * 0.8
            ));
        }
    }
    
    draw(ctx) {
        const healthPercent = this.health / this.maxHealth;
        const barWidth = this.radius * 2;
        const barHeight = 6;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(
            this.position.x - barWidth / 2,
            this.position.y - this.radius - 15,
            barWidth,
            barHeight
        );
        let healthColor;
        if (healthPercent > 0.6) {
            healthColor = '#00ff00';
        } else if (healthPercent > 0.3) {
            healthColor = '#ffff00';
        } else {
            healthColor = '#ff0000';
        }
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(
            this.position.x - barWidth / 2,
            this.position.y - this.radius - 15,
            barWidth * healthPercent,
            barHeight
        );
        const pulseRadius = this.radius * (1 + this.pulseValue);
        const gradient = ctx.createRadialGradient(
            this.position.x, this.position.y, this.radius * 0.8,
            this.position.x, this.position.y, pulseRadius * 1.3
        );
        
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(255, 0, 85, 0)');
        
        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(this.position.x, this.position.y, pulseRadius * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.position.x, this.position.y, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.arc(this.position.x, this.position.y, pulseRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `PHASE ${this.phase}`, 
            this.position.x, 
            this.position.y - this.radius - 20
        );
    }
    
    takeDamage(damage) {
        this.health -= damage;
        this.pulseTime = 1;
        this.pulseDirection = -1;
        return this.health <= 0;
    }
    
    onPhaseChange() {
        switch(this.phase) {
            case 2:
                this.orbitSpeed *= 1.5;
                break;
                
            case 3:
                this.velocity = { 
                    x: (Math.random() - 0.5) * 5, 
                    y: (Math.random() - 0.5) * 5 
                };
                break;
                
            case 4:
                this.color = '#ff0000';
                this.attackInterval /= 2;
                break;
        }
    }
    
    performAttack(core) {
        switch(this.phase) {
            case 1:
                this.attackType = 'projectile';
                break;
                
            case 2:
                this.attackType = Math.random() < 0.5 ? 'projectile' : 'charge';
                break;
                
            case 3:
                const rand = Math.random();
                if (rand < 0.4) {
                    this.attackType = 'projectile';
                } else if (rand < 0.7) {
                    this.attackType = 'charge';
                } else {
                    this.attackType = 'summon';
                }
                break;
                
            case 4:
                const rand2 = Math.random();
                if (rand2 < 0.3) {
                    this.attackType = 'projectile';
                } else if (rand2 < 0.6) {
                    this.attackType = 'charge';
                } else if (rand2 < 0.8) {
                    this.attackType = 'summon';
                } else {
                    this.attackType = 'shockwave';
                }
                break;
        }
    }
} 