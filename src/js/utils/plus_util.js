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

    /**
     * Handles connection errors and displays user-friendly error message
     * @param {string} [customMessage] - Custom error message (optional)
     * @param {HTMLElement} [container] - Container element to display error in (optional, defaults to body)
     */
    static handleConnectionError(customMessage = null, container = null) {
        const errorMessage = customMessage || "Connection failed. If the problem persists, please check your internet connection or VPN.";
        
        // Use provided container or default to body
        const targetContainer = container || document.body;
        
        // Check if error alert already exists to avoid duplicates
        const existingError = document.getElementById('plus-connection-error');
        if (existingError) {
            return;
        }

        // Import alert component dynamically
        import('../components/universal/elements/alert.js').then(({ createAlert }) => {
            const errorAlert = createAlert({
                id: 'plus-connection-error',
                style: 'danger',
                title: 'Connection Error',
                text: errorMessage,
                dismissable: true,
                onDismiss: () => {
                    // Allow retry after dismissing
                }
            });
            
            // Insert at the top of the container
            if (targetContainer.firstChild) {
                targetContainer.insertBefore(errorAlert, targetContainer.firstChild);
            } else {
                targetContainer.appendChild(errorAlert);
            }
        }).catch(err => {
            // Fallback if alert component fails to load
            console.error("Failed to load alert component:", err);
            const fallbackError = document.createElement('div');
            fallbackError.id = 'plus-connection-error';
            fallbackError.style.cssText = 'padding: 1rem; margin: 1rem; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 4px;';
            fallbackError.innerHTML = `<strong>Connection Error</strong><br>${errorMessage}`;
            if (targetContainer.firstChild) {
                targetContainer.insertBefore(fallbackError, targetContainer.firstChild);
            } else {
                targetContainer.appendChild(fallbackError);
            }
        });
    }

    /**
     * Checks if a resource failed to load and handles the error
     * @param {string} resourceUrl - URL of the resource that failed
     * @param {string} resourceType - Type of resource (css, js, etc.)
     */
    static handleResourceLoadError(resourceUrl, resourceType = 'resource') {
        console.error(`Failed to load ${resourceType}:`, resourceUrl);
        this.handleConnectionError();
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

