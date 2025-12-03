/**
 * @fileoverview Sidebar Tab component for PLUS design system.
 * Universal element component for sidebar navigation tabs.
 * Matches Figma design system specifications.
 * 
 * Figma: node-id 111-227838
 * States: enabled, hover, selected, disabled, focus
 */

/**
 * Creates a sidebar tab component
 * @param {Object} options - Sidebar tab configuration
 * @param {string} options.text - Tab text
 * @param {string} [options.icon] - Font Awesome icon name (without "fa-" prefix)
 * @param {string} [options.state='enabled'] - Tab state (enabled, hover, selected, disabled, focus)
 * @param {boolean} [options.leadingVisual=true] - Whether to show leading icon
 * @param {boolean} [options.trailingVisual=false] - Whether to show trailing icon
 * @param {string} [options.id] - Tab ID
 * @param {Function} [options.onClick] - Click handler function
 * @param {Array} [options.classes] - Additional CSS classes
 * @returns {HTMLElement} Sidebar tab element
 */
export function createSidebarTab({
    text,
    icon = null,
    state = 'enabled',
    leadingVisual = true,
    trailingVisual = false,
    id = null,
    onClick = null,
    classes = []
}) {
    // Figma: hover uses button, others use div
    const tab = document.createElement(state === 'hover' ? 'button' : 'div');
    
    if (state === 'hover') {
        tab.type = 'button';
    }
    
    tab.classList.add('plus-sidebar-tab', `plus-sidebar-tab-${state}`);
    
    // Figma: w-[184px], gap-[var(--element/gap-md,10px)], px-[var(--element/pad-x-md,10px)] py-[var(--element/pad-y-md,6px)], rounded-[var(--modal/radius-md,6px)]
    tab.style.display = 'flex';
    tab.style.gap = 'var(--size-element-gap-md)';
    tab.style.alignItems = 'center';
    tab.style.paddingLeft = 'var(--size-element-pad-x-md)';
    tab.style.paddingRight = 'var(--size-element-pad-x-md)';
    tab.style.paddingTop = 'var(--size-element-pad-y-md)';
    tab.style.paddingBottom = 'var(--size-element-pad-y-md)';
    tab.style.borderRadius = 'var(--size-modal-radius-md)';
    tab.style.width = '184px';
    tab.style.boxSizing = 'border-box';
    tab.style.position = 'relative';
    
    // Background colors by state
    if (state === 'hover') {
        tab.style.backgroundColor = 'var(--color-primary-state-12)';
        tab.style.cursor = 'pointer';
    } else if (state === 'selected') {
        tab.style.backgroundColor = 'var(--color-primary-state-16)';
    } else if (state === 'focus') {
        tab.style.backgroundColor = 'var(--color-primary-state-12)';
        tab.style.border = '1.5px solid var(--color-inverse-primary)';
        tab.style.borderStyle = 'solid';
    } else if (state === 'disabled') {
        tab.style.opacity = '0.38';
    }
    
    if (id) {
        tab.id = id;
    }
    
    if (classes && classes.length > 0) {
        tab.classList.add(...classes);
    }
    
    if (onClick && state !== 'disabled') {
        tab.addEventListener('click', onClick);
    }
    
    // Leading visual (icon) - Figma: w-[11px], text-[12px] (Font Awesome B2)
    if (leadingVisual && icon) {
        const iconContainer = document.createElement('div');
        iconContainer.style.display = 'flex';
        iconContainer.style.alignItems = 'center';
        iconContainer.style.justifyContent = 'center';
        iconContainer.style.width = '11px';
        iconContainer.style.flexShrink = '0';
        iconContainer.style.position = 'relative';
        
        const iconEl = document.createElement('i');
        iconEl.classList.add('fas', `fa-${icon}`);
        iconEl.style.fontSize = 'var(--font-size-fa-body2-solid)';
        iconEl.style.lineHeight = 'var(--font-line-height-fa-body2-solid)';
        iconEl.style.fontStyle = 'normal';
        iconEl.style.textAlign = 'center';
        iconEl.style.whiteSpace = 'nowrap';
        
        // Icon color varies by state - Figma shows primary color for selected/hover/focus
        if (state === 'selected' || state === 'hover' || state === 'focus') {
            iconEl.style.color = 'var(--color-primary)';
        } else if (state === 'disabled') {
            iconEl.style.opacity = '0.38';
            iconEl.style.color = 'var(--color-on-surface-variant)';
        } else {
            iconEl.style.color = 'var(--color-on-surface-variant)';
        }
        
        iconContainer.appendChild(iconEl);
        tab.appendChild(iconContainer);
    }
    
    // Text - Figma: Body/B2/Regular (Light, 14px, line-height 1.571)
    const textEl = document.createElement('div');
    textEl.classList.add('body2-txt');
    textEl.style.fontWeight = 'var(--font-weight-light)';
    textEl.style.fontSize = 'var(--font-size-body2)';
    textEl.style.lineHeight = 'var(--font-line-height-body2)';
    textEl.textContent = text;
    textEl.style.flex = '1 0 0';
    textEl.style.minHeight = '1px';
    textEl.style.minWidth = '1px';
    textEl.style.position = 'relative';
    textEl.style.flexShrink = '0';
    
    // Text color varies by state
    if (state === 'selected') {
        // Selected uses primary-text color
        textEl.style.color = 'var(--color-primary-text)';
    } else if (state === 'hover' || state === 'focus') {
        // Hover/focus also use primary-text
        textEl.style.color = 'var(--color-primary-text)';
    } else if (state === 'disabled') {
        textEl.style.opacity = '0.38';
        textEl.style.color = 'var(--color-on-surface-variant)';
    } else {
        textEl.style.color = 'var(--color-on-surface)';
    }
    
    tab.appendChild(textEl);
    
    // Trailing visual (icon)
    if (trailingVisual) {
        const trailingContainer = document.createElement('div');
        trailingContainer.style.display = 'flex';
        trailingContainer.style.alignItems = 'center';
        trailingContainer.style.justifyContent = 'center';
        trailingContainer.style.flexShrink = '0';
        trailingContainer.style.position = 'relative';
        
        const trailingIcon = document.createElement('i');
        trailingIcon.classList.add('fas', 'fa-icons');
        trailingIcon.style.fontSize = 'var(--font-size-fa-body2-solid)';
        trailingIcon.style.lineHeight = 'var(--font-line-height-fa-body2-solid)';
        trailingIcon.style.color = 'var(--color-on-surface-variant)';
        trailingContainer.appendChild(trailingIcon);
        
        tab.appendChild(trailingContainer);
    }
    
    return tab;
}
