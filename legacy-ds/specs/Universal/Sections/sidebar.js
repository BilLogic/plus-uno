/**
 * @fileoverview Spec component for PLUS design system.
 * Shared organism component for navigation sidebar with tutor and supervisor variants.
 * Matches Figma design system specifications.
 * 
 * Figma: node-id 111-227891 (tutor and supervisor variants)
 */

import { createSidebarTab } from '../../../components/SidebarTab/index.js';
import { createLogo } from '../../../assets/index.js';

/**
 * Creates a sidebar organism component
 * @param {Object} options - Sidebar configuration
 * @param {string} [options.user='tutor'] - User type (tutor, supervisor)
 * @param {string} [options.logoContainerUrl] - Logo container image URL
 * @param {string} [options.logoTextUrl] - Logo text image URL
 * @param {string} [options.id] - Sidebar ID
 * @param {Function} [options.onHomeClick] - Home tab click handler
 * @param {Function} [options.onTabClick] - Tab click handler (receives tab name)
 * @param {Array} [options.classes] - Additional CSS classes
 * @returns {HTMLElement} Sidebar element
 */
export function createSidebar({
    user = 'tutor',
    logoContainerUrl = null,
    logoTextUrl = null,
    id = null,
    onHomeClick = null,
    onTabClick = null,
    visible = true,
    classes = []
}) {
    // Figma: Main container uses gap-[var(--surface-container/gap-sm,16px)]
    const sidebar = document.createElement('div');
    sidebar.classList.add('plus-sidebar');
    sidebar.style.display = 'flex';
    sidebar.style.flexDirection = 'column';
    sidebar.style.gap = 'var(--size-surface-gap-sm)'; // Gap between blocks (Logo, Home, Sections)
    // User requested Sidebar to hug content, so remove fixed width or 100%
    sidebar.style.width = 'fit-content';
    sidebar.style.height = '100%';
    sidebar.style.boxSizing = 'border-box';

    if (!visible) {
        sidebar.style.display = 'none';
    }

    if (id) {
        sidebar.id = id;
    }

    if (classes && classes.length > 0) {
        sidebar.classList.add(...classes);
    }

    // Logo section - Figma: px-[var(--element/pad-x-sm,8px)] py-[var(--element/pad-y-md,6px)], gap-[var(--element/gap-md,10px)], rounded-[4px]
    // User requested update to Large tier for padding
    const logoSection = document.createElement('div');
    logoSection.classList.add('plus-sidebar-logo');
    logoSection.style.display = 'flex';
    logoSection.style.alignItems = 'center';
    logoSection.style.gap = 'var(--size-element-gap-md)';
    // User requested NO padding for logo section
    logoSection.style.padding = '0';
    logoSection.style.borderRadius = 'var(--size-element-radius-sm)';
    logoSection.style.boxSizing = 'border-box';

    // Logo - Use createLogo component
    const logo = createLogo({
        style: 'colored',
        size: 'XS',
        text: true
    });

    logoSection.appendChild(logo);

    sidebar.appendChild(logoSection);

    // Home tab (selected state) - Figma: bg-[var(--_primary/state-layers/primary-16)], px-[var(--element/pad-x-lg,16px)] py-[var(--element/pad-y-lg,8px)], rounded-[var(--element/radius-sm,4px)]
    const homeTab = createSidebarTab({
        text: 'Home',
        icon: 'house',
        state: 'selected',
        onClick: onHomeClick
    });
    sidebar.appendChild(homeTab);

    // Training section
    const trainingSection = document.createElement('div');
    trainingSection.classList.add('plus-sidebar-section');
    trainingSection.style.display = 'flex';
    trainingSection.style.flexDirection = 'column';
    trainingSection.style.gap = 'var(--size-element-gap-sm)'; // Gap within section (Title to Tab, Tab to Tab)

    // Section title - Figma: px-[var(--element/pad-x-md,10px)] py-[var(--element/pad-y-md,6px)], Body/B2/Semibold (Regular, 14px)
    // User requested update to Large tier for padding
    const trainingTitle = document.createElement('div');
    trainingTitle.classList.add('plus-sidebar-section-title');
    // Updated to Large tier
    // Updated to Large tier - User requested NO left padding for titles
    trainingTitle.style.padding = 'var(--size-element-pad-y-lg) var(--size-element-pad-x-lg) 0 0';
    const trainingTitleText = document.createElement('p');
    trainingTitleText.classList.add('body2-txt');
    trainingTitleText.style.fontWeight = 'var(--font-weight-normal)';
    trainingTitleText.style.margin = '0';
    trainingTitleText.textContent = 'Training';
    trainingTitle.appendChild(trainingTitleText);
    trainingSection.appendChild(trainingTitle);

    // Lessons tab - Figma: px-[var(--element/pad-x-lg,16px)] py-[var(--element/pad-y-lg,8px)]
    const lessonsTab = createSidebarTab({
        text: 'Lessons',
        icon: 'book-open',
        state: 'enabled',
        onClick: () => onTabClick && onTabClick('lessons')
    });
    trainingSection.appendChild(lessonsTab);

    // Onboarding tab - Figma: px-[var(--element/pad-x-lg,16px)] py-[var(--element/gap-sm,8px)]
    const onboardingTab = createSidebarTab({
        text: 'Onboarding',
        icon: 'clipboard',
        state: 'enabled',
        onClick: () => onTabClick && onTabClick('onboarding')
    });
    trainingSection.appendChild(onboardingTab);

    sidebar.appendChild(trainingSection);

    // Toolkit section
    const toolkitSection = document.createElement('div');
    toolkitSection.classList.add('plus-sidebar-section');
    toolkitSection.style.display = 'flex';
    toolkitSection.style.flexDirection = 'column';
    toolkitSection.style.gap = 'var(--size-element-gap-sm)';

    const toolkitTitle = document.createElement('div');
    toolkitTitle.classList.add('plus-sidebar-section-title');
    // Updated to Large tier
    // Updated to Large tier - User requested NO left padding for titles
    toolkitTitle.style.padding = 'var(--size-element-pad-y-lg) var(--size-element-pad-x-lg) 0 0';
    const toolkitTitleText = document.createElement('p');
    toolkitTitleText.classList.add('body2-txt');
    toolkitTitleText.style.fontWeight = 'var(--font-weight-normal)';
    toolkitTitleText.style.margin = '0';
    toolkitTitleText.textContent = 'Toolkit';
    toolkitTitle.appendChild(toolkitTitleText);
    toolkitSection.appendChild(toolkitTitle);

    // Sessions tab - Figma: py varies by user type
    const sessionsTab = createSidebarTab({
        text: 'Sessions',
        icon: 'calendar-alt',
        state: 'enabled',
        onClick: () => onTabClick && onTabClick('sessions')
    });
    toolkitSection.appendChild(sessionsTab);

    // Slack tab
    const slackTab = createSidebarTab({
        text: 'Slack',
        icon: 'arrow-up-right-from-square',
        state: 'enabled',
        onClick: () => onTabClick && onTabClick('slack')
    });
    toolkitSection.appendChild(slackTab);

    sidebar.appendChild(toolkitSection);

    // Admin section (only for supervisor)
    if (user === 'supervisor') {
        const adminSection = document.createElement('div');
        adminSection.classList.add('plus-sidebar-section');
        adminSection.style.display = 'flex';
        adminSection.style.flexDirection = 'column';
        adminSection.style.gap = 'var(--size-element-gap-sm)';

        const adminTitle = document.createElement('div');
        adminTitle.classList.add('plus-sidebar-section-title');
        // Updated to Large tier
        // Updated to Large tier - User requested NO left padding for titles
        adminTitle.style.padding = 'var(--size-element-pad-y-lg) var(--size-element-pad-x-lg) 0 0';
        const adminTitleText = document.createElement('p');
        adminTitleText.classList.add('body2-txt');
        adminTitleText.style.fontWeight = 'var(--font-weight-normal)';
        adminTitleText.style.margin = '0';
        adminTitleText.textContent = 'Admin';
        adminTitle.appendChild(adminTitleText);
        adminSection.appendChild(adminTitle);

        // Tutors tab
        const tutorsTab = createSidebarTab({
            text: 'Tutors',
            icon: 'chart-pie',
            state: 'enabled',
            onClick: () => onTabClick && onTabClick('tutors')
        });
        adminSection.appendChild(tutorsTab);

        // Sessions tab (admin)
        const adminSessionsTab = createSidebarTab({
            text: 'Sessions',
            icon: 'calendar-week',
            state: 'enabled',
            onClick: () => onTabClick && onTabClick('admin-sessions')
        });
        adminSection.appendChild(adminSessionsTab);

        // Students tab
        const studentsTab = createSidebarTab({
            text: 'Students',
            icon: 'users',
            state: 'enabled',
            onClick: () => onTabClick && onTabClick('students')
        });
        adminSection.appendChild(studentsTab);

        // Groups tab
        const groupsTab = createSidebarTab({
            text: 'Groups',
            icon: 'users-rectangle',
            state: 'enabled',
            onClick: () => onTabClick && onTabClick('groups')
        });
        adminSection.appendChild(groupsTab);

        sidebar.appendChild(adminSection);
    }

    return sidebar;
}
