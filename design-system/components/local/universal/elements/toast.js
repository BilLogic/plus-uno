/**
 * @fileoverview Toast component for PLUS design system.
 * Universal element component for displaying toast notifications.
 * Based on Bootstrap 4.6.2 toast structure with PLUS design tokens.
 * 
 * Bootstrap 4.6.2 Reference: https://getbootstrap.com/docs/4.6/components/toasts/
 */

/**
 * Toast container element (singleton)
 * @type {HTMLElement|null}
 */
let toastContainer = null;

/**
 * Gets or creates the toast container
 * @param {string} [position='top-right'] - Position of toast container (top-right, top-left, bottom-right, bottom-left)
 * @returns {HTMLElement} Toast container element
 */
function getToastContainer(position = 'top-right') {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'plus-toast-container';
        toastContainer.setAttribute('aria-live', 'polite');
        toastContainer.setAttribute('aria-atomic', 'true');
        document.body.appendChild(toastContainer);
    }
    
    // Update position class
    toastContainer.className = `plus-toast-container plus-toast-${position}`;
    
    return toastContainer;
}

/**
 * Creates a toast notification component
 * @param {Object} options - Toast configuration
 * @param {string} [options.id] - Toast ID
 * @param {string} options.style - Toast style (primary, secondary, success, danger, warning, info)
 * @param {string} [options.title] - Toast title/header
 * @param {string} options.text - Toast body text
 * @param {boolean} [options.dismissable=true] - Whether toast can be dismissed
 * @param {number} [options.delay=5000] - Auto-hide delay in milliseconds (0 to disable auto-hide)
 * @param {string} [options.position='top-right'] - Position of toast (top-right, top-left, bottom-right, bottom-left)
 * @param {Function} [options.onDismiss] - Function to call when toast is dismissed
 * @param {Function} [options.onShow] - Function to call when toast is shown
 * @param {Function} [options.onHide] - Function to call when toast is hidden
 * @returns {HTMLElement} Toast element
 */
export function createToast({
    id,
    style,
    title,
    text,
    dismissable = true,
    delay = 5000,
    position = 'top-right',
    onDismiss = null,
    onShow = null,
    onHide = null
} = {}) {
    // Validate required parameters
    if (!style) {
        throw new Error('Toast style is required');
    }
    if (!text) {
        throw new Error('Toast text is required');
    }

    // Create toast element
    const toast = document.createElement('div');
    if (id) {
        toast.id = id;
    }
    toast.className = 'plus-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Add style class
    if (style) {
        toast.classList.add(style);
    }

    // Create toast header if title is provided
    if (title) {
        const header = document.createElement('div');
        header.className = 'plus-toast-header';
        
        const titleEl = document.createElement('strong');
        titleEl.className = 'plus-toast-title';
        titleEl.textContent = title;
        header.appendChild(titleEl);

        // Add dismiss button in header if dismissable
        if (dismissable) {
            const dismissBtn = document.createElement('button');
            dismissBtn.type = 'button';
            dismissBtn.className = 'plus-toast-close';
            dismissBtn.setAttribute('aria-label', 'Close');
            dismissBtn.innerHTML = '<i class="fas fa-xmark"></i>';
            dismissBtn.addEventListener('click', () => {
                hideToast(toast, onDismiss);
            });
            header.appendChild(dismissBtn);
        }
        
        toast.appendChild(header);
    }

    // Create toast body
    const body = document.createElement('div');
    body.className = 'plus-toast-body';
    body.textContent = text;
    toast.appendChild(body);

    // If no title, add dismiss button to body
    if (!title && dismissable) {
        const dismissBtn = document.createElement('button');
        dismissBtn.type = 'button';
        dismissBtn.className = 'plus-toast-close plus-toast-close-body';
        dismissBtn.setAttribute('aria-label', 'Close');
        dismissBtn.innerHTML = '<i class="fas fa-xmark"></i>';
        dismissBtn.addEventListener('click', () => {
            hideToast(toast, onDismiss);
        });
        body.appendChild(dismissBtn);
    }

    // Get toast container and append toast
    const container = getToastContainer(position);
    container.appendChild(toast);

    // Trigger show animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
        if (onShow) {
            onShow();
        }
    });

    // Auto-hide if delay is set
    if (delay > 0) {
        const timeoutId = setTimeout(() => {
            hideToast(toast, onDismiss);
        }, delay);
        
        // Store timeout ID on toast element for potential cancellation
        toast._timeoutId = timeoutId;
    }

    return toast;
}

/**
 * Hides a toast with animation
 * @param {HTMLElement} toast - Toast element to hide
 * @param {Function} [onDismiss] - Callback function
 */
function hideToast(toast, onDismiss) {
    // Clear auto-hide timeout if exists
    if (toast._timeoutId) {
        clearTimeout(toast._timeoutId);
        delete toast._timeoutId;
    }

    // Remove show class to trigger hide animation
    toast.classList.remove('show');
    
    // Remove element after animation completes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
        if (onDismiss) {
            onDismiss();
        }
    }, 300); // Match CSS transition duration
}

/**
 * Shows a toast (programmatically)
 * @param {HTMLElement} toast - Toast element to show
 */
export function showToast(toast) {
    if (toast && toast.classList.contains('plus-toast')) {
        toast.classList.add('show');
    }
}

/**
 * Hides a toast (programmatically)
 * @param {HTMLElement} toast - Toast element to hide
 */
export function hideToastElement(toast) {
    if (toast && toast.classList.contains('plus-toast')) {
        hideToast(toast);
    }
}

/**
 * Creates a static toast element for display purposes (e.g., in Storybook)
 * This creates a toast that is not fixed-position and can be displayed in the document flow
 * @param {Object} options - Toast configuration
 * @param {string} [options.id] - Toast ID
 * @param {string} options.style - Toast style (primary, secondary, success, danger, warning, info)
 * @param {string} [options.title] - Toast title/header
 * @param {string} options.text - Toast body text
 * @param {boolean} [options.dismissable=true] - Whether toast can be dismissed
 * @returns {HTMLElement} Static toast element
 */
export function createStaticToast({
    id,
    style,
    title,
    text,
    dismissable = true
} = {}) {
    // Validate required parameters
    if (!style) {
        throw new Error('Toast style is required');
    }
    if (!text) {
        throw new Error('Toast text is required');
    }

    // Create toast element
    const toast = document.createElement('div');
    if (id) {
        toast.id = id;
    }
    toast.className = 'plus-toast plus-toast-static show';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Add style class
    if (style) {
        toast.classList.add(style);
    }

    // Create toast header if title is provided
    if (title) {
        const header = document.createElement('div');
        header.className = 'plus-toast-header';
        
        const titleEl = document.createElement('strong');
        titleEl.className = 'plus-toast-title';
        titleEl.textContent = title;
        header.appendChild(titleEl);

        // Add dismiss button in header if dismissable
        if (dismissable) {
            const dismissBtn = document.createElement('button');
            dismissBtn.type = 'button';
            dismissBtn.className = 'plus-toast-close';
            dismissBtn.setAttribute('aria-label', 'Close');
            dismissBtn.innerHTML = '<i class="fas fa-xmark"></i>';
            // Don't add click handler for static display
            header.appendChild(dismissBtn);
        }
        
        toast.appendChild(header);
    }

    // Create toast body
    const body = document.createElement('div');
    body.className = 'plus-toast-body';
    body.textContent = text;
    toast.appendChild(body);

    // If no title, add dismiss button to body
    if (!title && dismissable) {
        const dismissBtn = document.createElement('button');
        dismissBtn.type = 'button';
        dismissBtn.className = 'plus-toast-close plus-toast-close-body';
        dismissBtn.setAttribute('aria-label', 'Close');
        dismissBtn.innerHTML = '<i class="fas fa-xmark"></i>';
        // Don't add click handler for static display
        body.appendChild(dismissBtn);
    }

    return toast;
}

/**
 * Clears all toasts from the container
 * Useful for cleanup in Storybook or when resetting the UI
 */
export function clearAllToasts() {
    if (toastContainer) {
        // Get all toast elements
        const toasts = toastContainer.querySelectorAll('.plus-toast');
        
        // Clear all timeouts and remove toasts
        toasts.forEach((toast) => {
            // Clear auto-hide timeout if exists
            if (toast._timeoutId) {
                clearTimeout(toast._timeoutId);
                delete toast._timeoutId;
            }
            // Remove toast immediately
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }
}

