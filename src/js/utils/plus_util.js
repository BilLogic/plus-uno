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

