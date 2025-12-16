/**
 * @fileoverview StatusIndicators component for Training Onboarding Elements
 * Status indicator icons showing different stages: not started, in progress, completed
 * Matches Figma design system specifications
 */

/**
 * Creates a StatusIndicators component
 * @param {Object} options - Component configuration
 * @param {string} [options.stage="not started"] - Status stage: "not started", "in progress", "completed"
 * @returns {HTMLElement} StatusIndicators element
 */
export function createStatusIndicators({ stage = "not started" } = {}) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "flex-start";
    
    const button = document.createElement("div");
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.borderRadius = "var(--size-element-radius-md)";
    button.style.minWidth = "36px";
    button.style.padding = "var(--size-element-pad-y-md) var(--size-element-pad-x-md)";
    button.style.gap = "var(--size-element-gap-md)";
    
    const iconWrapper = document.createElement("div");
    iconWrapper.style.display = "flex";
    iconWrapper.style.alignItems = "center";
    iconWrapper.style.justifyContent = "center";
    iconWrapper.style.width = "12px";
    iconWrapper.style.height = "12px";
    iconWrapper.style.flexShrink = "0";
    
    const icon = document.createElement("i");
    icon.style.fontSize = "14px";
    icon.style.color = "var(--color-on-surface-variant)";
    icon.style.lineHeight = "1.714";
    
    // Set icon based on stage
    if (stage === "in progress") {
        icon.className = "fas fa-spinner";
    } else if (stage === "completed") {
        icon.className = "fas fa-circle-check";
    } else {
        // not started
        icon.className = "fas fa-circle-stop";
    }
    
    iconWrapper.appendChild(icon);
    button.appendChild(iconWrapper);
    container.appendChild(button);
    
    return container;
}

