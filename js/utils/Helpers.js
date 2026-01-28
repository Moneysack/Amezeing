// =============================================
// AMAZEING - Helper Utilities
// =============================================

/**
 * Format time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Create a position key string from row and col
 * @param {number} row
 * @param {number} col
 * @returns {string}
 */
export function posKey(row, col) {
    return `${row},${col}`;
}

/**
 * Parse a position key back to row and col
 * @param {string} key
 * @returns {{row: number, col: number}}
 */
export function parseKey(key) {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
}

/**
 * Check if two positions are equal
 * @param {Object} pos1 - {row, col}
 * @param {Object} pos2 - {row, col}
 * @returns {boolean}
 */
export function posEquals(pos1, pos2) {
    return pos1.row === pos2.row && pos1.col === pos2.col;
}

/**
 * Check if two positions are adjacent (horizontal/vertical only)
 * @param {Object} pos1 - {row, col}
 * @param {Object} pos2 - {row, col}
 * @returns {boolean}
 */
export function areAdjacent(pos1, pos2) {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Deep clone an object using JSON parse/stringify
 * @param {*} obj
 * @returns {*}
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce a function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle a function
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Generate a simple hash from a date string (for daily puzzle selection)
 * @param {string} dateString - YYYY-MM-DD format
 * @returns {number}
 */
export function dateHash(dateString) {
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        const char = dateString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string}
 */
export function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms
 * @returns {Promise}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
