/**
 * @fileoverview Popover component for PLUS design system.
 * Universal element component for creating popovers that display additional information.
 * Uses Bootstrap 4.6.2 popover functionality with PLUS design system styling.
 */

/**
 * Creates a popover element styled according to PLUS design system
 * @param {Object} options - Popover configuration options
 * @param {string|HTMLElement} options.trigger - Trigger element (button, link, etc.) or selector string
 * @param {string} options.content - Popover content text
 * @param {string} [options.title] - Popover title (optional)
 * @param {string} [options.placement="top"] - Popover placement ("top", "bottom", "left", "right")
 * @param {string} [options.triggerType="click"] - Trigger type ("click", "hover", "focus", "manual")
 * @param {string} [options.size="default"] - Popover size ("small", "default", "large")
 * @param {string} [options.id] - Popover ID
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @returns {HTMLElement} Popover trigger element with popover initialized
 */
export function createPopover({
    trigger,
    content,
    title,
    placement = "top",
    triggerType = "click",
    size = "default",
    id,
    classes = []
} = {}) {
    // If trigger is a string selector, find the element
    let triggerElement;
    if (typeof trigger === "string") {
        triggerElement = document.querySelector(trigger);
        if (!triggerElement) {
            console.warn(`Popover: Trigger element not found: ${trigger}`);
            return null;
        }
    } else if (trigger instanceof HTMLElement) {
        triggerElement = trigger;
    } else {
        console.warn("Popover: Invalid trigger element provided");
        return null;
    }

    // Add popover classes
    triggerElement.classList.add("plus-popover-trigger");
    
    if (size && size !== "default") {
        triggerElement.classList.add(`plus-popover-${size}`);
    }
    
    if (classes && classes.length > 0) {
        triggerElement.classList.add(...classes);
    }
    
    if (id) {
        triggerElement.id = id;
    }

    // Set Bootstrap popover data attributes
    triggerElement.setAttribute("data-toggle", "popover");
    triggerElement.setAttribute("data-placement", placement);
    triggerElement.setAttribute("data-trigger", triggerType);
    triggerElement.setAttribute("data-content", content);
    
    if (title) {
        triggerElement.setAttribute("data-title", title);
    }

    // Initialize Bootstrap popover when jQuery is available
    if (typeof $ !== "undefined") {
        $(triggerElement).popover({
            html: true,
            container: "body"
        });
    } else {
        console.warn("Popover: jQuery is required for Bootstrap popover functionality");
    }

    return triggerElement;
}

/**
 * Creates a popover trigger button with popover functionality
 * @param {Object} options - Popover button configuration options
 * @param {string} options.buttonText - Button text
 * @param {string} options.content - Popover content text
 * @param {string} [options.title] - Popover title (optional)
 * @param {string} [options.placement="top"] - Popover placement ("top", "bottom", "left", "right")
 * @param {string} [options.triggerType="click"] - Trigger type ("click", "hover", "focus", "manual")
 * @param {string} [options.size="default"] - Popover size ("small", "default", "large")
 * @param {string} [options.buttonStyle="default"] - Button style ("primary", "secondary", "success", "danger", "warning", "info", "default")
 * @param {string} [options.buttonFill="filled"] - Button fill ("filled", "outline", "tonal", "text")
 * @param {string} [options.buttonSize="default"] - Button size ("small", "default", "large")
 * @param {string} [options.id] - Popover ID
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @returns {HTMLElement} Button element with popover initialized
 */
export function createPopoverButton({
    buttonText,
    content,
    title,
    placement = "top",
    triggerType = "click",
    size = "default",
    buttonStyle = "default",
    buttonFill = "filled",
    buttonSize = "default",
    id,
    classes = []
} = {}) {
    // Import PlusInterface dynamically to avoid circular dependencies
    // In a real scenario, you might want to import this at the top
    // For now, we'll create a simple button element
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("btn");
    button.textContent = buttonText;
    
    // Use createPopover to add popover functionality
    return createPopover({
        trigger: button,
        content,
        title,
        placement,
        triggerType,
        size,
        id,
        classes
    });
}



