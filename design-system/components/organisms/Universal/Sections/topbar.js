/**
 * @fileoverview Top Bar organism component for PLUS design system.
 * Shared organism component for top navigation bar with breadcrumb and user avatar.
 * Matches Figma design system specifications.
 * 
 * Figma: node-id 111-227859 (expanded and collapsed variants)
 */

import { createBreadcrumb } from '../../../molecules/Breadcrumb/index.js';
import { createUserAvatar } from '../../../molecules/UserAvatar/index.js';
import { createButton } from '../../../molecules/Button/index.js';

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
    
    if (id) {
        topBar.id = id;
    }
    
    if (classes && classes.length > 0) {
        topBar.classList.add(...classes);
    }
    
    // Sidebar control button - Figma: w-[168px], h-full
    const sidebarControlWrapper = document.createElement('div');
    sidebarControlWrapper.classList.add('flex', 'flex-row', 'items-center', 'self-stretch');
    
    const sidebarControl = document.createElement('div');
    sidebarControl.classList.add('plus-topbar-sidebar-control');
    
    // Toggle button - Figma: bg-[var(--_primary/state-layers/primary-08)], rounded-[var(--element/radius-md,4px)]
    // Icon: angles-left (expanded) or bars (collapsed), text-[14px] (Font Awesome H6)
    const toggleButton = createButton({
        btnText: '',
        btnStyle: 'default',
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
