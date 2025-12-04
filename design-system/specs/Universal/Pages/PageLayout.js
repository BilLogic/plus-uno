/**
 * @fileoverview Spec component for PLUS design system.
 * Universal page layout component that composes Sidebar, TopBar, Content, and Footer.
 * Handles responsive sidebar visibility and layout structure.
 */

import { createSidebar } from '../Sections/sidebar.js';
import { createTopBar } from '../Sections/topbar.js';
import { createFooter } from '../Sections/footer.js';

/**
 * Creates a universal page layout component
 * @param {Object} options - Layout configuration
 * @param {HTMLElement} options.content - The main page content element
 * @param {Object} [options.sidebarConfig={}] - Configuration for the Sidebar
 * @param {Object} [options.topBarConfig={}] - Configuration for the TopBar
 * @param {Object} [options.footerConfig={}] - Configuration for the Footer
 * @param {string} [options.id] - Layout ID
 * @param {Array} [options.classes] - Additional CSS classes
 * @returns {HTMLElement} Page layout element
 */
export function createPageLayout({
    content,
    sidebarConfig = {},
    topBarConfig = {},
    footerConfig = {},
    simulateWidth = null,
    id = null,
    classes = []
}) {
    const layout = document.createElement('div');
    layout.classList.add('plus-page-layout');

    // Layout styles - Main Container (Flex Column)
    layout.style.display = 'flex';
    layout.style.flexDirection = 'column'; // TopBar on top, Content below
    layout.style.width = '100%';
    layout.style.height = '100vh'; // Full viewport height
    // User requested layout background to be Surface Container
    layout.style.backgroundColor = 'var(--color-surface-container)';
    layout.style.overflow = 'hidden'; // Prevent body scroll
    // User requested outline around overall layout
    layout.style.border = '1px solid var(--color-outline-variant)';
    layout.style.boxSizing = 'border-box'; // Ensure border is included in width/height

    // User requested specific padding/gap for outer container
    layout.style.padding = 'var(--Surface-Container-pad-y-sm, 12px) var(--Surface-Container-pad-x-sm, 16px)';
    layout.style.gap = 'var(--Surface-Container-gap-sm, 16px)';
    layout.style.alignItems = 'flex-start'; // This might break full width if children aren't 100%. TopBar is 100%.

    if (id) {
        layout.id = id;
    }

    if (classes && classes.length > 0) {
        layout.classList.add(...classes);
    }

    // --- State Management ---
    // Breakpoint for sidebar visibility (lg-min: 992px)
    const breakpoint = 992;

    // Determine initial visibility
    // If simulateWidth is provided, use it. Otherwise check window.innerWidth.
    let isSidebarVisible;
    if (simulateWidth !== null) {
        isSidebarVisible = simulateWidth >= breakpoint;
    } else {
        isSidebarVisible = window.innerWidth >= breakpoint;
    }

    // --- TopBar (Top Level) ---
    const topBarContainer = document.createElement('div');
    topBarContainer.classList.add('plus-page-topbar-wrapper');
    topBarContainer.style.width = '100%';
    topBarContainer.style.flexShrink = '0'; // Don't shrink
    topBarContainer.style.zIndex = '110'; // Above sidebar
    topBarContainer.style.position = 'relative';
    // User requested NO stroke/outline around topbar
    topBarContainer.style.borderBottom = 'none';

    // Helper to create and append TopBar
    function renderTopBar() {
        // Clear existing content
        topBarContainer.innerHTML = '';

        const topBar = createTopBar({
            ...topBarConfig,
            mode: isSidebarVisible ? 'expanded' : 'collapsed',
            onSidebarToggle: () => {
                toggleSidebar();
                if (topBarConfig.onSidebarToggle) {
                    topBarConfig.onSidebarToggle();
                }
            }
        });
        // Ensure TopBar spans full width
        topBar.style.width = '100%';
        topBarContainer.appendChild(topBar);
        return topBar;
    }

    // Initial render
    let topBar = renderTopBar();
    layout.appendChild(topBarContainer);

    // --- Main Container (Sidebar + Content) ---
    const mainContainer = document.createElement('div');
    mainContainer.classList.add('plus-page-main-container');
    mainContainer.style.display = 'flex';
    mainContainer.style.flex = '1'; // Grow to fill remaining height
    mainContainer.style.overflow = 'hidden'; // Contain scroll within this area
    mainContainer.style.position = 'relative';
    // Ensure main container takes full width available (minus parent padding)
    mainContainer.style.width = '100%';
    // User requested gap between Sidebar and Content (Surface Container Gap Small)
    mainContainer.style.gap = 'var(--Surface-Container-gap-sm, 16px)';
    // User requested Sidebar to hug content. 
    mainContainer.style.alignItems = 'stretch';

    // --- Sidebar ---
    const sidebarContainer = document.createElement('div');
    sidebarContainer.classList.add('plus-page-sidebar-wrapper');
    sidebarContainer.style.flexShrink = '0';
    sidebarContainer.style.height = '100%'; // Fill main container height
    sidebarContainer.style.overflowY = 'auto'; // Sidebar scroll if needed
    // User requested NO stroke/outline around sidebar
    sidebarContainer.style.borderRight = 'none';
    sidebarContainer.style.backgroundColor = 'var(--color-surface-container)';
    sidebarContainer.style.transition = 'transform 0.3s ease, width 0.3s ease';
    sidebarContainer.style.zIndex = '100';
    // Ensure sidebar container allows sidebar to hug content
    sidebarContainer.style.width = 'fit-content';

    // Initial visibility
    if (!isSidebarVisible) {
        sidebarContainer.style.display = 'none';
    }

    const sidebar = createSidebar({
        ...sidebarConfig,
        visible: true
    });
    sidebarContainer.appendChild(sidebar);
    mainContainer.appendChild(sidebarContainer);

    // --- Content Wrapper (Page Content + Footer) ---
    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('plus-page-content-wrapper');
    contentWrapper.style.display = 'flex';
    contentWrapper.style.flexDirection = 'column';
    // User requested specific styles for "surface layer"
    contentWrapper.style.padding = 'var(--Surface-pad-y, 24px) var(--Surface-pad-x, 32px)';
    contentWrapper.style.gap = 'var(--Surface-gap-md, 24px)';
    contentWrapper.style.flex = '1 0 0'; // Flex grow, shrink, basis 0
    contentWrapper.style.alignItems = 'flex-start';

    contentWrapper.style.minWidth = '0';
    contentWrapper.style.height = '100%';
    contentWrapper.style.overflowY = 'auto'; // Scrollable content area
    // User requested Content Container to be Surface
    contentWrapper.style.backgroundColor = 'var(--color-surface)';
    // User requested corner radius
    contentWrapper.style.borderRadius = 'var(--size-surface-radius, 16px)';

    // --- Page Content ---
    const mainContent = document.createElement('main');
    mainContent.classList.add('plus-page-main');
    mainContent.style.flex = '1';
    // Remove previous padding as it's now on contentWrapper
    mainContent.style.padding = '0';
    mainContent.style.boxSizing = 'border-box';
    mainContent.style.width = '100%'; // Ensure it fills width despite align-items: flex-start

    if (content) {
        mainContent.appendChild(content);
    }
    contentWrapper.appendChild(mainContent);

    // --- Footer ---
    const footer = createFooter(footerConfig);
    footer.style.marginTop = 'auto';
    // Remove previous padding as it's now on contentWrapper
    footer.style.padding = '0';
    footer.style.width = '100%'; // Ensure it fills width

    contentWrapper.appendChild(footer);

    mainContainer.appendChild(contentWrapper);
    layout.appendChild(mainContainer);

    // --- Logic ---

    function toggleSidebar() {
        isSidebarVisible = !isSidebarVisible;
        updateLayout();
    }

    function updateLayout() {
        // Update Sidebar visibility
        if (isSidebarVisible) {
            sidebarContainer.style.display = 'block';
        } else {
            sidebarContainer.style.display = 'none';
        }

        // Re-render TopBar to update its state (icon, etc.)
        // This ensures we use the correct TopBar configuration for the current mode
        topBar = renderTopBar();
    }

    // Responsive Handler
    // Only attach listener if we are NOT simulating width
    if (simulateWidth === null) {
        const mediaQuery = window.matchMedia(`(min-width: ${breakpoint}px)`);

        function handleBreakpointChange(e) {
            isSidebarVisible = e.matches;
            updateLayout();
        }

        mediaQuery.addEventListener('change', handleBreakpointChange);
    }

    // Initial update not needed as we set initial state above, but good for consistency
    // updateLayout(); // Skip to avoid double render on init

    return layout;
}
