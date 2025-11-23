/**
 * @fileoverview Loading GIF component for PLUS design system.
 * Universal element component for creating CSS-animated loading indicators.
 * Uses CSS animations instead of actual GIF files for better performance and customization.
 * 
 * Component Type: Element (uses `element-*` tokens)
 */

/**
 * Creates a loading GIF component (CSS-animated)
 * @param {Object} options - Loading GIF configuration
 * @param {string} [options.style='primary'] - Loading style (primary, secondary, tertiary, success, danger, warning, info)
 * @param {string} [options.size='default'] - Loading size (small, default, large)
 * @param {string} [options.label='Loading...'] - Screen reader label text
 * @param {string} [options.id] - Loading container ID
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @returns {HTMLElement} Loading GIF element
 */
export function createLoadingGif({
    style = 'primary',
    size = 'default',
    label = 'Loading...',
    id = null,
    classes = []
} = {}) {
    // Create container div for the animated loading indicator
    const container = document.createElement('div');
    container.classList.add('plus-loading-gif', `plus-loading-gif-${style}`, `plus-loading-gif-${size}`);
    
    // Set ARIA attributes for accessibility
    container.setAttribute('role', 'status');
    container.setAttribute('aria-label', label);
    
    if (id) {
        container.id = id;
    }
    
    if (classes && classes.length > 0) {
        container.classList.add(...classes);
    }
    
    // Create animated dots (common loading pattern)
    // Three dots that pulse in sequence
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.classList.add('plus-loading-gif-dot');
        dot.style.animationDelay = `${i * 0.15}s`;
        container.appendChild(dot);
    }
    
    // Screen reader only text
    const srOnly = document.createElement('span');
    srOnly.classList.add('sr-only');
    srOnly.textContent = label;
    container.appendChild(srOnly);
    
    return container;
}

