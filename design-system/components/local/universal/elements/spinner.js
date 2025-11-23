/**
 * @fileoverview Spinner component for PLUS design system.
 * Universal element component for creating loading spinners.
 * Uses Bootstrap 4.6.2's spinner component pattern.
 * 
 * Reference: https://getbootstrap.com/docs/4.6/components/spinners/
 */

/**
 * Creates a spinner component
 * @param {Object} options - Spinner configuration
 * @param {string} [options.style='primary'] - Spinner style (primary, secondary, tertiary, success, danger, warning, info)
 * @param {string} [options.size='default'] - Spinner size (small, default, large)
 * @param {string} [options.label='Loading...'] - Screen reader label text
 * @param {string} [options.id] - Spinner container ID
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @returns {HTMLElement} Spinner element
 */
export function createSpinner({
    style = 'primary',
    size = 'default',
    label = 'Loading...',
    id = null,
    classes = []
} = {}) {
    // Bootstrap 4.6.2 spinner-border container
    const spinner = document.createElement("div");
    spinner.classList.add("spinner-border", "plus-spinner", `plus-spinner-${style}`, `plus-spinner-${size}`);
    
    // Set ARIA attributes for accessibility
    spinner.setAttribute("role", "status");
    spinner.setAttribute("aria-label", label);
    
    if (id) {
        spinner.id = id;
    }
    
    if (classes && classes.length > 0) {
        spinner.classList.add(...classes);
    }
    
    // Screen reader only text
    const srOnly = document.createElement("span");
    srOnly.classList.add("sr-only");
    srOnly.textContent = label;
    spinner.appendChild(srOnly);
    
    return spinner;
}



