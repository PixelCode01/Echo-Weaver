// Main entry point for the game

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
    
    // Detect device type and show appropriate instructions
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    
    if (isMobile) {
        console.log('Mobile device detected, using touch controls');
        document.querySelector('.desktop-instructions').style.display = 'none';
        document.querySelector('.mobile-instructions').style.display = 'block';
    } else {
        console.log('Desktop device detected, using keyboard controls');
        document.querySelector('.desktop-instructions').style.display = 'block';
        document.querySelector('.mobile-instructions').style.display = 'none';
    }
    
    // Get DOM elements
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const submitScoreButton = document.getElementById('submit-score');
    const playerNameInput = document.getElementById('player-name');
    const gameOverPlayerNameInput = document.getElementById('game-over-player-name');
    const playerNameContainer = document.getElementById('player-name-container');
    const gameOverPlayerNameContainer = document.getElementById('player-name-container-gameover');
    const canvas = document.getElementById('game-canvas');
    
    // Set up canvas
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Update settings with actual window size
    SETTINGS.WIDTH = canvas.width;
    SETTINGS.HEIGHT = canvas.height;
    
    // Load sounds
    const sounds = {
        'wave_create': new Audio('/static/assets/sounds/create_wave.wav'),
        'enemy_hit': new Audio('/static/assets/sounds/enemy_hit.wav'),
        'game_over': new Audio('/static/assets/sounds/game_over.wav'),
        'powerup_collect': new Audio('/static/assets/sounds/powerup_collect.wav'),
        'echo_burst': new Audio('/static/assets/sounds/echo_burst.wav')
    };
    
    // Function to play sounds
    function playSound(soundName) {
        if (sounds[soundName]) {
            sounds[soundName].currentTime = 0;
            sounds[soundName].play().catch(error => {
                console.log(`Error playing sound ${soundName}:`, error);
            });
        }
    }
    
    // Create game instance with sound support
    let game = new Game(canvas);
    game._playSound = playSound;
    
    // Make game globally accessible for components like Core
    window.game = game;
    
    // Player name state
    let playerName = '';
    let gamePaused = false; // Start with game running
    
    // Cookie functions
    function setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
    }
    
    function getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    }
    
    // Check for saved player name in cookie
    const savedPlayerName = getCookie('playerName');
    if (savedPlayerName) {
        playerName = savedPlayerName;
        const playerNameInput = document.getElementById('player-name');
        if (playerNameInput) {
            playerNameInput.value = playerName;
        }
        console.log('Loaded player name from cookie:', playerName);
    }
    
    // Load high scores initially
    fetch('/api/highscores')
        .then(response => response.json())
        .then(highscores => {
            console.log('Initial highscores:', highscores);
            
            if (highscores && highscores.length > 0) {
                const highscoreElement = document.getElementById('highscore');
                if (highscoreElement) {
                    highscoreElement.textContent = highscores[0].score;
                }
            }
            
            // Also update the leaderboard on the game over screen
            updateLeaderboard(highscores);
        })
        .catch(error => console.error('Error loading high scores:', error));
    
    // Game loop variables
    let lastTime = 0;
    let accumulator = 0;
    const timeStep = 1000 / SETTINGS.FPS;
    
    // Game loop
    function gameLoop(timestamp) {
        // Calculate delta time
        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        // Failsafe: Prevent infinite loops by limiting delta time
        const maxDeltaTime = 100; // 100ms max
        const clampedDeltaTime = Math.min(deltaTime, maxDeltaTime);
        
        // Only update if game is not paused
        if (!gamePaused) {
            // Update with fixed time step
            accumulator += clampedDeltaTime;
            while (accumulator >= timeStep) {
                game.update();
                accumulator -= timeStep;
            }
        }
        
        // Always draw, even when paused
        game.draw(ctx);
        
        // Continue loop
        requestAnimationFrame(gameLoop);
    }
    
    // Event listeners
    startButton.addEventListener('click', function() {
        console.log('Start button clicked');
        
        // Get player name if entered
        if (playerNameInput && playerNameInput.value.trim() !== '') {
            playerName = playerNameInput.value.trim();
            console.log('Setting player name to:', playerName);
            
            // Save player name to cookie (30 days expiration)
            setCookie('playerName', playerName, 30);
            
            // Save player name to server
            fetch('/api/player', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: playerName })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Player name saved successfully');
            })
            .catch(error => {
                console.error('Error saving player name:', error);
            });
        }
        
        // Hide start screen and show game screen
        if (startScreen) startScreen.classList.add('hidden');
        if (gameScreen) gameScreen.classList.remove('hidden');
        
        // Start the game
        gamePaused = false;
        game.start();
        
        // Start the game loop if it hasn't been started yet
        if (lastTime === 0) {
            requestAnimationFrame(gameLoop);
        }
    });
    
    restartButton.addEventListener('click', () => {
        console.log('Restart button clicked');
        
        game.reset();
        
        // Switch screens
        gameOverScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        // Resume game
        gamePaused = false;
    });
    
    submitScoreButton.addEventListener('click', () => {
        console.log('Submit score button clicked');
        
        // Use the stored player name
        let name = playerName;
        
        if (!name || name.trim() === '') {
            // If we somehow don't have a player name, use Anonymous
            name = 'Anonymous';
            
            // Save the name for future use if it's not Anonymous
            if (name !== 'Anonymous') {
                playerName = name;
                
                // Save player name to session
                fetch('/api/player', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: playerName
                    })
                })
                .then(response => {
                    console.log('Player name saved successfully');
                })
                .catch(error => {
                    console.error('Error saving player name:', error);
                });
            }
        }
        
        // Save the high score
        game.saveHighScore(name);
        
        // Update button state
        submitScoreButton.disabled = true;
        submitScoreButton.textContent = 'Score Submitted!';
        
        // Update leaderboard in real-time
        fetch('/api/highscores')
            .then(response => response.json())
            .then(highscores => {
                console.log('Received highscores after submit:', highscores);
                updateLeaderboard(highscores);
            })
            .catch(error => console.error('Error updating leaderboard:', error));
    });
    
    // Function to update the leaderboard
    function updateLeaderboard(highscores) {
        console.log('Updating leaderboard with:', highscores);
        
        // Ensure highscores is an array
        if (!Array.isArray(highscores)) {
            console.error('Highscores is not an array:', typeof highscores);
            highscores = [];
        }
        
        // Check for duplicate leaderboard elements
        const leaderboardElements = document.querySelectorAll('#leaderboard-entries');
        console.log('Number of leaderboard elements found in updateLeaderboard:', leaderboardElements.length);
        if (leaderboardElements.length > 1) {
            console.error('Multiple leaderboard elements found with the same ID!');
            // Keep only the first one and remove others
            for (let i = 1; i < leaderboardElements.length; i++) {
                leaderboardElements[i].parentNode.removeChild(leaderboardElements[i]);
            }
            console.log('Removed duplicate leaderboard elements, keeping only the first one');
        }
        
        // Get the leaderboard container
        const leaderboardContainer = document.getElementById('leaderboard');
        if (leaderboardContainer) {
            // Find the existing leaderboard entries div
            const oldLeaderboardEntries = document.getElementById('leaderboard-entries');
            if (oldLeaderboardEntries) {
                // Remove it completely
                oldLeaderboardEntries.parentNode.removeChild(oldLeaderboardEntries);
            }
            
            // Create a brand new leaderboard entries div
            const newLeaderboardEntries = document.createElement('div');
            newLeaderboardEntries.id = 'leaderboard-entries';
            leaderboardContainer.appendChild(newLeaderboardEntries);
            
            // Deduplicate entries by name (keep highest score for each name)
            const uniqueScores = {};
            highscores.forEach(entry => {
                if (!entry) return;
                
                const name = entry.name || 'Anonymous';
                const score = entry.score || 0;
                
                // If we haven't seen this name yet, or this score is higher than the previous one
                if (!uniqueScores[name] || score > uniqueScores[name]) {
                    uniqueScores[name] = score;
                }
            });
            
            // Convert back to array and sort
            const uniqueHighscores = Object.entries(uniqueScores).map(([name, score]) => ({
                name,
                score
            }));
            
            uniqueHighscores.sort((a, b) => b.score - a.score);
            
            // Get current player name for highlighting
            console.log('Current player for highlighting:', playerName);
            
            // Add entries to the new leaderboard div
            uniqueHighscores.forEach((entry, index) => {
                const entryElement = document.createElement('div');
                entryElement.className = 'leaderboard-entry';
                if (entry.name === playerName) {
                    entryElement.classList.add('current-player');
                }
                
                entryElement.innerHTML = `${index + 1}. ${entry.name}<span>${entry.score}</span>`;
                newLeaderboardEntries.appendChild(entryElement);
            });
            
            // If no entries, show a message
            if (uniqueHighscores.length === 0) {
                const emptyElement = document.createElement('div');
                emptyElement.className = 'leaderboard-entry';
                emptyElement.textContent = 'No high scores yet!';
                newLeaderboardEntries.appendChild(emptyElement);
            }
        } else {
            console.error('Leaderboard container not found!');
        }
    }
    
    // Auto-submit score when game over if we already have a player name
    game.autoSubmitScore = function() {
        console.log('Auto-submit score called, player name:', playerName);
        
        if (playerName && playerName.trim() !== '') {
            this.saveHighScore(playerName);
            
            // Update UI to show score was submitted
            if (submitScoreButton) {
                submitScoreButton.disabled = true;
                submitScoreButton.textContent = 'Score Submitted!';
            }
            
            // Update leaderboard in real-time
            fetch('/api/highscores')
                .then(response => response.json())
                .then(highscores => {
                    console.log('Received highscores after auto-submit:', highscores);
                    updateLeaderboard(highscores);
                })
                .catch(error => console.error('Error updating leaderboard:', error));
            
            return true;
        }
        return false;
    };
    
    // Game input events
    canvas.addEventListener('mousedown', (event) => {
        console.log('=== MOUSE DOWN EVENT ===');
        console.log('Game paused:', gamePaused);
        console.log('Universal controls exist:', !!window.universalControls);
        
        if (!gamePaused) {
            // Check universal controls cooldown
            if (window.universalControls && !window.universalControls.canInteractNow()) {
                console.log('Mouse click blocked by universal controls cooldown');
                return;
            }
            
            console.log('Mouse click allowed, processing...');
            game.handleEvent(event);
            
            // Record interaction for universal controls
            if (window.universalControls) {
                window.universalControls.recordInteraction();
                console.log('Interaction recorded for universal controls');
            }
        }
    });
    
    canvas.addEventListener('mouseup', (event) => {
        if (!gamePaused) {
            game.handleEvent(event);
        }
    });
    
    document.addEventListener('keydown', (event) => {
        if (!gamePaused) {
            game.handleEvent(event);
        }
    });
    
    // Handle touch events for mobile
    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('=== TOUCH START EVENT ===');
        console.log('Game paused:', gamePaused);
        console.log('Universal controls exist:', !!window.universalControls);
        
        if (!gamePaused) {
            // Check universal controls cooldown
            if (window.universalControls && !window.universalControls.canInteractNow()) {
                console.log('Touch blocked by universal controls cooldown');
                return;
            }
            
            console.log('Touch allowed, processing...');
            
            const touch = event.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            game.handleEvent(mouseEvent);
            
            // Record interaction for universal controls
            if (window.universalControls) {
                window.universalControls.recordInteraction();
                console.log('Interaction recorded for universal controls');
            }
            
            // Mobile triple-tap detection for wave mode switching
            if (game.lastTapTime && (Date.now() - game.lastTapTime) < 300) {
                game.tapCount = (game.tapCount || 0) + 1;
                
                // On third tap, switch wave mode
                if (game.tapCount >= 2) {
                    game.tapCount = 0;
                    game.cycleWaveMode();
                }
            } else {
                game.tapCount = 0;
            }
            
            game.lastTapTime = Date.now();
        }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (!gamePaused && event.touches.length === 1) {
            const touch = event.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            game.handleEvent(mouseEvent);
        }
    }, { passive: false });
    
    canvas.addEventListener('touchend', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        if (!gamePaused) {
            const mouseEvent = new MouseEvent('mouseup', {
                clientX: event.changedTouches[0].clientX,
                clientY: event.changedTouches[0].clientY
            });
            game.handleEvent(mouseEvent);
        }
    }, { passive: false });
    
    // Prevent touch events on the entire document to avoid unwanted behaviors
    document.addEventListener('touchstart', (event) => {
        // Only prevent default on game-related elements
        if (event.target.closest('#game-canvas') || event.target.closest('#mobile-controls')) {
            event.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', (event) => {
        // Only prevent default on game-related elements
        if (event.target.closest('#game-canvas') || event.target.closest('#mobile-controls')) {
            event.preventDefault();
        }
    }, { passive: false });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // Update settings
        SETTINGS.WIDTH = window.innerWidth;
        SETTINGS.HEIGHT = window.innerHeight;
        
        // Resize canvas
        canvas.width = SETTINGS.WIDTH;
        canvas.height = SETTINGS.HEIGHT;
        
        // Reset core position
        if (game.core) {
            game.core.position = new Vector(SETTINGS.WIDTH / 2, SETTINGS.HEIGHT / 2);
        }
    });
    
    // Handle visibility change (pause/resume)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Game is paused
            console.log('Game paused');
            gamePaused = true;
        } else {
            // Game is resumed only if tutorial is completed
            console.log('Game resumed');
            lastTime = 0; // Reset last time to avoid large delta time
            
            // Only unpause if there's no tutorial visible
            const tutorialOverlay = document.getElementById('tutorial-overlay');
            if (tutorialOverlay && !tutorialOverlay.classList.contains('hidden')) {
                gamePaused = true;
            } else {
                gamePaused = false;
            }
        }
    });
    
    // Function to show tutorial based on device
    function showTutorial() {
        // Detect if mobile or desktop
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Show the tutorial overlay
        const tutorialOverlay = document.getElementById('tutorial-overlay');
        if (tutorialOverlay) {
            // Clear existing tutorial content
            const tutorialContent = tutorialOverlay.querySelector('.tutorial-content');
            if (tutorialContent) {
                tutorialContent.innerHTML = '';
            } else {
                return; // Can't find tutorial content container
            }
            
            // Create device-specific tutorial
            if (isMobile) {
                // Mobile tutorial
                tutorialContent.innerHTML = `
                    <h2>How to Play on Mobile</h2>
                    
                    <div class="tutorial-step" data-step="1">
                        <h3>Draw Sound Waves</h3>
                        <p>Touch and drag to create directional sound waves</p>
                        <div class="tutorial-image mobile-draw"></div>
                    </div>
                    
                    <div class="tutorial-step hidden" data-step="2">
                        <h3>Special Buttons</h3>
                        <p>Use the buttons at the bottom right for special abilities</p>
                        <div class="tutorial-image mobile-buttons"></div>
                    </div>
                    
                    <div class="tutorial-step hidden" data-step="3">
                        <h3>Echo Burst</h3>
                        <p>Tap the burst button to destroy nearby enemies</p>
                        <div class="tutorial-image mobile-burst"></div>
                    </div>
                    
                    <div class="tutorial-step hidden" data-step="4">
                        <h3>Wave Modes</h3>
                        <p>Tap the mode button to cycle between wave types</p>
                        <div class="tutorial-image mobile-modes"></div>
                    </div>
                    
                    <button class="glow-button tutorial-next">Next</button>
                `;
            } else {
                // Desktop tutorial
                tutorialContent.innerHTML = `
                    <h2>How to Play on Desktop</h2>
                    
                    <div class="tutorial-step" data-step="1">
                        <h3>Draw Sound Waves</h3>
                        <p>Click and drag to create directional sound waves</p>
                        <div class="tutorial-image desktop-draw"></div>
                    </div>
                    
                    <div class="tutorial-step hidden" data-step="2">
                        <h3>Wave Modes</h3>
                        <p>Press 1, 2, or 3 to switch between Normal, Focused, and Wide wave modes</p>
                        <div class="tutorial-image desktop-keys"></div>
                    </div>
                    
                    <div class="tutorial-step hidden" data-step="3">
                        <h3>Echo Burst</h3>
                        <p>Press SPACE to activate Echo Burst when available - destroys nearby enemies!</p>
                        <div class="tutorial-image desktop-space"></div>
                    </div>
                    
                    <div class="tutorial-step hidden" data-step="4">
                        <h3>Pause Game</h3>
                        <p>Press ESC or P to pause the game at any time</p>
                        <div class="tutorial-image desktop-pause"></div>
                    </div>
                    
                    <button class="glow-button tutorial-next">Next</button>
                `;
            }
            
            tutorialOverlay.classList.remove('hidden');
            
            // Set up tutorial navigation
            const tutorialSteps = document.querySelectorAll('.tutorial-step');
            const nextButton = document.querySelector('.tutorial-next');
            let currentStep = 0;
            
            // Function to show a specific tutorial step
            function showStep(stepIndex) {
                tutorialSteps.forEach((step, index) => {
                    if (index === stepIndex) {
                        step.classList.remove('hidden');
                        step.style.opacity = '0';
                        setTimeout(() => {
                            step.style.opacity = '1';
                        }, 50);
                    } else {
                        step.classList.add('hidden');
                    }
                });
                
                // Update button text for the last step
                if (stepIndex === tutorialSteps.length - 1) {
                    nextButton.textContent = 'Start Playing!';
                } else {
                    nextButton.textContent = 'Next';
                }
            }
            
            // Show the first step
            showStep(currentStep);
            
            // Handle next button clicks
            nextButton.addEventListener('click', () => {
                currentStep++;
                
                if (currentStep < tutorialSteps.length) {
                    showStep(currentStep);
                } else {
                    // Tutorial complete, start the game
                    tutorialOverlay.classList.add('hidden');
                    gamePaused = false; // Unpause the game
                    
                    // Add a welcome message
                    game.messageDisplay.addMessage(
                        'Welcome to Echo Weaver!', 
                        { x: SETTINGS.WIDTH / 2, y: SETTINGS.HEIGHT / 2 }, 
                        SETTINGS.PRIMARY_COLOR, 
                        36
                    );
                }
            });
        } else {
            // If tutorial overlay doesn't exist, just start the game
            gamePaused = false;
        }
    }
    
    // Universal touch/drag cooldown system for all devices
    console.log("=== INITIALIZING UNIVERSAL CONTROLS ===");
    console.log("Game state at initialization:", game.state);
    console.log("Game score at initialization:", game.score);
    
    // Initialize universal controls (works on all devices)
    try {
        // Check if UniversalControls class is available
        if (typeof window.UniversalControls === 'undefined') {
            console.error("UniversalControls class is not defined. Check if universal_controls.js is loaded properly.");
            console.log("Available global classes:", Object.keys(window).filter(key => key.includes('Control')));
            return;
        }
        
        const universalControls = new window.UniversalControls(game);
        window.universalControls = universalControls; // Make it globally accessible
        console.log("Universal controls initialized successfully:", universalControls);
        console.log("Universal controls added to window:", !!window.universalControls);
    } catch (error) {
        console.error("Failed to initialize universal controls:", error);
        console.error("Error stack:", error.stack);
    }
    
    // Update universal controls in the game loop
    const originalGameUpdate = game.update;
    game.update = function() {
        originalGameUpdate.call(game);
        
        // Update universal controls
        if (window.universalControls && game.state === 'playing') {
            window.universalControls.update();
            // Debug: Log universal controls update
            if (game.score % 120 === 0 && game.score > 0) {
                console.log('=== UNIVERSAL CONTROLS UPDATE IN GAME LOOP ===');
                console.log('Game state:', game.state);
                console.log('Game score:', game.score);
                console.log('Universal controls exist:', !!window.universalControls);
            }
        } else {
            // Debug: Log why universal controls aren't updating
            if (game.score % 120 === 0 && game.score > 0) {
                console.log('=== UNIVERSAL CONTROLS UPDATE SKIPPED ===');
                console.log('Universal controls exist:', !!window.universalControls);
                console.log('Game state:', game.state);
                console.log('Game state is playing:', game.state === 'playing');
            }
        }
    };
    
    // Add keyboard shortcuts for wave modes (desktop)
    document.addEventListener('keydown', (e) => {
        if (game.state === 'playing') {
            if (e.key === '1') {
                game.currentWaveMode = 'normal';
                document.getElementById('current-mode').textContent = 'Normal';
                
                // Add visual feedback
                const modeDisplay = document.getElementById('wave-mode');
                modeDisplay.classList.add('mode-changed');
                setTimeout(() => {
                    modeDisplay.classList.remove('mode-changed');
                }, 500);
            } else if (e.key === '2') {
                game.currentWaveMode = 'focused';
                document.getElementById('current-mode').textContent = 'Focused';
                
                // Add visual feedback
                const modeDisplay = document.getElementById('wave-mode');
                modeDisplay.classList.add('mode-changed');
                setTimeout(() => {
                    modeDisplay.classList.remove('mode-changed');
                }, 500);
            } else if (e.key === '3') {
                game.currentWaveMode = 'wide';
                document.getElementById('current-mode').textContent = 'Wide';
                
                // Add visual feedback
                const modeDisplay = document.getElementById('wave-mode');
                modeDisplay.classList.add('mode-changed');
                setTimeout(() => {
                    modeDisplay.classList.remove('mode-changed');
                }, 500);
            }
        }
    });
    
    // Add pause functionality
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            if (game.state === 'playing') {
                gamePaused = !gamePaused;
                
                // Show pause message
                if (gamePaused) {
                    const pauseMessage = document.createElement('div');
                    pauseMessage.id = 'pause-message';
                    pauseMessage.innerHTML = '<h2>Game Paused</h2><p>Press ESC or P to resume</p>';
                    document.getElementById('game-screen').appendChild(pauseMessage);
                } else {
                    const pauseMessage = document.getElementById('pause-message');
                    if (pauseMessage) {
                        pauseMessage.remove();
                    }
                }
            }
        }
    });
    
    // Add visual effects for the game canvas
    function addVisualEffects() {
        // Add canvas filter for better visual appearance
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            // Check if the browser supports backdrop-filter
            const div = document.createElement('div');
            div.style.backdropFilter = 'blur(1px)';
            const supportsBackdropFilter = div.style.backdropFilter === 'blur(1px)';
            
            if (supportsBackdropFilter) {
                canvas.style.filter = 'contrast(1.05) brightness(1.05)';
            }
        }
    }
    
    // Call visual effects setup
    addVisualEffects();
    
    // Add debug button functionality
    const debugButton = document.getElementById('debug-button');
    if (debugButton) {
        debugButton.addEventListener('click', () => {
            console.log('Debug button clicked, resetting data');
            if (window.resetMockAPI) {
                window.resetMockAPI();
            }
        });
    }
}); 