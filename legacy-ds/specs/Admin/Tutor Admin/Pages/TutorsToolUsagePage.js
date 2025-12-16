/**
 * @fileoverview TutorsToolUsagePage component for Admin specs
 * Full page layout for Tutors Tool Usage
 */

import { createPageLayout } from '../../../Universal/Pages/PageLayout.js';
import { createNavigation } from '../../../../components/Navigation/index.js';
import { createButton } from '../../../../components/Button/index.js';
import { createDataCardHorizontalScroll } from '../Sections/DataCardHorizontalScroll.js';
import { createTutorsToolUsageTableRow } from '../Tables/TutorsToolUsageTable.js';
import { createPagination } from '../../../../components/Pagination/index.js';
import { createFilters } from '../Elements/Filters.js';

/**
 * Creates a TutorsToolUsagePage component
 * @returns {HTMLElement} Page element
 */
export function createTutorsToolUsagePage() {
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
            { text: 'Tutor Performance', selected: false },
            { text: 'Status And Warnings', selected: false },
            { text: 'Tool Usage', selected: true },
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

    // Section: Tool Usage
    const toolUsageSection = document.createElement('div');
    toolUsageSection.style.display = 'flex';
    toolUsageSection.style.flexDirection = 'column';
    toolUsageSection.style.gap = 'var(--size-section-gap-md)';

    // Section header
    const sectionHeader = document.createElement('div');
    sectionHeader.style.display = 'flex';
    sectionHeader.style.justifyContent = 'space-between';
    sectionHeader.style.alignItems = 'center';
    sectionHeader.style.flexWrap = 'wrap';
    sectionHeader.style.gap = 'var(--size-element-gap-md)';

    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'h3';
    sectionTitle.textContent = 'Tool Usage';
    sectionHeader.appendChild(sectionTitle);

    // Filters - use createFilters component
    const filters = createFilters({
        schoolFilter: 'All Schools',
        tutorFilter: 'All Tutors',
        startDate: '01/10/25',
        endDate: '02/10/25'
    });
    sectionHeader.appendChild(filters);
    toolUsageSection.appendChild(sectionHeader);

    // Horizontal scrolling data cards
    const cardsSection = createDataCardHorizontalScroll({
        cards: [
            { title: 'Recording Upload (Daily)', graphType: 'Bar', state: 'default' },
            { title: 'Reflection Completion (Weekly)', graphType: 'Line', state: 'default' },
            { title: 'Help Center visits (Weekly)', graphType: 'Line', state: 'default' },
            { title: 'Dashboard Adoption (Daily)', graphType: 'Bar', state: 'default' },
            { title: 'Dashboard Adoption (Weekly)', graphType: 'Line', state: 'default' }
        ]
    });
    toolUsageSection.appendChild(cardsSection);
    content.appendChild(toolUsageSection);

    // Section: Tool Usage Details
    const toolUsageDetailsSection = document.createElement('div');
    toolUsageDetailsSection.style.display = 'flex';
    toolUsageDetailsSection.style.flexDirection = 'column';
    toolUsageDetailsSection.style.gap = 'var(--size-section-gap-sm)';

    // Section header for table
    const detailsHeader = document.createElement('div');
    detailsHeader.style.display = 'flex';
    detailsHeader.style.justifyContent = 'space-between';
    detailsHeader.style.alignItems = 'center';
    detailsHeader.style.flexWrap = 'wrap';
    detailsHeader.style.gap = 'var(--size-element-gap-md)';

    const detailsTitle = document.createElement('h2');
    detailsTitle.className = 'h3';
    detailsTitle.textContent = 'Tool Usage Details';
    detailsHeader.appendChild(detailsTitle);

    const actionButtonsGroup = document.createElement('div');
    actionButtonsGroup.style.display = 'flex';
    actionButtonsGroup.style.gap = 'var(--size-element-gap-md)';
    actionButtonsGroup.style.alignItems = 'center';

    const addTutorButton = createButton({
        btnText: 'Add Tutor',
        btnStyle: 'primary',
        btnFill: 'outline',
        btnSize: 'small',
        leadingIcon: 'user-plus'
    });
    actionButtonsGroup.appendChild(addTutorButton);

    const exportCsvButton = createButton({
        btnText: 'Export CSV',
        btnStyle: 'primary',
        btnFill: 'outline',
        btnSize: 'small',
        leadingIcon: 'download'
    });
    actionButtonsGroup.appendChild(exportCsvButton);

    detailsHeader.appendChild(actionButtonsGroup);
    toolUsageDetailsSection.appendChild(detailsHeader);

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
    const tableHeader = createTutorsToolUsageTableRow({ type: 'header' });
    tableSection.appendChild(tableHeader);

    // Table rows
    const tableData = [
        { tutorName: 'Floyd Miles', helpCenterVisits: 'No', recording: null, reflection: null, dashboardAdoption: null },
        { tutorName: 'Jane Smith', helpCenterVisits: 'Yes', recording: '85%', reflection: '92%', dashboardAdoption: 'Yes' },
        { tutorName: 'John Doe', helpCenterVisits: 'Yes', recording: '92%', reflection: '88%', dashboardAdoption: 'Yes' },
        { tutorName: 'Alice Brown', helpCenterVisits: 'No', recording: '75%', reflection: '80%', dashboardAdoption: 'No' },
        { tutorName: 'Bob White', helpCenterVisits: 'Yes', recording: null, reflection: null, dashboardAdoption: 'Yes' },
        { tutorName: 'Charlie Green', helpCenterVisits: 'No', recording: '60%', reflection: '65%', dashboardAdoption: 'No' },
        { tutorName: 'Diana Prince', helpCenterVisits: 'Yes', recording: '95%', reflection: '98%', dashboardAdoption: 'Yes' },
        { tutorName: 'Eve Adams', helpCenterVisits: 'No', recording: '50%', reflection: '55%', dashboardAdoption: 'No' },
        { tutorName: 'Frank Black', helpCenterVisits: 'Yes', recording: '88%', reflection: '90%', dashboardAdoption: 'Yes' },
        { tutorName: 'Grace Kelly', helpCenterVisits: 'No', recording: '70%', reflection: '75%', dashboardAdoption: 'No' }
    ];

    tableData.forEach((rowData) => {
        const row = createTutorsToolUsageTableRow({
            type: 'item',
            state: 'default',
            data: rowData
        });
        tableSection.appendChild(row);
    });

    tableWrapper.appendChild(tableSection);
    toolUsageDetailsSection.appendChild(tableWrapper);

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
    toolUsageDetailsSection.appendChild(paginationContainer);

    content.appendChild(toolUsageDetailsSection);

    // --- Page Layout Composition ---
    return createPageLayout({
        content: content,
        sidebarConfig: sidebarConfig,
        topBarConfig: topBarConfig,
        id: 'tutors-tool-usage-page'
    });
}
