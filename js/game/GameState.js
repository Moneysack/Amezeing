// =============================================
// AMAZEING - Game State Management
// =============================================

import { GAME_STATES } from '../utils/Constants.js';
import { deepClone } from '../utils/Helpers.js';

/**
 * GameState - Centralized reactive state management
 * Uses a simple observer pattern for state changes
 */
class GameState {
    constructor() {
        // Internal state
        this._state = {
            // Current level info
            levelId: null,
            levelData: null,
            gridSize: 6,
            theme: 'star-sky',

            // Grid state - which cells are occupied
            occupiedCells: new Set(), // Set of "row,col" strings

            // Completed paths
            paths: [], // Array of path objects: {number, cells: [{row, col}]}

            // Current drawing path
            currentPath: null,

            // Points to connect
            points: [], // [{number, row, col}]
            totalPoints: 0,

            // Connection tracking
            connectedPoints: new Set(), // Set of connected point numbers
            currentNumber: 1, // Next point number to connect from

            // Game status
            gameState: GAME_STATES.IDLE,
            isComplete: false,

            // Timer
            startTime: null,
            elapsedTime: 0,
            timerRunning: false,

            // Stats
            hintsUsed: 0,

            // History for undo
            history: [],
            maxHistory: 50
        };

        // Event listeners
        this._listeners = new Map();
    }

    // =========================================
    // Getters
    // =========================================

    get levelId() { return this._state.levelId; }
    get levelData() { return this._state.levelData; }
    get gridSize() { return this._state.gridSize; }
    get theme() { return this._state.theme; }
    get occupiedCells() { return this._state.occupiedCells; }
    get paths() { return this._state.paths; }
    get currentPath() { return this._state.currentPath; }
    get points() { return this._state.points; }
    get totalPoints() { return this._state.totalPoints; }
    get connectedPoints() { return this._state.connectedPoints; }
    get currentNumber() { return this._state.currentNumber; }
    get gameState() { return this._state.gameState; }
    get isComplete() { return this._state.isComplete; }
    get elapsedTime() { return this._state.elapsedTime; }
    get hintsUsed() { return this._state.hintsUsed; }
    get history() { return this._state.history; }

    // =========================================
    // Setters with change notification
    // =========================================

    set gameState(value) {
        const old = this._state.gameState;
        this._state.gameState = value;
        this._notify('gameState', value, old);
    }

    set currentPath(value) {
        const old = this._state.currentPath;
        this._state.currentPath = value;
        this._notify('currentPath', value, old);
    }

    set currentNumber(value) {
        const old = this._state.currentNumber;
        this._state.currentNumber = value;
        this._notify('currentNumber', value, old);
    }

    set elapsedTime(value) {
        const old = this._state.elapsedTime;
        this._state.elapsedTime = value;
        this._notify('elapsedTime', value, old);
    }

    set theme(value) {
        const old = this._state.theme;
        this._state.theme = value;
        this._notify('theme', value, old);
    }

    // =========================================
    // Level Management
    // =========================================

    /**
     * Load a new level
     * @param {Object} levelData - Level configuration
     */
    loadLevel(levelData) {
        this._state.levelId = levelData.id;
        this._state.levelData = levelData;
        this._state.gridSize = levelData.size;
        this._state.theme = levelData.theme || 'star-sky';
        this._state.points = [...levelData.points];
        this._state.totalPoints = levelData.points.length;

        // Reset game state
        this.reset();

        this._notify('levelLoaded', levelData);
    }

    /**
     * Reset current level
     */
    reset() {
        this._state.paths = [];
        this._state.occupiedCells = new Set();
        this._state.currentPath = null;
        this._state.connectedPoints = new Set();
        this._state.currentNumber = 1;
        this._state.gameState = GAME_STATES.IDLE;
        this._state.isComplete = false;
        this._state.history = [];
        this._state.hintsUsed = 0;
        this._state.elapsedTime = 0;
        this._state.timerRunning = false;

        this._notify('reset');
    }

    // =========================================
    // Path Management
    // =========================================

    /**
     * Start a new path from a point
     * @param {number} row
     * @param {number} col
     * @param {number} pointNumber
     */
    startPath(row, col, pointNumber) {
        this._state.currentPath = {
            number: pointNumber,
            cells: [{ row, col }]
        };
        this._state.occupiedCells.add(`${row},${col}`);
        this._state.gameState = GAME_STATES.DRAWING;
        this._notify('pathStarted', { row, col, pointNumber });
    }

    /**
     * Extend the current path
     * @param {number} row
     * @param {number} col
     */
    extendPath(row, col) {
        if (!this._state.currentPath) return;

        this._state.currentPath.cells.push({ row, col });
        this._state.occupiedCells.add(`${row},${col}`);
        this._notify('pathExtended', { row, col });
    }

    /**
     * Remove cells from current path (backtracking)
     * @param {number} fromIndex - Index to truncate from
     */
    truncatePath(fromIndex) {
        if (!this._state.currentPath) return;

        const removed = this._state.currentPath.cells.splice(fromIndex + 1);
        removed.forEach(cell => {
            this._state.occupiedCells.delete(`${cell.row},${cell.col}`);
        });
        this._notify('pathTruncated', { fromIndex, removed });
    }

    /**
     * Complete the current path
     * @param {number} endRow
     * @param {number} endCol
     */
    completePath(endRow, endCol) {
        if (!this._state.currentPath) return;

        // Add final cell
        this._state.currentPath.cells.push({ row: endRow, col: endCol });
        this._state.occupiedCells.add(`${endRow},${endCol}`);

        // Save to history before committing
        this.saveSnapshot();

        // Move current path to completed paths
        const completedPath = { ...this._state.currentPath };
        this._state.paths.push(completedPath);

        // Mark points as connected
        this._state.connectedPoints.add(completedPath.number);
        this._state.connectedPoints.add(completedPath.number + 1);

        // Update current number
        this._state.currentNumber = completedPath.number + 1;

        // Clear current path
        this._state.currentPath = null;
        this._state.gameState = GAME_STATES.IDLE;

        this._notify('pathCompleted', completedPath);

        // Check for level completion
        this._checkCompletion();
    }

    /**
     * Cancel the current path
     */
    cancelPath() {
        if (!this._state.currentPath) return;

        // Remove all cells except the starting point (which is a number point)
        this._state.currentPath.cells.forEach((cell, index) => {
            if (index > 0) {
                this._state.occupiedCells.delete(`${cell.row},${cell.col}`);
            }
        });

        const cancelled = this._state.currentPath;
        this._state.currentPath = null;
        this._state.gameState = GAME_STATES.IDLE;

        this._notify('pathCancelled', cancelled);
    }

    /**
     * Check if level is complete
     */
    _checkCompletion() {
        // All points connected when we've connected all points
        if (this._state.connectedPoints.size === this._state.totalPoints) {
            this._state.isComplete = true;
            this._state.gameState = GAME_STATES.COMPLETED;
            this._notify('levelComplete');
        }
    }

    // =========================================
    // Cell Query Methods
    // =========================================

    /**
     * Check if a cell is occupied
     * @param {number} row
     * @param {number} col
     * @returns {boolean}
     */
    isCellOccupied(row, col) {
        return this._state.occupiedCells.has(`${row},${col}`);
    }

    /**
     * Check if a cell is a numbered point
     * @param {number} row
     * @param {number} col
     * @returns {Object|null} Point object or null
     */
    getPointAt(row, col) {
        return this._state.points.find(p => p.row === row && p.col === col) || null;
    }

    /**
     * Get the last cell of the current path
     * @returns {Object|null}
     */
    getCurrentPathEnd() {
        if (!this._state.currentPath || this._state.currentPath.cells.length === 0) {
            return null;
        }
        return this._state.currentPath.cells[this._state.currentPath.cells.length - 1];
    }

    /**
     * Find index of a cell in current path
     * @param {number} row
     * @param {number} col
     * @returns {number} Index or -1
     */
    findInCurrentPath(row, col) {
        if (!this._state.currentPath) return -1;
        return this._state.currentPath.cells.findIndex(
            c => c.row === row && c.col === col
        );
    }

    // =========================================
    // History (Undo)
    // =========================================

    /**
     * Save current state to history
     */
    saveSnapshot() {
        const snapshot = {
            paths: deepClone(this._state.paths),
            occupiedCells: new Set(this._state.occupiedCells),
            currentNumber: this._state.currentNumber,
            connectedPoints: new Set(this._state.connectedPoints)
        };

        this._state.history.push(snapshot);

        // Limit history size
        if (this._state.history.length > this._state.maxHistory) {
            this._state.history.shift();
        }
    }

    /**
     * Restore previous state (undo)
     * @returns {boolean} Success
     */
    undo() {
        const snapshot = this._state.history.pop();
        if (!snapshot) return false;

        this._state.paths = snapshot.paths;
        this._state.occupiedCells = snapshot.occupiedCells;
        this._state.currentNumber = snapshot.currentNumber;
        this._state.connectedPoints = snapshot.connectedPoints;
        this._state.currentPath = null;
        this._state.gameState = GAME_STATES.IDLE;

        this._notify('undo', snapshot);
        return true;
    }

    /**
     * Check if undo is available
     * @returns {boolean}
     */
    canUndo() {
        return this._state.history.length > 0;
    }

    // =========================================
    // Event System
    // =========================================

    /**
     * Subscribe to state changes
     * @param {string} event - Event name or '*' for all
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    subscribe(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => {
            this._listeners.get(event)?.delete(callback);
        };
    }

    /**
     * Notify listeners of a change
     * @param {string} event
     * @param {*} data
     * @param {*} oldData
     */
    _notify(event, data, oldData) {
        // Notify specific listeners
        this._listeners.get(event)?.forEach(cb => cb(data, oldData));

        // Notify wildcard listeners
        this._listeners.get('*')?.forEach(cb => cb(event, data, oldData));
    }

    // =========================================
    // Stats
    // =========================================

    incrementHints() {
        this._state.hintsUsed++;
        this._notify('hintsUsed', this._state.hintsUsed);
    }
}

// Export singleton instance
export const gameState = new GameState();
