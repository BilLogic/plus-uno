/**
 * @fileoverview Popover component for PLUS design system.
 * Universal element component for creating popovers that display additional information.
 * Matches Figma design system specifications exactly.
 * Uses Bootstrap 4.6.2 popover functionality with PLUS design system styling.
 */

/**
 * Creates a popover element styled according to PLUS design system
 * Matches Figma design system specifications exactly
 * @param {Object} options - Popover configuration options
 * @param {string|HTMLElement} options.trigger - Trigger element (button, link, etc.) or selector string
 * @param {string} options.content - Popover content text
 * @param {string} [options.title] - Popover title (optional - creates "title + content" type)
 * @param {string} [options.placement="top"] - Popover placement ("top", "bottom", "left", "right")
 * @param {string} [options.triggerType="click"] - Trigger type ("click", "hover", "focus", "manual")
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
    
    // Add type class based on whether title is provided
    if (title) {
        triggerElement.classList.add("plus-popover-title-content");
    } else {
        triggerElement.classList.add("plus-popover-content-only");
    }
    
    // Add placement class
    triggerElement.classList.add(`plus-popover-${placement}`);
    
    if (classes && classes.length > 0) {
        triggerElement.classList.add(...classes);
    }
    
    if (id) {
        triggerElement.id = id;
    }

    // Build popover content HTML based on type
    let popoverContent = "";
    if (title) {
        // Title + Content type
        popoverContent = `
            <div class="plus-popover-title">${title}</div>
            <div class="plus-popover-body">${content}</div>
        `;
    } else {
        // Content only type
        popoverContent = `<div class="plus-popover-body">${content}</div>`;
    }
    
    // Set Bootstrap popover data attributes
    triggerElement.setAttribute("data-toggle", "popover");
    triggerElement.setAttribute("data-placement", placement);
    triggerElement.setAttribute("data-trigger", triggerType);
    triggerElement.setAttribute("data-content", popoverContent);
    triggerElement.setAttribute("data-html", "true");

    // Initialize Bootstrap popover when jQuery is available
    if (typeof $ !== "undefined") {
        $(triggerElement).popover({
            html: true,
            container: "body"
        });
        
        // After popover is shown, add our custom class and restructure if needed
        $(triggerElement).on('shown.bs.popover', function() {
            const popover = $(this).data('bs.popover');
            if (popover && popover.tip) {
                const $tip = $(popover.tip);
                $tip.addClass('plus-popover');
                
                // Remove Bootstrap's default header if it exists
                $tip.find('.popover-header').remove();
            }
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
    id,
    classes = []
} = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-primary";
    button.textContent = buttonText;
    
    // Use createPopover to add popover functionality
    return createPopover({
        trigger: button,
        content,
        title,
        placement,
        triggerType,
        id,
        classes
    });
}

