// =============================================
// AMAZEING - Constants
// =============================================

export const GRID_SIZES = [6, 8, 10, 12];

export const THEMES = {
    'star-sky': {
        id: 'star-sky',
        name: 'Star Sky',
        emojis: ['🌟'],
        background: 'star-sky'
    },
    'galaxy': {
        id: 'galaxy',
        name: 'Galaxy',
        emojis: ['🌌', '🌀', '💫'],
        background: 'galaxy'
    },
    'ship': {
        id: 'ship',
        name: 'Ship',
        emojis: ['🚢', '🌊'],
        background: 'ship'
    },
    'rocket': {
        id: 'rocket',
        name: 'Rocket',
        emojis: ['🚀', '🔥'],
        background: 'rocket'
    },
    'heart': {
        id: 'heart',
        name: 'Heart',
        emojis: ['❤️', '💕'],
        background: 'heart'
    },
    'neon-city': {
        id: 'neon-city',
        name: 'Neon City',
        emojis: ['🔵', '🟣', '🟡'],
        background: 'neon-city'
    }
};

export const DIRECTIONS = {
    UP: { row: -1, col: 0 },
    DOWN: { row: 1, col: 0 },
    LEFT: { row: 0, col: -1 },
    RIGHT: { row: 0, col: 1 }
};

export const GAME_STATES = {
    IDLE: 'idle',
    DRAWING: 'drawing',
    PAUSED: 'paused',
    COMPLETED: 'completed'
};

export const STORAGE_KEYS = {
    PROGRESS: 'amazeing_progress',
    SETTINGS: 'amazeing_settings',
    DAILY_COMPLETED: 'amazeing_daily',
    CURRENT_LEVEL: 'amazeing_current_level'
};

export const DIFFICULTY_NAMES = {
    6: 'Easy',
    8: 'Medium',
    10: 'Hard',
    12: 'Expert'
};
