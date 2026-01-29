// =============================================
// AMAZEING - Main Entry Point
// =============================================

import { GameController } from './game/GameController.js';

/**
 * Initialize the game when DOM is ready
 */
async function init() {
    console.log('Amazeing - Initializing...');

    try {
        // Create game controller
        console.log('Creating game controller...');
        const game = new GameController();

        // Initialize the game
        console.log('Initializing game...');
        await game.initialize();

        // Make game accessible for debugging
        window.amazeing = game;

        console.log('Amazeing - Ready!');
    } catch (error) {
        console.error('Failed to initialize Amazeing:', error);
        console.error('Error stack:', error.stack);

        // Show error to user
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: #1a1a2e;
                color: white;
                font-family: sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <h1 style="font-size: 3rem; margin-bottom: 1rem;">🌟</h1>
                <h2>Oops! Something went wrong</h2>
                <p style="opacity: 0.7; margin-top: 0.5rem;">
                    Please refresh the page to try again.
                </p>
                <button onclick="location.reload()" style="
                    margin-top: 1rem;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 1rem;
                    cursor: pointer;
                ">
                    Refresh
                </button>
            </div>
        `;
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
