/**
 * @fileoverview Utility functions for PLUS design system
 */

/**
 * Utility class for PLUS applications
 */
export class PlusUtil {
    
    static MIN_SCREEN_SIZE = 768;

    /**
     * Checks screen size and handles responsive behavior
     */
    static checkResize() {
        const screenWidth = window.innerWidth;
        // Add resize handling logic here
        return screenWidth >= this.MIN_SCREEN_SIZE;
    }

    /**
     * Gets a value from localStorage
     * @param {string} id - User/tutor ID
     * @param {string} key - Key to retrieve
     * @returns {*} Stored value
     */
    static getLocalStorage(id, key) {
        try {
            const userInfo = JSON.parse(localStorage.getItem(`PLUSUserData_${id}`) || "{}");
            return userInfo[key];
        } catch (e) {
            console.error("Error reading from localStorage:", e);
            return null;
        }
    }

    /**
     * Sets a value in localStorage
     * @param {string} id - User/tutor ID
     * @param {string} key - Key to set
     * @param {*} val - Value to store
     */
    static setLocalStorage(id, key, val) {
        try {
            const infoKey = `PLUSUserData_${id}`;
            const userInfo = JSON.parse(localStorage.getItem(infoKey) || "{}");
            userInfo[key] = val;
            localStorage.setItem(infoKey, JSON.stringify(userInfo));
        } catch (e) {
            console.error("Error writing to localStorage:", e);
        }
    }
}

/**
 * String utility functions
 */
export class PlusStringUtil {

    /**
     * Converts a string to kebab-case
     * @param {string} str - String to convert
     * @returns {string} Kebab-case string
     */
    static convertToKebabCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }

    /**
     * Capitalizes the first letter of a string
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    static capitalize(str) {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

/**
 * Network utility functions for handling connection errors
 */
export class PlusNetworkUtil {
    
    /**
     * Checks if the browser is online
     * @returns {boolean} True if online, false otherwise
     */
    static isOnline() {
        return navigator.onLine !== false;
    }

    /**
     * Monitors network status and handles connection failures
     * @param {Function} onConnectionFailed - Callback when connection fails
     * @param {Function} onConnectionRestored - Callback when connection is restored
     */
    static monitorConnection(onConnectionFailed = null, onConnectionRestored = null) {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            if (onConnectionRestored) {
                onConnectionRestored();
            }
        });

        window.addEventListener('offline', () => {
            if (onConnectionFailed) {
                onConnectionFailed();
            }
        });

        // Check initial status
        if (!this.isOnline() && onConnectionFailed) {
            onConnectionFailed();
        }
    }

    /**
     * Checks if external resources (CDN) are loading properly
     * @param {Array<string>} resourceUrls - URLs to check
     * @returns {Promise<boolean>} True if all resources load successfully
     */
    static async checkResources(resourceUrls = []) {
        if (!this.isOnline()) {
            return false;
        }

        const defaultUrls = [
            'https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
            'https://code.jquery.com/jquery-3.6.0.min.js'
        ];

        const urlsToCheck = resourceUrls.length > 0 ? resourceUrls : defaultUrls;
        
        try {
            const checks = urlsToCheck.map(url => {
                return fetch(url, { 
                    method: 'HEAD', 
                    mode: 'no-cors',
                    cache: 'no-cache'
                }).catch(() => false);
            });
            
            const results = await Promise.all(checks);
            return results.every(result => result !== false);
        } catch (error) {
            console.error('Error checking resources:', error);
            return false;
        }
    }
}

