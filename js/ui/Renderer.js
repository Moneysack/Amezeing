// =============================================
// AMAZEING - Renderer
// =============================================

import { THEMES } from '../utils/Constants.js';
import { gameState } from '../game/GameState.js';

/**
 * Renderer - Handles all visual rendering of the game
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
    }

    /**
     * Initialize the grid for a new level
     * @param {number} gridSize
     * @param {Array} points - Array of {number, row, col}
     */
    initialize(gridSize, points) {
        this.gridSize = gridSize;
        this.gridContainer.dataset.size = gridSize;
        this.pointsOverlay.dataset.size = gridSize;
        this.gridContainer.innerHTML = '';

        // Create grid cells
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
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
    }

    /**
     * Render all paths (completed and current)
     */
    renderPaths() {
        this.clearPaths();

        const theme = THEMES[gameState.theme] || THEMES['star-sky'];

        // Render completed paths
        gameState.paths.forEach(path => {
            this._renderPath(path, theme, false);
        });

        // Render current drawing path
        if (gameState.currentPath) {
            this._renderPath(gameState.currentPath, theme, true);
        }
    }

    /**
     * Render a single path
     * @param {Object} path - Path object with cells array
     * @param {Object} theme - Theme configuration
     * @param {boolean} isDrawing - Is this the currently drawing path
     */
    _renderPath(path, theme, isDrawing) {
        if (!path.cells || path.cells.length < 1) return;

        const emoji = theme.emojis[(path.number - 1) % theme.emojis.length];
        const fontSize = this.cellSize * 0.55;

        this.ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Set opacity for drawing path
        this.ctx.globalAlpha = isDrawing ? 0.85 : 1;

        // Draw emoji at each cell (skip first and last which have numbers)
        path.cells.forEach((cell, index) => {
            // Skip start and end points (they show numbers)
            const isStartOrEnd = index === 0 || (index === path.cells.length - 1 && !isDrawing);

            if (!isStartOrEnd) {
                const x = this.gridPadding + cell.col * (this.cellSize + this.gridGap) + this.cellSize / 2;
                const y = this.gridPadding + cell.row * (this.cellSize + this.gridGap) + this.cellSize / 2;

                this.ctx.fillText(emoji, x, y);
            }
        });

        this.ctx.globalAlpha = 1;
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
     * Render the pattern preview
     * @param {Array<Array<string>>} artwork - 2D array of emojis
     * @param {number} size - Grid size
     */
    renderPreview(artwork, size) {
        if (!artwork) return;

        const pixelSize = 64 / size;
        this.previewCtx.clearRect(0, 0, 64, 64);
        this.previewCtx.font = `${pixelSize * 0.8}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        this.previewCtx.textAlign = 'center';
        this.previewCtx.textBaseline = 'middle';

        artwork.forEach((row, rowIndex) => {
            row.forEach((emoji, colIndex) => {
                if (emoji) {
                    this.previewCtx.fillText(
                        emoji,
                        colIndex * pixelSize + pixelSize / 2,
                        rowIndex * pixelSize + pixelSize / 2
                    );
                }
            });
        });
    }

    /**
     * Render the final artwork in the win modal
     * @param {number} size - Grid size
     */
    renderFinalArtwork(size) {
        const artworkContainer = document.getElementById('final-artwork');
        artworkContainer.innerHTML = '';
        artworkContainer.style.gridTemplateColumns = `repeat(${size}, 1.5rem)`;

        const theme = THEMES[gameState.theme] || THEMES['star-sky'];

        // Build grid of emojis from paths
        const grid = Array.from({ length: size }, () =>
            Array(size).fill('')
        );

        gameState.paths.forEach(path => {
            const emoji = theme.emojis[(path.number - 1) % theme.emojis.length];
            path.cells.forEach(cell => {
                grid[cell.row][cell.col] = emoji;
            });
        });

        // Render
        grid.forEach(row => {
            row.forEach(emoji => {
                const span = document.createElement('span');
                span.textContent = emoji || ' ';
                span.className = 'artwork-cell';
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
            indicator.querySelector('.theme-emoji').textContent = theme.emojis[0];
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
