// =============================================
// AMAZEING - Timer
// =============================================

import { formatTime } from '../utils/Helpers.js';

/**
 * Timer - Game timer with display updates
 */
export class Timer {
    /**
     * Create timer
     * @param {HTMLElement} displayElement - Element to show time
     */
    constructor(displayElement) {
        this.display = displayElement;
        this.startTime = null;
        this.elapsedTime = 0;
        this.intervalId = null;
        this.isRunning = false;
        this.onUpdate = null;
    }

    /**
     * Start the timer
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startTime = Date.now() - (this.elapsedTime * 1000);

        this.intervalId = setInterval(() => {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            this._updateDisplay();
            this.onUpdate?.(this.elapsedTime);
        }, 1000);
    }

    /**
     * Stop/pause the timer
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Reset the timer to zero
     */
    reset() {
        this.stop();
        this.elapsedTime = 0;
        this.startTime = null;
        this._updateDisplay();
    }

    /**
     * Get current elapsed time in seconds
     * @returns {number}
     */
    getTime() {
        return this.elapsedTime;
    }

    /**
     * Get formatted time string
     * @returns {string}
     */
    getFormattedTime() {
        return formatTime(this.elapsedTime);
    }

    /**
     * Set a callback for time updates
     * @param {Function} callback
     */
    setUpdateCallback(callback) {
        this.onUpdate = callback;
    }

    /**
     * Update the display element
     */
    _updateDisplay() {
        if (this.display) {
            this.display.textContent = this.getFormattedTime();
        }
    }

    /**
     * Destroy the timer
     */
    destroy() {
        this.stop();
        this.display = null;
        this.onUpdate = null;
    }
}
