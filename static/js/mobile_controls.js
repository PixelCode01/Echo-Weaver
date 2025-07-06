// MobileControls class - Handles mobile-specific UI and interactions

class MobileControls {
    constructor(game) {
        this.game = game;
        this.gameScreen = document.getElementById('game-screen');
        
        // Create mobile control buttons
        this.createMobileControls();
        
        // Add touch event handlers
        this.addTouchEventHandlers();
        
        console.log('Mobile controls initialized');
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
    }
    
    addTouchEventHandlers() {
        // Echo Burst button
        this.echoBurstButton.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            
            if (this.game.state === 'playing' && this.game.echoBurstCooldown === 0) {
                this.game._activateEchoBurst();
                
                // Add visual feedback
                this.echoBurstButton.classList.add('button-pressed');
                setTimeout(() => {
                    this.echoBurstButton.classList.remove('button-pressed');
                }, 200);
            }
        });
        
        // Wave Mode button
        this.waveModeButton.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            
            if (this.game.state === 'playing') {
                this.game.cycleWaveMode();
                
                // Update mode indicator
                this.modeIndicator.innerHTML = `<span>${this.game.currentWaveMode}</span>`;
                
                // Add visual feedback
                this.waveModeButton.classList.add('button-pressed');
                setTimeout(() => {
                    this.waveModeButton.classList.remove('button-pressed');
                }, 200);
            }
        });
        
        // Pause button
        this.pauseButton.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            
            if (this.game.state === 'playing') {
                // Toggle pause state
                window.gamePaused = !window.gamePaused;
                
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
        });
        
        // Prevent default touch behavior on game canvas to avoid unwanted scrolling
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.addEventListener('touchmove', (e) => {
                if (e.touches.length === 1) {
                    e.preventDefault();
                }
            }, { passive: false });
        }
    }
    
    updateCooldownDisplay() {
        // Update Echo Burst cooldown visual
        if (this.game.echoBurstCooldown > 0) {
            const cooldownPercent = (this.game.echoBurstCooldown / SETTINGS.ECHO_BURST_COOLDOWN) * 100;
            this.echoBurstButton.style.opacity = 0.5;
            this.echoBurstButton.style.background = `conic-gradient(rgba(0, 0, 0, 0.5) ${cooldownPercent}%, var(--accent-color) ${cooldownPercent}%)`;
        } else {
            this.echoBurstButton.style.opacity = 1;
            this.echoBurstButton.style.background = 'var(--accent-color)';
        }
    }
    
    // Call this in the game loop to update mobile controls
    update() {
        this.updateCooldownDisplay();
    }
} 