class PowerUp {
    constructor(position, type) {
        this.position = new Vector(position.x, position.y);
        this.type = type;
        this.radius = SETTINGS.POWERUP_RADIUS;
        this.color = this.getColorForType(type);
        this.speed = SETTINGS.POWERUP_SPEED;
        this.angle = Math.random() * Math.PI * 2;
        this.moveDistance = 20;
        this.moveTimer = 0;
        this.active = true;
        this.pulseTimer = 0;
    }

    getColorForType(type) {
        switch (type) {
            case 'invincibility': return SETTINGS.POWERUP_COLOR_INVINCIBILITY;
            case 'wave_boost': return SETTINGS.POWERUP_COLOR_WAVE_BOOST;
            case 'slow_time': return SETTINGS.POWERUP_COLOR_SLOW_TIME;
            case 'clear_screen': return SETTINGS.POWERUP_COLOR_CLEAR_SCREEN;
            case 'wave_width': return SETTINGS.POWERUP_COLOR_WAVE_WIDTH;
            case 'time_stop': return SETTINGS.POWERUP_COLOR_TIME_STOP;
            case 'wave_magnet': return SETTINGS.POWERUP_COLOR_WAVE_MAGNET;
            default: return SETTINGS.WHITE;
        }
    }

    update() {
        if (!this.active) return;
        
        this.moveTimer += 0.05;
        const moveX = Math.cos(this.moveTimer) * 0.5;
        const moveY = Math.sin(this.moveTimer) * 0.5;
        this.position = this.position.add(new Vector(moveX, moveY));

        this.pulseTimer = (this.pulseTimer + 1) % 60;

        if (this.position.x < this.radius) this.position.x = this.radius;
        if (this.position.x > SETTINGS.WIDTH - this.radius) this.position.x = SETTINGS.WIDTH - this.radius;
        if (this.position.y < this.radius) this.position.y = this.radius;
        if (this.position.y > SETTINGS.HEIGHT - this.radius) this.position.y = SETTINGS.HEIGHT - this.radius;
    }

    draw(ctx) {
        if (!this.active) return;

        const pulseScale = 1 + 0.2 * Math.sin(this.pulseTimer / 60 * 2 * Math.PI);
        const pulseRadius = this.radius * pulseScale;

        const gradient = ctx.createRadialGradient(
            this.position.x, this.position.y, this.radius * 0.5,
            this.position.x, this.position.y, pulseRadius * 2
        );
        gradient.addColorStop(0, `rgba(${hexToRgb(this.color)}, 0.8)`);
        gradient.addColorStop(1, `rgba(${hexToRgb(this.color)}, 0)`);
        
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, pulseRadius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.position.x - this.radius * 0.3, this.position.y - this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
        ctx.fill();

        this.drawIcon(ctx);
    }

    drawIcon(ctx) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        
        ctx.strokeStyle = SETTINGS.WHITE;
        ctx.lineWidth = 2;
        
        switch (this.type) {
            case 'invincibility':
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'wave_boost':
                ctx.beginPath();
                ctx.moveTo(-this.radius * 0.4, -this.radius * 0.4);
                ctx.lineTo(0, 0);
                ctx.lineTo(-this.radius * 0.4, this.radius * 0.4);
                ctx.stroke();
                break;
                
            case 'slow_time':
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -this.radius * 0.4);
                ctx.stroke();
                break;
                
            case 'clear_screen':
                for (let i = 0; i < 8; i++) {
                    const angle = i * Math.PI / 4;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * this.radius * 0.7, Math.sin(angle) * this.radius * 0.7);
                    ctx.stroke();
                }
                break;
                
            case 'wave_width':
                ctx.beginPath();
                ctx.moveTo(-this.radius * 0.6, -this.radius * 0.3);
                ctx.lineTo(this.radius * 0.6, -this.radius * 0.3);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-this.radius * 0.6, 0);
                ctx.lineTo(this.radius * 0.6, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-this.radius * 0.6, this.radius * 0.3);
                ctx.lineTo(this.radius * 0.6, this.radius * 0.3);
                ctx.stroke();
                break;
                
            case 'time_stop':
                ctx.fillStyle = SETTINGS.WHITE;
                ctx.fillRect(-this.radius * 0.4, -this.radius * 0.4, this.radius * 0.8, this.radius * 0.8);
                break;
                
            case 'wave_magnet':
                ctx.beginPath();
                ctx.moveTo(-this.radius * 0.4, -this.radius * 0.4);
                ctx.lineTo(this.radius * 0.4, -this.radius * 0.4);
                ctx.lineTo(this.radius * 0.4, 0);
                ctx.lineTo(-this.radius * 0.4, 0);
                ctx.lineTo(-this.radius * 0.4, -this.radius * 0.4);
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }

    collidesWith(other) {
        if (!this.active) return false;
        return this.position.distanceTo(other.position) < this.radius + other.radius;
    }
} 