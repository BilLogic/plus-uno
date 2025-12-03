/**
 * @fileoverview OnboardingAlertCard component for Training Onboarding Cards
 * Alert card component with title, description, and close icon
 * Matches Figma design system specifications
 */

/**
 * Creates an OnboardingAlertCard component
 * @param {Object} options - Card configuration
 * @param {string} [options.title="Don't forget to complete this module"] - Alert title
 * @param {string} [options.description] - Alert description text
 * @returns {HTMLElement} Alert card element
 */
export function createOnboardingAlertCard({
    title = "Don't forget to complete this module",
    description = "Make sure to finish the quiz on the Google Site and answer the reflection question at the bottom of this page to complete this onboarding module."
} = {}) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "flex-start";
    container.style.width = "400px";
    
    const alert = document.createElement("div");
    alert.style.backgroundColor = "var(--color-primary-state-08)";
    alert.style.border = "1px solid var(--color-primary)";
    alert.style.borderRadius = "var(--size-modal-radius-md)";
    alert.style.display = "flex";
    alert.style.flex = "1";
    alert.style.minHeight = "0";
    alert.style.minWidth = "0";
    alert.style.padding = "var(--size-modal-pad-y-lg) var(--size-modal-pad-x-md)";
    alert.style.gap = "var(--size-modal-pad-x-sm)";
    alert.style.alignItems = "flex-start";
    
    // Message section
    const messageSection = document.createElement("div");
    messageSection.style.display = "flex";
    messageSection.style.flexDirection = "column";
    messageSection.style.gap = "var(--size-element-gap-xs)";
    messageSection.style.flex = "1";
    messageSection.style.minHeight = "0";
    messageSection.style.minWidth = "0";
    messageSection.style.color = "var(--color-on-primary-container)";
    
    // Title
    const titleElement = document.createElement("div");
    titleElement.style.fontFamily = "var(--font-family-header)";
    titleElement.style.fontSize = "var(--font-size-h5)";
    titleElement.style.fontWeight = "var(--font-weight-semibold-2)";
    titleElement.style.lineHeight = "1.4";
    titleElement.style.width = "100%";
    titleElement.textContent = title;
    
    messageSection.appendChild(titleElement);
    
    // Description
    const descriptionElement = document.createElement("div");
    descriptionElement.style.fontSize = "0px";
    descriptionElement.style.width = "100%";
    
    const descriptionText = document.createElement("p");
    descriptionText.style.fontFamily = "var(--font-family-body)";
    descriptionText.style.fontSize = "var(--font-size-body1)";
    descriptionText.style.fontWeight = "var(--font-weight-normal)";
    descriptionText.style.lineHeight = "1.5";
    descriptionText.style.margin = "0";
    
    // Parse description to handle bold text
    const parts = description.split(/(quiz on the Google Site|reflection question at the bottom of this page)/);
    parts.forEach((part) => {
        if (part === "quiz on the Google Site" || part === "reflection question at the bottom of this page") {
            const boldSpan = document.createElement("span");
            boldSpan.style.fontFamily = "var(--font-family-body)";
            boldSpan.style.fontWeight = "var(--font-weight-normal)";
            boldSpan.textContent = part;
            descriptionText.appendChild(boldSpan);
        } else if (part.trim()) {
            descriptionText.appendChild(document.createTextNode(part));
        }
    });
    
    descriptionElement.appendChild(descriptionText);
    messageSection.appendChild(descriptionElement);
    
    alert.appendChild(messageSection);
    
    // Close icon
    const closeIcon = document.createElement("div");
    closeIcon.style.display = "flex";
    closeIcon.style.alignItems = "center";
    closeIcon.style.justifyContent = "center";
    closeIcon.style.flexShrink = "0";
    
    const icon = document.createElement("i");
    icon.className = "fas fa-xmark";
    icon.style.fontSize = "var(--font-size-fa-h4-solid)";
    icon.style.color = "var(--color-on-surface-variant)";
    icon.style.lineHeight = "1.6";
    
    closeIcon.appendChild(icon);
    alert.appendChild(closeIcon);
    
    container.appendChild(alert);
    
    return container;
}

