// =============================================
// AMAZEING - Random Level Generator
// =============================================

import { THEMES } from '../utils/Constants.js';

/**
 * LevelGenerator - Generates random solvable puzzle levels
 * Uses Hamiltonian path generation to ensure all cells can be filled
 */
export class LevelGenerator {
    /**
     * Generate a random level
     * @param {Object} options
     * @param {number} options.size - Grid size (6, 8, 10, 12)
     * @param {number} options.numPoints - Number of points (2, 4, 8)
     * @param {number} options.obstaclePercent - Percentage of cells as obstacles (0-20)
     * @returns {Object|null} Level data or null if generation failed
     */
    static generate(options = {}) {
        const {
            size = 6,
            numPoints = 2,
            obstaclePercent = 0
        } = options;

        // Calculate max obstacles (keep grid solvable)
        const totalCells = size * size;
        const maxObstacles = Math.floor(totalCells * (obstaclePercent / 100));

        // Try multiple times to generate a valid level
        for (let attempt = 0; attempt < 50; attempt++) {
            const result = this._tryGenerateLevel(size, numPoints, maxObstacles);
            if (result) {
                return result;
            }
        }

        // Fallback: generate simpler level without obstacles
        return this._tryGenerateLevel(size, numPoints, 0);
    }

    /**
     * Attempt to generate a level
     * @private
     */
    static _tryGenerateLevel(size, numPoints, maxObstacles) {
        // Generate random obstacles
        const obstacles = this._generateObstacles(size, maxObstacles);

        // Create grid representation
        const grid = this._createGrid(size, obstacles);

        // Find a Hamiltonian path through the grid
        const path = this._findHamiltonianPath(grid, size, obstacles);

        if (!path) {
            return null;
        }

        // Place points along the path
        const points = this._placePoints(path, numPoints);

        // Create solution segments
        const solution = this._createSolution(path, points);

        // Pick a random theme
        const themeKeys = Object.keys(THEMES);
        const theme = themeKeys[Math.floor(Math.random() * themeKeys.length)];

        // Generate level ID
        const levelId = `random-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

        return {
            id: levelId,
            name: `Random ${size}x${size}`,
            size: size,
            theme: theme,
            difficulty: Math.ceil(size / 4),
            points: points,
            obstacles: obstacles,
            solution: solution
        };
    }

    /**
     * Generate random obstacles avoiding corners
     * @private
     */
    static _generateObstacles(size, maxObstacles) {
        const obstacles = [];
        const obstacleSet = new Set();

        // Avoid corners and edges for obstacles (make path easier to find)
        const avoidCells = new Set([
            '0,0', `0,${size-1}`, `${size-1},0`, `${size-1},${size-1}`
        ]);

        let attempts = 0;
        while (obstacles.length < maxObstacles && attempts < maxObstacles * 10) {
            attempts++;

            // Prefer central obstacles
            const row = Math.floor(Math.random() * (size - 2)) + 1;
            const col = Math.floor(Math.random() * (size - 2)) + 1;
            const key = `${row},${col}`;

            if (!obstacleSet.has(key) && !avoidCells.has(key)) {
                obstacleSet.add(key);
                obstacles.push({ row, col });
            }
        }

        return obstacles;
    }

    /**
     * Create grid representation
     * @private
     */
    static _createGrid(size, obstacles) {
        const grid = [];
        const obstacleSet = new Set(obstacles.map(o => `${o.row},${o.col}`));

        for (let row = 0; row < size; row++) {
            grid[row] = [];
            for (let col = 0; col < size; col++) {
                grid[row][col] = obstacleSet.has(`${row},${col}`) ? -1 : 0;
            }
        }

        return grid;
    }

    /**
     * Find a Hamiltonian path using modified Warnsdorff's algorithm with backtracking
     * @private
     */
    static _findHamiltonianPath(grid, size, obstacles) {
        const totalCells = size * size - obstacles.length;

        // Try starting from different corners
        const startPoints = [
            { row: 0, col: 0 },
            { row: 0, col: size - 1 },
            { row: size - 1, col: 0 },
            { row: size - 1, col: size - 1 }
        ];

        // Shuffle start points
        this._shuffle(startPoints);

        for (const start of startPoints) {
            if (grid[start.row][start.col] === -1) continue;

            const visited = new Set();
            const path = [];
            const state = { iterations: 0, maxIterations: 50000 };

            if (this._hamiltonianDFS(grid, size, start.row, start.col, visited, path, totalCells, state)) {
                return path;
            }
        }

        return null;
    }

    /**
     * DFS with Warnsdorff's heuristic for Hamiltonian path
     * @private
     */
    static _hamiltonianDFS(grid, size, row, col, visited, path, target, state) {
        // Check iteration limit to prevent long waits
        state.iterations++;
        if (state.iterations > state.maxIterations) {
            return false;
        }

        const key = `${row},${col}`;
        visited.add(key);
        path.push({ row, col });

        if (path.length === target) {
            return true;
        }

        // Get neighbors sorted by Warnsdorff's heuristic (fewest onward moves first)
        const neighbors = this._getNeighbors(grid, size, row, col, visited);

        // Sort by degree (number of available moves from that cell)
        neighbors.sort((a, b) => {
            const degA = this._getNeighbors(grid, size, a.row, a.col, visited).length;
            const degB = this._getNeighbors(grid, size, b.row, b.col, visited).length;
            return degA - degB;
        });

        // Add some randomization to avoid always getting same path
        if (neighbors.length > 1 && Math.random() < 0.3) {
            this._shuffle(neighbors);
        }

        for (const next of neighbors) {
            if (this._hamiltonianDFS(grid, size, next.row, next.col, visited, path, target, state)) {
                return true;
            }
        }

        // Backtrack
        visited.delete(key);
        path.pop();
        return false;
    }

    /**
     * Get valid neighbors for a cell
     * @private
     */
    static _getNeighbors(grid, size, row, col, visited) {
        const neighbors = [];
        const directions = [
            { dr: -1, dc: 0 },  // up
            { dr: 1, dc: 0 },   // down
            { dr: 0, dc: -1 },  // left
            { dr: 0, dc: 1 }    // right
        ];

        for (const { dr, dc } of directions) {
            const nr = row + dr;
            const nc = col + dc;

            if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
                grid[nr][nc] !== -1 && !visited.has(`${nr},${nc}`)) {
                neighbors.push({ row: nr, col: nc });
            }
        }

        return neighbors;
    }

    /**
     * Place numbered points along the path
     * @private
     */
    static _placePoints(path, numPoints) {
        const points = [];
        const pathLength = path.length;

        // Calculate spacing between points
        const spacing = Math.floor(pathLength / numPoints);

        for (let i = 0; i < numPoints; i++) {
            let index;
            if (i === 0) {
                index = 0; // First point at start
            } else if (i === numPoints - 1) {
                index = pathLength - 1; // Last point at end
            } else {
                // Distribute points evenly
                index = i * spacing;
            }

            points.push({
                number: i + 1,
                row: path[index].row,
                col: path[index].col
            });
        }

        return points;
    }

    /**
     * Create solution segments from path and points
     * @private
     */
    static _createSolution(path, points) {
        const solution = [];

        // Find indices of points in path
        const pointIndices = [];
        for (const point of points) {
            const idx = path.findIndex(p => p.row === point.row && p.col === point.col);
            pointIndices.push(idx);
        }

        // Create solution segments
        for (let i = 0; i < points.length - 1; i++) {
            const startIdx = pointIndices[i];
            const endIdx = pointIndices[i + 1];

            solution.push({
                from: i + 1,
                to: i + 2,
                path: path.slice(startIdx, endIdx + 1)
            });
        }

        return solution;
    }

    /**
     * Shuffle array in place
     * @private
     */
    static _shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Get difficulty presets
     */
    static getPresets() {
        return {
            easy: { size: 6, numPoints: 2, obstaclePercent: 0, label: 'Easy (6x6, 2 pts)' },
            medium: { size: 8, numPoints: 4, obstaclePercent: 5, label: 'Medium (8x8, 4 pts)' },
            hard: { size: 10, numPoints: 4, obstaclePercent: 8, label: 'Hard (10x10, 4 pts)' },
            expert: { size: 12, numPoints: 8, obstaclePercent: 10, label: 'Expert (12x12, 8 pts)' }
        };
    }
}
