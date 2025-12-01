/**
 * @fileoverview DataCardHeaderAndIcon component for Admin specs
 * Card header with title and info icon
 */

/**
 * Creates a DataCardHeaderAndIcon component
 * @param {Object} options - Header configuration
 * @param {string} [options.title="Card Title"] - Card title text
 * @returns {HTMLElement} Header element
 */
export function createDataCardHeaderAndIcon({
    title = "Card Title"
} = {}) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.gap = "var(--size-element-gap-lg)";
    container.style.alignItems = "center";
    container.style.width = "508px";

    // Header text
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "flex-start";

    const titleEl = document.createElement("div");
    titleEl.style.fontFamily = "var(--font-family-header)";
    titleEl.style.fontSize = "var(--font-size-h5)";
    titleEl.style.fontWeight = "var(--font-weight-semibold)";
    titleEl.style.lineHeight = "1.4";
    titleEl.style.color = "var(--color-on-surface)";
    titleEl.style.whiteSpace = "nowrap";
    titleEl.textContent = title;
    header.appendChild(titleEl);

    container.appendChild(header);

    // Info icon
    const iconContainer = document.createElement("div");
    iconContainer.style.display = "flex";
    iconContainer.style.alignItems = "center";
    iconContainer.style.justifyContent = "center";
    iconContainer.style.width = "13px";
    iconContainer.style.flexShrink = "0";

    const infoIcon = document.createElement("i");
    infoIcon.className = "fas fa-circle-info";
    infoIcon.style.fontSize = "14px";
    infoIcon.style.color = "var(--color-on-surface-state-16)";
    infoIcon.style.lineHeight = "1.714";
    iconContainer.appendChild(infoIcon);

    container.appendChild(iconContainer);

    return container;
}

