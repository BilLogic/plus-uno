/**
 * @fileoverview SessionAdminPage component for Session Admin specs
 * Full page layout for Session Admin
 */

import { createPageLayout } from '../../../Universal/Pages/PageLayout.js';
import { createTopBar } from '../../../Universal/Sections/topbar.js';
import { createNavigation } from '../../../../components/Navigation/index.js';
import { createButton } from '../../../../components/Button/index.js';
import { createSessionsTableRow } from '../Tables/SessionsTable.js';
import { createPagination } from '../../../../components/Pagination/index.js';
import { createSessionOverviewSection } from '../Sections/SessionOverviewSection.js';
import { createFilters } from '../../Tutor Admin/Elements/Filters.js';
import { createSessionBreakdownModal } from '../Modals/SessionBreakdownModal.js';

/**
 * Creates a Session Admin Page component
 * @param {Object} options - Page configuration
 * @param {boolean} [options.showModal=false] - Whether to show the session breakdown modal with scrim
 * @returns {HTMLElement} Page element
 */
export function createSessionAdminPage({ showModal = false } = {}) {
    // --- Configuration ---
    const topBarConfig = {
        mode: 'expanded',
        breadcrumbItems: [
            { text: 'Home', href: '#' },
            { text: 'Session Admin' }
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
    content.style.gap = 'var(--size-surface-gap-md)';
    content.style.width = '100%';

    // Tab navigation
    const tabs = createNavigation({
        type: 'tabs',
        items: [
            { text: 'Warnings', selected: true },
            { text: 'Current Tutors', selected: false },
            { text: 'Incoming Tutors', selected: false },
            { text: 'Details', selected: false, disabled: true }
        ]
    });
    tabs.style.width = '600px';
    content.appendChild(tabs);

    // Container for overview and session details
    const contentWrapper = document.createElement('div');
    contentWrapper.style.display = 'flex';
    contentWrapper.style.flexDirection = 'column';
    contentWrapper.style.gap = 'var(--size-section-gap-lg)';
    contentWrapper.style.width = '100%';

    // Overview section
    const overviewSection = document.createElement('div');
    overviewSection.style.display = 'flex';
    overviewSection.style.flexDirection = 'column';
    overviewSection.style.gap = 'var(--size-section-gap-sm)';
    overviewSection.style.width = '100%';

    // Overview cards wrapper with horizontal scroll
    const overviewCardsWrapper = document.createElement('div');
    overviewCardsWrapper.style.width = '100%';
    overviewCardsWrapper.style.overflowX = 'auto';
    overviewCardsWrapper.style.overflowY = 'hidden';

    // Overview title and filters
    const overviewHeader = document.createElement('div');
    overviewHeader.style.display = 'flex';
    overviewHeader.style.flexWrap = 'wrap';
    overviewHeader.style.gap = 'var(--size-section-gap-md)';
    overviewHeader.style.alignItems = 'center';
    overviewHeader.style.justifyContent = 'space-between';
    overviewHeader.style.width = '100%';

    const overviewTitle = document.createElement('div');
    overviewTitle.style.fontFamily = 'var(--font-family-header)';
    overviewTitle.style.fontSize = 'var(--font-size-h4)';
    overviewTitle.style.fontWeight = 'var(--font-weight-semibold-2)';
    overviewTitle.style.lineHeight = '1.333';
    overviewTitle.style.color = 'var(--color-on-surface)';
    overviewTitle.style.whiteSpace = 'nowrap';
    overviewTitle.textContent = 'Session Overview';
    overviewHeader.appendChild(overviewTitle);

    // Filters container - use createFilters component from Tutor Admin
    const filtersContainer = createFilters({
        schoolFilter: 'All Schools',
        tutorFilter: 'All Tutors',
        startDate: '11/01/12',
        endDate: '12/20/12'
    });
    overviewHeader.appendChild(filtersContainer);

    overviewSection.appendChild(overviewHeader);

    // Overview cards section with horizontal scroll
    const overviewCards = createSessionOverviewSection();
    overviewCardsWrapper.appendChild(overviewCards);
    overviewSection.appendChild(overviewCardsWrapper);

    contentWrapper.appendChild(overviewSection);

    // Session Details section
    const sessionDetailsSection = document.createElement('div');
    sessionDetailsSection.style.display = 'flex';
    sessionDetailsSection.style.flexDirection = 'column';
    sessionDetailsSection.style.gap = 'var(--size-section-gap-sm)';
    sessionDetailsSection.style.width = '100%';

    // Table wrapper with horizontal scroll
    const tableWrapper = document.createElement('div');
    tableWrapper.style.width = '100%';
    tableWrapper.style.overflowX = 'auto';
    tableWrapper.style.overflowY = 'hidden';

    // Session Details title
    const sessionDetailsTitle = document.createElement('div');
    sessionDetailsTitle.style.display = 'flex';
    sessionDetailsTitle.style.gap = 'var(--size-card-gap-md)';
    sessionDetailsTitle.style.alignItems = 'center';
    sessionDetailsTitle.style.width = '100%';

    const titleEl = document.createElement('div');
    titleEl.style.fontFamily = 'var(--font-family-header)';
    titleEl.style.fontSize = 'var(--font-size-h4)';
    titleEl.style.fontWeight = 'var(--font-weight-semibold-2)';
    titleEl.style.lineHeight = '1.333';
    titleEl.style.color = 'var(--color-on-surface)';
    titleEl.style.whiteSpace = 'nowrap';
    titleEl.textContent = 'Session Details';
    sessionDetailsTitle.appendChild(titleEl);

    sessionDetailsSection.appendChild(sessionDetailsTitle);

    // Table container
    const tableContainer = document.createElement('div');
    tableContainer.style.display = 'flex';
    tableContainer.style.flexDirection = 'column';
    tableContainer.style.gap = '0';
    tableContainer.style.minWidth = '1500px';
    tableContainer.style.width = '100%';

    // Table header
    const tableHeader = createSessionsTableRow({ type: 'header' });
    tableContainer.appendChild(tableHeader);

    // Table rows (sample data)
    const sampleRows = [
        { day: 'DoW (00/00/00)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: '20%', engagedStudent: '20%', attendedTutors: '20%', completedCheckin: '20%' },
        { day: 'DoW (00/00/00)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: '20%', engagedStudent: '20%', attendedTutors: '20%', completedCheckin: '20%' },
        { day: 'DoW (00/00/00)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: '20%', engagedStudent: '20%', attendedTutors: '20%', completedCheckin: 'Badge' },
        { day: 'DoW (00/00/00)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: '20%', engagedStudent: '20%', attendedTutors: '20%', completedCheckin: '20%' },
        { day: 'DoW (00/00/00)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: '20%', engagedStudent: '20%', attendedTutors: '20%', completedCheckin: '20%' },
        { day: 'DoW (00/00/00)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: '20%', engagedStudent: '20%', attendedTutors: '20%', completedCheckin: '20%' },
        { day: 'DoW (00/00/00)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: '20%', engagedStudent: '20%', attendedTutors: '20%', completedCheckin: '20%' },
        { day: 'DoW (00/00/00)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: '20%', engagedStudent: '20%', attendedTutors: '20%', completedCheckin: '20%' },
        { day: 'DoW (00/00/00)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: '20%', engagedStudent: '20%', attendedTutors: '20%', completedCheckin: '20%' },
        { day: 'DoW (00/00/00)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: '20%', engagedStudent: '20%', attendedTutors: '20%', completedCheckin: '20%' }
    ];

    sampleRows.forEach((rowData, index) => {
        const row = createSessionsTableRow({
            type: 'item row',
            state: index === 0 ? 'hover' : 'default',
            data: rowData
        });
        tableContainer.appendChild(row);
    });

    tableWrapper.appendChild(tableContainer);
    sessionDetailsSection.appendChild(tableWrapper);

    // Pagination footer
    const paginationFooter = document.createElement('div');
    paginationFooter.style.display = 'flex';
    paginationFooter.style.flexWrap = 'wrap';
    paginationFooter.style.gap = 'var(--size-section-gap-md)';
    paginationFooter.style.alignItems = 'center';
    paginationFooter.style.justifyContent = 'space-between';
    paginationFooter.style.width = '100%';

    const paginationInfo = document.createElement('div');
    paginationInfo.style.fontFamily = 'var(--font-family-body)';
    paginationInfo.style.fontSize = 'var(--font-size-body2)';
    paginationInfo.style.fontWeight = 'var(--font-weight-normal)';
    paginationInfo.style.lineHeight = '1.571';
    paginationInfo.style.color = 'var(--color-on-surface)';
    paginationInfo.style.whiteSpace = 'nowrap';
    paginationInfo.textContent = 'Showing 1 to 10 of 200 entries';
    paginationFooter.appendChild(paginationInfo);

    const pagination = createPagination({
        currentPage: 1,
        totalPages: 20,
        type: 'icon',
        size: 'default'
    });
    paginationFooter.appendChild(pagination);

    sessionDetailsSection.appendChild(paginationFooter);

    contentWrapper.appendChild(sessionDetailsSection);
    content.appendChild(contentWrapper);

    // --- Page Layout Composition ---
    const layout = createPageLayout({
        content: content,
        sidebarConfig: sidebarConfig,
        topBarConfig: topBarConfig,
        id: 'session-admin-page'
    });

    // Scrim and Modal - only show if explicitly requested
    if (showModal) {
        const scrim = document.createElement('div');
        scrim.style.position = 'fixed';
        scrim.style.top = '0';
        scrim.style.left = '0';
        scrim.style.width = '100%';
        scrim.style.height = '100%';
        scrim.style.backgroundColor = 'var(--color-scrim)';
        scrim.style.display = 'flex';
        scrim.style.alignItems = 'center';
        scrim.style.justifyContent = 'center';
        scrim.style.zIndex = '1000';

        const modal = createSessionBreakdownModal({ sessionDate: "11/02/12" });
        scrim.appendChild(modal);
        layout.appendChild(scrim);
    }

    return layout;
}

