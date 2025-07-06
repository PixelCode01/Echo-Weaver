// Echo Weaver Score Manipulator
// Copy and paste these commands into your browser console to test different score levels

// Set score to a specific value
function setScore(value) {
    if (window.game && window.game.state === 'playing') {
        window.game.score = value;
        document.getElementById('score').textContent = value;
        console.log(`Score set to: ${value}`);
    } else {
        console.log('Game is not running. Start the game first.');
    }
}

// Add points to current score
function addScore(points) {
    if (window.game && window.game.state === 'playing') {
        window.game.score += points;
        document.getElementById('score').textContent = window.game.score;
        console.log(`Added ${points} points. New score: ${window.game.score}`);
    } else {
        console.log('Game is not running. Start the game first.');
    }
}

// Quick score presets for testing different difficulty levels
function testScore5() {
    setScore(5);
    console.log('Testing score 5 - Basic enemies should appear');
}

function testScore15() {
    setScore(15);
    console.log('Testing score 15 - Zigzag enemies should appear');
}

function testScore30() {
    setScore(30);
    console.log('Testing score 30 - Ghost enemies should appear');
}

function testScore60() {
    setScore(60);
    console.log('Testing score 60 - Charger enemies should appear');
}

function testScore120() {
    setScore(120);
    console.log('Testing score 120 - Splitter enemies should appear');
}

function testScore180() {
    setScore(180);
    console.log('Testing score 180 - Shielded enemies should appear');
}

function testScore250() {
    setScore(250);
    console.log('Testing score 250 - Teleporter enemies should appear');
}

function testScore350() {
    setScore(350);
    console.log('Testing score 350 - Reflector enemies should appear');
}

function testScore440() {
    setScore(440);
    console.log('Testing score 440 - Swarm enemies should appear');
}

function testScore540() {
    setScore(540);
    console.log('Testing score 540 - TimeBomber enemies should appear');
}

function testScore650() {
    setScore(650);
    console.log('Testing score 650 - Vortex enemies should appear');
}

function testScore780() {
    setScore(780);
    console.log('Testing score 780 - Speedster enemies should appear');
}

function testScore920() {
    setScore(920);
    console.log('Testing score 920 - SlowTank enemies should appear');
}

function testScore1000() {
    setScore(1000);
    console.log('Testing score 1000 - Boss enemies should appear');
}

function testScore1500() {
    setScore(1500);
    console.log('Testing score 1500 - Maximum difficulty with bosses');
}

// Get current game info
function getGameInfo() {
    if (window.game) {
        console.log('Game Info:');
        console.log(`- Score: ${window.game.score}`);
        console.log(`- Wave: ${window.game.waveManager.currentWave}`);
        console.log(`- Enemies on screen: ${window.game.enemies.length}`);
        console.log(`- Game state: ${window.game.state}`);
        console.log(`- Enemy speed: ${window.game.waveManager.enemySpeed}`);
    } else {
        console.log('Game not found. Make sure the game is loaded.');
    }
}

// Clear all enemies (useful for testing)
function clearEnemies() {
    if (window.game && window.game.state === 'playing') {
        window.game.enemies = [];
        console.log('All enemies cleared');
    } else {
        console.log('Game is not running. Start the game first.');
    }
}

// Spawn specific enemy types for testing
function spawnEnemy(type) {
    if (window.game && window.game.state === 'playing') {
        let enemy;
        switch(type.toLowerCase()) {
            case 'basic':
                enemy = new Enemy();
                break;
            case 'zigzag':
                enemy = new ZigzagEnemy();
                break;
            case 'ghost':
                enemy = new GhostEnemy();
                break;
            case 'charger':
                enemy = new ChargerEnemy();
                break;
            case 'splitter':
                enemy = new SplitterEnemy();
                break;
            case 'shielded':
                enemy = new ShieldedEnemy();
                break;
            case 'teleporter':
                enemy = new TeleporterEnemy();
                break;
            case 'reflector':
                enemy = new ReflectorEnemy();
                break;
            case 'swarm':
                enemy = new SwarmEnemy();
                break;
            case 'timebomber':
                enemy = new TimeBomberEnemy();
                break;
            case 'vortex':
                enemy = new VortexEnemy();
                break;
            case 'speedster':
                enemy = new SpeedsterEnemy();
                break;
            case 'slowtank':
                enemy = new SlowTankEnemy();
                break;
            case 'boss':
                enemy = new BossEnemy();
                break;
            default:
                console.log('Unknown enemy type. Use: basic, zigzag, ghost, charger, splitter, shielded, teleporter, reflector, swarm, timebomber, vortex, speedster, slowtank, boss');
                return;
        }
        window.game.enemies.push(enemy);
        console.log(`Spawned ${type} enemy`);
    } else {
        console.log('Game is not running. Start the game first.');
    }
}

// Show available commands
function showHelp() {
    console.log('=== Echo Weaver Score Manipulator ===');
    console.log('Available commands:');
    console.log('- setScore(value) - Set score to specific value');
    console.log('- addScore(points) - Add points to current score');
    console.log('- testScore5() - Test score 5');
    console.log('- testScore15() - Test score 15');
    console.log('- testScore30() - Test score 30');
    console.log('- testScore60() - Test score 60');
    console.log('- testScore120() - Test score 120');
    console.log('- testScore180() - Test score 180');
    console.log('- testScore250() - Test score 250');
    console.log('- testScore350() - Test score 350');
    console.log('- testScore440() - Test score 440');
    console.log('- testScore540() - Test score 540');
    console.log('- testScore650() - Test score 650');
    console.log('- testScore780() - Test score 780');
    console.log('- testScore920() - Test score 920');
    console.log('- testScore1000() - Test score 1000');
    console.log('- testScore1500() - Test score 1500');
    console.log('- getGameInfo() - Show current game info');
    console.log('- clearEnemies() - Remove all enemies');
    console.log('- spawnEnemy(type) - Spawn specific enemy type');
    console.log('- showHelp() - Show this help message');
    console.log('');
    console.log('Example: setScore(150) to test splitter enemies');
}

// Auto-show help when loaded
showHelp(); 