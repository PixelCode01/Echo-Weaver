// Game settings
console.log('=== SETTINGS.JS LOADING ===');
window.scriptLoadOrder = window.scriptLoadOrder || [];
window.scriptLoadOrder.push('settings.js');
console.log('Script load order so far:', window.scriptLoadOrder);

const SETTINGS = {
    // Canvas dimensions
    WIDTH: window.innerWidth,
    HEIGHT: window.innerHeight,
    
    // Game speed
    FPS: 60,
    
    // Colors
    BLACK: '#0a0a12',
    WHITE: '#ffffff',
    PRIMARY_COLOR: '#00ffff',
    SECONDARY_COLOR: '#ff00ff',
    ACCENT_COLOR: '#ff55aa',
    YELLOW: '#ffff00',
    
    // Core settings
    CORE_RADIUS: 20,
    CORE_COLOR: '#00ffff',
    CORE_INNER_COLOR: '#ffffff',
    CORE_GLOW_COLOR: 'rgba(0, 255, 255, 0.5)',
    CORE_PULSE_SPEED: 0.02,
    
    // Enemy settings
    ENEMY_RADIUS: 15,
    ENEMY_SPEED: 1.5,
    ENEMY_COLOR: '#ff0055',
    ENEMY_MAX_SPEED: 3.5,
    ENEMY_SPAWN_RATE: 60,
    SPAWN_RATE_DECREMENT: 5,
    ENEMIES_PER_WAVE_BASE: 5,
    ENEMIES_PER_WAVE_INCREMENT: 2,
    SPECIAL_ENEMY_CHANCE: 0.3,
    
    // Speed limiting settings (new)
    SPEED_LIMIT_100: 1.5,  // Max 1.5x speed till score 100
    SPEED_LIMIT_200: 2.0,  // Max 2.0x speed till score 200
    SPEED_LIMIT_AFTER_200: 3.5,  // Max speed after score 200
    
    // Mobile touch cooldown settings (new)
    MOBILE_TOUCH_COOLDOWN_BASE: 50,   // Base cooldown in ms (very low for responsiveness)
    MOBILE_TOUCH_COOLDOWN_MAX: 200,   // Maximum cooldown in ms (low to keep game playable)
    MOBILE_TOUCH_COOLDOWN_SCORE_FACTOR: 0.1,  // How much score affects cooldown (very low for better balance)
    
    // Boss enemy settings
    BOSS_ENEMY_RADIUS: 40,
    BOSS_ENEMY_HEALTH: 20,
    BOSS_ENEMY_COLOR: '#ff0055',
    BOSS_ENEMY_SCORE: 10,
    BOSS_ATTACK_INTERVAL: 120,
    BOSS_WAVE_INTERVAL: 5, // Boss appears every X waves
    
    // Wave settings
    WAVE_SPEED: 8,
    WAVE_MAX_RADIUS: 500,
    WAVE_COLOR: '#00ffff',
    WAVE_WIDTH: 3,
    
    // Wave modes
    WAVE_MODE_NORMAL: {
        damage_multiplier: 1,
        width_multiplier: 1
    },
    WAVE_MODE_FOCUSED: {
        damage_multiplier: 2,
        width_multiplier: 0.5
    },
    WAVE_MODE_WIDE: {
        damage_multiplier: 0.7,
        width_multiplier: 2
    },
    
    // Powerup settings
    POWERUP_RADIUS: 15,
    POWERUP_SPAWN_CHANCE: 0.2,
    
    // Powerup durations (in frames)
    POWERUP_DURATION_INVINCIBILITY: 300,
    POWERUP_DURATION_WAVE_BOOST: 300,
    POWERUP_DURATION_SLOW_TIME: 300,
    POWERUP_DURATION_WAVE_WIDTH: 300,
    POWERUP_DURATION_TIME_STOP: 180,
    POWERUP_DURATION_WAVE_MAGNET: 300,
    POWERUP_DURATION_CHAIN_REACTION: 300,
    POWERUP_DURATION_MULTI_WAVE: 1, // Instant effect
    
    // Powerup colors
    POWERUP_COLOR_INVINCIBILITY: '#ffff00',
    POWERUP_COLOR_WAVE_BOOST: '#00ff00',
    POWERUP_COLOR_SLOW_TIME: '#0000ff',
    POWERUP_COLOR_CLEAR_SCREEN: '#ff0000',
    POWERUP_COLOR_WAVE_WIDTH: '#00ffff',
    POWERUP_COLOR_TIME_STOP: '#9900ff',
    POWERUP_COLOR_WAVE_MAGNET: '#ff9900',
    POWERUP_COLOR_CHAIN_REACTION: '#ff00ff',
    POWERUP_COLOR_MULTI_WAVE: '#ffffff',
    
    // Powerup messages
    POWERUP_MESSAGES: {
        'invincibility': 'Invincibility!',
        'wave_boost': 'Wave Boost!',
        'slow_time': 'Slow Time!',
        'clear_screen': 'Screen Clear!',
        'wave_width': 'Wide Waves!',
        'time_stop': 'Time Stop!',
        'wave_magnet': 'Wave Magnet!',
        'chain_reaction': 'Chain Reaction!',
        'multi_wave': 'Multi Wave!'
    },
    
    // Echo Burst
    ECHO_BURST_COOLDOWN: 300,
    ECHO_BURST_RADIUS: 150,
    ECHO_BURST_DAMAGE: 3,
    ECHO_BURST_COLOR: '#00ffff',
    
    // Combo system
    COMBO_DECAY_TIME: 90,
    COMBO_BONUS_MULTIPLIER: 0.1,
    COMBO_MESSAGES: {
        5: 'Nice!',
        10: 'Great!',
        15: 'Awesome!',
        20: 'Amazing!',
        30: 'Incredible!',
        50: 'Unstoppable!',
        100: 'GODLIKE!'
    },
    COMBO_FEVER_BOOST: 2,
    
    // Critical hits
    CRITICAL_HIT_CHANCE: 0.1,
    CRITICAL_HIT_MULTIPLIER: 2,
    
    // Fever mode
    FEVER_MODE_MAX_CHARGE: 100,
    FEVER_MODE_CHARGE_PER_HIT: 5,
    FEVER_MODE_DURATION: 300,
    FEVER_MODE_PLAYER_WAVE_DAMAGE_MULTIPLIER: 2,
    
    // Achievement messages
    ACHIEVEMENT_MESSAGES: {
        boss_slayer: 'Achievement: Boss Slayer!',
        combo_master: 'Achievement: Combo Master!',
        wave_master: 'Achievement: Wave Master!',
        survivor: 'Achievement: Survivor!'
    },

    // Grid settings
    GRID_SIZE: 50,

    // Background particle settings
    BG_PARTICLE_COUNT: 50,
    BG_PARTICLE_COLOR: '#1a2e4a',
    BG_PARTICLE_SIZE_MIN: 1,
    BG_PARTICLE_SIZE_MAX: 3,
    BG_PARTICLE_SPEED_MIN: 0.2,
    BG_PARTICLE_SPEED_MAX: 0.8,
    
    // Enemy trail settings
    ENEMY_TRAIL_DECAY: 0.95,
    
    // Impact effect settings
    IMPACT_EFFECT_DURATION: 20,
    IMPACT_EFFECT_SIZE: 30,
    
    // Damage number settings
    DAMAGE_NUMBER_SPEED: 1,
    DAMAGE_NUMBER_DURATION: 60,
    DAMAGE_NUMBER_CRITICAL_SCALE: 1.5,

    // Enemy colors
    ENEMY_COLORS: {
        'Enemy': '#ff0055',
        'ZigzagEnemy': '#00c800',
        'GhostEnemy': '#9696ff',
        'ChargerEnemy': '#ff6400',
        'SplitterEnemy': '#ff00ff',
        'ShieldedEnemy': '#64c8ff',
        'TeleporterEnemy': '#8A2BE2',
        'ReflectorEnemy': '#FFD700',
        'SwarmEnemy': '#FF4500',
        'TimeBomberEnemy': '#FF0000',
        'VortexEnemy': '#4B0082',
        'SpeedsterEnemy': '#FF1493',
        'SlowTankEnemy': '#8B4513'
    },
    
    // Special enemy settings
    GHOST_ENEMY_HITS_REQUIRED: 2,
    CHARGER_ENEMY_CHARGE_SPEED_MULTIPLIER: 4,
    CHARGER_ENEMY_CHARGE_DISTANCE: 120,
    SPLITTER_ENEMY_COUNT: 2,
    SPLITTER_ENEMY_RADIUS_MULTIPLIER: 0.7,
    SHIELDED_ENEMY_SHIELD_HEALTH: 3,
    SHIELDED_ENEMY_SHIELD_COLOR: '#c8c8c8',
};

// Adjust settings based on device
function adjustSettingsForDevice() {
    // Detect if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Adjust settings for mobile
        SETTINGS.CORE_RADIUS = Math.min(15, SETTINGS.CORE_RADIUS);
        SETTINGS.ENEMY_RADIUS = Math.min(12, SETTINGS.ENEMY_RADIUS);
        SETTINGS.BOSS_ENEMY_RADIUS = Math.min(30, SETTINGS.BOSS_ENEMY_RADIUS);
        SETTINGS.POWERUP_RADIUS = Math.min(12, SETTINGS.POWERUP_RADIUS);
        
        // Make echo burst more mobile-friendly
        SETTINGS.ECHO_BURST_COOLDOWN = 240; // Slightly faster cooldown
    }
}

// Call the adjustment function
adjustSettingsForDevice();

// Freeze the settings object to prevent modifications
Object.freeze(SETTINGS); 