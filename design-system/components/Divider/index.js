/**
 * @fileoverview Divider component for PLUS design system.
 * Universal element component for visual separation.
 * Matches Figma design system specifications.
 * 
 * Component Type: Element (uses `element-*` tokens)
 * Token Usage: --size-element-stroke-sm/md/lg/xl for stroke width
 */

/**
 * Creates a divider component
 * @param {Object} options - Divider configuration
 * @param {"sm"|"md"|"lg"|"xl"|string} [options.size="md"] - Divider size using semantic tokens (sm=1px, md=1.5px, lg=2px, xl=2.5px)
 *   Also accepts legacy pixel values ('1px', '1.5px', '2px', '2.5px') for backward compatibility
 * @param {"light"|"dark"} [options.style="light"] - Divider style (light uses outline-variant, dark uses outline)
 * @param {boolean} [options.opacity10=false] - Whether to apply 10% opacity (for accordion/collapse use cases)
 * @param {string} [options.id] - Divider ID
 * @param {string} [options.width] - Custom width (e.g., '114px', '100%'). Defaults to 100%
 * @param {Array<string>} [options.classes] - Additional CSS classes
 * @param {Object} [options.styles] - Additional inline styles
 * @returns {HTMLElement} Divider element
 */
export function createDivider({
    size = "md",
    style = "light",
    opacity10 = false,
    id,
    width,
    classes = [],
    styles = null
}) {
    const divider = document.createElement("div");
    divider.classList.add("plus-divider");
    
    // Map semantic sizes to CSS classes
    // Support both semantic tokens (sm, md, lg, xl) and legacy pixel values
    const sizeMap = {
        "sm": "sm",
        "md": "md", 
        "lg": "lg",
        "xl": "xl",
        "1px": "sm",
        "1.5px": "md",
        "2px": "lg",
        "2.5px": "xl"
    };
    
    const sizeClass = sizeMap[size] || "md";
    divider.classList.add(`plus-divider-${sizeClass}`);
    
    // Add style class
    divider.classList.add(`plus-divider-${style}`);
    
    if (opacity10) {
        divider.classList.add("plus-divider-opacity-10");
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
    
    if (styles) {
        Object.assign(divider.style, styles);
    }
    
    const line = document.createElement("div");
    line.classList.add("plus-divider-line");
    divider.appendChild(line);
    
    return divider;
}

