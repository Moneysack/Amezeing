// =============================================
// AMAZEING - Path Manager
// =============================================

import { gameState } from './GameState.js';
import { areAdjacent, posEquals } from '../utils/Helpers.js';

/**
 * PathManager - Handles path creation, validation, and manipulation
 */
export class PathManager {
    /**
     * Create path manager
     * @param {Grid} grid - Grid instance
     */
    constructor(grid) {
        this.grid = grid;
    }

    /**
     * Attempt to start a new path
     * @param {number} row
     * @param {number} col
     * @returns {{success: boolean, reason?: string}}
     */
    tryStartPath(row, col) {
        // Can only start from a numbered point
        const point = this.grid.getPointAt(row, col);
        if (!point) {
            return { success: false, reason: 'not_a_point' };
        }

        // Must start from the current number (next to connect)
        if (point !== gameState.currentNumber) {
            return { success: false, reason: 'wrong_point' };
        }

        // Check if already drawing
        if (gameState.currentPath) {
            return { success: false, reason: 'already_drawing' };
        }

        // Start the path
        gameState.startPath(row, col, point);
        this.grid.occupyCell(row, col, point);

        return { success: true };
    }

    /**
     * Attempt to extend the current path
     * @param {number} row
     * @param {number} col
     * @returns {{success: boolean, completed?: boolean, backtracked?: boolean, reason?: string}}
     */
    tryExtendPath(row, col) {
        if (!gameState.currentPath) {
            return { success: false, reason: 'no_active_path' };
        }

        const pathEnd = gameState.getCurrentPathEnd();
        if (!pathEnd) {
            return { success: false, reason: 'no_path_end' };
        }

        // Check if this is the same cell (no movement)
        if (posEquals(pathEnd, { row, col })) {
            return { success: false, reason: 'same_cell' };
        }

        // Check adjacency (must be horizontal/vertical)
        if (!areAdjacent(pathEnd, { row, col })) {
            return { success: false, reason: 'not_adjacent' };
        }

        // Check if backtracking (going back along current path)
        const existingIndex = gameState.findInCurrentPath(row, col);
        if (existingIndex !== -1) {
            // Backtracking - truncate path to this position
            const cellsToRemove = gameState.currentPath.cells.slice(existingIndex + 1);
            cellsToRemove.forEach(cell => {
                this.grid.releaseCell(cell.row, cell.col);
            });
            gameState.truncatePath(existingIndex);
            return { success: true, backtracked: true };
        }

        // Check if cell is available
        const cell = this.grid.getCell(row, col);
        if (!cell) {
            return { success: false, reason: 'invalid_cell' };
        }

        // Check if this is the target point
        const targetNumber = gameState.currentNumber + 1;
        if (cell.isPoint && cell.pointNumber === targetNumber) {
            // Complete the path!
            gameState.completePath(row, col);
            this.grid.occupyCell(row, col, gameState.currentPath?.number || targetNumber - 1);
            return { success: true, completed: true };
        }

        // Check if cell is occupied (and not a valid target)
        if (cell.occupied || (cell.isPoint && cell.pointNumber !== targetNumber)) {
            return { success: false, reason: 'cell_occupied' };
        }

        // Extend the path
        gameState.extendPath(row, col);
        this.grid.occupyCell(row, col, gameState.currentPath.number);

        return { success: true };
    }

    /**
     * Cancel the current path
     */
    cancelPath() {
        if (!gameState.currentPath) return;

        // Release cells (except starting point which is a number)
        gameState.currentPath.cells.forEach((cell, index) => {
            if (index > 0) {
                this.grid.releaseCell(cell.row, cell.col);
            }
        });

        gameState.cancelPath();
    }

    /**
     * Undo the last completed path
     * @returns {boolean} Success
     */
    undo() {
        if (!gameState.canUndo()) return false;

        const success = gameState.undo();
        if (success) {
            // Rebuild grid state from remaining paths
            this.grid.reset();
            this.grid.initializePoints(gameState.points);
            this.grid.rebuildFromPaths(gameState.paths);
        }
        return success;
    }

    /**
     * Reset all paths
     */
    reset() {
        gameState.reset();
        this.grid.reset();
        this.grid.initializePoints(gameState.points);
    }

    /**
     * Get hint for the next move
     * @returns {Array<{row: number, col: number}>|null} Hint cells or null
     */
    getHint() {
        const levelData = gameState.levelData;
        if (!levelData || !levelData.solution) return null;

        const currentNum = gameState.currentNumber;

        // Find the solution path for current connection
        const solutionPath = levelData.solution.find(s => s.from === currentNum);
        if (!solutionPath) return null;

        // If we have a current path, find where we diverged or show next cells
        if (gameState.currentPath) {
            const currentCells = gameState.currentPath.cells;
            const solutionCells = solutionPath.path;

            // Find how far along the solution we are
            let matchIndex = 0;
            for (let i = 0; i < currentCells.length && i < solutionCells.length; i++) {
                if (posEquals(currentCells[i], solutionCells[i])) {
                    matchIndex = i;
                } else {
                    break;
                }
            }

            // Return next 3 cells from solution
            const hintCells = solutionCells.slice(matchIndex + 1, matchIndex + 4);
            return hintCells.length > 0 ? hintCells : null;
        }

        // Not started yet - show first few cells of solution
        return solutionPath.path.slice(0, 3);
    }

    /**
     * Validate a complete path
     * @param {Object} path - Path object
     * @param {number} targetNumber - Expected end point number
     * @returns {boolean}
     */
    validatePath(path, targetNumber) {
        if (!path || path.cells.length < 2) return false;

        const start = path.cells[0];
        const end = path.cells[path.cells.length - 1];

        // Check start is correct point
        const startPoint = this.grid.getPointAt(start.row, start.col);
        if (startPoint !== path.number) return false;

        // Check end is correct point
        const endPoint = this.grid.getPointAt(end.row, end.col);
        if (endPoint !== targetNumber) return false;

        // Check path continuity (all cells adjacent)
        for (let i = 1; i < path.cells.length; i++) {
            if (!areAdjacent(path.cells[i - 1], path.cells[i])) {
                return false;
            }
        }

        return true;
    }
}
