/**
 * @fileoverview Jumbotron component for PLUS design system.
 * Universal element component for creating large hero sections.
 * Jumbotrons are Section components used for marketing/landing pages to display prominent content.
 * Matches Figma design system specifications and Bootstrap 4.6.2 patterns.
 */

import { createButton } from './button.js';

/**
 * Creates a jumbotron element styled according to PLUS design system
 * @param {Object} options - Jumbotron configuration options
 * @param {string} [options.id] - Jumbotron ID
 * @param {string} [options.title] - Jumbotron title/heading
 * @param {string} [options.subtitle] - Jumbotron subtitle
 * @param {HTMLElement|string} [options.body] - Jumbotron body content (HTML element or string)
 * @param {Object} [options.primaryButton] - Primary action button config: {text: string, onClick: Function, style: string, fill: string, size: string}
 * @param {Object} [options.secondaryButton] - Secondary action button config: {text: string, onClick: Function, style: string, fill: string, size: string}
 * @param {boolean} [options.fluid=false] - Whether jumbotron is fluid (full width, no border-radius)
 * @param {string} [options.paddingSize="md"] - Padding size ("sm", "md", "lg")
 * @param {string} [options.gapSize="md"] - Gap size between elements ("sm", "md", "lg")
 * @param {string} [options.radiusSize="md"] - Border radius size ("sm", "md", "lg")
 * @param {Array} [options.classes] - Additional CSS classes
 * @param {Object} [options.styles] - Additional inline styles
 * @returns {HTMLElement} Jumbotron element
 */
export function createJumbotron({
    id,
    title,
    subtitle,
    body,
    primaryButton,
    secondaryButton,
    fluid = false,
    paddingSize = "md",
    gapSize = "md",
    radiusSize = "md",
    classes = [],
    styles = null
}) {
    const jumbotron = document.createElement("div");
    
    if (id) {
        jumbotron.id = id;
    }
    
    // Base jumbotron class
    jumbotron.classList.add("plus-jumbotron");
    
    // Add fluid class if specified
    if (fluid) {
        jumbotron.classList.add("plus-jumbotron-fluid");
    }
    
    // Add padding size class
    if (paddingSize) {
        jumbotron.classList.add(`plus-jumbotron-pad-${paddingSize}`);
    }
    
    // Add gap size class
    if (gapSize) {
        jumbotron.classList.add(`plus-jumbotron-gap-${gapSize}`);
    }
    
    // Add radius size class (only if not fluid)
    if (!fluid && radiusSize) {
        jumbotron.classList.add(`plus-jumbotron-radius-${radiusSize}`);
    }
    
    // Add additional classes
    if (classes && classes.length > 0) {
        jumbotron.classList.add(...classes);
    }
    
    // Apply inline styles
    if (styles) {
        Object.assign(jumbotron.style, styles);
    }
    
    // Jumbotron content container
    const content = document.createElement("div");
    content.classList.add("plus-jumbotron-content");
    
    // Title element - typically uses h1 or h2
    if (title) {
        const titleEl = document.createElement("h1");
        titleEl.classList.add("plus-jumbotron-title", "h1");
        titleEl.textContent = title;
        content.appendChild(titleEl);
    }
    
    // Subtitle element
    if (subtitle) {
        const subtitleEl = document.createElement("p");
        subtitleEl.classList.add("plus-jumbotron-subtitle", "h4");
        subtitleEl.textContent = subtitle;
        content.appendChild(subtitleEl);
    }
    
    // Body content
    if (body) {
        const bodyEl = document.createElement("p");
        bodyEl.classList.add("plus-jumbotron-body", "body1-txt");
        
        if (typeof body === "string") {
            bodyEl.innerHTML = body;
        } else if (body instanceof HTMLElement) {
            bodyEl.appendChild(body);
        }
        
        content.appendChild(bodyEl);
    }
    
    // Action buttons container
    if (primaryButton || secondaryButton) {
        const buttonsContainer = document.createElement("div");
        buttonsContainer.classList.add("plus-jumbotron-actions");
        
        // Primary button
        if (primaryButton) {
            const primaryBtn = createButton({
                btnText: primaryButton.text || "Primary Action",
                btnStyle: primaryButton.style || "primary",
                btnFill: primaryButton.fill || "filled",
                btnSize: primaryButton.size || "default",
                buttonOnClick: primaryButton.onClick || (() => {}),
                icon: primaryButton.icon || null,
                iconPosition: primaryButton.iconPosition || "left",
                classes: []
            });
            buttonsContainer.appendChild(primaryBtn);
        }
        
        // Secondary button
        if (secondaryButton) {
            const secondaryBtn = createButton({
                btnText: secondaryButton.text || "Secondary Action",
                btnStyle: secondaryButton.style || "secondary",
                btnFill: secondaryButton.fill || "outline",
                btnSize: secondaryButton.size || "default",
                buttonOnClick: secondaryButton.onClick || (() => {}),
                icon: secondaryButton.icon || null,
                iconPosition: secondaryButton.iconPosition || "left",
                classes: []
            });
            buttonsContainer.appendChild(secondaryBtn);
        }
        
        content.appendChild(buttonsContainer);
    }
    
    jumbotron.appendChild(content);
    
    return jumbotron;
}



