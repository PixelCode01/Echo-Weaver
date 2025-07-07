// SoundWave class - The player's main weapon

class SoundWave {
    constructor(startPos, endPos, boostWidth = false, waveMagnetActive = false, damageMultiplier = 1, widthMultiplier = 1) {
        this.startPos = new Vector(startPos.x, startPos.y);
        this.endPos = new Vector(endPos.x, endPos.y);
        
        this.vec = this.endPos.subtract(this.startPos);
        this.angle = Math.atan2(this.vec.y, this.vec.x);
        this.length = this.vec.length();
        
        if (this.length < 10) return; // Too short to create a wave
        
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
        
        // Apply disruptor effects if any
        if (disruptors) {
            // Implementation for disruptor effects would go here
        }
        
        // Expand the wave
        this.currentWidth += currentExpansionSpeed;
        this.lifetime -= this.fadeSpeed;
        
        // Check if wave has faded out
        if (this.lifetime <= 0) {
            this.active = false;
            return;
        }
        
        // Wave Magnet effect - pull enemies towards the wave
        if (this.waveMagnetActive && enemies) {
            for (const enemy of enemies) {
                // Calculate distance from enemy to wave center
                const distVec = this.center.subtract(enemy.position);
                const distance = distVec.length();
                
                // If enemy is within a certain range of the wave
                if (distance < this.currentWidth * 2) {
                    if (distance > 0) {
                        // Normalize and apply a pull force
                        const pullForce = distVec.normalize().multiply(this.currentWidth * 0.05);
                        enemy.position = enemy.position.add(pullForce);
                    }
                }
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        // Calculate alpha based on lifetime
        const alpha = this.lifetime;
        
        // Save the current context state
        ctx.save();
        
        // Translate to the start position and rotate
        ctx.translate(this.startPos.x, this.startPos.y);
        ctx.rotate(this.angle);
        
        // Defensive: Check for non-finite values before drawing
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
        // Draw the main wave rectangle with a gradient
        const gradient = ctx.createLinearGradient(0, gradY0, 0, gradY1);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(150, 150, 255, ${alpha})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, gradY0, this.length, this.currentWidth);
        
        // Draw inner "rings" or layers
        const numInnerLayers = 2;
        for (let i = 1; i <= numInnerLayers; i++) {
            // Calculate dimensions for inner layer
            const innerWidthFactor = 0.7 - (i * 0.1); // Make inner layers smaller
            const innerAlphaFactor = 0.8 - (i * 0.2); // Make inner layers more transparent
            
            const innerWidth = this.currentWidth * innerWidthFactor;
            const innerLength = this.length * innerWidthFactor; // Also shrink length for inner layers
            const innerAlpha = alpha * innerAlphaFactor;
            
            if (innerWidth <= 0 || innerLength <= 0) continue;
            if (!Number.isFinite(innerWidth) || !Number.isFinite(innerLength)) continue;
            
            // Calculate position to center the inner rectangle
            const innerX = (this.length - innerLength) / 2;
            const innerY = -innerWidth / 2;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${innerAlpha})`;
            ctx.fillRect(innerX, innerY, innerLength, innerWidth);
        }
        
        // Restore the context state
        ctx.restore();
    }

    // Check if this wave collides with an enemy
    collidesWith(enemy) {
        if (!this.active) return false;
        
        // Create a rectangle representing the wave
        const waveRect = {
            x: this.startPos.x,
            y: this.startPos.y - this.currentWidth / 2,
            width: this.length,
            height: this.currentWidth
        };
        
        // Rotate the enemy position around the wave start point by -angle
        const rotatedEnemyPos = new Vector(
            Math.cos(-this.angle) * (enemy.position.x - this.startPos.x) - 
            Math.sin(-this.angle) * (enemy.position.y - this.startPos.y) + this.startPos.x,
            
            Math.sin(-this.angle) * (enemy.position.x - this.startPos.x) + 
            Math.cos(-this.angle) * (enemy.position.y - this.startPos.y) + this.startPos.y
        );
        
        // Check if the rotated enemy position is inside the wave rectangle
        return rotatedEnemyPos.x >= waveRect.x && 
               rotatedEnemyPos.x <= waveRect.x + waveRect.width &&
               rotatedEnemyPos.y >= waveRect.y && 
               rotatedEnemyPos.y <= waveRect.y + waveRect.height;
    }
} 