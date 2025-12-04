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
 * @param {string} [options.type='regular tutor'] - Avatar type (regular tutor, lead tutor, admin)
 * @param {string} [options.id] - Avatar ID
 * @param {Function} [options.onClick] - Click handler function
 * @param {Array} [options.classes] - Additional CSS classes
 * @returns {HTMLElement} User avatar element
 */
/**
 * Creates a user avatar component
 * @param {Object} options - User avatar configuration
 * @param {string} [options.firstChar='J'] - First character to display in avatar
 * @param {string} [options.name='John Doe'] - User name to display
 * @param {boolean} [options.showName=true] - Whether to show the name
 * @param {boolean} [options.counter=true] - Whether to show notification counter badge
 * @param {number} [options.counterValue=2] - Counter badge value
 * @param {string} [options.state='enabled'] - Component state (enabled, hover)
 * @param {string} [options.type='regular tutor'] - Avatar type (regular tutor, lead tutor, admin)
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
    state = 'enabled',
    type = 'regular tutor',
    id = null,
    onClick = null,
    classes = []
}) {
    // Figma: gap-[var(--element/gap-md,10px)], px-[var(--element/pad-x-md,10px)] py-[var(--element/pad-y-md,6px)], rounded-[var(--element/radius-md,4px)], w-[168px]
    const avatar = document.createElement('div');
    // Clean up type for class name
    const typeClass = type.replace(/\s+/g, '-');
    avatar.classList.add('plus-user-avatar', `plus-user-avatar-${typeClass}`, `plus-user-avatar-${state}`);

    avatar.style.display = 'flex';
    avatar.style.width = '168px';
    // Padding: var(--Element-pad-y-md, 6px) var(--Element-pad-x-md, 10px)
    avatar.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
    avatar.style.alignItems = 'center';
    // Gap: var(--Element-gap-md, 10px)
    avatar.style.gap = 'var(--size-element-gap-md)';

    avatar.style.borderRadius = 'var(--size-element-radius-md)';
    avatar.style.boxSizing = 'border-box';
    avatar.style.position = 'relative';

    // Background color logic based on state and type
    // Default (enabled): surface-container-lowest
    // Hover: linear-gradient or specific color

    if (state === 'hover') {
        // Figma hover state usually adds a state layer. 
        // Based on snippet: linear-gradient(90deg, rgba(25, 28, 30, 0.08)...)
        // We'll use a simple background color for now that matches the "state-08" convention if gradient isn't perfect.
        // Or better, use the snippet's logic if possible.
        // Let's use a safe hover color for now: var(--color-surface-container-highest) or similar.
        // Or better: rgba(25, 28, 30, 0.08) which is --color-on-surface-state-08 roughly.
        avatar.style.backgroundColor = 'rgba(25, 28, 30, 0.08)';
        avatar.style.cursor = 'pointer';
    } else {
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
    nameSection.style.gap = '6px';
    nameSection.style.flex = '1 0 0';

    nameSection.style.minHeight = '1px';
    nameSection.style.minWidth = '1px';
    nameSection.style.position = 'relative';

    // Determine badge style based on user type
    // Default to primary (tonal) for regular tutor
    let badgeStyle = 'primary';

    // Name pill (avatar circle) - using Badge component
    const namePill = createBadge({
        text: firstChar,
        style: badgeStyle,
        size: 'b2',
        classes: ['plus-user-avatar-initial']
    });

    // Override styles for specific types to match Figma (Solid colors)
    if (type === 'lead tutor') {
        // Figma: Solid Primary background, On-Primary text
        namePill.style.backgroundColor = 'var(--color-primary)';
        namePill.style.color = 'var(--color-on-primary)';
    } else if (type === 'admin') {
        // Figma: Solid Secondary background, On-Secondary text
        namePill.style.backgroundColor = 'var(--color-secondary)';
        namePill.style.color = 'var(--color-on-secondary)';
    }

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
