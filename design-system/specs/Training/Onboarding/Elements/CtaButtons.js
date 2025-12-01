/**
 * @fileoverview CtaButtons component for Training Onboarding Elements
 * CTA button component with different states: not started (Get Started), in progress (Continue), completed (Review)
 * Matches Figma design system specifications
 */

/**
 * Creates a CtaButtons component
 * @param {Object} options - Component configuration
 * @param {string} [options.state="not started"] - Button state: "not started", "in progress", "completed"
 * @returns {HTMLElement} CtaButtons element
 */
export function createCtaButtons({ state = "not started" } = {}) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "flex-start";
    
    const button = document.createElement("div");
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.borderRadius = "var(--size-element-radius-sm)";
    button.style.minWidth = "28px";
    button.style.padding = "var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)";
    button.style.gap = "var(--size-element-gap-sm)";
    
    const text = document.createElement("span");
    text.style.fontFamily = "var(--font-family-body)";
    text.style.fontSize = "var(--font-size-body3)";
    text.style.fontWeight = "var(--font-weight-normal)";
    text.style.lineHeight = "1.667";
    text.style.color = "var(--color-secondary-text)";
    text.style.whiteSpace = "nowrap";
    
    // Set text based on state
    if (state === "in progress") {
        text.textContent = "Continue";
    } else if (state === "completed") {
        text.textContent = "Review";
    } else {
        // not started
        text.textContent = "Get Started";
    }
    
    button.appendChild(text);
    container.appendChild(button);
    
    return container;
}

