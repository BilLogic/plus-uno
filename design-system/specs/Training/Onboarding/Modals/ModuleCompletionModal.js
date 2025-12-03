/**
 * @fileoverview ModuleCompletionModal component for Training Onboarding Modals
 * Modal showing module completion popup with title, message, and action button
 * Matches Figma design system specifications
 */

/**
 * Creates a ModuleCompletionModal component
 * @param {Object} options - Modal configuration
 * @param {Function} [options.onClose] - Close button handler
 * @param {Function} [options.onContinue] - Continue button handler
 * @returns {HTMLElement} Modal element
 */
export function createModuleCompletionModal({
    onClose = null,
    onContinue = null
} = {}) {
    const modal = document.createElement("div");
    modal.style.backgroundColor = "var(--color-surface-container-high)";
    modal.style.border = "1px solid var(--color-outline-variant)";
    modal.style.borderRadius = "var(--size-modal-radius-lg)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.gap = "var(--size-modal-gap-md)";
    modal.style.padding = "var(--size-modal-pad-y-md) var(--size-modal-pad-x-md)";
    modal.style.width = "388.67px";
    
    // Card Description section (header with title and close icon)
    const headerSection = document.createElement("div");
    headerSection.style.borderBottom = "1px solid var(--color-outline-variant)";
    headerSection.style.display = "flex";
    headerSection.style.flexDirection = "column";
    headerSection.style.alignItems = "center";
    headerSection.style.padding = "var(--size-element-pad-x-lg) 0";
    headerSection.style.width = "100%";
    
    const cardHeader = document.createElement("div");
    cardHeader.style.display = "flex";
    cardHeader.style.alignItems = "flex-start";
    cardHeader.style.width = "100%";
    
    // Title
    const titleContainer = document.createElement("div");
    titleContainer.style.display = "flex";
    titleContainer.style.flexDirection = "column";
    titleContainer.style.gap = "var(--size-element-gap-xs)";
    titleContainer.style.flex = "1";
    titleContainer.style.alignItems = "center";
    titleContainer.style.justifyContent = "center";
    titleContainer.style.minHeight = "0";
    titleContainer.style.minWidth = "0";
    
    const title = document.createElement("div");
    title.style.fontFamily = "var(--font-family-header)";
    title.style.fontSize = "var(--font-size-h4)";
    title.style.fontWeight = "var(--font-weight-semibold-2)";
    title.style.lineHeight = "1.333";
    title.style.color = "var(--color-on-surface)";
    title.style.width = "100%";
    title.textContent = "Module Completed!";
    
    titleContainer.appendChild(title);
    cardHeader.appendChild(titleContainer);
    
    // Close icon
    const closeIcon = document.createElement("div");
    closeIcon.style.display = "flex";
    closeIcon.style.alignItems = "center";
    closeIcon.style.justifyContent = "center";
    closeIcon.style.flexShrink = "0";
    closeIcon.style.cursor = "pointer";
    
    if (onClose) {
        closeIcon.addEventListener("click", onClose);
    }
    
    const icon = document.createElement("i");
    icon.className = "fas fa-xmark";
    icon.style.fontSize = "var(--font-size-fa-h4-solid)";
    icon.style.color = "var(--color-on-surface-variant)";
    icon.style.lineHeight = "1.6";
    
    closeIcon.appendChild(icon);
    cardHeader.appendChild(closeIcon);
    
    headerSection.appendChild(cardHeader);
    modal.appendChild(headerSection);
    
    // Message section
    const messageSection = document.createElement("div");
    messageSection.style.display = "flex";
    messageSection.style.gap = "var(--size-element-gap-lg)";
    messageSection.style.alignItems = "flex-start";
    messageSection.style.padding = "var(--size-element-pad-y-lg) 0";
    messageSection.style.width = "100%";
    
    const messageText = document.createElement("div");
    messageText.style.fontFamily = "var(--font-family-body)";
    messageText.style.fontSize = "var(--font-size-body1)";
    messageText.style.fontWeight = "var(--font-weight-normal)";
    messageText.style.lineHeight = "1.5";
    messageText.style.color = "black";
    messageText.style.flex = "1";
    messageText.style.minHeight = "0";
    messageText.style.minWidth = "0";
    messageText.textContent = "You've completed this onboarding module. You can revisit it anytime, or continue with the rest of your onboarding.";
    
    messageSection.appendChild(messageText);
    modal.appendChild(messageSection);
    
    // Bottom Button section
    const buttonSection = document.createElement("div");
    buttonSection.style.borderTop = "1px solid var(--color-outline-variant)";
    buttonSection.style.display = "flex";
    buttonSection.style.gap = "var(--size-element-gap-md)";
    buttonSection.style.alignItems = "center";
    buttonSection.style.justifyContent = "flex-end";
    buttonSection.style.padding = "var(--size-element-pad-y-lg) 0";
    buttonSection.style.width = "100%";
    
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "var(--size-element-gap-md)";
    buttonContainer.style.flex = "1";
    buttonContainer.style.alignItems = "center";
    buttonContainer.style.justifyContent = "flex-end";
    buttonContainer.style.minHeight = "0";
    buttonContainer.style.minWidth = "0";
    
    const continueButton = document.createElement("button");
    continueButton.type = "button";
    continueButton.style.backgroundColor = "var(--color-primary)";
    continueButton.style.borderRadius = "var(--size-element-radius-md)";
    continueButton.style.display = "flex";
    continueButton.style.alignItems = "center";
    continueButton.style.justifyContent = "center";
    continueButton.style.gap = "var(--size-element-gap-sm)";
    continueButton.style.minWidth = "36px";
    continueButton.style.padding = "var(--size-element-pad-y-md) var(--size-element-pad-x-md)";
    continueButton.style.border = "none";
    continueButton.style.cursor = "pointer";
    continueButton.style.flex = "1";
    continueButton.style.minHeight = "0";
    continueButton.style.minWidth = "0";
    
    if (onContinue) {
        continueButton.addEventListener("click", onContinue);
    }
    
    // Leading icon
    const leadingIcon = document.createElement("div");
    leadingIcon.style.display = "flex";
    leadingIcon.style.alignItems = "center";
    leadingIcon.style.justifyContent = "center";
    leadingIcon.style.width = "12px";
    leadingIcon.style.height = "100%";
    leadingIcon.style.flexShrink = "0";
    
    const iconElement = document.createElement("i");
    iconElement.className = "fas fa-arrow-right-from-bracket";
    iconElement.style.fontSize = "var(--font-size-fa-h6-solid)";
    iconElement.style.color = "var(--color-on-primary)";
    iconElement.style.lineHeight = "1.714";
    
    leadingIcon.appendChild(iconElement);
    continueButton.appendChild(leadingIcon);
    
    // Button text
    const buttonText = document.createElement("div");
    buttonText.style.fontFamily = "var(--font-family-header)";
    buttonText.style.fontSize = "var(--font-size-h6)";
    buttonText.style.fontWeight = "var(--font-weight-semibold-2)";
    buttonText.style.lineHeight = "1.5";
    buttonText.style.color = "var(--color-on-primary)";
    buttonText.style.whiteSpace = "nowrap";
    buttonText.textContent = "Back to Onboarding Overview";
    
    continueButton.appendChild(buttonText);
    buttonContainer.appendChild(continueButton);
    buttonSection.appendChild(buttonContainer);
    modal.appendChild(buttonSection);
    
    return modal;
}

