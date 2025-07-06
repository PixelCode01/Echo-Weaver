// UniversalControls class - Handles touch/drag cooldown for all devices

console.log('=== UNIVERSAL CONTROLS SCRIPT LOADING ===');
console.log('Script loading timestamp:', Date.now());
console.log('Window object available:', !!window);
console.log('Document ready state:', document.readyState);
console.log('SETTINGS available:', typeof SETTINGS);
console.log('Game class available:', typeof Game);

// Track script loading order
window.scriptLoadOrder = window.scriptLoadOrder || [];
window.scriptLoadOrder.push('universal_controls.js');
console.log('Script load order so far:', window.scriptLoadOrder);

// Check for any existing errors
if (window.UniversalControls) {
    console.warn('UniversalControls already exists in window!');
}

// Make UniversalControls available globally
window.UniversalControls = class UniversalControls {
    constructor(game) {
        console.log('=== UNIVERSAL CONTROLS INITIALIZATION ===');
        console.log('UniversalControls constructor called with game:', game);
        console.log('Game state:', game?.state);
        console.log('Game score:', game?.score);
        
        this.game = game;
        this.gameScreen = document.getElementById('game-screen');
        console.log('Game screen element:', this.gameScreen);
        console.log('Game screen exists:', !!this.gameScreen);
        
        // Touch/drag cooldown system
        this.lastInteractionTime = 0;
        this.canInteract = true;
        
        console.log('Initial cooldown state:', {
            lastInteractionTime: this.lastInteractionTime,
            canInteract: this.canInteract
        });
        
        // Create universal control UI
        this.createUniversalControls();
        
        // Add event handlers for all devices
        this.addEventHandlers();
        
        console.log('Universal controls initialized with cooldown settings:', {
            base: SETTINGS.MOBILE_TOUCH_COOLDOWN_BASE,
            max: SETTINGS.MOBILE_TOUCH_COOLDOWN_MAX,
            factor: SETTINGS.MOBILE_TOUCH_COOLDOWN_SCORE_FACTOR
        });
        
        console.log('=== UNIVERSAL CONTROLS INITIALIZATION COMPLETE ===');
    }
    
    createUniversalControls() {
        console.log('=== CREATING UNIVERSAL CONTROLS UI ===');
        
        // Create container for universal controls (visible for cooldown bar)
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.id = 'universal-controls';
        this.controlsContainer.style.display = 'block'; // Show the container for cooldown bar
        console.log('Controls container created (visible):', this.controlsContainer);
        
        if (!this.gameScreen) {
            console.error('Game screen not found! Cannot append controls.');
            return;
        }
        
        this.gameScreen.appendChild(this.controlsContainer);
        console.log('Controls container appended to game screen (hidden)');
        
        // Create interaction cooldown progress bar (only this will be visible)
        this.interactionCooldownBar = document.createElement('div');
        this.interactionCooldownBar.id = 'interaction-cooldown-bar';
        this.interactionCooldownBar.className = 'universal-cooldown-bar';
        this.interactionCooldownBar.style.position = 'fixed';
        this.interactionCooldownBar.style.bottom = '60px';
        this.interactionCooldownBar.style.left = '50%';
        this.interactionCooldownBar.style.transform = 'translateX(-50%)';
        this.interactionCooldownBar.style.zIndex = '1000';
        this.interactionCooldownBar.style.width = '200px';
        this.interactionCooldownBar.style.height = '10px';
        this.interactionCooldownBar.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        this.interactionCooldownBar.style.border = '2px solid rgba(255, 255, 255, 0.5)';
        this.interactionCooldownBar.style.borderRadius = '5px';
        this.interactionCooldownBar.style.display = 'none'; // Start hidden
        this.controlsContainer.appendChild(this.interactionCooldownBar);
        console.log('Interaction cooldown bar created and positioned');
        
        // Create interaction cooldown label
        this.interactionCooldownLabel = document.createElement('div');
        this.interactionCooldownLabel.id = 'interaction-cooldown-label';
        this.interactionCooldownLabel.className = 'universal-cooldown-label';
        this.interactionCooldownLabel.innerHTML = 'Interaction Cooldown';
        this.interactionCooldownLabel.style.position = 'fixed';
        this.interactionCooldownLabel.style.bottom = '75px';
        this.interactionCooldownLabel.style.left = '50%';
        this.interactionCooldownLabel.style.transform = 'translateX(-50%)';
        this.interactionCooldownLabel.style.zIndex = '1000';
        this.interactionCooldownLabel.style.color = 'white';
        this.interactionCooldownLabel.style.fontSize = '12px';
        this.interactionCooldownLabel.style.fontWeight = 'bold';
        this.interactionCooldownLabel.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
        this.interactionCooldownLabel.style.display = 'none'; // Start hidden
        this.controlsContainer.appendChild(this.interactionCooldownLabel);
        
        console.log('=== UNIVERSAL CONTROLS UI CREATION COMPLETE ===');
        console.log('All elements created:', {
            container: !!this.controlsContainer,
            cooldownBar: !!this.interactionCooldownBar,
            cooldownLabel: !!this.interactionCooldownLabel
        });
    }
    
    addEventHandlers() {
        // No event handlers needed since buttons are removed
        console.log('Universal controls event handlers skipped - buttons removed');
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
        // Debug: Check if update is being called
        if (this.game && this.game.score % 60 === 0 && this.game.score > 0) {
            console.log('=== UNIVERSAL CONTROLS UPDATE CALLED ===');
            console.log('Game state:', this.game.state);
            console.log('Game score:', this.game.score);
            console.log('Controls exist:', {
                cooldownBar: !!this.interactionCooldownBar,
                cooldownLabel: !!this.interactionCooldownLabel
            });
        }
        
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
        
        const canInteract = timeSinceLastInteraction >= requiredCooldown;
        
        // Debug logging for cooldown checks
        if (this.game && this.game.score % 30 === 0 && this.game.score > 0) {
            console.log('=== COOLDOWN CHECK DEBUG ===');
            console.log('Current time:', now);
            console.log('Last interaction time:', this.lastInteractionTime);
            console.log('Time since last interaction:', timeSinceLastInteraction);
            console.log('Required cooldown:', requiredCooldown);
            console.log('Can interact:', canInteract);
            console.log('Game score:', this.game.score);
        }
        
        return canInteract;
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

console.log('=== UNIVERSAL CONTROLS SCRIPT LOADED ===');
console.log('UniversalControls class available:', typeof window.UniversalControls);
console.log('UniversalControls in window:', !!window.UniversalControls);
console.log('Script execution completed successfully');
console.log('Final window check - UniversalControls:', !!window.UniversalControls);
console.log('Final window check - typeof:', typeof window.UniversalControls); 