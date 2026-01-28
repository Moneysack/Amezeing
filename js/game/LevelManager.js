// =============================================
// AMAZEING - Level Manager
// =============================================

import { Storage } from '../utils/Storage.js';
import { STORAGE_KEYS } from '../utils/Constants.js';
import { dateHash, getTodayString } from '../utils/Helpers.js';

/**
 * LevelManager - Handles level loading, progression, and storage
 */
export class LevelManager {
    constructor() {
        this.packs = [];
        this.currentPackIndex = 0;
        this.currentLevelIndex = 0;
        this.progress = Storage.get(STORAGE_KEYS.PROGRESS, {});
        this.dailyStatus = Storage.get(STORAGE_KEYS.DAILY_COMPLETED, {});
    }

    /**
     * Load all level packs
     * @returns {Promise<Array>}
     */
    async loadPacks() {
        try {
            const packFiles = ['pack1.json', 'pack2.json', 'pack3.json', 'pack4.json'];

            this.packs = await Promise.all(
                packFiles.map(async (file) => {
                    try {
                        const response = await fetch(`data/levels/${file}`);
                        if (!response.ok) {
                            console.warn(`Failed to load ${file}`);
                            return null;
                        }
                        return response.json();
                    } catch (err) {
                        console.warn(`Error loading ${file}:`, err);
                        return null;
                    }
                })
            );

            // Filter out failed loads
            this.packs = this.packs.filter(p => p !== null);

            // If no packs loaded, use built-in sample levels
            if (this.packs.length === 0) {
                this.packs = this._getSamplePacks();
            }

            return this.packs;
        } catch (error) {
            console.error('Error loading level packs:', error);
            this.packs = this._getSamplePacks();
            return this.packs;
        }
    }

    /**
     * Get sample/built-in level packs
     * @returns {Array}
     */
    _getSamplePacks() {
        return [
            {
                packId: 'pack1',
                packName: 'Easy',
                gridSize: 6,
                levels: this._generateSampleLevels(6, 15)
            },
            {
                packId: 'pack2',
                packName: 'Medium',
                gridSize: 8,
                levels: this._generateSampleLevels(8, 15)
            },
            {
                packId: 'pack3',
                packName: 'Hard',
                gridSize: 10,
                levels: this._generateSampleLevels(10, 15)
            },
            {
                packId: 'pack4',
                packName: 'Expert',
                gridSize: 12,
                levels: this._generateSampleLevels(12, 15)
            }
        ];
    }

    /**
     * Generate sample levels for a given grid size
     * @param {number} size
     * @param {number} count
     * @returns {Array}
     */
    _generateSampleLevels(size, count) {
        const themes = ['star-sky', 'galaxy', 'ship', 'rocket', 'heart', 'neon-city'];
        const levels = [];

        for (let i = 0; i < count; i++) {
            const theme = themes[i % themes.length];
            const level = this._generateLevel(size, i + 1, theme);
            levels.push(level);
        }

        return levels;
    }

    /**
     * Generate a single sample level
     * @param {number} size - Grid size
     * @param {number} levelNum - Level number
     * @param {string} theme - Theme id
     * @returns {Object}
     */
    _generateLevel(size, levelNum, theme) {
        // Create a simple path that forms a pattern
        const points = [];
        const solution = [];
        const artwork = Array.from({ length: size }, () => Array(size).fill(''));

        // Generate a zigzag pattern
        let pointNum = 1;
        const numPoints = Math.min(4 + Math.floor(levelNum / 3), 8);

        // Create points around the edges
        const positions = [
            { row: 0, col: 0 },
            { row: 0, col: size - 1 },
            { row: size - 1, col: size - 1 },
            { row: size - 1, col: 0 },
            { row: 0, col: Math.floor(size / 2) },
            { row: Math.floor(size / 2), col: size - 1 },
            { row: size - 1, col: Math.floor(size / 2) },
            { row: Math.floor(size / 2), col: 0 }
        ];

        for (let i = 0; i < numPoints && i < positions.length; i++) {
            points.push({
                number: pointNum++,
                row: positions[i].row,
                col: positions[i].col
            });
        }

        // Generate solution paths between consecutive points
        for (let i = 0; i < points.length - 1; i++) {
            const from = points[i];
            const to = points[i + 1];
            const path = this._generatePath(from, to, size);

            solution.push({
                from: from.number,
                to: to.number,
                path: path
            });

            // Fill artwork
            const emojiMap = {
                'star-sky': '🌟',
                'galaxy': '🌌',
                'ship': '🚢',
                'rocket': '🚀',
                'heart': '❤️',
                'neon-city': '🔵'
            };
            const emoji = emojiMap[theme] || '🌟';
            path.forEach(cell => {
                artwork[cell.row][cell.col] = emoji;
            });
        }

        return {
            id: `level-${size}-${levelNum}`,
            name: `Level ${levelNum}`,
            size: size,
            theme: theme,
            difficulty: Math.ceil(levelNum / 5),
            points: points,
            solution: solution,
            artwork: artwork
        };
    }

    /**
     * Generate a simple path between two points
     * @param {Object} from - Start point {row, col}
     * @param {Object} to - End point {row, col}
     * @param {number} size - Grid size
     * @returns {Array}
     */
    _generatePath(from, to, size) {
        const path = [{ row: from.row, col: from.col }];

        let currentRow = from.row;
        let currentCol = from.col;

        // Move horizontally first, then vertically
        while (currentCol !== to.col) {
            currentCol += currentCol < to.col ? 1 : -1;
            path.push({ row: currentRow, col: currentCol });
        }

        while (currentRow !== to.row) {
            currentRow += currentRow < to.row ? 1 : -1;
            path.push({ row: currentRow, col: currentCol });
        }

        return path;
    }

    /**
     * Get a specific level
     * @param {number} packIndex
     * @param {number} levelIndex
     * @returns {Object|null}
     */
    getLevel(packIndex, levelIndex) {
        if (packIndex < 0 || packIndex >= this.packs.length) return null;

        const pack = this.packs[packIndex];
        if (!pack.levels || levelIndex < 0 || levelIndex >= pack.levels.length) return null;

        return pack.levels[levelIndex];
    }

    /**
     * Get current level
     * @returns {Object|null}
     */
    getCurrentLevel() {
        return this.getLevel(this.currentPackIndex, this.currentLevelIndex);
    }

    /**
     * Move to next level
     * @returns {Object|null}
     */
    getNextLevel() {
        const pack = this.packs[this.currentPackIndex];

        if (this.currentLevelIndex + 1 < pack.levels.length) {
            this.currentLevelIndex++;
        } else if (this.currentPackIndex + 1 < this.packs.length) {
            this.currentPackIndex++;
            this.currentLevelIndex = 0;
        } else {
            return null; // All levels complete
        }

        this._saveCurrentPosition();
        return this.getCurrentLevel();
    }

    /**
     * Set current level position
     * @param {number} packIndex
     * @param {number} levelIndex
     */
    setCurrentLevel(packIndex, levelIndex) {
        this.currentPackIndex = packIndex;
        this.currentLevelIndex = levelIndex;
        this._saveCurrentPosition();
    }

    /**
     * Save current position to storage
     */
    _saveCurrentPosition() {
        Storage.set(STORAGE_KEYS.CURRENT_LEVEL, {
            pack: this.currentPackIndex,
            level: this.currentLevelIndex
        });
    }

    /**
     * Load saved position
     */
    loadSavedPosition() {
        const saved = Storage.get(STORAGE_KEYS.CURRENT_LEVEL);
        if (saved) {
            this.currentPackIndex = saved.pack || 0;
            this.currentLevelIndex = saved.level || 0;
        }
    }

    /**
     * Mark a level as complete
     * @param {number} packIndex
     * @param {number} levelIndex
     * @param {Object} stats
     */
    markLevelComplete(packIndex, levelIndex, stats) {
        const key = `${packIndex}-${levelIndex}`;
        this.progress[key] = {
            completed: true,
            time: stats.time,
            hintsUsed: stats.hintsUsed,
            completedAt: new Date().toISOString()
        };

        Storage.set(STORAGE_KEYS.PROGRESS, this.progress);
    }

    /**
     * Check if a level is completed
     * @param {number} packIndex
     * @param {number} levelIndex
     * @returns {boolean}
     */
    isLevelCompleted(packIndex, levelIndex) {
        return !!this.progress[`${packIndex}-${levelIndex}`]?.completed;
    }

    /**
     * Get stats for a completed level
     * @param {number} packIndex
     * @param {number} levelIndex
     * @returns {Object|null}
     */
    getLevelStats(packIndex, levelIndex) {
        return this.progress[`${packIndex}-${levelIndex}`];
    }

    /**
     * Get daily puzzle
     * @returns {Object}
     */
    getDailyPuzzle() {
        const today = getTodayString();
        const hash = dateHash(today);

        // Select a level based on the date hash
        const allLevels = this.packs.flatMap(pack => pack.levels);
        const index = hash % allLevels.length;

        const level = { ...allLevels[index] };
        level.id = `daily-${today}`;
        level.name = 'Daily Puzzle';

        return level;
    }

    /**
     * Check if daily puzzle is completed
     * @returns {boolean}
     */
    isDailyCompleted() {
        const today = getTodayString();
        return !!this.dailyStatus[today]?.completed;
    }

    /**
     * Mark daily puzzle as complete
     * @param {Object} stats
     */
    markDailyComplete(stats) {
        const today = getTodayString();
        this.dailyStatus[today] = {
            completed: true,
            time: stats.time,
            completedAt: new Date().toISOString()
        };

        Storage.set(STORAGE_KEYS.DAILY_COMPLETED, this.dailyStatus);
    }

    /**
     * Get total levels count
     * @returns {number}
     */
    getTotalLevels() {
        return this.packs.reduce((sum, pack) => sum + (pack.levels?.length || 0), 0);
    }

    /**
     * Get completed levels count
     * @returns {number}
     */
    getCompletedLevelsCount() {
        return Object.values(this.progress).filter(p => p.completed).length;
    }
}
