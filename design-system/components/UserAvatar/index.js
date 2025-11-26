/**
 * @fileoverview User Avatar component for PLUS design system.
 * Universal element component for displaying user information with avatar.
 * Matches Figma design system specifications.
 * 
 * Figma: node-id 111-227876
 */

/**
 * Creates a user avatar component
 * @param {Object} options - User avatar configuration
 * @param {string} [options.firstChar='J'] - First character to display in avatar
 * @param {string} [options.name='John Doe'] - User name to display
 * @param {boolean} [options.showName=true] - Whether to show the name
 * @param {boolean} [options.counter=true] - Whether to show notification counter badge
 * @param {number} [options.counterValue=2] - Counter badge value
 * @param {string} [options.type='default'] - Avatar type (default, focus)
 * @param {string} [options.id] - Avatar ID
 * @param {Function} [options.onClick] - Click handler function
 * @param {Array} [options.classes] - Additional CSS classes
 * @returns {HTMLElement} User avatar element
 */
export function createUserAvatar({
    firstChar = 'J',
    name = 'John Doe',
    showName = true,
    counter = true,
    counterValue = 2,
    type = 'default',
    id = null,
    onClick = null,
    classes = []
}) {
    // Figma: gap-[var(--element/gap-md,10px)], px-[var(--element/pad-x-md,10px)] py-[var(--element/pad-y-md,6px)], rounded-[var(--element/radius-md,4px)], w-[168px]
    const avatar = document.createElement('div');
    avatar.classList.add('plus-user-avatar', `plus-user-avatar-${type}`);
    
    avatar.style.display = 'flex';
    avatar.style.gap = 'var(--size-element-gap-md)';
    avatar.style.alignItems = 'center';
    avatar.style.paddingLeft = 'var(--size-element-pad-x-md)';
    avatar.style.paddingRight = 'var(--size-element-pad-x-md)';
    avatar.style.paddingTop = 'var(--size-element-pad-y-md)';
    avatar.style.paddingBottom = 'var(--size-element-pad-y-md)';
    avatar.style.borderRadius = 'var(--size-element-radius-md)';
    avatar.style.width = '168px';
    avatar.style.boxSizing = 'border-box';
    avatar.style.position = 'relative';
    
    // Background color for default type
    if (type === 'default') {
        avatar.style.backgroundColor = 'var(--color-surface-container-lowest)';
    }
    
    if (id) {
        avatar.id = id;
    }
    
    if (classes && classes.length > 0) {
        avatar.classList.add(...classes);
    }
    
    if (onClick) {
        avatar.style.cursor = 'pointer';
        avatar.addEventListener('click', onClick);
    }
    
    // User name section - Figma: flex-[1_0_0], gap-[var(--spacing/small/space-075,6px)]
    const nameSection = document.createElement('div');
    nameSection.style.display = 'flex';
    nameSection.style.flex = '1 0 0';
    nameSection.style.gap = '6px'; // space-075 = 6px
    nameSection.style.alignItems = 'center';
    nameSection.style.minHeight = '1px';
    nameSection.style.minWidth = '1px';
    nameSection.style.position = 'relative';
    nameSection.style.flexShrink = '0';
    
    // Name pill (avatar circle) - Figma: bg-[var(--_primary/state-layers/primary-08)], px-[4px] py-0, rounded-[var(--border/radius/radius-1000,999px)]
    const namePill = document.createElement('div');
    namePill.style.display = 'flex';
    namePill.style.alignItems = 'center';
    namePill.style.paddingLeft = '4px';
    namePill.style.paddingRight = '4px';
    namePill.style.paddingTop = '0';
    namePill.style.paddingBottom = '0';
    namePill.style.borderRadius = '999px'; // radius-1000 = 999px
    namePill.style.backgroundColor = 'var(--color-primary-state-08)';
    namePill.style.flexShrink = '0';
    namePill.style.boxSizing = 'border-box';
    namePill.style.position = 'relative';
    
    // Badge container - Figma: gap-[10px] h-[24px], min-w-[16px]
    const pillContent = document.createElement('div');
    pillContent.style.display = 'flex';
    pillContent.style.gap = '10px';
    pillContent.style.height = '24px';
    pillContent.style.alignItems = 'center';
    pillContent.style.justifyContent = 'center';
    pillContent.style.minWidth = '16px';
    pillContent.style.position = 'relative';
    pillContent.style.flexShrink = '0';
    
    // Text - Figma: Body/B2/Semibold (Regular, 14px), color var(--_primary/primary-(text),#00547e)
    const pillText = document.createElement('div');
    pillText.style.display = 'flex';
    pillText.style.flex = '1 0 0';
    pillText.style.flexDirection = 'column';
    pillText.style.fontFamily = 'var(--font-family-body)';
    pillText.style.fontWeight = 'var(--font-weight-normal)';
    pillText.style.justifyContent = 'center';
    pillText.style.lineHeight = '0';
    pillText.style.minHeight = '1px';
    pillText.style.minWidth = '1px';
    pillText.style.position = 'relative';
    pillText.style.flexShrink = '0';
    pillText.style.fontSize = 'var(--font-size-body2)';
    pillText.style.color = 'var(--color-primary-text)';
    pillText.style.textAlign = 'center';
    
    const pillTextP = document.createElement('p');
    pillTextP.style.lineHeight = '1.571';
    pillTextP.style.whiteSpace = 'pre-wrap';
    pillTextP.textContent = firstChar;
    pillText.appendChild(pillTextP);
    
    pillContent.appendChild(pillText);
    namePill.appendChild(pillContent);
    nameSection.appendChild(namePill);
    
    // Name text - Figma: Body/B2/Regular (Light, 14px), color var(--neutral-colors/on-surface,#191c1e)
    if (showName) {
        const nameText = document.createElement('p');
        nameText.style.flex = '1 0 0';
        nameText.style.fontFamily = 'var(--font-family-body)';
        nameText.style.fontWeight = 'var(--font-weight-light)';
        nameText.style.lineHeight = '1.571';
        nameText.style.minHeight = '1px';
        nameText.style.minWidth = '1px';
        nameText.style.overflow = 'ellipsis';
        nameText.style.overflowX = 'hidden';
        nameText.style.position = 'relative';
        nameText.style.flexShrink = '0';
        nameText.style.fontSize = 'var(--font-size-body2)';
        nameText.style.color = 'var(--color-on-surface)';
        nameText.style.whiteSpace = 'nowrap';
        nameText.textContent = name;
        nameSection.appendChild(nameText);
    }
    
    avatar.appendChild(nameSection);
    
    // Counter badge - Figma: bg-[var(--_danger/state-layers/danger-08)], px-[var(--element/pad-x-sm,8px)] py-0, rounded-[var(--border/radius/radius-1000,999px)]
    if (counter) {
        const counterBadge = document.createElement('div');
        counterBadge.style.display = 'flex';
        counterBadge.style.alignItems = 'center';
        counterBadge.style.paddingLeft = 'var(--size-element-pad-x-sm)';
        counterBadge.style.paddingRight = 'var(--size-element-pad-x-sm)';
        counterBadge.style.paddingTop = '0';
        counterBadge.style.paddingBottom = '0';
        counterBadge.style.borderRadius = '999px'; // radius-1000 = 999px
        counterBadge.style.backgroundColor = 'var(--color-danger-state-08)';
        counterBadge.style.flexShrink = '0';
        counterBadge.style.boxSizing = 'border-box';
        counterBadge.style.position = 'relative';
        
        // Badge content - Figma: gap-[var(--element/gap-sm,8px)], min-w-[12px]
        const counterContent = document.createElement('div');
        counterContent.style.display = 'flex';
        counterContent.style.gap = 'var(--size-element-gap-sm)';
        counterContent.style.alignItems = 'center';
        counterContent.style.justifyContent = 'center';
        counterContent.style.minWidth = '12px';
        counterContent.style.position = 'relative';
        counterContent.style.flexShrink = '0';
        
        // Text - Figma: Body/B3/Semibold (Regular, 12px), color var(--_danger/danger-(text),#9b0606)
        const counterText = document.createElement('div');
        counterText.style.display = 'flex';
        counterText.style.flex = '1 0 0';
        counterText.style.flexDirection = 'column';
        counterText.style.fontFamily = 'var(--font-family-body)';
        counterText.style.fontWeight = 'var(--font-weight-normal)';
        counterText.style.justifyContent = 'center';
        counterText.style.lineHeight = '0';
        counterText.style.minHeight = '1px';
        counterText.style.minWidth = '1px';
        counterText.style.position = 'relative';
        counterText.style.flexShrink = '0';
        counterText.style.fontSize = 'var(--font-size-body3)';
        counterText.style.color = 'var(--color-danger-text)';
        counterText.style.textAlign = 'center';
        
        const counterTextP = document.createElement('p');
        counterTextP.style.lineHeight = '1.667';
        counterTextP.style.whiteSpace = 'pre-wrap';
        counterTextP.textContent = counterValue.toString();
        counterText.appendChild(counterTextP);
        
        counterContent.appendChild(counterText);
        counterBadge.appendChild(counterContent);
        avatar.appendChild(counterBadge);
    }
    
    return avatar;
}
