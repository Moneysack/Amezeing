// =============================================
// AMAZEING - Storage Utility
// =============================================

export const Storage = {
    /**
     * Get a value from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Parsed value or default
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            return JSON.parse(item);
        } catch (error) {
            console.warn(`Storage.get error for key "${key}":`, error);
            return defaultValue;
        }
    },

    /**
     * Set a value in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store (will be JSON stringified)
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Storage.set error for key "${key}":`, error);
            return false;
        }
    },

    /**
     * Remove a value from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Storage.remove error for key "${key}":`, error);
        }
    },

    /**
     * Clear all Amazeing-related storage
     */
    clearAll() {
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('amazeing_'));
            keys.forEach(k => localStorage.removeItem(k));
        } catch (error) {
            console.warn('Storage.clearAll error:', error);
        }
    },

    /**
     * Check if localStorage is available
     * @returns {boolean}
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
};
