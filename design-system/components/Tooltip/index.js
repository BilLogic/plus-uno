/**
 * @fileoverview Tooltip component for PLUS design system.
 * Universal element component for creating tooltips that display brief information.
 * Uses Bootstrap 4.6.2 tooltip functionality with PLUS design system styling.
 */

/**
 * Creates a tooltip element styled according to PLUS design system
 * @param {Object} options - Tooltip configuration options
 * @param {string|HTMLElement} options.trigger - Trigger element (button, link, icon, etc.) or selector string
 * @param {string} options.text - Tooltip text content
 * @param {string} [options.placement="top"] - Tooltip placement ("top", "bottom", "left", "right")
 * @param {string} [options.triggerType="hover"] - Trigger type ("hover", "focus", "click", "manual")
 * @param {string} [options.size="default"] - Tooltip size ("small", "default", "large")
 * @param {string} [options.id] - Tooltip ID
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @param {boolean} [options.html=false] - Whether to allow HTML in tooltip content
 * @returns {HTMLElement} Tooltip trigger element with tooltip initialized
 */
export function createTooltip({
    trigger,
    text,
    placement = "top",
    triggerType = "hover",
    size = "default",
    id,
    classes = [],
    html = false
} = {}) {
    // If trigger is a string selector, find the element
    let triggerElement;
    if (typeof trigger === "string") {
        triggerElement = document.querySelector(trigger);
        if (!triggerElement) {
            console.warn(`Tooltip: Trigger element not found: ${trigger}`);
            return null;
        }
    } else if (trigger instanceof HTMLElement) {
        triggerElement = trigger;
    } else {
        console.warn("Tooltip: Invalid trigger element provided");
        return null;
    }

    // Add tooltip classes
    triggerElement.classList.add("plus-tooltip-trigger");
    
    if (size && size !== "default") {
        triggerElement.classList.add(`plus-tooltip-${size}`);
    }
    
    if (classes && classes.length > 0) {
        triggerElement.classList.add(...classes);
    }
    
    if (id) {
        triggerElement.id = id;
    }

    // Set Bootstrap tooltip data attributes
    triggerElement.setAttribute("data-toggle", "tooltip");
    triggerElement.setAttribute("data-placement", placement);
    triggerElement.setAttribute("data-trigger", triggerType);
    
    // Add data attribute for size (for CSS targeting)
    if (size) {
        triggerElement.setAttribute("data-tooltip-size", size);
    }
    
    // Use title attribute for tooltip text (Bootstrap 4.6.2 standard)
    if (html) {
        triggerElement.setAttribute("data-html", "true");
        triggerElement.setAttribute("data-original-title", text);
    } else {
        triggerElement.setAttribute("title", text);
    }

    // Initialize Bootstrap tooltip when jQuery is available
    if (typeof $ !== "undefined") {
        $(triggerElement).tooltip({
            html: html,
            container: "body",
            // Ensure tooltip gets proper classes when shown
            template: '<div class="tooltip" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>'
        });
        
        // After tooltip is shown, apply size class to tooltip element
        $(triggerElement).on('shown.bs.tooltip', function() {
            const tooltipElement = document.querySelector('.tooltip.show');
            if (tooltipElement && size && size !== "default") {
                tooltipElement.classList.add(`plus-tooltip-${size}`);
                tooltipElement.setAttribute("data-tooltip-size", size);
            }
        });
    } else {
        console.warn("Tooltip: jQuery is required for Bootstrap tooltip functionality");
    }

    return triggerElement;
}

/**
 * Creates a tooltip trigger button with tooltip functionality
 * @param {Object} options - Tooltip button configuration options
 * @param {string} options.buttonText - Button text
 * @param {string} options.text - Tooltip text content
 * @param {string} [options.placement="top"] - Tooltip placement ("top", "bottom", "left", "right")
 * @param {string} [options.triggerType="hover"] - Trigger type ("hover", "focus", "click", "manual")
 * @param {string} [options.size="default"] - Tooltip size ("small", "default", "large")
 * @param {string} [options.buttonStyle="default"] - Button style ("primary", "secondary", "success", "danger", "warning", "info", "default")
 * @param {string} [options.buttonFill="filled"] - Button fill ("filled", "outline", "tonal", "text")
 * @param {string} [options.buttonSize="default"] - Button size ("small", "default", "large")
 * @param {string} [options.id] - Tooltip ID
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @param {boolean} [options.html=false] - Whether to allow HTML in tooltip content
 * @returns {HTMLElement} Button element with tooltip initialized
 */
export function createTooltipButton({
    buttonText,
    text,
    placement = "top",
    triggerType = "hover",
    size = "default",
    buttonStyle = "default",
    buttonFill = "filled",
    buttonSize = "default",
    id,
    classes = [],
    html = false
} = {}) {
    // Import PlusInterface dynamically to avoid circular dependencies
    // In a real scenario, you might want to import this at the top
    // For now, we'll create a simple button element
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("btn");
    button.textContent = buttonText;
    
    // Use createTooltip to add tooltip functionality
    return createTooltip({
        trigger: button,
        text,
        placement,
        triggerType,
        size,
        id,
        classes,
        html
    });
}

/**
 * Destroys all tooltips in the document
 * Useful for cleanup in Storybook or when resetting the UI
 */
export function destroyAllTooltips() {
    if (typeof $ !== "undefined" && $.fn.tooltip) {
        // Find all elements with tooltip data attribute
        const tooltipElements = document.querySelectorAll('[data-toggle="tooltip"]');
        
        // Destroy each tooltip instance
        tooltipElements.forEach((element) => {
            try {
                const $element = $(element);
                // Check if tooltip is initialized
                if ($element.data('bs.tooltip')) {
                    $element.tooltip('dispose');
                }
            } catch (e) {
                // Silently fail if tooltip is not initialized
            }
        });
        
        // Also remove any tooltip elements that might be in the DOM
        const tooltipElementsInDOM = document.querySelectorAll('.tooltip');
        tooltipElementsInDOM.forEach((tooltip) => {
            try {
                const $tooltip = $(tooltip);
                if ($tooltip.data('bs.tooltip')) {
                    $tooltip.tooltip('dispose');
                }
                // Remove the tooltip element from DOM
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            } catch (e) {
                // Silently fail
            }
        });
    }
}

/**
 * Creates a static tooltip element for Storybook display (always visible, no interaction required)
 * Matches Figma design system specifications exactly
 * @param {Object} options - Static tooltip configuration options
 * @param {string} options.text - Tooltip text content
 * @param {string} [options.placement="top"] - Tooltip placement ("top", "bottom", "left", "right")
 * @param {string} [options.size="default"] - Tooltip size ("small", "default", "large")
 * @returns {HTMLElement} Static tooltip element
 */
export function createStaticTooltip({
    text,
    placement = "top",
    size = "default"
} = {}) {
    const tooltip = document.createElement("div");
    tooltip.className = `tooltip bs-tooltip-${placement} show`;
    if (size && size !== "default") {
        tooltip.classList.add(`plus-tooltip-${size}`);
    }
    tooltip.setAttribute("data-placement", placement);
    tooltip.setAttribute("data-tooltip-size", size);
    tooltip.style.opacity = "1";
    
    // Create arrow
    const arrow = document.createElement("div");
    arrow.className = "arrow";
    tooltip.appendChild(arrow);
    
    // Create tooltip inner (this has the box styling: border-radius, background, padding)
    const tooltipInner = document.createElement("div");
    tooltipInner.className = "tooltip-inner";
    tooltipInner.textContent = text;
    
    tooltip.appendChild(tooltipInner);
    
    return tooltip;
}

