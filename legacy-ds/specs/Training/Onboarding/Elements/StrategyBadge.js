/**
 * @fileoverview StrategyBadge component for Training Onboarding Elements
 * Badge component showing different file/strategy types: image, video, audio, document, book, website, other
 * Matches Figma design system specifications
 */

/**
 * Creates a StrategyBadge component
 * @param {Object} options - Component configuration
 * @param {string} [options.type="image"] - Badge type: "image", "video", "audio", "document", "book", "website", "other"
 * @returns {HTMLElement} StrategyBadge element
 */
export function createStrategyBadge({ type = "image" } = {}) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.padding = "0 var(--size-element-pad-y-sm)";
    container.style.borderRadius = "var(--size-element-radius-sm)";
    
    const badge = document.createElement("div");
    badge.style.display = "flex";
    badge.style.alignItems = "center";
    badge.style.justifyContent = "center";
    badge.style.gap = "6px";
    badge.style.minWidth = "16px";
    
    const icon = document.createElement("i");
    icon.style.fontSize = "12px";
    icon.style.color = "var(--color-on-surface-variant)";
    icon.style.lineHeight = "1.833";
    icon.className = "fas";
    
    // Set icon based on type
    const iconMap = {
        "image": "fa-file-image",
        "video": "fa-file-video",
        "audio": "fa-file-audio",
        "document": "fa-file-pdf",
        "book": "fa-file-lines",
        "website": "fa-up-right-from-square",
        "other": "fa-file"
    };
    
    icon.className = `fas ${iconMap[type] || iconMap.image}`;
    
    badge.appendChild(icon);
    container.appendChild(badge);
    
    return container;
}

