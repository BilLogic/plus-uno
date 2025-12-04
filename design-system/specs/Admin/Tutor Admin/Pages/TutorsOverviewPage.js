/**
 * @fileoverview TutorsOverviewPage component for Admin specs
 * Full page layout for Tutors Overview (Tutor performance)
 */

import { createPageLayout } from '../../../Universal/Pages/PageLayout.js';
import { createNavigation } from '../../../../components/Navigation/index.js';
import { createButton } from '../../../../components/Button/index.js';
import { createDataCard } from '../Cards/DataCard.js';
import { createTutorsPerformanceTableRow } from '../Tables/TutorsPerformanceTable.js';
import { createPagination } from '../../../../components/Pagination/index.js';
import { createFilters } from '../Elements/Filters.js';
import { createTutorsOverviewModal } from '../Modals/TutorsOverviewModal.js';

/**
 * Creates a TutorsOverviewPage component
 * @param {Object} options - Page configuration
 * @param {boolean} [options.showModal=false] - Whether to show the tutor overview modal with scrim
 * @param {string} [options.modalTab="Info"] - Modal tab type: "Info", "Sessions", or "Add a new tutor"
 * @returns {HTMLElement} Page element
 */
export function createTutorsOverviewPage({ showModal = false, modalTab = "Info" } = {}) {
    // --- Configuration ---
    const topBarConfig = {
        mode: 'expanded',
        breadcrumbItems: [
            { text: 'Home', href: '#' },
            { text: 'Tutor Admin' }
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
    content.style.gap = 'var(--size-section-gap-lg)';
    content.style.width = '100%';

    // Tab navigation and action buttons container
    const headerContainer = document.createElement('div');
    headerContainer.style.display = 'flex';
    headerContainer.style.justifyContent = 'space-between';
    headerContainer.style.alignItems = 'center';
    headerContainer.style.flexWrap = 'wrap';
    headerContainer.style.gap = 'var(--size-element-gap-md)';

    // Tab navigation
    const tabs = createNavigation({
        type: 'tabs',
        items: [
            { text: 'Tutor Performance', selected: true },
            { text: 'Status And Warnings', selected: false },
            { text: 'Tool Usage', selected: false },
            { text: 'Training Progress', selected: false }
        ]
    });
    headerContainer.appendChild(tabs);

    // Action buttons section
    const actionSection = document.createElement('div');
    actionSection.style.display = 'flex';
    actionSection.style.gap = 'var(--size-element-gap-md)';
    actionSection.style.justifyContent = 'flex-end';
    actionSection.style.alignItems = 'center';

    const emailButton = createButton({
        btnText: 'Email Tutors',
        btnStyle: 'primary',
        btnFill: 'outline',
        btnSize: 'default'
    });
    actionSection.appendChild(emailButton);

    const exportButton = createButton({
        btnText: 'Export Reflection Data',
        btnStyle: 'primary',
        btnFill: 'outline',
        btnSize: 'default'
    });
    actionSection.appendChild(exportButton);

    headerContainer.appendChild(actionSection);
    content.appendChild(headerContainer);

    // Section: Performance Overview
    const performanceOverviewSection = document.createElement('div');
    performanceOverviewSection.style.display = 'flex';
    performanceOverviewSection.style.flexDirection = 'column';
    performanceOverviewSection.style.gap = 'var(--size-section-gap-md)';

    // Section header
    const overviewHeader = document.createElement('div');
    overviewHeader.style.display = 'flex';
    overviewHeader.style.justifyContent = 'space-between';
    overviewHeader.style.alignItems = 'center';
    overviewHeader.style.flexWrap = 'wrap';
    overviewHeader.style.gap = 'var(--size-element-gap-md)';

    const overviewTitle = document.createElement('h2');
    overviewTitle.className = 'h3';
    overviewTitle.textContent = 'Performance Overview';
    overviewHeader.appendChild(overviewTitle);

    // Filters for Performance Overview - use createFilters component
    const overviewFilters = createFilters({
        schoolFilter: 'All Schools',
        tutorFilter: 'All Tutors',
        startDate: '01/10/25',
        endDate: '02/10/25'
    });
    overviewHeader.appendChild(overviewFilters);
    performanceOverviewSection.appendChild(overviewHeader);

    // Cards wrapper with horizontal scroll
    const cardsWrapper = document.createElement('div');
    cardsWrapper.style.width = '100%';
    cardsWrapper.style.overflowX = 'auto';
    cardsWrapper.style.overflowY = 'hidden';

    // Data cards row - horizontal layout
    const cardsRow = document.createElement('div');
    cardsRow.style.display = 'flex';
    cardsRow.style.gap = 'var(--size-card-gap-md)';
    cardsRow.style.flexWrap = 'nowrap';
    cardsRow.style.alignItems = 'flex-start';

    const card1 = createDataCard({
        title: 'Attendance',
        graphType: 'Pie',
        state: 'default'
    });
    cardsRow.appendChild(card1);

    const card2 = createDataCard({
        title: 'Sign-Up Rate',
        graphType: 'Pie',
        state: 'default'
    });
    cardsRow.appendChild(card2);

    cardsWrapper.appendChild(cardsRow);
    performanceOverviewSection.appendChild(cardsWrapper);
    content.appendChild(performanceOverviewSection);

    // Section: Performance Details
    const performanceDetailsSection = document.createElement('div');
    performanceDetailsSection.style.display = 'flex';
    performanceDetailsSection.style.flexDirection = 'column';
    performanceDetailsSection.style.gap = 'var(--size-section-gap-sm)';

    // Section header for table
    const detailsHeader = document.createElement('div');
    detailsHeader.style.display = 'flex';
    detailsHeader.style.justifyContent = 'space-between';
    detailsHeader.style.alignItems = 'center';
    detailsHeader.style.flexWrap = 'wrap';
    detailsHeader.style.gap = 'var(--size-element-gap-md)';

    const detailsTitle = document.createElement('h2');
    detailsTitle.className = 'h3';
    detailsTitle.textContent = 'Performance Details';
    detailsHeader.appendChild(detailsTitle);

    const addTutorButton = createButton({
        btnText: 'Add Tutor',
        btnStyle: 'primary',
        btnFill: 'outline',
        btnSize: 'small',
        leadingIcon: 'user-plus'
    });
    detailsHeader.appendChild(addTutorButton);
    performanceDetailsSection.appendChild(detailsHeader);

    // Table wrapper with scrolling
    const tableWrapper = document.createElement('div');
    tableWrapper.style.width = '100%';
    tableWrapper.style.overflowX = 'auto';
    tableWrapper.style.overflowY = 'hidden';

    // Table section
    const tableSection = document.createElement('div');
    tableSection.style.display = 'flex';
    tableSection.style.flexDirection = 'column';
    tableSection.style.gap = 'var(--size-section-gap-sm)';
    tableSection.style.minWidth = '1000px';

    // Table header
    const tableHeader = createTutorsPerformanceTableRow({ type: 'header' });
    tableSection.appendChild(tableHeader);

    // Table rows
    const tableData = [
        { tutorName: 'Amelia Blue', signedUp: 'Yes', attendance: '92%', sessions: '25', students: '18', isAdmin: false },
        { tutorName: 'Ava Silver', signedUp: 'Yes', attendance: '22%', sessions: '34', students: '12', isAdmin: false },
        { tutorName: 'Elijah Orange', signedUp: 'Yes', attendance: '68%', sessions: '22', students: '7', isAdmin: false },
        { tutorName: 'Ethan Black', signedUp: 'Yes', attendance: '49%', sessions: '65', students: '5', isAdmin: false },
        { tutorName: 'Ethan Cole', signedUp: 'Yes', attendance: '90%', sessions: '52', students: '21', isAdmin: true },
        { tutorName: 'Floyd Miles', signedUp: 'No', attendance: null, sessions: null, students: '13', isAdmin: false },
        { tutorName: 'Hannah Brown', signedUp: 'Yes', attendance: '94%', sessions: '54', students: '7', isAdmin: false },
        { tutorName: 'Henry Gold', signedUp: 'Yes', attendance: '92%', sessions: '33', students: '10', isAdmin: false },
        { tutorName: 'Liam Brown', signedUp: 'Yes', attendance: '50%', sessions: '3', students: '8', isAdmin: false },
        { tutorName: 'Lila Richardson', signedUp: 'Yes', attendance: null, sessions: null, students: '22', isAdmin: false }
    ];

    tableData.forEach((rowData) => {
        const row = createTutorsPerformanceTableRow({
            type: 'list item',
            state: 'default',
            data: rowData
        });
        tableSection.appendChild(row);
    });

    tableWrapper.appendChild(tableSection);
    performanceDetailsSection.appendChild(tableWrapper);

    // Pagination container
    const paginationContainer = document.createElement('div');
    paginationContainer.style.display = 'flex';
    paginationContainer.style.justifyContent = 'space-between';
    paginationContainer.style.alignItems = 'center';
    paginationContainer.style.flexWrap = 'wrap';
    paginationContainer.style.gap = 'var(--size-element-gap-md)';

    const paginationText = document.createElement('div');
    paginationText.className = 'body2-txt';
    paginationText.textContent = 'Showing 1 to 10 of 200 entries';
    paginationContainer.appendChild(paginationText);

    const pagination = createPagination({
        currentPage: 1,
        totalPages: 10,
        type: 'text',
        size: 'default'
    });
    paginationContainer.appendChild(pagination);
    performanceDetailsSection.appendChild(paginationContainer);

    content.appendChild(performanceDetailsSection);

    // Scrim and Modal - only show if explicitly requested
    // Note: PageLayout doesn't natively handle modals yet, so we append it to the layout if needed.
    // Or we can append it to the content. Appending to content puts it inside the surface, which might be wrong for a fixed scrim.
    // Ideally, modals should be appended to document.body or a high-level portal.
    // For now, let's append it to the content, but ensure it has fixed positioning.

    const layout = createPageLayout({
        content: content,
        sidebarConfig: sidebarConfig,
        topBarConfig: topBarConfig,
        id: 'tutors-overview-page'
    });

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

        const modal = createTutorsOverviewModal({ tab: modalTab, tutorName: "Amelia Blue" });
        scrim.appendChild(modal);
        layout.appendChild(scrim); // Append to layout to cover everything
    }

    return layout;
}

