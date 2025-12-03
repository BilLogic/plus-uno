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
import { createBadge } from '../Badge/index.js';

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
    avatar.style.width = '168px';
    // Padding: var(--Element-pad-y-md, 6px) var(--Element-pad-x-md, 10px)
    // Mapping to project tokens: var(--size-element-pad-y-md) var(--size-element-pad-x-md)
    avatar.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
    avatar.style.alignItems = 'center';
    // Gap: var(--Element-gap-md, 10px)
    // Mapping to project tokens: var(--size-element-gap-md)
    avatar.style.gap = 'var(--size-element-gap-md)';

    avatar.style.borderRadius = 'var(--size-element-radius-md)';
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
    nameSection.style.alignItems = 'center';
    // Gap: var(--Spacing-Small-space-075, 6px)
    // We'll use the fallback 6px or try to find the token. 
    // Based on previous files, it might be var(--size-spacing-small-space-075) but let's stick to the user's explicit request or a safe fallback.
    // The user provided: gap: var(--Spacing-Small-space-075, 6px);
    nameSection.style.gap = '6px'; // Using the value directly to be safe and match the "6px" in the var fallback
    nameSection.style.flex = '1 0 0';

    nameSection.style.minHeight = '1px';
    nameSection.style.minWidth = '1px';
    nameSection.style.position = 'relative';

    // Name pill (avatar circle) - using Badge component
    // Figma: bg-[var(--_primary/state-layers/primary-08)], px-[4px] py-0, rounded-[var(--border/radius/radius-1000,999px)]
    // Text: Body/B2/Semibold (Regular, 14px)
    const namePill = createBadge({
        text: firstChar,
        style: 'primary',
        size: 'b2',
        classes: ['plus-user-avatar-initial']
    });

    // Force circular shape for the initial
    namePill.style.padding = '0';
    namePill.style.width = '24px';
    namePill.style.height = '24px';
    namePill.style.minWidth = '24px'; // Ensure it doesn't shrink
    namePill.style.borderRadius = '50%'; // Force circle
    namePill.style.display = 'flex';
    namePill.style.alignItems = 'center';
    namePill.style.justifyContent = 'center';

    // Fix text alignment inside the badge
    const namePillText = namePill.querySelector('.plus-badge-text');
    if (namePillText) {
        namePillText.style.lineHeight = '1';
        namePillText.style.display = 'block'; // Ensure it behaves like a block for height calculations if needed
    }

    nameSection.appendChild(namePill);

    // Name text - Figma: Body/B2/Regular (Light, 14px), color var(--neutral-colors/on-surface,#191c1e)
    const nameText = document.createElement('p');
    nameText.style.margin = '0'; // Remove default browser margin
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

    avatar.appendChild(nameSection);

    // Counter badge - using Badge component
    // Figma: bg-[var(--_danger/state-layers/danger-08)], px-[var(--element/pad-x-sm,8px)] py-0
    // Text: Body/B3/Semibold (Regular, 12px)
    if (counter) {
        const counterBadge = createBadge({
            text: counterValue.toString(),
            style: 'danger',
            size: 'b3',
            classes: ['plus-user-avatar-counter']
        });
        // Adjust padding to match Figma px-[8px] py-0
        counterBadge.style.paddingTop = '0';
        counterBadge.style.paddingBottom = '0';

        // Fix text alignment inside the counter badge
        const counterBadgeText = counterBadge.querySelector('.plus-badge-text');
        if (counterBadgeText) {
            counterBadgeText.style.lineHeight = '1';
        }

        avatar.appendChild(counterBadge);
    }

    return avatar;
}
