/**
 * @fileoverview StrategyContentPromptModal component for Training Onboarding Modals
 * Modal showing reflection question form with instructions, question, textarea, and submit button
 * Matches Figma design system specifications
 */

/**
 * Creates a StrategyContentPromptModal component
 * @param {Object} options - Modal configuration
 * @param {string} [options.question="What's one specific action you plan to take in your next session based on what you learned in this module?"] - Reflection question text
 * @param {Function} [options.onSubmit] - Submit button handler
 * @returns {HTMLElement} Modal element
 */
export function createStrategyContentPromptModal({
    question = "What's one specific action you plan to take in your next session based on what you learned in this module?",
    onSubmit = null
} = {}) {
    const modal = document.createElement("div");
    modal.style.backgroundColor = "var(--color-surface-container-low)";
    modal.style.borderRadius = "var(--size-section-radius-md)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.gap = "var(--size-modal-gap-md)";
    modal.style.padding = "var(--size-modal-pad-y-md) var(--size-modal-pad-x-md)";
    modal.style.width = "672px";
    
    // Intro section
    const introSection = document.createElement("div");
    introSection.style.display = "flex";
    introSection.style.flexDirection = "column";
    introSection.style.gap = "var(--size-element-gap-xs)";
    introSection.style.alignItems = "flex-start";
    introSection.style.width = "100%";
    
    // Instructions title
    const instructionsTitle = document.createElement("div");
    instructionsTitle.style.fontFamily = "var(--font-family-header)";
    instructionsTitle.style.fontSize = "var(--font-size-h5)";
    instructionsTitle.style.fontWeight = "var(--font-weight-semibold-2)";
    instructionsTitle.style.lineHeight = "1.4";
    instructionsTitle.style.width = "100%";
    instructionsTitle.textContent = "Instructions";
    
    introSection.appendChild(instructionsTitle);
    
    // Instructions text
    const instructionsText = document.createElement("div");
    instructionsText.style.fontFamily = "var(--font-family-body)";
    instructionsText.style.fontSize = "var(--font-size-body1)";
    instructionsText.style.fontWeight = "var(--font-weight-normal)";
    instructionsText.style.lineHeight = "1.5";
    instructionsText.style.width = "100%";
    instructionsText.textContent = "Take a moment to reflect on what you learned in this module. Your response helps us understand your perspective and ensures you're ready to apply this in your sessions. Please answer the question below to complete the module.";
    
    introSection.appendChild(instructionsText);
    modal.appendChild(introSection);
    
    // Question section
    const questionSection = document.createElement("div");
    questionSection.style.display = "flex";
    questionSection.style.flexDirection = "column";
    questionSection.style.gap = "var(--size-element-gap-lg)";
    questionSection.style.alignItems = "flex-start";
    questionSection.style.width = "100%";
    
    // Label
    const labelSection = document.createElement("div");
    labelSection.style.display = "flex";
    labelSection.style.flexDirection = "column";
    labelSection.style.gap = "var(--size-element-gap-xs)";
    labelSection.style.alignItems = "flex-start";
    labelSection.style.width = "100%";
    
    const labelTitle = document.createElement("div");
    labelTitle.style.fontFamily = "var(--font-family-header)";
    labelTitle.style.fontSize = "var(--font-size-body1)";
    labelTitle.style.fontWeight = "var(--font-weight-semibold-2)";
    labelTitle.style.lineHeight = "1.5";
    labelTitle.style.color = "var(--color-on-surface)";
    labelTitle.style.width = "100%";
    
    const questionLabel = document.createElement("span");
    questionLabel.textContent = "Question 1 ";
    labelTitle.appendChild(questionLabel);
    
    const requiredStar = document.createElement("span");
    requiredStar.style.fontFamily = "var(--font-family-header)";
    requiredStar.style.fontWeight = "var(--font-weight-normal)";
    requiredStar.style.color = "#ba1a1a";
    requiredStar.textContent = "*";
    labelTitle.appendChild(requiredStar);
    
    labelSection.appendChild(labelTitle);
    
    const questionText = document.createElement("div");
    questionText.style.fontFamily = "var(--font-family-body)";
    questionText.style.fontSize = "var(--font-size-body1)";
    questionText.style.fontWeight = "var(--font-weight-normal)";
    questionText.style.lineHeight = "1.5";
    questionText.style.color = "var(--color-on-surface-variant)";
    questionText.style.width = "100%";
    questionText.textContent = question;
    
    labelSection.appendChild(questionText);
    questionSection.appendChild(labelSection);
    
    // Textarea
    const textareaWrapper = document.createElement("div");
    textareaWrapper.style.backgroundColor = "var(--color-surface)";
    textareaWrapper.style.border = "0.6px solid var(--color-outline-variant)";
    textareaWrapper.style.height = "80px";
    textareaWrapper.style.width = "100%";
    textareaWrapper.style.position = "relative";
    textareaWrapper.style.borderRadius = "inherit";
    textareaWrapper.style.overflow = "hidden";
    
    const textarea = document.createElement("textarea");
    textarea.style.width = "100%";
    textarea.style.height = "100%";
    textarea.style.padding = "var(--size-element-pad-y-md) var(--size-element-pad-x-md)";
    textarea.style.gap = "var(--size-element-gap-md)";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.fontFamily = "var(--font-family-body)";
    textarea.style.fontSize = "var(--font-size-body2)";
    textarea.style.fontWeight = "var(--font-weight-normal)";
    textarea.style.lineHeight = "1.571";
    textarea.style.color = "var(--color-on-surface)";
    textarea.style.backgroundColor = "transparent";
    textarea.placeholder = "Type in your response here ...";
    
    textareaWrapper.appendChild(textarea);
    questionSection.appendChild(textareaWrapper);
    
    modal.appendChild(questionSection);
    
    // Button section
    const buttonSection = document.createElement("div");
    buttonSection.style.display = "flex";
    buttonSection.style.flexWrap = "wrap";
    buttonSection.style.gap = "var(--size-element-gap-lg)";
    buttonSection.style.alignItems = "center";
    buttonSection.style.justifyContent = "flex-end";
    buttonSection.style.width = "100%";
    
    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.style.backgroundColor = "var(--color-primary)";
    submitButton.style.borderRadius = "var(--size-element-radius-sm)";
    submitButton.style.display = "flex";
    submitButton.style.alignItems = "center";
    submitButton.style.justifyContent = "center";
    submitButton.style.gap = "var(--size-element-gap-sm)";
    submitButton.style.minWidth = "36px";
    submitButton.style.padding = "var(--size-element-pad-y-md) var(--size-element-pad-x-md)";
    submitButton.style.border = "none";
    submitButton.style.cursor = "pointer";
    
    if (onSubmit) {
        submitButton.addEventListener("click", () => {
            onSubmit(textarea.value);
        });
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
    iconElement.className = "fas fa-paper-plane";
    iconElement.style.fontSize = "var(--font-size-fa-h6-solid)";
    iconElement.style.color = "var(--color-on-primary)";
    iconElement.style.lineHeight = "1.714";
    
    leadingIcon.appendChild(iconElement);
    submitButton.appendChild(leadingIcon);
    
    // Button text
    const buttonText = document.createElement("div");
    buttonText.style.fontFamily = "var(--font-family-header)";
    buttonText.style.fontSize = "var(--font-size-h6)";
    buttonText.style.fontWeight = "var(--font-weight-semibold-2)";
    buttonText.style.lineHeight = "1.5";
    buttonText.style.color = "var(--color-on-primary)";
    buttonText.style.whiteSpace = "nowrap";
    buttonText.textContent = "Submit";
    
    submitButton.appendChild(buttonText);
    buttonSection.appendChild(submitButton);
    modal.appendChild(buttonSection);
    
    return modal;
}

