// =============================================
// AMAZEING - Game Controller
// =============================================

import { gameState } from './GameState.js';
import { Grid } from './Grid.js';
import { PathManager } from './PathManager.js';
import { LevelManager } from './LevelManager.js';
import { Renderer } from '../ui/Renderer.js';
import { InputHandler } from '../ui/InputHandler.js';
import { Timer } from '../features/Timer.js';
import { THEMES, GAME_STATES } from '../utils/Constants.js';
import { debounce } from '../utils/Helpers.js';

/**
 * GameController - Main game coordinator
 */
export class GameController {
    constructor() {
        this.grid = null;
        this.pathManager = null;
        this.levelManager = new LevelManager();
        this.renderer = null;
        this.inputHandler = null;
        this.timer = null;

        this.isDaily = false;

        // Bind methods
        this._onDragStart = this._onDragStart.bind(this);
        this._onDragMove = this._onDragMove.bind(this);
        this._onDragEnd = this._onDragEnd.bind(this);
    }

    /**
     * Initialize the game
     */
    async initialize() {
        // Get DOM elements
        const gridContainer = document.getElementById('grid-container');
        const pathCanvas = document.getElementById('path-canvas');
        const previewCanvas = document.getElementById('preview-canvas');
        const timerDisplay = document.getElementById('timer');

        // Create renderer
        this.renderer = new Renderer(gridContainer, pathCanvas, previewCanvas);

        // Create input handler
        this.inputHandler = new InputHandler(gridContainer, {
            onDragStart: this._onDragStart,
            onDragMove: this._onDragMove,
            onDragEnd: this._onDragEnd
        });

        // Create timer
        this.timer = new Timer(timerDisplay);
        this.timer.setUpdateCallback((time) => {
            gameState.elapsedTime = time;
        });

        // Set up UI event listeners
        this._setupUIListeners();

        // Set up state subscriptions
        this._setupStateSubscriptions();

        // Handle window resize
        window.addEventListener('resize', debounce(() => {
            this.renderer.handleResize();
        }, 250));

        // Load level packs
        await this.levelManager.loadPacks();
        this.levelManager.loadSavedPosition();

        // Load the current/first level
        const level = this.levelManager.getCurrentLevel();
        if (level) {
            this.loadLevel(level);
        }
    }

    /**
     * Set up UI button listeners
     */
    _setupUIListeners() {
        // Control buttons
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('share-btn').addEventListener('click', () => this.share());

        // Menu button
        document.getElementById('menu-btn').addEventListener('click', () => this._showModal('menu-modal'));

        // Menu items
        document.getElementById('continue-btn').addEventListener('click', () => this._hideAllModals());
        document.getElementById('levels-btn').addEventListener('click', () => this._showLevelSelect());
        document.getElementById('daily-btn').addEventListener('click', () => this.loadDailyPuzzle());
        document.getElementById('themes-btn').addEventListener('click', () => this._showThemeSelect());

        // Close buttons
        document.getElementById('close-menu-btn')?.addEventListener('click', () => this._hideAllModals());
        document.getElementById('close-levels-btn')?.addEventListener('click', () => this._hideAllModals());
        document.getElementById('close-themes-btn')?.addEventListener('click', () => this._hideAllModals());

        // Win modal buttons
        document.getElementById('next-level-btn').addEventListener('click', () => this.loadNextLevel());
        document.getElementById('share-win-btn').addEventListener('click', () => this.share());

        // Theme selection
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const themeId = e.currentTarget.dataset.theme;
                this.setTheme(themeId);
            });
        });

        // Pack tabs
        document.querySelectorAll('.pack-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const packIndex = parseInt(e.currentTarget.dataset.pack, 10);
                this._renderLevelGrid(packIndex);

                // Update active tab
                document.querySelectorAll('.pack-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Click outside modal to close
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') {
                this._hideAllModals();
            }
        });
    }

    /**
     * Set up game state subscriptions
     */
    _setupStateSubscriptions() {
        // Update UI when current number changes
        gameState.subscribe('currentNumber', (num) => {
            this.renderer.highlightCurrentPoint(num);
        });

        // Handle level completion
        gameState.subscribe('levelComplete', () => {
            this._onLevelComplete();
        });

        // Handle path changes
        gameState.subscribe('pathCompleted', (path) => {
            this.renderer.updatePointStatus(path.number, true);
            this.renderer.updatePointStatus(path.number + 1, true);
            this.renderer.renderPaths();
        });

        gameState.subscribe('pathCancelled', () => {
            this.renderer.renderPaths();
        });

        gameState.subscribe('undo', () => {
            this._refreshPointStatuses();
            this.renderer.renderPaths();
            this.renderer.highlightCurrentPoint(gameState.currentNumber);
        });

        gameState.subscribe('reset', () => {
            this._refreshPointStatuses();
            this.renderer.clearPaths();
            this.renderer.highlightCurrentPoint(1);
        });
    }

    /**
     * Load a level
     * @param {Object} levelData
     */
    loadLevel(levelData) {
        // Create grid
        this.grid = new Grid(levelData.size);
        this.grid.initializePoints(levelData.points);

        // Create path manager
        this.pathManager = new PathManager(this.grid);

        // Load into game state
        gameState.loadLevel(levelData);

        // Update theme
        this.setTheme(levelData.theme || 'star-sky', false);

        // Initialize renderer
        this.renderer.initialize(levelData.size, levelData.points);
        this.renderer.renderPreview(levelData.artwork, levelData.size);
        this.renderer.highlightCurrentPoint(1);

        // Update level name display
        document.getElementById('level-name').textContent = levelData.name;

        // Reset and start timer
        this.timer.reset();
        this.timer.start();

        // Enable input
        this.inputHandler.enable();

        // Hide any open modals
        this._hideAllModals();

        this.isDaily = levelData.id?.startsWith('daily-');
    }

    /**
     * Handle drag start
     * @param {number} row
     * @param {number} col
     */
    _onDragStart(row, col) {
        if (gameState.gameState === GAME_STATES.COMPLETED) return;

        const result = this.pathManager.tryStartPath(row, col);

        if (result.success) {
            this.renderer.renderPaths();
        }
    }

    /**
     * Handle drag move
     * @param {number} row
     * @param {number} col
     */
    _onDragMove(row, col) {
        if (gameState.gameState !== GAME_STATES.DRAWING) return;

        const result = this.pathManager.tryExtendPath(row, col);

        if (!result.success && result.reason !== 'same_cell') {
            this.renderer.showInvalidFeedback(row, col);
        } else {
            this.renderer.renderPaths();
        }
    }

    /**
     * Handle drag end
     */
    _onDragEnd() {
        if (gameState.gameState === GAME_STATES.DRAWING) {
            // Cancel incomplete path
            this.pathManager.cancelPath();
            this.renderer.renderPaths();
        }
    }

    /**
     * Handle level completion
     */
    _onLevelComplete() {
        // Stop timer
        this.timer.stop();

        // Disable input
        this.inputHandler.disable();

        // Save progress
        const stats = {
            time: gameState.elapsedTime,
            hintsUsed: gameState.hintsUsed
        };

        if (this.isDaily) {
            this.levelManager.markDailyComplete(stats);
        } else {
            this.levelManager.markLevelComplete(
                this.levelManager.currentPackIndex,
                this.levelManager.currentLevelIndex,
                stats
            );
        }

        // Show win modal
        this.renderer.renderFinalArtwork(gameState.gridSize);

        document.getElementById('win-stats').textContent =
            `Time: ${this.timer.getFormattedTime()}`;

        // Show modal with delay for effect
        setTimeout(() => {
            this._showModal('win-modal');
        }, 500);
    }

    /**
     * Reset current level
     */
    reset() {
        this.pathManager.reset();
        this.timer.reset();
        this.timer.start();
        this.inputHandler.enable();
    }

    /**
     * Undo last path
     */
    undo() {
        this.pathManager.undo();
    }

    /**
     * Show hint
     */
    showHint() {
        const hintCells = this.pathManager.getHint();

        if (hintCells && hintCells.length > 0) {
            this.renderer.showHint(hintCells);
            gameState.incrementHints();
        }
    }

    /**
     * Share completed puzzle
     */
    async share() {
        const theme = THEMES[gameState.theme] || THEMES['star-sky'];
        const emoji = theme.emojis[0];

        const text = `I completed "${gameState.levelData?.name || 'a puzzle'}" in Amazeing! ${emoji}\nTime: ${this.timer.getFormattedTime()}\nPlay at: [Your URL]`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Amazeing Puzzle',
                    text: text
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    this._copyToClipboard(text);
                }
            }
        } else {
            this._copyToClipboard(text);
        }
    }

    /**
     * Copy text to clipboard
     * @param {string} text
     */
    _copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        }).catch(() => {
            alert('Could not copy to clipboard');
        });
    }

    /**
     * Load next level
     */
    loadNextLevel() {
        const level = this.levelManager.getNextLevel();
        if (level) {
            this.loadLevel(level);
        } else {
            alert('Congratulations! You completed all levels!');
            this._hideAllModals();
        }
    }

    /**
     * Load daily puzzle
     */
    loadDailyPuzzle() {
        const daily = this.levelManager.getDailyPuzzle();
        this.loadLevel(daily);
    }

    /**
     * Set theme
     * @param {string} themeId
     * @param {boolean} rerender - Whether to re-render paths
     */
    setTheme(themeId, rerender = true) {
        document.body.dataset.theme = themeId;
        gameState.theme = themeId;
        this.renderer.updateThemeIndicator(themeId);

        // Update theme button active state
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeId);
        });

        if (rerender) {
            this.renderer.renderPaths();
        }
    }

    /**
     * Refresh point connected statuses
     */
    _refreshPointStatuses() {
        gameState.points.forEach(point => {
            const connected = gameState.connectedPoints.has(point.number);
            this.renderer.updatePointStatus(point.number, connected);
        });
    }

    /**
     * Show a modal
     * @param {string} modalId
     */
    _showModal(modalId) {
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        document.getElementById(modalId).classList.remove('hidden');
    }

    /**
     * Hide all modals
     */
    _hideAllModals() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    }

    /**
     * Show level select modal
     */
    _showLevelSelect() {
        this._renderLevelGrid(this.levelManager.currentPackIndex);

        // Update active tab
        document.querySelectorAll('.pack-tab').forEach((tab, index) => {
            tab.classList.toggle('active', index === this.levelManager.currentPackIndex);
        });

        this._showModal('levels-modal');
    }

    /**
     * Render level selection grid
     * @param {number} packIndex
     */
    _renderLevelGrid(packIndex) {
        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';

        const pack = this.levelManager.packs[packIndex];
        if (!pack || !pack.levels) return;

        pack.levels.forEach((level, levelIndex) => {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = levelIndex + 1;

            if (this.levelManager.isLevelCompleted(packIndex, levelIndex)) {
                btn.classList.add('completed');
            }

            if (packIndex === this.levelManager.currentPackIndex &&
                levelIndex === this.levelManager.currentLevelIndex) {
                btn.classList.add('current');
            }

            btn.addEventListener('click', () => {
                this.levelManager.setCurrentLevel(packIndex, levelIndex);
                this.loadLevel(level);
            });

            grid.appendChild(btn);
        });
    }

    /**
     * Show theme select modal
     */
    _showThemeSelect() {
        this._showModal('themes-modal');
    }
}
