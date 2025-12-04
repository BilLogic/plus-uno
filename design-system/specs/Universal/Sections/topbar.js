/**
 * @fileoverview Spec component for PLUS design system.
 * Shared organism component for top navigation bar with breadcrumb and user avatar.
 * Matches Figma design system specifications.
 * 
 * Figma: node-id 111-227859 (expanded and collapsed variants)
 */

import { createBreadcrumb } from '../../../components/Breadcrumb/index.js';
import { createUserAvatar } from '../../../components/UserAvatar/index.js';
import { createButton } from '../../../components/Button/index.js';

/**
 * Creates a top bar organism component
 * @param {Object} options - Top bar configuration
 * @param {string} [options.mode='expanded'] - Top bar mode (expanded, collapsed)
 * @param {Array<Object>} [options.breadcrumbItems] - Breadcrumb items array
 * @param {string} [options.userName='John Doe'] - User name for avatar
 * @param {string} [options.userFirstChar='J'] - First character for avatar
 * @param {number} [options.counterValue=2] - Notification counter value
 * @param {Function} [options.onSidebarToggle] - Sidebar toggle button click handler
 * @param {Function} [options.onUserClick] - User avatar click handler
 * @param {string} [options.id] - Top bar ID
 * @param {Array} [options.classes] - Additional CSS classes
 * @returns {HTMLElement} Top bar element
 */
export function createTopBar({
    mode = 'expanded',
    breadcrumbItems = [{ text: 'Strategies' }],
    userName = 'John Doe',
    userFirstChar = 'J',
    counterValue = 2,
    onSidebarToggle = null,
    onUserClick = null,
    id = null,
    classes = []
}) {
    // Figma: gap-[var(--surface-container/gap-sm,16px)], px-[var(--surface-container/pad-x-sm,16px)] py-[var(--surface-container/pad-y-sm,12px)]
    const topBar = document.createElement('div');
    topBar.classList.add('plus-topbar', `plus-topbar-${mode}`);
    topBar.style.display = 'flex';
    topBar.style.alignItems = 'center';
    // Removed justify-content: space-between to rely on gap and flex-grow
    // User didn't specify justify-content, but implied a flex container. 
    // User said: layout of container ... gap: 16px. 
    // If I use justify-content: space-between, the gap might be ignored if there is extra space. 
    // But usually TopBar has [Left Control] ... [Breadcrumb] ... [User Avatar].
    // If the user wants specific gap, maybe they want them stacked left? 
    // "gap: 16px" implies they might just be flex-start?
    // Let's look at the Figma screenshot or context if I had it. 
    // The user said "gap between the toggle icon button and the breadcrumb section is wayy too large".
    // This suggests `justify-content: space-between` is WRONG and it should be `justify-content: flex-start` (default) with `flex-grow` on the middle element or just gap.
    // However, usually the User Avatar is on the far right.
    // Let's assume the Breadcrumb expands? 
    // In `topbar.js` before: `pageControl` (breadcrumb) had `flex-[1_0_0]`.
    // If `pageControl` grows, it pushes the avatar to the right.
    // So `justify-content` on `topBar` doesn't matter as much if `pageControl` grows.
    // BUT, if `pageControl` grows, the gap between SidebarControl and PageControl is handled by `topBar` gap? No, `sidebarControl` is a child.
    // So: [SidebarControl] --gap-- [PageControl (flex-grow)] --gap-- [UserAvatar]
    // If `PageControl` grows, it takes all available space.
    // The gap between SidebarControl and PageControl will be `16px`.
    // The gap between PageControl and UserAvatar will be `16px`.
    // This seems correct.

    topBar.style.width = '100%'; // User said 1268px, but 100% is safer for component.
    topBar.style.boxSizing = 'border-box';
    // User requested: gap: var(--Surface-Container-gap-sm, 16px);
    topBar.style.gap = 'var(--Surface-Container-gap-sm, 16px)';
    // User requested NO padding on sides or top/bottom for TopBar
    topBar.style.padding = '0';

    if (id) {
        topBar.id = id;
    }

    if (classes && classes.length > 0) {
        topBar.classList.add(...classes);
    }

    // Sidebar control button - Figma: w-[168px] (or 250px to match sidebar), h-full
    const sidebarControlWrapper = document.createElement('div');
    sidebarControlWrapper.classList.add('flex', 'flex-row', 'items-center', 'self-stretch');
    // Set width based on mode to align with sidebar
    if (mode === 'expanded') {
        sidebarControlWrapper.style.width = '168px'; // User spec: 168px
        sidebarControlWrapper.style.flexShrink = '0';
    } else {
        sidebarControlWrapper.style.width = 'auto'; // User spec: closed state just flex
        sidebarControlWrapper.style.flexShrink = '0';
    }
    sidebarControlWrapper.style.display = 'flex';
    sidebarControlWrapper.style.alignItems = 'center';
    sidebarControlWrapper.style.alignSelf = 'stretch';

    const sidebarControl = document.createElement('div');
    sidebarControl.classList.add('plus-topbar-sidebar-control');

    // Toggle button - Figma: bg-[var(--_primary/state-layers/primary-08)], rounded-[var(--element/radius-md,4px)]
    // Icon: angles-left (expanded) or bars (collapsed), text-[14px] (Font Awesome H6)
    const toggleButton = createButton({
        btnText: '',
        btnStyle: 'primary',
        btnFill: 'tonal',
        btnSize: 'default',
        icon: mode === 'expanded' ? 'angles-left' : 'bars',
        buttonOnClick: onSidebarToggle,
        classes: ['plus-topbar-toggle-button']
    });

    sidebarControl.appendChild(toggleButton);
    sidebarControlWrapper.appendChild(sidebarControl);
    topBar.appendChild(sidebarControlWrapper);

    // Page control (breadcrumb) - Figma: flex-[1_0_0]
    const pageControl = document.createElement('div');
    pageControl.classList.add('plus-topbar-page-control');
    pageControl.style.flex = '1 0 0'; // Ensure it grows to push avatar to right

    // Breadcrumb - Figma: gap-[var(--element/gap-sm,8px)], px-[var(--element/pad-x-lg,16px)] py-[var(--element/pad-y-lg,8px)]
    const breadcrumb = createBreadcrumb({
        items: breadcrumbItems
    });
    breadcrumb.classList.add('plus-topbar-breadcrumb');

    // Figma: Body/B1/Regular (Light, 16px), color var(--neutral-colors/on-surface-variant,#3f484a)
    const breadcrumbItemElements = breadcrumb.querySelectorAll('.plus-breadcrumb-current, .plus-breadcrumb-link');
    breadcrumbItemElements.forEach(item => {
        item.classList.add('body1-txt');
        item.style.fontWeight = 'var(--font-weight-light)';
    });

    pageControl.appendChild(breadcrumb);
    topBar.appendChild(pageControl);

    // User avatar - Figma: w-[168px], rounded varies by mode
    const userAvatar = createUserAvatar({
        firstChar: userFirstChar,
        name: userName,
        showName: true,
        counter: true,
        counterValue: counterValue,
        type: 'default',
        onClick: onUserClick,
        classes: ['plus-topbar-user-avatar']
    });

    topBar.appendChild(userAvatar);

    return topBar;
}
