// UniversalControls class - Handles touch/drag cooldown for all devices

class UniversalControls {
    constructor(game) {
        console.log('UniversalControls constructor called with game:', game);
        this.game = game;
        this.gameScreen = document.getElementById('game-screen');
        console.log('Game screen element:', this.gameScreen);
        
        // Touch/drag cooldown system
        this.lastInteractionTime = 0;
        this.canInteract = true;
        
        // Create universal control UI
        this.createUniversalControls();
        
        // Add event handlers for all devices
        this.addEventHandlers();
        
        console.log('Universal controls initialized with cooldown settings:', {
            base: SETTINGS.MOBILE_TOUCH_COOLDOWN_BASE,
            max: SETTINGS.MOBILE_TOUCH_COOLDOWN_MAX,
            factor: SETTINGS.MOBILE_TOUCH_COOLDOWN_SCORE_FACTOR
        });
    }
    
    createUniversalControls() {
        // Create container for universal controls
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.id = 'universal-controls';
        this.gameScreen.appendChild(this.controlsContainer);
        
        // Create Echo Burst button
        this.echoBurstButton = document.createElement('div');
        this.echoBurstButton.id = 'echo-burst-button';
        this.echoBurstButton.className = 'universal-control-button';
        this.echoBurstButton.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
        this.echoBurstButton.setAttribute('data-tooltip', 'Echo Burst');
        this.controlsContainer.appendChild(this.echoBurstButton);
        
        // Create Wave Mode button
        this.waveModeButton = document.createElement('div');
        this.waveModeButton.id = 'wave-mode-button';
        this.waveModeButton.className = 'universal-control-button';
        this.waveModeButton.innerHTML = '<i class="fas fa-sync"></i>';
        this.waveModeButton.setAttribute('data-tooltip', 'Change Wave Mode');
        this.controlsContainer.appendChild(this.waveModeButton);
        
        // Create Pause button
        this.pauseButton = document.createElement('div');
        this.pauseButton.id = 'pause-button';
        this.pauseButton.className = 'universal-control-button';
        this.pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
        this.pauseButton.setAttribute('data-tooltip', 'Pause Game');
        this.controlsContainer.appendChild(this.pauseButton);
        
        // Create current mode indicator
        this.modeIndicator = document.createElement('div');
        this.modeIndicator.id = 'universal-mode-indicator';
        this.modeIndicator.innerHTML = '<span>Normal</span>';
        this.controlsContainer.appendChild(this.modeIndicator);
        
        // Create interaction cooldown progress bar
        this.interactionCooldownBar = document.createElement('div');
        this.interactionCooldownBar.id = 'interaction-cooldown-bar';
        this.interactionCooldownBar.className = 'universal-cooldown-bar';
        this.controlsContainer.appendChild(this.interactionCooldownBar);
        
        // Create interaction cooldown label
        this.interactionCooldownLabel = document.createElement('div');
        this.interactionCooldownLabel.id = 'interaction-cooldown-label';
        this.interactionCooldownLabel.className = 'universal-cooldown-label';
        this.interactionCooldownLabel.innerHTML = 'Interaction Cooldown';
        this.controlsContainer.appendChild(this.interactionCooldownLabel);
    }
    
    addEventHandlers() {
        // Echo Burst button - works with both touch and click
        this.echoBurstButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.game.state === 'playing' && this.game.echoBurstCooldown === 0 && this.canInteractNow()) {
                this.game._activateEchoBurst();
                this.recordInteraction();
                
                // Add visual feedback
                this.echoBurstButton.classList.add('button-pressed');
                setTimeout(() => {
                    this.echoBurstButton.classList.remove('button-pressed');
                }, 200);
            }
        });
        
        this.echoBurstButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.game.state === 'playing' && this.game.echoBurstCooldown === 0 && this.canInteractNow()) {
                this.game._activateEchoBurst();
                this.recordInteraction();
                
                // Add visual feedback
                this.echoBurstButton.classList.add('button-pressed');
                setTimeout(() => {
                    this.echoBurstButton.classList.remove('button-pressed');
                }, 200);
            }
        }, { passive: false });
        
        // Wave Mode button - works with both touch and click
        this.waveModeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.game.state === 'playing' && this.canInteractNow()) {
                this.game.cycleWaveMode();
                this.recordInteraction();
                
                // Update mode indicator
                this.modeIndicator.innerHTML = `<span>${this.game.currentWaveMode}</span>`;
                
                // Add visual feedback
                this.waveModeButton.classList.add('button-pressed');
                setTimeout(() => {
                    this.waveModeButton.classList.remove('button-pressed');
                }, 200);
            }
        });
        
        this.waveModeButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.game.state === 'playing' && this.canInteractNow()) {
                this.game.cycleWaveMode();
                this.recordInteraction();
                
                // Update mode indicator
                this.modeIndicator.innerHTML = `<span>${this.game.currentWaveMode}</span>`;
                
                // Add visual feedback
                this.waveModeButton.classList.add('button-pressed');
                setTimeout(() => {
                    this.waveModeButton.classList.remove('button-pressed');
                }, 200);
            }
        }, { passive: false });
        
        // Pause button - works with both touch and click
        this.pauseButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.game.state === 'playing' && this.canInteractNow()) {
                // Toggle pause state
                window.gamePaused = !window.gamePaused;
                this.recordInteraction();
                
                // Update button icon
                if (window.gamePaused) {
                    this.pauseButton.innerHTML = '<i class="fas fa-play"></i>';
                    
                    // Show pause message
                    const pauseMessage = document.createElement('div');
                    pauseMessage.id = 'pause-message';
                    pauseMessage.innerHTML = '<h2>Game Paused</h2><p>Click play to resume</p>';
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
        });
        
        this.pauseButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.game.state === 'playing' && this.canInteractNow()) {
                // Toggle pause state
                window.gamePaused = !window.gamePaused;
                this.recordInteraction();
                
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
    }
    
    updateCooldownDisplay() {
        // Debug: Check if elements exist
        if (!this.interactionCooldownBar || !this.interactionCooldownLabel) {
            console.error('Interaction cooldown elements not found:', {
                bar: this.interactionCooldownBar,
                label: this.interactionCooldownLabel
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
        
        // Update interaction cooldown progress bar
        const now = Date.now();
        const timeSinceLastInteraction = now - this.lastInteractionTime;
        const requiredCooldown = this.calculateInteractionCooldown();
        
        // Debug: Log cooldown calculations every 60 frames
        if (this.game.score % 60 === 0 && this.game.score > 0) {
            console.log('Interaction cooldown debug:', {
                now,
                lastInteractionTime: this.lastInteractionTime,
                timeSinceLastInteraction,
                requiredCooldown,
                canInteract: this.canInteract,
                gameScore: this.game.score
            });
        }
        
        if (timeSinceLastInteraction < requiredCooldown) {
            const progress = (timeSinceLastInteraction / requiredCooldown) * 100;
            this.interactionCooldownBar.style.width = `${progress}%`;
            this.interactionCooldownBar.style.display = 'block';
            this.interactionCooldownLabel.style.display = 'block';
            
            // Add visual indicator for interaction cooldown with color change
            if (progress < 50) {
                this.interactionCooldownBar.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
            } else if (progress < 80) {
                this.interactionCooldownBar.style.backgroundColor = 'rgba(255, 165, 0, 0.5)';
            } else {
                this.interactionCooldownBar.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
            }
            
            // Update label with time remaining
            const remainingTime = Math.ceil((requiredCooldown - timeSinceLastInteraction) / 100);
            this.interactionCooldownLabel.innerHTML = `Interaction Cooldown (${remainingTime}s)`;
        } else {
            this.interactionCooldownBar.style.display = 'none';
            this.interactionCooldownLabel.style.display = 'none';
            this.canInteract = true;
        }
    }
    
    // Call this in the game loop to update universal controls
    update() {
        this.updateCooldownDisplay();
    }
    
    // Calculate interaction cooldown based on score
    calculateInteractionCooldown() {
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
            console.log(`Interaction Cooldown Debug - Score: ${this.game.score}, Base: ${baseCooldown}ms, Score Increase: ${scoreBasedIncrease}ms, Final: ${finalCooldown}ms`);
        }
        
        return finalCooldown;
    }
    
    // Check if interaction is allowed
    canInteractNow() {
        const now = Date.now();
        const timeSinceLastInteraction = now - this.lastInteractionTime;
        const requiredCooldown = this.calculateInteractionCooldown();
        
        return timeSinceLastInteraction >= requiredCooldown;
    }
    
    // Record interaction and start cooldown
    recordInteraction() {
        this.lastInteractionTime = Date.now();
        this.canInteract = false;
        console.log('Interaction recorded, cooldown started');
    }
    
    // Reset interaction cooldown (call this when game resets)
    resetInteractionCooldown() {
        this.lastInteractionTime = 0;
        this.canInteract = true;
        this.interactionCooldownBar.style.display = 'none';
        this.interactionCooldownLabel.style.display = 'none';
        console.log('Interaction cooldown reset');
    }
}

// Make it globally accessible
window.UniversalControls = UniversalControls; 