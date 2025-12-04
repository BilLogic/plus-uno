/**
 * @fileoverview GroupInfoPage component for Group Admin specs
 * Full page layout for Group Info with groups table
 */

import { createPageLayout } from '../../../Universal/Pages/PageLayout.js';
import { createTopBar } from '../../../Universal/Sections/topbar.js';
import { createNavigation } from '../../../../components/Navigation/index.js';
import { createButton } from '../../../../components/Button/index.js';
import { createGroupsTableRow } from '../Tables/GroupsTable.js';
import { createPagination } from '../../../../components/Pagination/index.js';

/**
 * Creates the Group Info Page component
 * @returns {HTMLElement} The Group Info Page element
 */
export function createGroupInfoPage() {
    // --- Configuration ---
    const topBarConfig = {
        mode: 'expanded',
        breadcrumbItems: [
            { text: 'Home', href: '#' },
            { text: 'Group Admin' }
        ],
        userName: 'John Doe',
        userFirstChar: 'J',
        counterValue: 2
    };

    const sidebarConfig = {
        user: 'supervisor',
        onTabClick: (tab) => console.log(`Tab clicked: ${tab}`),
        onHomeClick: () => console.log('Home clicked')
    };

    // --- Content Creation ---
    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = 'var(--size-section-gap-md)';
    content.style.width = '100%';
    content.setAttribute("data-node-id", "258:263800");

    // Tab navigation - INSIDE content container
    const tabsWrapper = document.createElement('div');
    tabsWrapper.style.display = 'flex';
    tabsWrapper.style.alignItems = 'center';
    tabsWrapper.style.flexShrink = '0';

    // Tab navigation
    const tabs = createNavigation({
        type: 'tabs',
        items: [
            { text: 'Group Info', selected: true },
            { text: 'Training Progress', selected: false }
        ]
    });
    tabsWrapper.appendChild(tabs);
    content.appendChild(tabsWrapper);

    // Title section with Add Group button
    const titleSection = document.createElement('div');
    titleSection.style.display = 'flex';
    titleSection.style.flexWrap = 'wrap';
    titleSection.style.gap = 'var(--size-section-gap-md)';
    titleSection.style.alignItems = 'center';
    titleSection.style.justifyContent = 'space-between';
    titleSection.style.width = '100%';

    const title = document.createElement('h2');
    title.className = 'h4-txt';
    title.style.color = 'var(--color-on-surface)';
    title.textContent = 'Group Info';
    titleSection.appendChild(title);

    // Add Group button - on the right side of the title section
    const addGroupButton = createButton({
        btnText: 'Add Group',
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: 'default',
        icon: 'user-plus',
        iconPosition: 'left'
    });
    titleSection.appendChild(addGroupButton);

    content.appendChild(titleSection);

    // Table wrapper with scrolling
    const tableWrapper = document.createElement('div');
    tableWrapper.style.width = '100%';
    tableWrapper.style.overflowX = 'auto';
    tableWrapper.style.overflowY = 'hidden';

    // Main table
    const tableContainer = document.createElement('div');
    tableContainer.style.display = 'flex';
    tableContainer.style.flexDirection = 'column';
    tableContainer.style.minWidth = '1000px';
    tableContainer.style.width = '100%';

    // Table header
    const tableHeader = createGroupsTableRow({ type: 'header' });
    tableContainer.appendChild(tableHeader);

    // Table rows - matching Figma design (all show "Math Masters" with size 4)
    for (let i = 0; i < 10; i++) {
        const tableRow = createGroupsTableRow({
            type: 'list item',
            data: {
                groupName: 'Math Masters',
                groupSize: 4
            }
        });
        tableContainer.appendChild(tableRow);
    }

    tableWrapper.appendChild(tableContainer);
    content.appendChild(tableWrapper);

    // Footer with pagination
    const footerContainer = document.createElement('div');
    footerContainer.style.display = 'flex';
    footerContainer.style.flexWrap = 'wrap';
    footerContainer.style.gap = 'var(--size-section-gap-md)';
    footerContainer.style.alignItems = 'center';
    footerContainer.style.justifyContent = 'space-between';
    footerContainer.style.width = '100%';

    const paginationInfo = document.createElement('div');
    paginationInfo.className = 'body2-txt';
    paginationInfo.style.fontWeight = '300';
    paginationInfo.style.color = 'var(--color-on-surface)';
    paginationInfo.textContent = 'Showing 1 to 10 of 200 entries';
    footerContainer.appendChild(paginationInfo);

    const pagination = createPagination({
        currentPage: 1,
        totalPages: 20,
        type: 'icon', // Icon pagination with caret icons for prev/next (matching Figma)
        size: 'default'
    });
    footerContainer.appendChild(pagination);

    content.appendChild(footerContainer);

    // --- Page Layout Composition ---
    return createPageLayout({
        content: content,
        sidebarConfig: sidebarConfig,
        topBarConfig: topBarConfig,
        id: 'group-info-page'
    });
}

