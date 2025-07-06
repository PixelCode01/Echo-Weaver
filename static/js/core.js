// Core class - The player's core that needs to be defended

class Core {
    constructor(x, y, radius) {
        this.position = new Vector(x || SETTINGS.WIDTH / 2, y || SETTINGS.HEIGHT / 2);
        this.radius = radius || SETTINGS.CORE_RADIUS;
        this.hitTimer = 0;
        this.pulseTimer = 0;
        this.isInvincible = false;
        this.rotationAngle = 0;
        this.innerRingRotation = 0;
        this.outerRingRotation = 0;
    }

    draw(ctx, feverModeActive = false) {
        // Save context for transformations
        ctx.save();
        
        // Draw glow effect
        const glowRadius = this.radius * 1.5;
        const gradient = ctx.createRadialGradient(
            this.position.x, this.position.y, this.radius * 0.8,
            this.position.x, this.position.y, glowRadius
        );
        gradient.addColorStop(0, 'rgba(0, 229, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw the base core
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = SETTINGS.PRIMARY_COLOR;
        ctx.fill();
        
        // Draw inner core
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a12';
        ctx.fill();
        
        // Update rotation angles
        this.innerRingRotation += 0.01;
        this.outerRingRotation -= 0.005;
        
        // Draw rotating inner energy ring
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.innerRingRotation);
        ctx.translate(-this.position.x, -this.position.y);
        
        for (let i = 0; i < 6; i++) {
            const angle = i * (Math.PI / 3);
            const x = this.position.x + this.radius * 0.4 * Math.cos(angle);
            const y = this.position.y + this.radius * 0.4 * Math.sin(angle);
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }
        
        // Reset transformation and set up for outer ring
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.outerRingRotation);
        ctx.translate(-this.position.x, -this.position.y);
        
        // Draw rotating outer energy ring
        for (let i = 0; i < 8; i++) {
            const angle = i * (Math.PI / 4);
            const x = this.position.x + this.radius * 0.85 * Math.cos(angle);
            const y = this.position.y + this.radius * 0.85 * Math.sin(angle);
            
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }
        
        // Reset transformation
        ctx.restore();

        // Pulsating effect
        this.pulseTimer = (this.pulseTimer + 1) % 60; // Cycle every second
        const pulseScale = 1 + 0.1 * Math.sin(this.pulseTimer / 60 * 2 * Math.PI);
        const pulseRadius = this.radius * pulseScale;
        
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 229, 255, ${0.3 + 0.2 * Math.sin(this.pulseTimer / 60 * 2 * Math.PI)})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Hit animation
        if (this.hitTimer > 0) {
            const alpha = this.hitTimer / 30;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 62, 127, ${alpha})`;
            ctx.fill();
            this.hitTimer--;
        }

        // Invincibility shield
        if (this.isInvincible) {
            const shieldPulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
            const shieldRadius = this.radius * 1.3 * shieldPulse;
            
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, shieldRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(123, 47, 247, 0.7)';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Add shield particles
            if (Math.random() < 0.3) {
                const angle = Math.random() * Math.PI * 2;
                const x = this.position.x + shieldRadius * Math.cos(angle);
                const y = this.position.y + shieldRadius * Math.sin(angle);
                
                if (window.game) {
                    window.game.particles.push(new Particle(
                        new Vector(x, y),
                        'rgba(123, 47, 247, 0.7)'
                    ));
                }
            }
        }

        // Fever Mode visual
        if (feverModeActive) {
            const feverPulse = 0.8 + 0.2 * Math.sin(Date.now() / 100);
            const feverRadius = this.radius * 1.5 * feverPulse;
            
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, feverRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 62, 127, 0.8)';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // Add fever particles
            if (Math.random() < 0.5) {
                const angle = Math.random() * Math.PI * 2;
                const x = this.position.x + feverRadius * Math.cos(angle);
                const y = this.position.y + feverRadius * Math.sin(angle);
                
                if (window.game) {
                    window.game.particles.push(new Particle(
                        new Vector(x, y),
                        'rgba(255, 62, 127, 0.8)'
                    ));
                }
            }
        }
    }

    onHit() {
        this.hitTimer = 30;
    }

    setInvincible(invincible) {
        this.isInvincible = invincible;
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