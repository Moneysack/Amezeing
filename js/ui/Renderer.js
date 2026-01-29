// =============================================
// AMAZEING - Renderer
// =============================================

import { THEMES } from '../utils/Constants.js';
import { gameState } from '../game/GameState.js';

/**
 * Renderer - Handles all visual rendering of the game
 * Now uses colored lines instead of emojis, supports obstacles
 */
export class Renderer {
    /**
     * Create renderer
     * @param {HTMLElement} gridContainer
     * @param {HTMLCanvasElement} pathCanvas
     * @param {HTMLCanvasElement} previewCanvas
     */
    constructor(gridContainer, pathCanvas, previewCanvas) {
        this.gridContainer = gridContainer;
        this.pathCanvas = pathCanvas;
        this.previewCanvas = previewCanvas;
        this.ctx = pathCanvas.getContext('2d');
        this.previewCtx = previewCanvas.getContext('2d');

        this.cellSize = 48;
        this.gridSize = 6;
        this.gridGap = 2;
        this.gridPadding = 2;

        // Points overlay
        this.pointsOverlay = document.getElementById('points-overlay');

        // Track obstacles
        this.obstacles = new Set();
    }

    /**
     * Initialize the grid for a new level
     * @param {number} gridSize
     * @param {Array} points - Array of {number, row, col}
     * @param {Array} obstacles - Array of {row, col} for blocked cells
     */
    initialize(gridSize, points, obstacles = []) {
        this.gridSize = gridSize;
        this.gridContainer.dataset.size = gridSize;
        this.pointsOverlay.dataset.size = gridSize;
        this.gridContainer.innerHTML = '';

        // Store obstacles
        this.obstacles = new Set(obstacles.map(o => `${o.row},${o.col}`));

        // Create grid cells
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // Mark obstacles
                if (this.obstacles.has(`${row},${col}`)) {
                    cell.classList.add('obstacle');
                }

                this.gridContainer.appendChild(cell);
            }
        }

        // Render numbered points
        this._renderPoints(points);

        // Resize canvas to match grid
        this._resizeCanvas();

        // Clear any existing paths
        this.clearPaths();
    }

    /**
     * Render numbered points on the grid
     * @param {Array} points
     */
    _renderPoints(points) {
        this.pointsOverlay.innerHTML = '';

        points.forEach(point => {
            const pointEl = document.createElement('div');
            pointEl.className = 'point';
            pointEl.dataset.number = point.number;
            pointEl.dataset.row = point.row;
            pointEl.dataset.col = point.col;
            pointEl.textContent = point.number;
            pointEl.style.gridRow = point.row + 1;
            pointEl.style.gridColumn = point.col + 1;
            this.pointsOverlay.appendChild(pointEl);
        });
    }

    /**
     * Resize canvas to match grid dimensions
     */
    _resizeCanvas() {
        // Wait for layout to complete
        requestAnimationFrame(() => {
            const rect = this.gridContainer.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            this.pathCanvas.width = rect.width * dpr;
            this.pathCanvas.height = rect.height * dpr;
            this.pathCanvas.style.width = rect.width + 'px';
            this.pathCanvas.style.height = rect.height + 'px';

            this.ctx.scale(dpr, dpr);

            // Calculate cell size from actual rendered grid
            this.cellSize = (rect.width - this.gridPadding * 2) / this.gridSize - this.gridGap;

            // Re-render paths
            this.renderPaths();
        });
    }

    /**
     * Clear all rendered paths
     */
    clearPaths() {
        this.ctx.clearRect(0, 0, this.pathCanvas.width, this.pathCanvas.height);

        // Also clear cell highlights
        this.gridContainer.querySelectorAll('.cell.path-cell').forEach(cell => {
            cell.classList.remove('path-cell');
            cell.style.backgroundColor = '';
        });
    }

    /**
     * Render all paths (completed and current)
     */
    renderPaths() {
        this.clearPaths();

        const theme = THEMES[gameState.theme] || THEMES['star-sky'];

        // Render completed paths
        gameState.paths.forEach((path, index) => {
            this._renderPath(path, theme, false, index);
        });

        // Render current drawing path
        if (gameState.currentPath) {
            this._renderPath(gameState.currentPath, theme, true, gameState.paths.length);
        }
    }

    /**
     * Render a single path as colored line
     * @param {Object} path - Path object with cells array
     * @param {Object} theme - Theme configuration
     * @param {boolean} isDrawing - Is this the currently drawing path
     * @param {number} pathIndex - Index for color variation
     */
    _renderPath(path, theme, isDrawing, pathIndex) {
        if (!path.cells || path.cells.length < 1) return;

        // Get line color based on theme
        const lineColor = this._getPathColor(theme, pathIndex);
        const lineWidth = this.cellSize * 0.4;

        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalAlpha = isDrawing ? 0.7 : 1;

        // Draw the line connecting cell centers
        if (path.cells.length >= 2) {
            this.ctx.beginPath();

            const firstCell = path.cells[0];
            const startX = this.gridPadding + firstCell.col * (this.cellSize + this.gridGap) + this.cellSize / 2;
            const startY = this.gridPadding + firstCell.row * (this.cellSize + this.gridGap) + this.cellSize / 2;
            this.ctx.moveTo(startX, startY);

            for (let i = 1; i < path.cells.length; i++) {
                const cell = path.cells[i];
                const x = this.gridPadding + cell.col * (this.cellSize + this.gridGap) + this.cellSize / 2;
                const y = this.gridPadding + cell.row * (this.cellSize + this.gridGap) + this.cellSize / 2;
                this.ctx.lineTo(x, y);
            }

            this.ctx.stroke();
        }

        // Also fill the cells with a lighter version of the color
        path.cells.forEach((cell, index) => {
            const cellEl = this.gridContainer.querySelector(
                `.cell[data-row="${cell.row}"][data-col="${cell.col}"]`
            );
            if (cellEl && !cellEl.classList.contains('obstacle')) {
                cellEl.classList.add('path-cell');
                cellEl.style.backgroundColor = this._getLightColor(lineColor, isDrawing ? 0.3 : 0.4);
            }
        });

        this.ctx.globalAlpha = 1;
    }

    /**
     * Get color for a path based on theme and index
     * @param {Object} theme
     * @param {number} index
     * @returns {string}
     */
    _getPathColor(theme, index) {
        // Color palette for paths
        const colors = [
            '#4CAF50', // Green
            '#2196F3', // Blue
            '#FF9800', // Orange
            '#9C27B0', // Purple
            '#F44336', // Red
            '#00BCD4', // Cyan
            '#FFEB3B', // Yellow
            '#E91E63', // Pink
            '#3F51B5', // Indigo
            '#009688', // Teal
        ];

        return colors[index % colors.length];
    }

    /**
     * Get a lighter version of a color
     * @param {string} color - Hex color
     * @param {number} alpha - Alpha value
     * @returns {string}
     */
    _getLightColor(color, alpha) {
        // Convert hex to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Show invalid move feedback on a cell
     * @param {number} row
     * @param {number} col
     */
    showInvalidFeedback(row, col) {
        const cell = this.gridContainer.querySelector(
            `.cell[data-row="${row}"][data-col="${col}"]`
        );

        if (cell) {
            cell.classList.add('invalid');
            setTimeout(() => cell.classList.remove('invalid'), 300);
        }
    }

    /**
     * Show hint cells
     * @param {Array<{row: number, col: number}>} cells
     */
    showHint(cells) {
        // Remove previous hints
        this.clearHints();

        cells.forEach(({ row, col }) => {
            const cell = this.gridContainer.querySelector(
                `.cell[data-row="${row}"][data-col="${col}"]`
            );
            if (cell) {
                cell.classList.add('hint');
            }
        });

        // Auto-remove hints after a delay
        setTimeout(() => this.clearHints(), 3000);
    }

    /**
     * Clear hint highlights
     */
    clearHints() {
        this.gridContainer.querySelectorAll('.cell.hint').forEach(cell => {
            cell.classList.remove('hint');
        });
    }

    /**
     * Update point connected status
     * @param {number} pointNumber
     * @param {boolean} connected
     */
    updatePointStatus(pointNumber, connected) {
        const point = this.pointsOverlay.querySelector(
            `.point[data-number="${pointNumber}"]`
        );
        if (point) {
            point.classList.toggle('connected', connected);
        }
    }

    /**
     * Highlight the current/next point to connect
     * @param {number} pointNumber
     */
    highlightCurrentPoint(pointNumber) {
        // Remove previous highlights
        this.pointsOverlay.querySelectorAll('.point.current, .point.active').forEach(p => {
            p.classList.remove('current', 'active');
        });

        // Highlight current point
        const point = this.pointsOverlay.querySelector(
            `.point[data-number="${pointNumber}"]`
        );
        if (point) {
            point.classList.add('current', 'active');
        }
    }

    /**
     * Render the pattern preview (simplified for line-based version)
     * @param {Object} levelData
     */
    renderPreview(levelData) {
        if (!levelData) return;

        const size = levelData.size;
        const pixelSize = 64 / size;

        this.previewCtx.clearRect(0, 0, 64, 64);

        // Draw a simple grid preview
        this.previewCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.previewCtx.fillRect(0, 0, 64, 64);

        // Draw obstacles as dark cells
        if (levelData.obstacles) {
            this.previewCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            levelData.obstacles.forEach(obs => {
                this.previewCtx.fillRect(
                    obs.col * pixelSize + 1,
                    obs.row * pixelSize + 1,
                    pixelSize - 2,
                    pixelSize - 2
                );
            });
        }

        // Draw points as dots
        this.previewCtx.fillStyle = '#ffd700';
        levelData.points.forEach(point => {
            this.previewCtx.beginPath();
            this.previewCtx.arc(
                point.col * pixelSize + pixelSize / 2,
                point.row * pixelSize + pixelSize / 2,
                pixelSize / 4,
                0,
                Math.PI * 2
            );
            this.previewCtx.fill();
        });
    }

    /**
     * Render the final artwork in the win modal
     * @param {number} size - Grid size
     */
    renderFinalArtwork(size) {
        const artworkContainer = document.getElementById('final-artwork');
        artworkContainer.innerHTML = '';
        artworkContainer.style.gridTemplateColumns = `repeat(${size}, 1.2rem)`;
        artworkContainer.style.gap = '1px';

        // Build grid from paths
        const grid = Array.from({ length: size }, () =>
            Array(size).fill(null)
        );

        gameState.paths.forEach((path, pathIndex) => {
            const color = this._getPathColor(THEMES[gameState.theme], pathIndex);
            path.cells.forEach(cell => {
                grid[cell.row][cell.col] = color;
            });
        });

        // Render
        grid.forEach((row, rowIndex) => {
            row.forEach((color, colIndex) => {
                const span = document.createElement('span');
                span.className = 'artwork-cell';

                if (this.obstacles.has(`${rowIndex},${colIndex}`)) {
                    span.style.backgroundColor = '#333';
                } else if (color) {
                    span.style.backgroundColor = color;
                } else {
                    span.style.backgroundColor = 'rgba(255,255,255,0.1)';
                }

                span.style.width = '1.2rem';
                span.style.height = '1.2rem';
                span.style.display = 'inline-block';
                span.style.borderRadius = '2px';

                artworkContainer.appendChild(span);
            });
        });
    }

    /**
     * Update theme indicator
     * @param {string} themeId
     */
    updateThemeIndicator(themeId) {
        const theme = THEMES[themeId] || THEMES['star-sky'];
        const indicator = document.getElementById('theme-indicator');

        if (indicator) {
            indicator.querySelector('.theme-emoji').textContent = '🎯';
            indicator.querySelector('.theme-name').textContent = theme.name;
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this._resizeCanvas();
    }
}
