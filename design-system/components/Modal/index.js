/**
 * @fileoverview Modal component for PLUS design system.
 * Universal modal component for creating dialog windows that overlay the main content.
 * Modals are used for lightboxes, user notifications, or completely custom content.
 */

import { createButton } from '../Button/index.js';

/**
 * Creates a modal element styled according to PLUS design system
 * @param {Object} options - Modal configuration options
 * @param {string} [options.id] - Modal ID
 * @param {string} [options.title] - Modal title text
 * @param {HTMLElement|string} [options.body] - Modal body content (HTML element or string)
 * @param {string} [options.type="default"] - Modal type ("default" or "scrollable")
 * @param {boolean} [options.showBottomButtons=true] - Whether to show buttons at bottom
 * @param {Object} [options.primaryButton] - Primary button config: {text: string, onClick: Function, style: string, fill: string, size: string}
 * @param {Object} [options.secondaryButton] - Secondary button config: {text: string, onClick: Function, style: string, fill: string, size: string}
 * @param {Function} [options.onClose] - Close button click handler
 * @param {string} [options.paddingSize="md"] - Padding size ("sm", "md", "lg")
 * @param {string} [options.gapSize="md"] - Gap size between modal elements ("sm", "md", "lg")
 * @param {string} [options.radiusSize="md"] - Border radius size ("sm", "md", "lg")
 * @param {Array} [options.classes] - Additional CSS classes
 * @param {Object} [options.styles] - Additional inline styles
 * @param {number} [options.width] - Modal width in pixels (default: 340px from Figma)
 * @returns {HTMLElement} Modal element
 */
export function createModal({
    id,
    title,
    body,
    type = "default",
    showBottomButtons = true,
    primaryButton = null,
    secondaryButton = null,
    onClose = null,
    paddingSize = null, // Will be set based on type if not provided
    gapSize = null, // Will be set based on type if not provided
    radiusSize = "md",
    classes = [],
    styles = null,
    width = 340
}) {
    const modal = document.createElement("div");
    
    if (id) {
        modal.id = id;
    }
    
    // Base modal class
    modal.classList.add("plus-modal");
    
    // Add type class
    if (type === "scrollable") {
        modal.classList.add("plus-modal-scrollable");
    } else {
        modal.classList.add("plus-modal-default");
    }
    
    // Set padding and gap based on type if not explicitly provided
    // Figma: default with buttons uses sm (10px/8px), scrollable with buttons uses md (16px/12px)
    if (!paddingSize) {
        paddingSize = (type === "scrollable" && showBottomButtons) ? "md" : "sm";
    }
    if (!gapSize) {
        gapSize = (type === "scrollable" && showBottomButtons) ? "md" : "sm";
    }
    
    // Add padding size class
    if (paddingSize) {
        modal.classList.add(`plus-modal-pad-${paddingSize}`);
    }
    
    // Add gap size class
    if (gapSize) {
        modal.classList.add(`plus-modal-gap-${gapSize}`);
    }
    
    // Add radius size class
    if (radiusSize) {
        modal.classList.add(`plus-modal-radius-${radiusSize}`);
    }
    
    // Add bottom buttons class
    if (showBottomButtons) {
        modal.classList.add("plus-modal-with-buttons");
    } else {
        modal.classList.add("plus-modal-no-buttons");
    }
    
    // Add additional classes
    if (classes && classes.length > 0) {
        modal.classList.add(...classes);
    }
    
    // Apply inline styles
    if (styles) {
        Object.assign(modal.style, styles);
    }
    
    // Set width - ensure it's always 340px as per Figma
    // Figma: w-[340px] for all modal types
    modal.style.width = `${width}px`;
    modal.style.minWidth = `${width}px`;
    modal.style.maxWidth = `${width}px`;
    
    // Modal Header
    const header = document.createElement("div");
    header.classList.add("plus-modal-header");
    
    if (title) {
        const titleEl = document.createElement("div");
        titleEl.classList.add("plus-modal-title", "h5");
        titleEl.textContent = title;
        header.appendChild(titleEl);
    }
    
    // Close button
    // Figma: Icon size varies by variant
    // - With buttons: size="h5" (16px) - Figma: Icon iconName="xmark" size="h5" style="solid"
    // - Without buttons: size="h3" (24px) - Figma: Icon iconName="xmark" size="h3"
    const closeBtn = document.createElement("button");
    closeBtn.classList.add("plus-modal-close-btn");
    if (showBottomButtons) {
        closeBtn.classList.add("plus-modal-close-btn-h5"); // h5 size (16px) for modals with buttons
    } else {
        closeBtn.classList.add("plus-modal-close-btn-h3"); // h3 size (24px) for modals without buttons
    }
    closeBtn.setAttribute("type", "button");
    closeBtn.setAttribute("aria-label", "Close modal");
    // Use "xmark" icon (not "times") - Figma: Icon iconName="xmark" style="solid"
    closeBtn.innerHTML = '<i class="fas fa-xmark"></i>';
    if (onClose) {
        closeBtn.addEventListener("click", onClose);
    }
    header.appendChild(closeBtn);
    
    modal.appendChild(header);
    
    // Divider after header
    const divider1 = document.createElement("div");
    divider1.classList.add("plus-modal-divider");
    modal.appendChild(divider1);
    
    // Modal Body
    const bodyEl = document.createElement("div");
    bodyEl.classList.add("plus-modal-body");
    
    if (type === "scrollable") {
        bodyEl.classList.add("plus-modal-body-scrollable");
    }
    
    const content = document.createElement("div");
    content.classList.add("plus-modal-content");
    
    if (body) {
        if (typeof body === "string") {
            // Wrap string content in a paragraph-like element for proper typography
            // Figma: Body/B1/Regular - Merriweather Sans Light, 16px, lineHeight 1.5
            const bodyText = document.createElement("div");
            bodyText.classList.add("body1-txt");
            bodyText.textContent = body;
            content.appendChild(bodyText);
        } else if (body instanceof HTMLElement) {
            // If it's already an element, ensure it has proper typography class if it doesn't
            if (!body.classList.contains("body1-txt") && !body.querySelector(".body1-txt")) {
                body.classList.add("body1-txt");
            }
            content.appendChild(body);
        }
    }
    
    bodyEl.appendChild(content);
    
    // Scrollbar for scrollable type
    if (type === "scrollable") {
        const scrollbar = document.createElement("div");
        scrollbar.classList.add("plus-modal-scrollbar");
        scrollbar.innerHTML = `
            <div class="plus-modal-scrollbar-icon">
                <i class="fas fa-caret-up"></i>
            </div>
            <div class="plus-modal-scrollbar-track">
                <div class="plus-modal-scrollbar-bar"></div>
            </div>
            <div class="plus-modal-scrollbar-icon">
                <i class="fas fa-caret-down"></i>
            </div>
        `;
        bodyEl.appendChild(scrollbar);
    }
    
    modal.appendChild(bodyEl);
    
    // Footer with buttons (if showBottomButtons is true)
    if (showBottomButtons && (primaryButton || secondaryButton)) {
        // Divider before footer
        const divider2 = document.createElement("div");
        divider2.classList.add("plus-modal-divider");
        modal.appendChild(divider2);
        
        const footer = document.createElement("div");
        footer.classList.add("plus-modal-footer");
        
        const buttonRow = document.createElement("div");
        buttonRow.classList.add("plus-modal-button-row");
        
        // Secondary button (if provided)
        if (secondaryButton) {
            const secondaryBtnEl = createButton({
                btnText: secondaryButton.text || "Cancel",
                btnStyle: secondaryButton.style || "secondary",
                btnFill: secondaryButton.fill || "tonal",
                btnSize: secondaryButton.size || "default",
                buttonOnClick: secondaryButton.onClick || null,
                icon: secondaryButton.icon || null,
                iconPosition: secondaryButton.iconPosition || "left",
                classes: ["plus-modal-button", "plus-modal-button-secondary"]
            });
            buttonRow.appendChild(secondaryBtnEl);
        }
        
        // Primary button (if provided)
        if (primaryButton) {
            const primaryBtnEl = createButton({
                btnText: primaryButton.text || "Confirm",
                btnStyle: primaryButton.style || "primary",
                btnFill: primaryButton.fill || "filled",
                btnSize: primaryButton.size || "default",
                buttonOnClick: primaryButton.onClick || null,
                icon: primaryButton.icon || null,
                iconPosition: primaryButton.iconPosition || "left",
                classes: ["plus-modal-button", "plus-modal-button-primary"]
            });
            buttonRow.appendChild(primaryBtnEl);
        }
        
        footer.appendChild(buttonRow);
        modal.appendChild(footer);
    }
    
    return modal;
}

