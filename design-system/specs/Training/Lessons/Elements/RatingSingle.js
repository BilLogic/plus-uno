/**
 * @fileoverview RatingSingle component for Training Lessons specs
 * Single rating item with number and radio button
 * Matches Figma design system specifications
 */

/**
 * Creates a radio button circle for rating
 * Matches Figma FormRadioButton component exactly
 * @param {Object} options - Radio button configuration
 * @param {boolean} [options.checked=false] - Whether radio is checked
 * @returns {HTMLElement} Radio button element
 */
function createRatingRadio({ checked = false } = {}) {
    // Radio container - Figma: size-[12px], rounded-[radius-5,96px] (fully circular)
    const radioContainer = document.createElement('div');
    radioContainer.style.display = 'flex';
    radioContainer.style.alignItems = 'center';
    radioContainer.style.justifyContent = 'center';
    radioContainer.style.width = 'var(--font-size-fa-body2-solid)'; // 12px
    radioContainer.style.height = 'var(--font-size-fa-body2-solid)'; // 12px
    radioContainer.style.borderRadius = 'var(--size-element-radius-pill)'; // Fully circular (96px/999px)
    radioContainer.style.border = '1px solid var(--color-primary)';
    radioContainer.style.boxSizing = 'border-box';
    radioContainer.setAttribute('data-node-id', checked ? '63:177679' : '63:1108');
    
    if (checked) {
        // Selected state - Figma: state=default, check type=check
        // bg-[var(--neutral-colors/surface,#f9f9fc)], border primary, padding spacer-1 (2px)
        radioContainer.style.backgroundColor = 'var(--color-surface)'; // #f9f9fc
        radioContainer.style.padding = '2px'; // 2px - no direct token exists, specific design requirement
        
        // Inner circle - Figma: size-[8px], fill rgba(0, 101, 142, 1) = #00658e
        // Note: Using --color-primary token which maps to primary color
        const innerCircle = document.createElement('div');
        // Inner circle: 12px container - 2px padding on each side = 8px inner circle
        // Inner circle: 12px container - 2px padding on each side = 8px
        innerCircle.style.width = 'calc(var(--font-size-fa-body2-solid) - 4px)'; // 8px (2px padding * 2)
        innerCircle.style.height = 'calc(var(--font-size-fa-body2-solid) - 4px)'; // 8px (2px padding * 2)
        innerCircle.style.borderRadius = 'var(--size-element-radius-pill)';
        innerCircle.style.backgroundColor = 'var(--color-primary)'; // Primary color for inner dot
        innerCircle.style.flexShrink = '0';
        innerCircle.setAttribute('data-node-id', 'I63:177679;42:5814');
        radioContainer.appendChild(innerCircle);
    } else {
        // Unselected state - Figma: state=default, check type=none
        // bg-[var(--_primary/on-primary,#ffffff)], border primary, no inner circle
        radioContainer.style.backgroundColor = 'var(--color-on-primary)'; // #ffffff (white)
        radioContainer.style.padding = '0'; // No padding when unchecked
    }
    
    return radioContainer;
}

/**
 * Creates a RatingSingle component
 * @param {Object} options - Rating configuration
 * @param {number} [options.value=1] - Rating value (1-5)
 * @param {string} [options.status="rest"] - Status: "rest" or "selected"
 * @param {Function} [options.onClick] - Click handler
 * @returns {HTMLElement} Rating single element
 */
export function createRatingSingle({
    value = 1,
    status = "rest",
    onClick = null
} = {}) {
    // Container - Figma: flex-col, gap element/gap-sm, padding element/pad-x-lg, py-0
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    container.style.alignItems = 'center';
    container.style.padding = '0 var(--size-element-pad-x-lg)';
    container.setAttribute('data-node-id', status === "selected" ? '63:177677' : '63:177674');

    // Number text - Figma: Merriweather Sans (Light for rest, Regular for selected), size 20px, color primary-text
    const numberText = document.createElement('div');
    numberText.style.fontFamily = 'var(--font-family-body)';
    numberText.style.fontSize = 'var(--font-size-lead)';
    numberText.style.fontWeight = status === "selected" ? 'var(--font-weight-semibold-1)' : 'var(--font-weight-normal)';
    numberText.style.lineHeight = '1.6';
    numberText.style.color = 'var(--color-primary-text)';
    numberText.style.textAlign = 'center';
    numberText.style.whiteSpace = 'nowrap';
    numberText.style.overflow = 'hidden';
    numberText.style.textOverflow = 'ellipsis';
    numberText.textContent = value.toString();
    container.appendChild(numberText);

    // Radio button
    const radio = createRatingRadio({ checked: status === "selected" });
    container.appendChild(radio);

    if (onClick) {
        container.style.cursor = 'pointer';
        container.addEventListener('click', onClick);
    }

    return container;
}

