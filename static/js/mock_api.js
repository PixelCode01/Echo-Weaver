// Mock API implementation for player name and highscores

class MockAPI {
    constructor() {
        // Initialize local storage if needed
        if (!localStorage.getItem('highscores')) {
            // Add some default high scores for testing
            const defaultHighscores = [
                { name: 'Champion', score: 10000 },
                { name: 'Pro', score: 8500 },
                { name: 'Expert', score: 7200 },
                { name: 'Master', score: 6000 },
                { name: 'Novice', score: 3500 }
            ];
            localStorage.setItem('highscores', JSON.stringify(defaultHighscores));
        }
        
        if (!localStorage.getItem('player_name')) {
            localStorage.setItem('player_name', '');
        }
        
        // Validate highscores format
        try {
            const highscores = JSON.parse(localStorage.getItem('highscores'));
            if (!Array.isArray(highscores)) {
                throw new Error('Highscores is not an array');
            }
            
            // Ensure each entry has name and score
            const validHighscores = highscores.filter(entry => 
                entry && typeof entry === 'object' && 
                'name' in entry && 'score' in entry &&
                typeof entry.name === 'string' && 
                typeof entry.score === 'number'
            );
            
            if (validHighscores.length !== highscores.length) {
                console.warn('Some highscores were invalid, fixing...');
                localStorage.setItem('highscores', JSON.stringify(validHighscores));
            }
        } catch (e) {
            console.error('Error validating highscores:', e);
            // Reset to default if there's an error
            const defaultHighscores = [
                { name: 'Champion', score: 10000 },
                { name: 'Pro', score: 8500 },
                { name: 'Expert', score: 7200 },
                { name: 'Master', score: 6000 },
                { name: 'Novice', score: 3500 }
            ];
            localStorage.setItem('highscores', JSON.stringify(defaultHighscores));
        }
        
        console.log('Mock API initialized');
        console.log('Current player name:', localStorage.getItem('player_name'));
        console.log('Current highscores:', localStorage.getItem('highscores'));
    }
    
    // Get player name
    async getPlayer() {
        const playerName = localStorage.getItem('player_name') || '';
        console.log('Getting player name:', playerName);
        return { name: playerName };
    }
    
    // Save player name
    async savePlayer(name) {
        console.log('Saving player name:', name);
        localStorage.setItem('player_name', name);
        return { success: true };
    }
    
    // Get highscores
    async getHighscores() {
        try {
            const highscoresStr = localStorage.getItem('highscores') || '[]';
            console.log('Raw highscores string:', highscoresStr);
            
            const highscores = JSON.parse(highscoresStr);
            
            // Ensure highscores is an array
            if (!Array.isArray(highscores)) {
                console.error('Highscores is not an array, resetting');
                const defaultHighscores = [
                    { name: 'Champion', score: 10000 },
                    { name: 'Pro', score: 8500 },
                    { name: 'Expert', score: 7200 },
                    { name: 'Master', score: 6000 },
                    { name: 'Novice', score: 3500 }
                ];
                localStorage.setItem('highscores', JSON.stringify(defaultHighscores));
                return defaultHighscores;
            }
            
            // Validate each entry
            const validHighscores = highscores.filter(entry => 
                entry && typeof entry === 'object' && 
                'name' in entry && 'score' in entry &&
                typeof entry.name === 'string' && 
                typeof entry.score === 'number'
            );
            
            if (validHighscores.length !== highscores.length) {
                console.warn('Some highscores were invalid, fixing...');
                localStorage.setItem('highscores', JSON.stringify(validHighscores));
                return validHighscores;
            }
            
            console.log('Getting highscores:', highscores);
            return highscores;
        } catch (e) {
            console.error('Error parsing highscores:', e);
            const defaultHighscores = [
                { name: 'Champion', score: 10000 },
                { name: 'Pro', score: 8500 },
                { name: 'Expert', score: 7200 },
                { name: 'Master', score: 6000 },
                { name: 'Novice', score: 3500 }
            ];
            localStorage.setItem('highscores', JSON.stringify(defaultHighscores));
            return defaultHighscores;
        }
    }
    
    // Save highscore
    async saveHighscore(name, score) {
        console.log('Saving highscore:', name, score);
        
        try {
            let highscores = JSON.parse(localStorage.getItem('highscores') || '[]');
            
            // Ensure highscores is an array
            if (!Array.isArray(highscores)) {
                console.warn('Highscores was not an array, resetting');
                highscores = [];
            }
            
            // Check if player already has a score
            let playerExists = false;
            for (let i = 0; i < highscores.length; i++) {
                if (highscores[i] && highscores[i].name === name) {
                    playerExists = true;
                    // Update score if new score is higher
                    if (score > highscores[i].score) {
                        highscores[i].score = score;
                    }
                    break;
                }
            }
            
            // Add new player if not found
            if (!playerExists) {
                highscores.push({ name, score });
            }
            
            // Sort and keep top 10
            highscores.sort((a, b) => b.score - a.score);
            highscores = highscores.slice(0, 10);
            
            localStorage.setItem('highscores', JSON.stringify(highscores));
            return { success: true };
        } catch (e) {
            console.error('Error saving highscore:', e);
            return { success: false, error: e.message };
        }
    }
    
    // Mock fetch API for compatibility with existing code
    mockFetch(url, options = {}) {
        return new Promise(async (resolve) => {
            console.log('Mock fetch:', url, options);
            
            // Simulate network delay
            await new Promise(r => setTimeout(r, 100));
            
            let responseData = {};
            
            // Handle different API endpoints
            if (url === '/api/player') {
                if (options && options.method === 'POST' && options.body) {
                    try {
                        const data = JSON.parse(options.body);
                        await this.savePlayer(data.name);
                        responseData = { success: true };
                    } catch (e) {
                        console.error('Error processing player data:', e);
                        responseData = { success: false, error: e.message };
                    }
                } else {
                    responseData = await this.getPlayer();
                }
            } else if (url === '/api/highscores') {
                if (options && options.method === 'POST' && options.body) {
                    try {
                        const data = JSON.parse(options.body);
                        await this.saveHighscore(data.name, data.score);
                        responseData = { success: true };
                    } catch (e) {
                        console.error('Error processing highscore data:', e);
                        responseData = { success: false, error: e.message };
                    }
                } else {
                    responseData = await this.getHighscores();
                }
            }
            
            // Create mock response
            resolve({
                ok: true,
                json: () => Promise.resolve(responseData)
            });
        });
    }
    
    // Install mock API
    install() {
        const originalFetch = window.fetch;
        
        // Override fetch for API calls
        window.fetch = (url, options = {}) => {
            if (url.startsWith('/api/')) {
                return this.mockFetch(url, options);
            }
            
            // Use original fetch for other requests
            return originalFetch(url, options);
        };
        
        console.log('Mock API installed');
    }
    
    // Reset mock API (for testing)
    reset() {
        localStorage.removeItem('player_name');
        localStorage.removeItem('highscores');
        console.log('Mock API reset');
        
        // Reinitialize
        if (!localStorage.getItem('highscores')) {
            // Add some default high scores for testing
            const defaultHighscores = [
                { name: 'Champion', score: 10000 },
                { name: 'Pro', score: 8500 },
                { name: 'Expert', score: 7200 },
                { name: 'Master', score: 6000 },
                { name: 'Novice', score: 3500 }
            ];
            localStorage.setItem('highscores', JSON.stringify(defaultHighscores));
        }
        
        if (!localStorage.getItem('player_name')) {
            localStorage.setItem('player_name', '');
        }
    }
}

// Create and install the mock API
const mockAPI = new MockAPI();
mockAPI.install();

// Add a global function to reset the mock API (for debugging)
window.resetMockAPI = function() {
    mockAPI.reset();
    location.reload();
}; 