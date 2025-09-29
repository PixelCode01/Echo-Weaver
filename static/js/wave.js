class SoundWave {
    constructor(startPos, endPos, boostWidth = false, waveMagnetActive = false, damageMultiplier = 1, widthMultiplier = 1) {
        this.startPos = new Vector(startPos.x, startPos.y);
        this.endPos = new Vector(endPos.x, endPos.y);
        
        this.vec = this.endPos.subtract(this.startPos);
        this.angle = Math.atan2(this.vec.y, this.vec.x);
        this.length = this.vec.length();
        
    if (this.length < 10) return;
        
        let initialWidth = SETTINGS.WAVE_WIDTH * widthMultiplier;
        if (boostWidth) {
            initialWidth *= SETTINGS.WAVE_WIDTH_BOOST_MULTIPLIER;
        }
        
        this.center = new Vector(
            this.startPos.x + (this.endPos.x - this.startPos.x) / 2,
            this.startPos.y + (this.endPos.y - this.startPos.y) / 2
        );
        
        this.expansionSpeed = SETTINGS.WAVE_SPEED;
        this.currentWidth = initialWidth;
        this.lifetime = 1.0;
        this.fadeSpeed = 0.02;
        this.waveMagnetActive = waveMagnetActive;
        this.damageMultiplier = damageMultiplier;
        this.active = true;
    }

    update(enemies = null, disruptors = null) {
        if (!this.active) return;
        
        let currentExpansionSpeed = this.expansionSpeed;
        let currentDamageMultiplier = this.damageMultiplier;
        
        if (disruptors) {
        }

        this.currentWidth += currentExpansionSpeed;
        this.lifetime -= this.fadeSpeed;

        if (this.lifetime <= 0) {
            this.active = false;
            return;
        }

        if (this.waveMagnetActive && enemies) {
            for (const enemy of enemies) {
                const distVec = this.center.subtract(enemy.position);
                const distance = distVec.length();
                if (distance < this.currentWidth * 2) {
                    if (distance > 0) {
                        const pullForce = distVec.normalize().multiply(this.currentWidth * 0.05);
                        enemy.position = enemy.position.add(pullForce);
                    }
                }
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        const alpha = this.lifetime;

        ctx.save();

        ctx.translate(this.startPos.x, this.startPos.y);
        ctx.rotate(this.angle);

        const gradY0 = -this.currentWidth / 2;
        const gradY1 = this.currentWidth / 2;
        if (!Number.isFinite(this.length) || !Number.isFinite(this.currentWidth) || !Number.isFinite(gradY0) || !Number.isFinite(gradY1)) {
            console.warn('Non-finite values in SoundWave.draw:', {
                length: this.length,
                currentWidth: this.currentWidth,
                gradY0,
                gradY1,
                startPos: this.startPos,
                endPos: this.endPos
            });
            ctx.restore();
            return;
        }
        const gradient = ctx.createLinearGradient(0, gradY0, 0, gradY1);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(150, 150, 255, ${alpha})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, gradY0, this.length, this.currentWidth);
        
        const numInnerLayers = 2;
        for (let i = 1; i <= numInnerLayers; i++) {
            const innerWidthFactor = 0.7 - (i * 0.1);
            const innerAlphaFactor = 0.8 - (i * 0.2);

            const innerWidth = this.currentWidth * innerWidthFactor;
            const innerLength = this.length * innerWidthFactor;
            const innerAlpha = alpha * innerAlphaFactor;
            
            if (innerWidth <= 0 || innerLength <= 0) continue;
            if (!Number.isFinite(innerWidth) || !Number.isFinite(innerLength)) continue;

            const innerX = (this.length - innerLength) / 2;
            const innerY = -innerWidth / 2;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${innerAlpha})`;
            ctx.fillRect(innerX, innerY, innerLength, innerWidth);
        }
        
        ctx.restore();
    }

    collidesWith(enemy) {
        if (!this.active) return false;

        const waveRect = {
            x: this.startPos.x,
            y: this.startPos.y - this.currentWidth / 2,
            width: this.length,
            height: this.currentWidth
        };

        const rotatedEnemyPos = new Vector(
            Math.cos(-this.angle) * (enemy.position.x - this.startPos.x) - 
            Math.sin(-this.angle) * (enemy.position.y - this.startPos.y) + this.startPos.x,
            
            Math.sin(-this.angle) * (enemy.position.x - this.startPos.x) + 
            Math.cos(-this.angle) * (enemy.position.y - this.startPos.y) + this.startPos.y
        );

        return rotatedEnemyPos.x >= waveRect.x && 
               rotatedEnemyPos.x <= waveRect.x + waveRect.width &&
               rotatedEnemyPos.y >= waveRect.y && 
               rotatedEnemyPos.y <= waveRect.y + waveRect.height;
    }
} 