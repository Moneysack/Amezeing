// =============================================
// AMAZEING - Grid Logic
// =============================================

import { posKey, areAdjacent } from '../utils/Helpers.js';

/**
 * Grid class - Manages the game grid and cell states
 */
export class Grid {
    /**
     * Create a new grid
     * @param {number} size - Grid size (6, 8, 10, or 12)
     */
    constructor(size) {
        this.size = size;
        this.cells = this._createGrid(size);
        this.points = new Map(); // Map of "row,col" -> point number
    }

    /**
     * Create the grid data structure
     * @param {number} size
     * @returns {Array<Array<Object>>}
     */
    _createGrid(size) {
        return Array.from({ length: size }, (_, row) =>
            Array.from({ length: size }, (_, col) => ({
                row,
                col,
                occupied: false,
                pathNumber: null,
                isPoint: false,
                pointNumber: null
            }))
        );
    }

    /**
     * Get a cell by position
     * @param {number} row
     * @param {number} col
     * @returns {Object|null}
     */
    getCell(row, col) {
        if (!this.isValidPosition(row, col)) return null;
        return this.cells[row][col];
    }

    /**
     * Check if a position is within grid bounds
     * @param {number} row
     * @param {number} col
     * @returns {boolean}
     */
    isValidPosition(row, col) {
        return row >= 0 && row < this.size && col >= 0 && col < this.size;
    }

    /**
     * Check if a cell is available for path drawing
     * @param {number} row
     * @param {number} col
     * @returns {boolean}
     */
    isCellAvailable(row, col) {
        const cell = this.getCell(row, col);
        return cell && !cell.occupied;
    }

    /**
     * Mark a cell as occupied
     * @param {number} row
     * @param {number} col
     * @param {number} pathNumber
     */
    occupyCell(row, col, pathNumber) {
        const cell = this.getCell(row, col);
        if (cell) {
            cell.occupied = true;
            cell.pathNumber = pathNumber;
        }
    }

    /**
     * Release a cell (mark as unoccupied)
     * @param {number} row
     * @param {number} col
     */
    releaseCell(row, col) {
        const cell = this.getCell(row, col);
        if (cell && !cell.isPoint) {
            cell.occupied = false;
            cell.pathNumber = null;
        }
    }

    /**
     * Set a numbered point on the grid
     * @param {number} row
     * @param {number} col
     * @param {number} pointNumber
     */
    setPoint(row, col, pointNumber) {
        const cell = this.getCell(row, col);
        if (cell) {
            cell.isPoint = true;
            cell.pointNumber = pointNumber;
            this.points.set(posKey(row, col), pointNumber);
        }
    }

    /**
     * Get point number at a position
     * @param {number} row
     * @param {number} col
     * @returns {number|null}
     */
    getPointAt(row, col) {
        return this.points.get(posKey(row, col)) || null;
    }

    /**
     * Check if a cell is a numbered point
     * @param {number} row
     * @param {number} col
     * @returns {boolean}
     */
    isPoint(row, col) {
        const cell = this.getCell(row, col);
        return cell ? cell.isPoint : false;
    }

    /**
     * Get all valid adjacent positions (horizontal/vertical only)
     * @param {number} row
     * @param {number} col
     * @returns {Array<{row: number, col: number}>}
     */
    getNeighbors(row, col) {
        const directions = [
            { row: -1, col: 0 },  // up
            { row: 1, col: 0 },   // down
            { row: 0, col: -1 },  // left
            { row: 0, col: 1 }    // right
        ];

        return directions
            .map(d => ({ row: row + d.row, col: col + d.col }))
            .filter(pos => this.isValidPosition(pos.row, pos.col));
    }

    /**
     * Check if two positions are adjacent (horizontal/vertical only)
     * @param {Object} pos1 - {row, col}
     * @param {Object} pos2 - {row, col}
     * @returns {boolean}
     */
    areAdjacent(pos1, pos2) {
        return areAdjacent(pos1, pos2);
    }

    /**
     * Reset the grid (clear all paths but keep points)
     */
    reset() {
        this.cells.forEach(row => {
            row.forEach(cell => {
                if (!cell.isPoint) {
                    cell.occupied = false;
                    cell.pathNumber = null;
                } else {
                    // Points stay but are no longer occupied by paths
                    cell.occupied = false;
                    cell.pathNumber = null;
                }
            });
        });
    }

    /**
     * Initialize grid with points from level data
     * @param {Array<{number: number, row: number, col: number}>} points
     */
    initializePoints(points) {
        // Reset grid
        this.cells = this._createGrid(this.size);
        this.points.clear();

        // Set up points
        points.forEach(p => {
            this.setPoint(p.row, p.col, p.number);
        });
    }

    /**
     * Rebuild grid state from paths
     * @param {Array} paths - Array of path objects
     */
    rebuildFromPaths(paths) {
        this.reset();
        paths.forEach(path => {
            path.cells.forEach(cell => {
                this.occupyCell(cell.row, cell.col, path.number);
            });
        });
    }
}
