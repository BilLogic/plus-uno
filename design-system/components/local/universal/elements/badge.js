/**
 * @fileoverview Badge and Chip components for PLUS design system.
 * Universal element components for labels and tags.
 * Matches Figma design system specifications.
 */

/**
 * Creates a badge component
 * @param {Object} options - Badge configuration
 * @param {string} options.text - Badge text
 * @param {string} [options.style='primary'] - Badge style (primary, secondary, tertiary, success, danger, warning)
 * @param {string} [options.size='b2'] - Badge size (h1, h2, h3, h4, h5, h6, b1, b2, b3)
 * @param {string} [options.id] - Badge ID
 * @param {Array} [options.classes] - Additional CSS classes
 * @returns {HTMLElement} Badge element
 */
export function createBadge({text, style = 'primary', size = 'b2', id, classes = []}) {
    const badge = document.createElement("span");
    badge.classList.add("plus-badge", style, size);
    
    if (id) {
        badge.id = id;
    }
    
    if (classes && classes.length > 0) {
        badge.classList.add(...classes);
    }

    const textEl = document.createElement("span");
    textEl.classList.add("plus-badge-text");
    textEl.textContent = text;
    badge.appendChild(textEl);

    return badge;
}

/**
 * Creates a chip component (similar to badge but with different semantics)
 * @param {Object} options - Chip configuration
 * @param {string} options.text - Chip text
 * @param {string} [options.style='primary'] - Chip style
 * @param {string} [options.size='b2'] - Chip size
 * @param {string} [options.id] - Chip ID
 * @param {boolean} [options.removable=false] - Whether chip can be removed
 * @param {Function} [options.onRemove] - Function to call when chip is removed
 * @param {Array} [options.classes] - Additional CSS classes
 * @returns {HTMLElement} Chip element
 */
export function createChip({text, style = 'primary', size = 'b2', id, removable = false, onRemove = null, classes = []}) {
    const chip = document.createElement("span");
    chip.classList.add("plus-chip", style, size);
    
    if (id) {
        chip.id = id;
    }
    
    if (classes && classes.length > 0) {
        chip.classList.add(...classes);
    }

    const textEl = document.createElement("span");
    textEl.classList.add("plus-badge-text");
    textEl.textContent = text;
    chip.appendChild(textEl);

    if (removable) {
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.classList.add("plus-chip-remove");
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.setAttribute("aria-label", "Remove");
        removeBtn.addEventListener("click", () => {
            chip.remove();
            if (onRemove) {
                onRemove();
            }
        });
        chip.appendChild(removeBtn);
    }

    return chip;
}

