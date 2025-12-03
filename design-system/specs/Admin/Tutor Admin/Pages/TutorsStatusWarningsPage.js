/**
 * @fileoverview TutorsStatusWarningsPage component for Admin specs
 * Full page layout for Tutors Status & Warnings
 */

import { createTopBar } from '../../../Universal/Sections/topbar.js';
import { createNavigation } from '../../../../components/Navigation/index.js';
import { createButton } from '../../../../components/Button/index.js';
import { createDataCard } from '../Cards/DataCard.js';
import { createTutorsStatusWarningsTableRow } from '../Tables/TutorsStatusWarningsTable.js';
import { createPagination } from '../../../../components/Pagination/index.js';
import { createFilters } from '../Elements/Filters.js';

/**
 * Creates a TutorsStatusWarningsPage component
 * @returns {HTMLElement} Page element
 */
export function createTutorsStatusWarningsPage() {
    const page = document.createElement('div');
    page.style.display = 'flex';
    page.style.flexDirection = 'column';
    page.style.backgroundColor = 'var(--color-surface)';
    page.style.minHeight = '100vh';
    page.style.overflowX = 'auto';
    page.style.overflowY = 'auto';

    // Top bar
    const topBar = createTopBar({
        mode: 'expanded',
        breadcrumbItems: [
            { text: 'Home', href: '#' },
            { text: 'Tutors' }
        ],
        userName: 'John Doe',
        userFirstChar: 'J',
        counterValue: 2
    });
    page.appendChild(topBar);

    // Main content container
    const mainContent = document.createElement('div');
    mainContent.style.display = 'flex';
    mainContent.style.flexDirection = 'column';
    mainContent.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    mainContent.style.gap = 'var(--size-section-gap-lg)';

    // Tab navigation
    const tabs = createNavigation({
        type: 'tabs',
        items: [
            { text: 'Tutor Performance', selected: false },
            { text: 'Status And Warnings', selected: true },
            { text: 'Tool Usage', selected: false },
            { text: 'Training Progress', selected: false }
        ]
    });
    mainContent.appendChild(tabs);

    // Action buttons and filters section
    const actionSection = document.createElement('div');
    actionSection.style.display = 'flex';
    actionSection.style.justifyContent = 'space-between';
    actionSection.style.alignItems = 'center';
    actionSection.style.gap = 'var(--size-element-gap-md)';

    // Button group
    const buttonGroup = document.createElement('div');
    buttonGroup.style.display = 'flex';
    buttonGroup.style.gap = 'var(--size-element-gap-md)';
    buttonGroup.style.alignItems = 'center';

    const emailButton = createButton({
        btnText: 'Email Tutors',
        btnStyle: 'primary',
        btnFill: 'outline',
        btnSize: 'default'
    });
    buttonGroup.appendChild(emailButton);

    const exportButton = createButton({
        btnText: 'Export Reflection Data',
        btnStyle: 'primary',
        btnFill: 'outline',
        btnSize: 'default'
    });
    buttonGroup.appendChild(exportButton);

    actionSection.appendChild(buttonGroup);

    // Filters - use createFilters component
    const filters = createFilters({
        schoolFilter: 'All Schools',
        tutorFilter: 'All Tutors',
        startDate: '01/10/25',
        endDate: '02/10/25'
    });
    actionSection.appendChild(filters);

    mainContent.appendChild(actionSection);

    // Section: Status Overview
    const overviewSection = document.createElement('div');
    overviewSection.style.display = 'flex';
    overviewSection.style.flexDirection = 'column';
    overviewSection.style.gap = 'var(--size-section-gap-sm)';

    // Section header
    const overviewHeader = document.createElement('div');
    overviewHeader.style.display = 'flex';
    overviewHeader.style.justifyContent = 'space-between';
    overviewHeader.style.alignItems = 'center';

    const overviewTitle = document.createElement('h2');
    overviewTitle.className = 'h4';
    overviewTitle.textContent = 'Status Overview';
    overviewHeader.appendChild(overviewTitle);

    // Filter placeholder for overview section
    const overviewFilterPlaceholder = document.createElement('div');
    overviewFilterPlaceholder.style.display = 'flex';
    overviewFilterPlaceholder.style.gap = 'var(--size-element-gap-lg)';
    overviewFilterPlaceholder.style.alignItems = 'center';
    overviewHeader.appendChild(overviewFilterPlaceholder);

    overviewSection.appendChild(overviewHeader);

    // Cards wrapper with horizontal scroll
    const cardsWrapper = document.createElement('div');
    cardsWrapper.style.width = '100%';
    cardsWrapper.style.overflowX = 'auto';
    cardsWrapper.style.overflowY = 'hidden';

    // Data cards row - horizontal layout
    const cardsRow = document.createElement('div');
    cardsRow.style.display = 'flex';
    cardsRow.style.gap = 'var(--size-section-gap-md)';
    cardsRow.style.flexWrap = 'nowrap';
    cardsRow.style.alignItems = 'flex-start';

    const card1 = createDataCard({
        title: 'Status Distribution (Latest)',
        graphType: 'Pie',
        state: 'default'
    });
    cardsRow.appendChild(card1);

    const card2 = createDataCard({
        title: 'Status Trend (Weekly)',
        graphType: 'Bar',
        state: 'default'
    });
    cardsRow.appendChild(card2);

    cardsWrapper.appendChild(cardsRow);
    overviewSection.appendChild(cardsWrapper);
    mainContent.appendChild(overviewSection);

    // Section: Status Details
    const statusSection = document.createElement('div');
    statusSection.style.display = 'flex';
    statusSection.style.flexDirection = 'column';
    statusSection.style.gap = 'var(--size-section-gap-sm)';

    // Section header
    const sectionHeader = document.createElement('div');
    sectionHeader.style.display = 'flex';
    sectionHeader.style.justifyContent = 'space-between';
    sectionHeader.style.alignItems = 'center';

    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'h4';
    sectionTitle.textContent = 'Status Details';
    sectionHeader.appendChild(sectionTitle);

    // Add Tutor button
    const addTutorButton = createButton({
        btnText: 'Add Tutor',
        btnStyle: 'primary',
        btnFill: 'outline',
        btnSize: 'small'
    });
    sectionHeader.appendChild(addTutorButton);

    statusSection.appendChild(sectionHeader);

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
    const tableHeader = createTutorsStatusWarningsTableRow({ type: 'header' });
    tableSection.appendChild(tableHeader);

    // Table rows
    const tableData = [
        { tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCalloff: 4 },
        { tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCalloff: 4 },
        { tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCalloff: 4 },
        { tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCalloff: 4 },
        { tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCalloff: 4 },
        { tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCalloff: 4 },
        { tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCalloff: 4 },
        { tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCalloff: 4 },
        { tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCalloff: 4 },
        { tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCalloff: 4 }
    ];

    tableData.forEach((rowData) => {
        const row = createTutorsStatusWarningsTableRow({
            type: 'list item',
            data: rowData
        });
        tableSection.appendChild(row);
    });

    tableWrapper.appendChild(tableSection);
    statusSection.appendChild(tableWrapper);

    // Pagination
    const pagination = createPagination({
        currentPage: 1,
        totalPages: 5,
        type: 'icon',
        size: 'default'
    });
    statusSection.appendChild(pagination);

    mainContent.appendChild(statusSection);
    page.appendChild(mainContent);

    return page;
}

