// Mobile Controls for Echo Weaver

class MobileControls {
    constructor(game) {
        this.game = game;
        this.isMobile = this.detectMobile();
        
        if (this.isMobile) {
            this.init();
        }
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    init() {
        // Create mobile control buttons
        this.createEchoBurstButton();
        this.createWaveModeButton();
        
        // Add touch events for wave creation
        this.setupWaveCreation();
    }
    
    createEchoBurstButton() {
        const echoBurstButton = document.createElement('div');
        echoBurstButton.id = 'echo-burst-button';
        echoBurstButton.className = 'mobile-control-button';
        echoBurstButton.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
        document.getElementById('game-screen').appendChild(echoBurstButton);
        
        // Add event listener
        echoBurstButton.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            
            if (this.game.state === 'playing' && this.game.echoBurstCooldown === 0) {
                this.game._activateEchoBurst();
                
                // Add visual feedback
                echoBurstButton.classList.add('pulse');
                setTimeout(() => {
                    echoBurstButton.classList.remove('pulse');
                }, 300);
            }
        });
    }
    
    createWaveModeButton() {
        const waveModeButton = document.createElement('div');
        waveModeButton.id = 'wave-mode-button';
        waveModeButton.className = 'mobile-control-button';
        waveModeButton.innerHTML = '<i class="fas fa-sync"></i>';
        document.getElementById('game-screen').appendChild(waveModeButton);
        
        // Add event listener
        waveModeButton.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            
            if (this.game.state === 'playing') {
                this.game.cycleWaveMode();
                
                // Add visual feedback
                waveModeButton.classList.add('rotate');
                setTimeout(() => {
                    waveModeButton.classList.remove('rotate');
                }, 300);
            }
        });
    }
    
    setupWaveCreation() {
        const canvas = document.getElementById('game-canvas');
        
        // Touch start event
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            
            if (this.game.state === 'playing') {
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                
                this.game.startPos = { x, y };
            }
        });
        
        // Touch end event
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            
            if (this.game.state === 'playing' && this.game.startPos) {
                const touch = e.changedTouches[0];
                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                
                const endPos = { x, y };
                
                // Determine wave parameters based on current mode
                let waveParams = SETTINGS.WAVE_MODE_NORMAL;
                if (this.game.currentWaveMode === 'focused') {
                    waveParams = SETTINGS.WAVE_MODE_FOCUSED;
                } else if (this.game.currentWaveMode === 'wide') {
                    waveParams = SETTINGS.WAVE_MODE_WIDE;
                }
                
                // Create a new wave
                const newWave = new SoundWave(
                    this.game.startPos,
                    endPos,
                    this.game.activePowerups['wave_width_active'] || false,
                    this.game.activePowerups['wave_magnet_active'] || false,
                    waveParams.damage_multiplier,
                    waveParams.width_multiplier
                );
                
                this.game.waves.push(newWave);
                this.game._playSound('wave_create');
                this.game.startPos = null;
            }
        });
        
        // Touch move event - for drawing a line preview
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            
            // Could implement a line preview here if desired
        });
    }
}

// Export the class
window.MobileControls = MobileControls; 