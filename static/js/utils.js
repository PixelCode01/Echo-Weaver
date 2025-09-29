class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    subtract(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    multiply(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const len = this.length();
        if (len === 0) return new Vector(0, 0);
        return new Vector(this.x / len, this.y / len);
    }

    distanceTo(v) {
        if (!v || typeof v.x === 'undefined' || typeof v.y === 'undefined' || 
            typeof this.x === 'undefined' || typeof this.y === 'undefined') {
            console.error('Vector.distanceTo called with invalid parameters:', {
                this: { x: this.x, y: this.y },
                v: v ? { x: v.x, y: v.y } : 'null/undefined'
            });
            return Infinity;
        }
        return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }
}

function drawText(ctx, text, size, x, y, color = SETTINGS.WHITE, align = 'center') {
    ctx.font = `${size}px Orbitron, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    
    let r, g, b;
    if (hex.length === 3) {
        r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
        g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
        b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    } else {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }
    
    return `${r}, ${g}, ${b}`;
}

function pointInCircle(point, circle) {
    return Math.pow(point.x - circle.x, 2) + Math.pow(point.y - circle.y, 2) <= Math.pow(circle.radius, 2);
}

function drawGrid(ctx, offset = { x: 0, y: 0 }) {
    ctx.strokeStyle = SETTINGS.GRID_COLOR;
    ctx.lineWidth = 1;

    for (let x = 0; x < SETTINGS.WIDTH; x += SETTINGS.GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x + offset.x, 0);
        ctx.lineTo(x + offset.x, SETTINGS.HEIGHT);
        ctx.stroke();
    }

    for (let y = 0; y < SETTINGS.HEIGHT; y += SETTINGS.GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y + offset.y);
        ctx.lineTo(SETTINGS.WIDTH, y + offset.y);
        ctx.stroke();
    }
}

class MessageDisplay {
    constructor() {
        this.messages = [];
    }

    addMessage(text, position, color, fontSize, duration = 90) {
        this.messages.push({
            text,
            position,
            color,
            fontSize,
            timer: duration,
            alpha: 255
        });
    }

    update() {
        for (let i = this.messages.length - 1; i >= 0; i--) {
            const msg = this.messages[i];
            msg.timer--;
            if (msg.timer <= 0) {
                msg.alpha -= 5;
                if (msg.alpha <= 0) {
                    this.messages.splice(i, 1);
                }
            }
        }
    }

    draw(ctx) {
        this.messages.forEach(msg => {
            ctx.globalAlpha = msg.alpha / 255;
            drawText(ctx, msg.text, msg.fontSize, msg.position.x, msg.position.y, msg.color);
            ctx.globalAlpha = 1;
        });
    }
}

class ComboManager {
    constructor() {
        this.comboCount = 0;
        this.comboTimer = 0;
    }

    addHit() {
        this.comboCount++;
        this.comboTimer = SETTINGS.COMBO_DECAY_TIME;
    }

    update() {
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer === 0 && this.comboCount > 0) {
                this.comboCount = 0;
            }
        }
    }

    getBonus() {
        return Math.floor(this.comboCount * (SETTINGS.COMBO_BONUS_MULTIPLIER || 0.1));
    }

    getComboMessage() {
        if (this.comboCount > 0 && this.comboCount % 10 === 0) {
            return SETTINGS.COMBO_MESSAGES[this.comboCount] || null;
        }
        return null;
    }
}

class FeverManager {
    constructor() {
        this.charge = 0;
        this.feverActive = false;
        this.feverTimer = 0;
    }

    addCharge(amount) {
        if (!this.feverActive) {
            this.charge += amount;
            if (this.charge >= SETTINGS.FEVER_MODE_MAX_CHARGE) {
                this.activateFeverMode();
            }
        }
    }

    activateFeverMode() {
        this.feverActive = true;
        this.feverTimer = SETTINGS.FEVER_MODE_DURATION;
    }

    update() {
        if (this.feverActive) {
            this.feverTimer--;
            if (this.feverTimer <= 0) {
                this.feverActive = false;
                this.charge = 0;
            }
        }
    }

    getChargePercentage() {
        return (this.charge / SETTINGS.FEVER_MODE_MAX_CHARGE) * 100;
    }
}

class ScreenShake {
    constructor(intensity = 5, duration = 20) {
        this.intensity = intensity;
        this.duration = duration;
        this.timer = duration;
    }

    shake() {
        if (this.timer <= 0) return { x: 0, y: 0 };
        
        const offset = {
            x: randomInt(-this.intensity, this.intensity),
            y: randomInt(-this.intensity, this.intensity)
        };
        
        this.timer--;
        return offset;
    }
} 