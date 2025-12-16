/**
 * @fileoverview Section component for PLUS design system.
 * A simple container component for page sections with standard padding and spacing.
 */

/**
 * Creates a section element styled according to PLUS design system
 * @param {Object} options - Section configuration options
 * @param {string} [options.id] - Section ID
 * @param {HTMLElement|string} [options.content] - Section content (HTML element or string)
 * @param {string} [options.title] - Section title
 * @param {string} [options.padding="md"] - Padding size ("none", "sm", "md", "lg", "xl")
 * @param {string} [options.background="transparent"] - Background color ("transparent", "surface", "surface-alt")
 * @param {Array} [options.classes] - Additional CSS classes
 * @param {Object} [options.styles] - Additional inline styles
 * @returns {HTMLElement} Section element
 */
export function createSection({
    id,
    content,
    title,
    padding = "md",
    background = "transparent",
    classes = [],
    styles = null
}) {
    const section = document.createElement("section");

    if (id) {
        section.id = id;
    }

    // Base section class
    section.classList.add("plus-section");

    // Add padding class
    if (padding) {
        section.classList.add(`plus-section-pad-${padding}`);
    }

    // Add background class
    if (background && background !== "transparent") {
        section.classList.add(`plus-section-bg-${background}`);
    }

    // Add additional classes
    if (classes && classes.length > 0) {
        section.classList.add(...classes);
    }

    // Apply inline styles
    if (styles) {
        Object.assign(section.style, styles);
    }

    // Add title if provided
    if (title) {
        const titleEl = document.createElement("h2");
        titleEl.classList.add("plus-section-title", "h3"); // Using h3 style for section titles
        titleEl.textContent = title;
        section.appendChild(titleEl);
    }

    // Add content
    if (content) {
        const contentWrapper = document.createElement("div");
        contentWrapper.classList.add("plus-section-content");

        if (typeof content === "string") {
            contentWrapper.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            contentWrapper.appendChild(content);
        }

        section.appendChild(contentWrapper);
    }

    return section;
}
