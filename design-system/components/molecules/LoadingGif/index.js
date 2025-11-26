/**
 * @fileoverview Loading GIF component for PLUS design system.
 * Universal element component for creating CSS-animated loading indicators.
 * Implements three animation types from Figma: Growing Grid, Rotating Grid, and Stacking Grid.
 * 
 * Component Type: Element (uses `element-*` tokens)
 * 
 * Figma Reference:
 * - Growing Grid: For "Generating Content" use case
 * - Rotating Grid: For "Working with Existing Content" use case
 * - Stacking Grid: For "Uploading/Importing Content" use case
 */

/**
 * Creates a loading GIF component (CSS-animated)
 * @param {Object} options - Loading GIF configuration
 * @param {string} [options.type='growing'] - Animation type (growing, rotating, stacking)
 * @param {string} [options.size='default'] - Loading size (small, default, large)
 * @param {string} [options.label='Loading...'] - Screen reader label text
 * @param {string} [options.id] - Loading container ID
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @returns {HTMLElement} Loading GIF element
 */
export function createLoadingGif({
    type = 'growing',
    size = 'default',
    label = 'Loading...',
    id = null,
    classes = []
} = {}) {
    // Create container div for the animated loading indicator
    const container = document.createElement('div');
    container.classList.add('plus-loading-gif', `plus-loading-gif-${type}`, `plus-loading-gif-${size}`);
    
    // Set ARIA attributes for accessibility
    container.setAttribute('role', 'status');
    container.setAttribute('aria-label', label);
    
    if (id) {
        container.id = id;
    }
    
    if (classes && classes.length > 0) {
        container.classList.add(...classes);
    }
    
    // Create the appropriate animation structure based on type
    if (type === 'growing') {
        // Growing Grid: 3x3 grid (9 squares) that grows from center
        const grid = document.createElement('div');
        grid.classList.add('plus-loading-gif-grid');
        
        for (let i = 0; i < 9; i++) {
            const square = document.createElement('div');
            square.classList.add('plus-loading-gif-square');
            square.classList.add(`plus-loading-gif-square-${i + 1}`);
            grid.appendChild(square);
        }
        
        container.appendChild(grid);
    } else if (type === 'rotating') {
        // Rotating Grid: 2x2 grid (3 squares forming L-shape) that rotates
        const grid = document.createElement('div');
        grid.classList.add('plus-loading-gif-grid');
        
        for (let i = 0; i < 3; i++) {
            const square = document.createElement('div');
            square.classList.add('plus-loading-gif-square');
            square.classList.add(`plus-loading-gif-square-${i + 1}`);
            grid.appendChild(square);
        }
        
        container.appendChild(grid);
    } else if (type === 'stacking') {
        // Stacking Grid: 4 squares that stack and rotate in sequence
        const grid = document.createElement('div');
        grid.classList.add('plus-loading-gif-grid');
        
        for (let i = 0; i < 4; i++) {
            const square = document.createElement('div');
            square.classList.add('plus-loading-gif-square');
            square.classList.add(`plus-loading-gif-square-${i + 1}`);
            grid.appendChild(square);
        }
        
        container.appendChild(grid);
    }
    
    // Screen reader only text
    const srOnly = document.createElement('span');
    srOnly.classList.add('sr-only');
    srOnly.textContent = label;
    container.appendChild(srOnly);
    
    return container;
}

