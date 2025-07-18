// MobileControls class - Handles mobile-specific UI and interactions

class MobileControls {
    constructor(game) {
        console.log('MobileControls constructor called with game:', game);
        this.game = game;
        this.gameScreen = document.getElementById('game-screen');
        console.log('Game screen element:', this.gameScreen);
        
        // Touch cooldown system
        this.touchCooldown = 0;
        this.lastTouchTime = 0;
        this.canTouch = true;
        
        // Create mobile control buttons
        this.createMobileControls();
        
        // Add touch event handlers
        this.addTouchEventHandlers();
        
        console.log('Mobile controls initialized with cooldown settings:', {
            base: SETTINGS.MOBILE_TOUCH_COOLDOWN_BASE,
            max: SETTINGS.MOBILE_TOUCH_COOLDOWN_MAX,
            factor: SETTINGS.MOBILE_TOUCH_COOLDOWN_SCORE_FACTOR
        });
    }
    
    createMobileControls() {
        // Create container for mobile controls
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.id = 'mobile-controls';
        this.gameScreen.appendChild(this.controlsContainer);
        
        // Create Echo Burst button
        this.echoBurstButton = document.createElement('div');
        this.echoBurstButton.id = 'echo-burst-button';
        this.echoBurstButton.className = 'mobile-control-button';
        this.echoBurstButton.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
        this.echoBurstButton.setAttribute('data-tooltip', 'Echo Burst');
        this.controlsContainer.appendChild(this.echoBurstButton);
        
        // Create Wave Mode button
        this.waveModeButton = document.createElement('div');
        this.waveModeButton.id = 'wave-mode-button';
        this.waveModeButton.className = 'mobile-control-button';
        this.waveModeButton.innerHTML = '<i class="fas fa-sync"></i>';
        this.waveModeButton.setAttribute('data-tooltip', 'Change Wave Mode');
        this.controlsContainer.appendChild(this.waveModeButton);
        
        // Create Pause button
        this.pauseButton = document.createElement('div');
        this.pauseButton.id = 'pause-button';
        this.pauseButton.className = 'mobile-control-button';
        this.pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
        this.pauseButton.setAttribute('data-tooltip', 'Pause Game');
        this.controlsContainer.appendChild(this.pauseButton);
        
        // Create current mode indicator
        this.modeIndicator = document.createElement('div');
        this.modeIndicator.id = 'mobile-mode-indicator';
        this.modeIndicator.innerHTML = '<span>Normal</span>';
        this.controlsContainer.appendChild(this.modeIndicator);
        
        // Create touch cooldown progress bar
        this.touchCooldownBar = document.createElement('div');
        this.touchCooldownBar.id = 'touch-cooldown-bar';
        this.touchCooldownBar.className = 'mobile-cooldown-bar';
        this.controlsContainer.appendChild(this.touchCooldownBar);
        
        // Create touch cooldown label
        this.touchCooldownLabel = document.createElement('div');
        this.touchCooldownLabel.id = 'touch-cooldown-label';
        this.touchCooldownLabel.className = 'mobile-cooldown-label';
        this.touchCooldownLabel.innerHTML = 'Touch Cooldown';
        this.controlsContainer.appendChild(this.touchCooldownLabel);
    }
    
    addTouchEventHandlers() {
        // Echo Burst button
        this.echoBurstButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.game.state === 'playing' && this.game.echoBurstCooldown === 0 && this.canTouchNow()) {
                this.game._activateEchoBurst();
                this.recordTouch();
                
                // Add visual feedback
                this.echoBurstButton.classList.add('button-pressed');
                setTimeout(() => {
                    this.echoBurstButton.classList.remove('button-pressed');
                }, 200);
            }
        }, { passive: false });
        
        // Wave Mode button
        this.waveModeButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.game.state === 'playing' && this.canTouchNow()) {
                this.game.cycleWaveMode();
                this.recordTouch();
                
                // Update mode indicator
                this.modeIndicator.innerHTML = `<span>${this.game.currentWaveMode}</span>`;
                
                // Add visual feedback
                this.waveModeButton.classList.add('button-pressed');
                setTimeout(() => {
                    this.waveModeButton.classList.remove('button-pressed');
                }, 200);
            }
        }, { passive: false });
        
        // Pause button
        this.pauseButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.game.state === 'playing' && this.canTouchNow()) {
                // Toggle pause state
                window.gamePaused = !window.gamePaused;
                this.recordTouch();
                
                // Update button icon
                if (window.gamePaused) {
                    this.pauseButton.innerHTML = '<i class="fas fa-play"></i>';
                    
                    // Show pause message
                    const pauseMessage = document.createElement('div');
                    pauseMessage.id = 'pause-message';
                    pauseMessage.innerHTML = '<h2>Game Paused</h2><p>Tap play to resume</p>';
                    this.gameScreen.appendChild(pauseMessage);
                } else {
                    this.pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
                    
                    // Remove pause message
                    const pauseMessage = document.getElementById('pause-message');
                    if (pauseMessage) {
                        pauseMessage.remove();
                    }
                }
                
                // Add visual feedback
                this.pauseButton.classList.add('button-pressed');
                setTimeout(() => {
                    this.pauseButton.classList.remove('button-pressed');
                }, 200);
            }
        }, { passive: false });
        
        // Prevent default touch behavior on game canvas to avoid unwanted scrolling
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            // Remove the old touchmove handler since it's now handled in main.js
            canvas.addEventListener('touchmove', (e) => {
                // This is now handled in main.js with better logic
            }, { passive: false });
        }
    }
    
    updateCooldownDisplay() {
        // Debug: Check if elements exist
        if (!this.touchCooldownBar || !this.touchCooldownLabel) {
            console.error('Touch cooldown elements not found:', {
                bar: this.touchCooldownBar,
                label: this.touchCooldownLabel
            });
            return;
        }
        
        // Update Echo Burst cooldown visual
        if (this.game.echoBurstCooldown > 0) {
            const cooldownPercent = (this.game.echoBurstCooldown / SETTINGS.ECHO_BURST_COOLDOWN) * 100;
            this.echoBurstButton.style.opacity = 0.5;
            this.echoBurstButton.style.background = `conic-gradient(rgba(0, 0, 0, 0.5) ${cooldownPercent}%, var(--accent-color) ${cooldownPercent}%)`;
        } else {
            this.echoBurstButton.style.opacity = 1;
            this.echoBurstButton.style.background = 'var(--accent-color)';
        }
        
        // Update touch cooldown progress bar
        const now = Date.now();
        const timeSinceLastTouch = now - this.lastTouchTime;
        const requiredCooldown = this.calculateTouchCooldown();
        
        // Debug: Log cooldown calculations every 60 frames
        if (this.game.score % 60 === 0 && this.game.score > 0) {
            console.log('Touch cooldown debug:', {
                now,
                lastTouchTime: this.lastTouchTime,
                timeSinceLastTouch,
                requiredCooldown,
                canTouch: this.canTouch,
                gameScore: this.game.score
            });
        }
        
        if (timeSinceLastTouch < requiredCooldown) {
            const progress = (timeSinceLastTouch / requiredCooldown) * 100;
            this.touchCooldownBar.style.width = `${progress}%`;
            this.touchCooldownBar.style.display = 'block';
            this.touchCooldownLabel.style.display = 'block';
            
            // Add visual indicator for touch cooldown with color change
            if (progress < 50) {
                this.touchCooldownBar.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
            } else if (progress < 80) {
                this.touchCooldownBar.style.backgroundColor = 'rgba(255, 165, 0, 0.5)';
            } else {
                this.touchCooldownBar.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
            }
            
            // Update label with time remaining
            const remainingTime = Math.ceil((requiredCooldown - timeSinceLastTouch) / 100);
            this.touchCooldownLabel.innerHTML = `Touch Cooldown (${remainingTime}s)`;
        } else {
            this.touchCooldownBar.style.display = 'none';
            this.touchCooldownLabel.style.display = 'none';
            this.canTouch = true;
        }
    }
    
    // Call this in the game loop to update mobile controls
    update() {
        this.updateCooldownDisplay();
    }
    
    // Calculate touch cooldown based on score
    calculateTouchCooldown() {
        const baseCooldown = SETTINGS.MOBILE_TOUCH_COOLDOWN_BASE;
        const maxCooldown = SETTINGS.MOBILE_TOUCH_COOLDOWN_MAX;
        const scoreFactor = SETTINGS.MOBILE_TOUCH_COOLDOWN_SCORE_FACTOR;
        
        // Increase cooldown with score, but cap it to keep game playable
        const scoreBasedIncrease = Math.min(this.game.score * scoreFactor, maxCooldown - baseCooldown);
        const totalCooldown = baseCooldown + scoreBasedIncrease;
        
        // Ensure cooldown never exceeds maximum to keep game playable
        const finalCooldown = Math.min(totalCooldown, maxCooldown);
        
        // Debug logging (only in development)
        if (this.game.score % 50 === 0 && this.game.score > 0) {
            console.log(`Touch Cooldown Debug - Score: ${this.game.score}, Base: ${baseCooldown}ms, Score Increase: ${scoreBasedIncrease}ms, Final: ${finalCooldown}ms`);
        }
        
        return finalCooldown;
    }
    
    // Check if touch is allowed
    canTouchNow() {
        const now = Date.now();
        const timeSinceLastTouch = now - this.lastTouchTime;
        const requiredCooldown = this.calculateTouchCooldown();
        
        return timeSinceLastTouch >= requiredCooldown;
    }
    
    // Record touch and start cooldown
    recordTouch() {
        this.lastTouchTime = Date.now();
        this.canTouch = false;
        console.log('Touch recorded, cooldown started');
    }
    
    // Reset touch cooldown (call this when game resets)
    resetTouchCooldown() {
        this.lastTouchTime = 0;
        this.canTouch = true;
        this.touchCooldownBar.style.display = 'none';
        this.touchCooldownLabel.style.display = 'none';
        console.log('Touch cooldown reset');
    }
} 