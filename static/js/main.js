document.addEventListener('DOMContentLoaded', () => {
    const DEBUG = false;
    const debugLog = (...args) => {
        if (DEBUG) {
            console.log(...args);
        }
    };
    const TUTORIAL_STORAGE_KEY = 'echoWeaverTutorialSeen';

    debugLog('DOM content loaded');
    debugLog('=== SCRIPT LOADING CHECK ===');
    debugLog('Document ready state:', document.readyState);
    debugLog('UniversalControls in window:', !!window.UniversalControls);
    debugLog('UniversalControls type:', typeof window.UniversalControls);
    debugLog('All window properties containing "Control":', Object.keys(window).filter(key => key.includes('Control')));
    debugLog('All window properties containing "Universal":', Object.keys(window).filter(key => key.includes('Universal')));
    debugLog('SETTINGS available:', typeof SETTINGS);
    debugLog('Game class available:', typeof Game);
    debugLog('Script loading order check - all scripts loaded');
    debugLog('Complete script load order:', window.scriptLoadOrder);
    debugLog('=== COMPREHENSIVE UNIVERSAL CONTROLS DIAGNOSTIC ===');
    debugLog('1. UniversalControls in window:', !!window.UniversalControls);
    debugLog('2. UniversalControls type:', typeof window.UniversalControls);
    debugLog('3. UniversalControls constructor:', window.UniversalControls);
    debugLog('4. All window properties:', Object.keys(window).filter(key => key.includes('Control') || key.includes('Universal')));
    debugLog('5. Script load order:', window.scriptLoadOrder);
    debugLog('6. Document ready state:', document.readyState);
    debugLog('7. SETTINGS loaded:', typeof SETTINGS);
    debugLog('8. Game class loaded:', typeof Game);
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    
    if (isMobile) {
        debugLog('Mobile device detected, using touch controls');
        document.querySelector('.desktop-instructions').style.display = 'none';
        document.querySelector('.mobile-instructions').style.display = 'block';
    } else {
        debugLog('Desktop device detected, using keyboard controls');
        document.querySelector('.desktop-instructions').style.display = 'block';
        document.querySelector('.mobile-instructions').style.display = 'none';
    }
    
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
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    SETTINGS.WIDTH = canvas.width;
    SETTINGS.HEIGHT = canvas.height;
    
    const soundConfig = {
        wave_create: '/static/assets/sounds/create_wave.wav',
        enemy_hit: '/static/assets/sounds/enemy_hit.wav',
        game_over: '/static/assets/sounds/game_over.wav',
        powerup_collect: '/static/assets/sounds/powerup_collect.wav',
        echo_burst: '/static/assets/sounds/echo_burst.wav',
        boss_spawn: '/static/assets/sounds/enemy_hit.wav',
        multi_wave: '/static/assets/sounds/create_wave.wav'
    };

    const sounds = Object.entries(soundConfig).reduce((acc, [name, path]) => {
        const audio = new Audio(path);
        audio.preload = 'auto';
        acc[name] = audio;
        return acc;
    }, {});

    const DEFAULT_SOUND = 'wave_create';
    
    function playSound(soundName) {
        const sound = sounds[soundName] || sounds[DEFAULT_SOUND];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => {
                debugLog(`Error playing sound ${soundName}:`, error);
            });
        } else {
            console.warn(`No audio resource available for sound ${soundName}`);
        }
    }
    
    let game = new Game(canvas);
    game._playSound = playSound;
    
    window.game = game;
    
    let playerName = '';
    let gamePaused = false;
    
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
    
    const savedPlayerName = getCookie('playerName');
    if (savedPlayerName) {
        playerName = savedPlayerName;
        const playerNameInput = document.getElementById('player-name');
        if (playerNameInput) {
            playerNameInput.value = playerName;
        }
    debugLog('Loaded player name from cookie:', playerName);
    }
    
    fetch('/api/highscores')
        .then(response => response.json())
        .then(highscores => {
            debugLog('Initial highscores:', highscores);
            
            if (highscores && highscores.length > 0) {
                const highscoreElement = document.getElementById('highscore');
                if (highscoreElement) {
                    highscoreElement.textContent = highscores[0].score;
                }
            }
            
            updateLeaderboard(highscores);
        })
        .catch(error => console.error('Error loading high scores:', error));
    
    let lastTime = 0;
    let accumulator = 0;
    const timeStep = 1000 / SETTINGS.FPS;
    
    function gameLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        const maxDeltaTime = 100;
        const clampedDeltaTime = Math.min(deltaTime, maxDeltaTime);
        
        if (!gamePaused) {
            accumulator += clampedDeltaTime;
            while (accumulator >= timeStep) {
                game.update();
                accumulator -= timeStep;
            }
        }
        
        game.draw(ctx);
        
        requestAnimationFrame(gameLoop);
    }
    
    startButton.addEventListener('click', function() {
        debugLog('Start button clicked');
        
        if (playerNameInput && playerNameInput.value.trim() !== '') {
            playerName = playerNameInput.value.trim();
            debugLog('Setting player name to:', playerName);
            
            setCookie('playerName', playerName, 30);
            
            fetch('/api/player', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: playerName })
            })
            .then(response => response.json())
            .then(data => {
                debugLog('Player name saved successfully');
            })
            .catch(error => {
                console.error('Error saving player name:', error);
            });
        }
        
        if (startScreen) startScreen.classList.add('hidden');
        if (gameScreen) gameScreen.classList.remove('hidden');
        
        gamePaused = true;
        game.start();

        const startGameplay = () => {
            if (lastTime === 0) {
                requestAnimationFrame(gameLoop);
            }
            gamePaused = false;
        };

        let tutorialSeen = false;
        try {
            tutorialSeen = localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
        } catch (storageError) {
            debugLog('Unable to read tutorial completion flag:', storageError);
        }
        if (!tutorialSeen) {
            showTutorial(() => {
                try {
                    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
                } catch (storageError) {
                    debugLog('Unable to persist tutorial completion flag:', storageError);
                }
                game.messageDisplay.addMessage(
                    'Welcome to Echo Weaver!',
                    { x: SETTINGS.WIDTH / 2, y: SETTINGS.HEIGHT / 2 },
                    SETTINGS.PRIMARY_COLOR,
                    36
                );
                startGameplay();
            });
        } else {
            startGameplay();
        }
    });
    
    restartButton.addEventListener('click', () => {
        debugLog('Restart button clicked');
        
        game.reset();
        
        gameOverScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        gamePaused = false;
    });
    
    submitScoreButton.addEventListener('click', () => {
        debugLog('Submit score button clicked');
        
        let name = playerName;
        
        if (!name || name.trim() === '') {
            name = 'Anonymous';
            
            if (name !== 'Anonymous') {
                playerName = name;
                
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
                    debugLog('Player name saved successfully');
                })
                .catch(error => {
                    console.error('Error saving player name:', error);
                });
            }
        }
        
        game.saveHighScore(name);
        
        submitScoreButton.disabled = true;
        submitScoreButton.textContent = 'Score Submitted!';
        
        fetch('/api/highscores')
            .then(response => response.json())
            .then(highscores => {
                debugLog('Received highscores after submit:', highscores);
                updateLeaderboard(highscores);
            })
            .catch(error => console.error('Error updating leaderboard:', error));
    });
    
    function updateLeaderboard(highscores) {
    debugLog('Updating leaderboard with:', highscores);

        if (!Array.isArray(highscores)) {
            console.error('Highscores is not an array:', typeof highscores);
            highscores = [];
        }

        const leaderboardElements = document.querySelectorAll('#leaderboard-entries');
    debugLog('Number of leaderboard elements found in updateLeaderboard:', leaderboardElements.length);
        if (leaderboardElements.length > 1) {
            console.error('Multiple leaderboard elements found with the same ID!');
            for (let i = 1; i < leaderboardElements.length; i++) {
                leaderboardElements[i].parentNode.removeChild(leaderboardElements[i]);
            }
            debugLog('Removed duplicate leaderboard elements, keeping only the first one');
        }
        
        const leaderboardContainer = document.getElementById('leaderboard');
        if (leaderboardContainer) {
            const oldLeaderboardEntries = document.getElementById('leaderboard-entries');
            if (oldLeaderboardEntries) {
                oldLeaderboardEntries.parentNode.removeChild(oldLeaderboardEntries);
            }
            
            const newLeaderboardEntries = document.createElement('div');
            newLeaderboardEntries.id = 'leaderboard-entries';
            leaderboardContainer.appendChild(newLeaderboardEntries);
            
            const uniqueScores = {};
            highscores.forEach(entry => {
                if (!entry) return;
                
                const name = entry.name || 'Anonymous';
                const score = entry.score || 0;
                
                if (!uniqueScores[name] || score > uniqueScores[name]) {
                    uniqueScores[name] = score;
                }
            });
            
            const uniqueHighscores = Object.entries(uniqueScores).map(([name, score]) => ({
                name,
                score
            }));
            
            uniqueHighscores.sort((a, b) => b.score - a.score);
            
            debugLog('Current player for highlighting:', playerName);
            
            uniqueHighscores.forEach((entry, index) => {
                const entryElement = document.createElement('div');
                entryElement.className = 'leaderboard-entry';
                if (entry.name === playerName) {
                    entryElement.classList.add('current-player');
                }
                
                entryElement.innerHTML = `${index + 1}. ${entry.name}<span>${entry.score}</span>`;
                newLeaderboardEntries.appendChild(entryElement);
            });
            
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
    
    game.autoSubmitScore = function() {
    debugLog('Auto-submit score called, player name:', playerName);
        
        if (playerName && playerName.trim() !== '') {
            this.saveHighScore(playerName);
            
            if (submitScoreButton) {
                submitScoreButton.disabled = true;
                submitScoreButton.textContent = 'Score Submitted!';
            }
            
            fetch('/api/highscores')
                .then(response => response.json())
                .then(highscores => {
                    debugLog('Received highscores after auto-submit:', highscores);
                    updateLeaderboard(highscores);
                })
                .catch(error => console.error('Error updating leaderboard:', error));
            
            return true;
        }
        return false;
    };
    
    canvas.addEventListener('mousedown', (event) => {
        debugLog('=== MOUSE DOWN EVENT ===');
        debugLog('Game paused:', gamePaused);
        debugLog('Universal controls exist:', !!window.universalControls);
        
        if (!gamePaused) {
            if (window.universalControls && !window.universalControls.canInteractNow()) {
                debugLog('Mouse click blocked by universal controls cooldown');
                return;
            }
            
            debugLog('Mouse click allowed, processing...');
            game.handleEvent(event);
            
            if (window.universalControls) {
                window.universalControls.recordInteraction();
                debugLog('Interaction recorded for universal controls');
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
    
    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        debugLog('=== TOUCH START EVENT ===');
        debugLog('Game paused:', gamePaused);
        debugLog('Universal controls exist:', !!window.universalControls);
        
        if (!gamePaused) {
            if (window.universalControls && !window.universalControls.canInteractNow()) {
                debugLog('Touch blocked by universal controls cooldown');
                return;
            }
            
            debugLog('Touch allowed, processing...');
            
            const touch = event.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            game.handleEvent(mouseEvent);
            
            if (window.universalControls) {
                window.universalControls.recordInteraction();
                debugLog('Interaction recorded for universal controls');
            }
            
            if (game.lastTapTime && (Date.now() - game.lastTapTime) < 300) {
                game.tapCount = (game.tapCount || 0) + 1;
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
    
    document.addEventListener('touchstart', (event) => {
        if (event.target.closest('#game-canvas') || event.target.closest('#mobile-controls')) {
            event.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', (event) => {
        if (event.target.closest('#game-canvas') || event.target.closest('#mobile-controls')) {
            event.preventDefault();
        }
    }, { passive: false });
    
    window.addEventListener('resize', () => {
        SETTINGS.WIDTH = window.innerWidth;
        SETTINGS.HEIGHT = window.innerHeight;
        
        canvas.width = SETTINGS.WIDTH;
        canvas.height = SETTINGS.HEIGHT;
        
        if (game.core) {
            game.core.position = new Vector(SETTINGS.WIDTH / 2, SETTINGS.HEIGHT / 2);
        }
    });
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            debugLog('Game paused');
            gamePaused = true;
        } else {
            debugLog('Game resumed');
            lastTime = 0;
            
            const tutorialOverlay = document.getElementById('tutorial-overlay');
            if (tutorialOverlay && !tutorialOverlay.classList.contains('hidden')) {
                gamePaused = true;
            } else {
                gamePaused = false;
            }
        }
    });
    
    function showTutorial(onComplete = () => {}) {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        const tutorialOverlay = document.getElementById('tutorial-overlay');
        if (tutorialOverlay) {
            const tutorialContent = tutorialOverlay.querySelector('.tutorial-content');
            if (tutorialContent) {
                tutorialContent.innerHTML = '';
            } else {
                onComplete();
                return;
            }
            
            const tutorialStepsData = isMobile
                ? [
                    {
                        title: 'Draw Sound Waves',
                        description: 'Touch and drag to sketch a line. Release to blast enemies with a sound wave that follows your stroke.',
                        media: {
                            src: '/static/images/tutorial-mobile-draw.svg',
                            alt: 'Finger drawing a sound wave on a phone screen'
                        }
                    },
                    {
                        title: 'Trigger Echo Burst',
                        description: 'Tap the Echo Burst button when it glows to clear enemies near the core and buy yourself time.',
                        media: {
                            src: '/static/images/tutorial-mobile-burst.svg',
                            alt: 'Echo Burst button activated on mobile HUD'
                        }
                    },
                    {
                        title: 'Swap Wave Modes',
                        description: 'Tap the wave icon or triple-tap the arena to rotate between Normal, Focused, and Wide waves for different strategies.',
                        media: {
                            src: '/static/images/tutorial-mobile-tap.svg',
                            alt: 'Player cycling wave modes with taps'
                        }
                    }
                ]
                : [
                    {
                        title: 'Draw Sound Waves',
                        description: 'Click and drag a path from the core. Release to unleash a wave that follows your line and slices through enemies.',
                        media: {
                            src: '/static/images/tutorial-desktop-draw.svg',
                            alt: 'Mouse drawing a wave path around the core'
                        }
                    },
                    {
                        title: 'Switch Wave Modes',
                        description: 'Press 1, 2, or 3 to swap between Normal, Focused, and Wide waves. Each mode changes damage, width, and reach.',
                        media: {
                            src: '/static/images/tutorial-desktop-keys.svg',
                            alt: 'Keyboard keys 1, 2, and 3 highlighted for wave modes'
                        }
                    },
                    {
                        title: 'Echo Burst & Pause',
                        description: 'Press SPACE to fire an Echo Burst that detonates nearby enemies. Need a breather? Press ESC or P to pause and plan.',
                        media: {
                            src: '/static/images/tutorial-desktop-space.svg',
                            alt: 'Space bar triggering an Echo Burst ability'
                        }
                    }
                ];

            const totalSteps = tutorialStepsData.length;

            tutorialContent.innerHTML = `
                <div class="tutorial-header">
                    <span class="tutorial-pill">${isMobile ? 'Touch Controls' : 'Keyboard & Mouse'}</span>
                    <h2>Quick Primer</h2>
                    <p class="tutorial-tagline">Master the basics in a few taps so you can dive straight into weaving echoes and keeping the core alive.</p>
                </div>
                <div class="tutorial-step-wrapper"></div>
                <div class="tutorial-progress">
                    <span class="tutorial-progress-label">Step <span class="tutorial-current-step">1</span> of ${totalSteps}</span>
                    <div class="tutorial-progress-bar">
                        <div class="tutorial-progress-bar-fill"></div>
                    </div>
                </div>
                <div class="tutorial-controls">
                    <button class="glow-button tutorial-next">Next</button>
                    <button class="tutorial-skip" type="button">Skip Tutorial</button>
                </div>
            `;

            const stepsContainer = tutorialContent.querySelector('.tutorial-step-wrapper');
            tutorialStepsData.forEach((step, index) => {
                const stepElement = document.createElement('article');
                stepElement.className = 'tutorial-step hidden';
                stepElement.dataset.step = (index + 1).toString();

                const stepCard = document.createElement('div');
                stepCard.className = 'tutorial-step-card';

                const visual = document.createElement('div');
                visual.className = 'tutorial-visual';
                const img = document.createElement('img');
                img.src = step.media.src;
                img.alt = step.media.alt;
                img.loading = 'lazy';
                visual.appendChild(img);

                const copy = document.createElement('div');
                copy.className = 'tutorial-copy';
                copy.innerHTML = `
                    <h3>${step.title}</h3>
                    <p>${step.description}</p>
                `;

                stepCard.appendChild(visual);
                stepCard.appendChild(copy);
                stepElement.appendChild(stepCard);
                stepsContainer.appendChild(stepElement);
            });

            tutorialOverlay.classList.remove('hidden');
            tutorialOverlay.setAttribute('tabindex', '-1');
            setTimeout(() => {
                if (typeof tutorialOverlay.focus === 'function') {
                    tutorialOverlay.focus({ preventScroll: true });
                }
            }, 0);

            const tutorialSteps = tutorialContent.querySelectorAll('.tutorial-step');
            const nextButton = tutorialContent.querySelector('.tutorial-next');
            const skipButton = tutorialContent.querySelector('.tutorial-skip');
            const progressCurrent = tutorialContent.querySelector('.tutorial-current-step');
            const progressBarFill = tutorialContent.querySelector('.tutorial-progress-bar-fill');
            if (!nextButton || tutorialSteps.length === 0) {
                tutorialOverlay.classList.add('hidden');
                onComplete();
                return;
            }
            let currentStep = 0;

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
                
                if (progressCurrent) {
                    progressCurrent.textContent = (stepIndex + 1).toString();
                }
                if (progressBarFill) {
                    const progressPercent = ((stepIndex + 1) / totalSteps) * 100;
                    progressBarFill.style.width = `${progressPercent}%`;
                }

                if (stepIndex === tutorialSteps.length - 1) {
                    nextButton.textContent = 'Start Playing!';
                } else {
                    nextButton.textContent = 'Next';
                }
            }
            
            showStep(currentStep);
            
            const handleNext = () => {
                currentStep++;
                if (currentStep < tutorialSteps.length) {
                    showStep(currentStep);
                } else {
                    tutorialOverlay.classList.add('hidden');
                    nextButton.removeEventListener('click', handleNext);
                    tutorialOverlay.removeEventListener('keydown', keyboardHandler);
                    tutorialOverlay.removeAttribute('tabindex');
                    onComplete();
                }
            };

            nextButton.addEventListener('click', handleNext);
            if (typeof nextButton.focus === 'function') {
                nextButton.focus();
            }
            if (skipButton) {
                skipButton.addEventListener('click', () => {
                    tutorialOverlay.classList.add('hidden');
                    nextButton.removeEventListener('click', handleNext);
                    tutorialOverlay.removeEventListener('keydown', keyboardHandler);
                    tutorialOverlay.removeAttribute('tabindex');
                    onComplete();
                }, { once: true });
            }

            const keyboardHandler = (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleNext();
                }
                if (event.key === 'Escape') {
                    event.preventDefault();
                    if (skipButton) {
                        skipButton.click();
                    } else {
                        tutorialOverlay.classList.add('hidden');
                        nextButton.removeEventListener('click', handleNext);
                        tutorialOverlay.removeEventListener('keydown', keyboardHandler);
                        tutorialOverlay.removeAttribute('tabindex');
                        onComplete();
                    }
                }
            };

            tutorialOverlay.addEventListener('keydown', keyboardHandler);
        } else {
            onComplete();
        }
    }
    
    debugLog("=== INITIALIZING UNIVERSAL CONTROLS ===");
    debugLog("Game state at initialization:", game.state);
    debugLog("Game score at initialization:", game.score);
    
    function initializeUniversalControls() {
        try {
            if (typeof window.UniversalControls === 'undefined') {
                console.error("UniversalControls class is not defined. Check if universal_controls.js is loaded properly.");
                debugLog("Available global classes:", Object.keys(window).filter(key => key.includes('Control')));
                return false;
            }
            
            const universalControls = new window.UniversalControls(game);
            window.universalControls = universalControls;
            debugLog("Universal controls initialized successfully:", universalControls);
            debugLog("Universal controls added to window:", !!window.universalControls);
            return true;
        } catch (error) {
            console.error("Failed to initialize universal controls:", error);
            console.error("Error stack:", error.stack);
            return false;
        }
    }
    
    function waitForUniversalControls() {
        if (typeof window.UniversalControls !== 'undefined') {
            debugLog("UniversalControls class found, initializing...");
            const success = initializeUniversalControls();
            if (success) {
                debugLog("Universal controls initialized successfully on first try");
            } else {
                console.error("Universal controls initialization failed");
            }
        } else {
            debugLog("UniversalControls class not yet available, retrying in 200ms...");
            setTimeout(waitForUniversalControls, 200);
        }
    }
    
    waitForUniversalControls();
    
    const originalGameUpdate = game.update;
    game.update = function() {
        originalGameUpdate.call(game);
        
        if (window.universalControls && game.state === 'playing') {
            window.universalControls.update();
            if (game.score % 120 === 0 && game.score > 0) {
                debugLog('=== UNIVERSAL CONTROLS UPDATE IN GAME LOOP ===');
                debugLog('Game state:', game.state);
                debugLog('Game score:', game.score);
                debugLog('Universal controls exist:', !!window.universalControls);
            }
        } else {
            if (game.score % 120 === 0 && game.score > 0) {
                debugLog('=== UNIVERSAL CONTROLS UPDATE SKIPPED ===');
                debugLog('Universal controls exist:', !!window.universalControls);
                debugLog('Game state:', game.state);
                debugLog('Game state is playing:', game.state === 'playing');
            }
        }
    };
    
    document.addEventListener('keydown', (e) => {
        if (game.state === 'playing') {
            if (e.key === '1') {
                game.currentWaveMode = 'normal';
                document.getElementById('current-mode').textContent = 'Normal';
                const modeDisplay = document.getElementById('wave-mode');
                modeDisplay.classList.add('mode-changed');
                setTimeout(() => {
                    modeDisplay.classList.remove('mode-changed');
                }, 500);
            } else if (e.key === '2') {
                game.currentWaveMode = 'focused';
                document.getElementById('current-mode').textContent = 'Focused';
                const modeDisplay = document.getElementById('wave-mode');
                modeDisplay.classList.add('mode-changed');
                setTimeout(() => {
                    modeDisplay.classList.remove('mode-changed');
                }, 500);
            } else if (e.key === '3') {
                game.currentWaveMode = 'wide';
                document.getElementById('current-mode').textContent = 'Wide';
                const modeDisplay = document.getElementById('wave-mode');
                modeDisplay.classList.add('mode-changed');
                setTimeout(() => {
                    modeDisplay.classList.remove('mode-changed');
                }, 500);
            }
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            if (game.state === 'playing') {
                gamePaused = !gamePaused;
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
    
    function addVisualEffects() {
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            const div = document.createElement('div');
            div.style.backdropFilter = 'blur(1px)';
            const supportsBackdropFilter = div.style.backdropFilter === 'blur(1px)';
            
            if (supportsBackdropFilter) {
                canvas.style.filter = 'contrast(1.05) brightness(1.05)';
            }
        }
    }
    
    addVisualEffects();
    
    const debugButton = document.getElementById('debug-button');
    if (debugButton) {
        debugButton.addEventListener('click', () => {
            debugLog('Debug button clicked, resetting data');
            if (window.resetMockAPI) {
                window.resetMockAPI();
            }
        });
    }
}); 