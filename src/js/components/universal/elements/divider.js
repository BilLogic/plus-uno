/**
 * @fileoverview Divider component for PLUS design system.
 * Universal element component for visual separation.
 * Matches Figma design system specifications.
 */

/**
 * Creates a divider component
 * @param {Object} options - Divider configuration
 * @param {string} [options.size='1px'] - Divider size (1px, 2px, 3px, 4px)
 * @param {string} [options.style='light'] - Divider style (light, dark)
 * @param {boolean} [options.opacity10=false] - Whether to apply 10% opacity
 * @param {string} [options.id] - Divider ID
 * @param {string} [options.width] - Custom width (e.g., '114px', '100%')
 * @param {Array} [options.classes] - Additional CSS classes
 * @returns {HTMLElement} Divider element
 */
export function createDivider({
    size = '1px',
    style = 'light',
    opacity10 = false,
    id,
    width,
    classes = []
}) {
    const divider = document.createElement("div");
    divider.classList.add("plus-divider", `size-${size}`, style);
    
    if (opacity10) {
        divider.classList.add("opacity-10");
    }
    
    if (id) {
        divider.id = id;
    }
    
    if (width) {
        divider.style.width = width;
    }
    
    if (classes && classes.length > 0) {
        divider.classList.add(...classes);
    }
    
    const line = document.createElement("div");
    line.classList.add("plus-divider-line");
    divider.appendChild(line);
    
    return divider;
}

