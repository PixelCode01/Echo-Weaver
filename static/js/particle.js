// Particle classes for visual effects

// Basic particle for explosions and effects
class Particle {
    constructor(position, color, size = 3) {
        this.position = new Vector(position.x, position.y);
        this.color = color;
        this.size = size;
        this.velocity = new Vector(
            randomFloat(-SETTINGS.PARTICLE_VELOCITY_VARIANCE, SETTINGS.PARTICLE_VELOCITY_VARIANCE),
            randomFloat(-SETTINGS.PARTICLE_VELOCITY_VARIANCE, SETTINGS.PARTICLE_VELOCITY_VARIANCE)
        );
        this.lifetime = SETTINGS.PARTICLE_LIFETIME;
        this.initialLifetime = this.lifetime;
        this.active = true;
    }

    update() {
        if (!this.active) return;
        
        this.position = this.position.add(this.velocity);
        this.lifetime--;
        
        if (this.lifetime <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        const alpha = this.lifetime / this.initialLifetime;
        const currentSize = this.size * alpha;
        
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hexToRgb(this.color)}, ${alpha})`;
        ctx.fill();
    }
}

// Background particle for ambient effects
class BackgroundParticle {
    constructor() {
        this.position = new Vector(
            Math.random() * SETTINGS.WIDTH,
            Math.random() * SETTINGS.HEIGHT
        );
        this.color = SETTINGS.GRID_COLOR;
        this.size = randomFloat(1, 3);
        this.velocity = new Vector(
            randomFloat(-0.5, 0.5),
            randomFloat(-0.5, 0.5)
        );
        this.active = true;
    }

    update() {
        if (!this.active) return;
        
        this.position = this.position.add(this.velocity);
        
        // Wrap around screen edges
        if (this.position.x < 0) this.position.x = SETTINGS.WIDTH;
        if (this.position.x > SETTINGS.WIDTH) this.position.x = 0;
        if (this.position.y < 0) this.position.y = SETTINGS.HEIGHT;
        if (this.position.y > SETTINGS.HEIGHT) this.position.y = 0;
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

// Damage number display
class DamageNumber {
    constructor(position, value, color = SETTINGS.WHITE, isCritical = false) {
        this.position = new Vector(position.x, position.y);
        this.value = value;
        this.color = isCritical ? SETTINGS.YELLOW : color;
        this.isCritical = isCritical;
        this.velocity = new Vector(randomFloat(-0.5, 0.5), -2); // Float upwards
        this.lifetime = SETTINGS.HIT_NUMBER_LIFETIME;
        this.initialLifetime = this.lifetime;
        this.fontSize = isCritical ? SETTINGS.FONT_SIZE_SCORE + 10 : SETTINGS.FONT_SIZE_SCORE;
        this.active = true;
    }

    update() {
        if (!this.active) return;
        
        this.position = this.position.add(this.velocity);
        this.lifetime--;
        
        if (this.lifetime <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        const alpha = this.lifetime / this.initialLifetime;
        ctx.globalAlpha = alpha;
        
        // Draw with shadow for critical hits
        if (this.isCritical) {
            ctx.shadowColor = SETTINGS.YELLOW;
            ctx.shadowBlur = 10;
        }
        
        drawText(ctx, this.value.toString(), this.fontSize, this.position.x, this.position.y, this.color);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// Impact effect for explosions
class ImpactEffect {
    constructor(position, color) {
        this.position = new Vector(position.x, position.y);
        this.color = color;
        this.radius = 5;
        this.maxRadius = 30;
        this.growthRate = 2;
        this.alpha = 1;
        this.fadeRate = 0.05;
        this.active = true;
    }

    update() {
        if (!this.active) return;
        
        this.radius += this.growthRate;
        this.alpha -= this.fadeRate;
        
        if (this.alpha <= 0 || this.radius >= this.maxRadius) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${hexToRgb(this.color)}, ${this.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
} 