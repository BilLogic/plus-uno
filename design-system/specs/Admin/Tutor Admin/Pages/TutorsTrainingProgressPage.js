/**
 * @fileoverview TutorsTrainingProgressPage component for Admin specs
 * Full page layout for Tutors Training Progress
 */

import { createTopBar } from '../../../Universal/Sections/topbar.js';
import { createNavigation } from '../../../../components/Navigation/index.js';
import { createButton } from '../../../../components/Button/index.js';
import { createTutorsTrainingProgressTableRow } from '../Tables/TutorsTrainingProgressTable.js';
import { createPagination } from '../../../../components/Pagination/index.js';
import { createTrainingAdminFilter } from '../Elements/TrainingAdminFilter.js';

/**
 * Creates a Tutor Need overview card with SMART bars visualization
 * @returns {HTMLElement} Card element
 */
function createTutorNeedCard() {
    const card = document.createElement('div');
    card.style.backgroundColor = 'var(--color-surface-container-lowest)';
    card.style.borderRadius = 'var(--size-card-radius-md)';
    card.style.padding = 'var(--size-card-pad-x-md) var(--size-card-pad-x-md)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = 'var(--size-card-gap-md)';
    card.style.width = '218px';
    card.style.minWidth = '162px';
    card.style.height = '180px';
    card.style.maxWidth = '218px';
    card.style.boxShadow = 'var(--elevation-light-1)';
    card.style.backgroundImage = 'linear-gradient(90deg, rgba(32, 108, 40, 0.08) 0%, rgba(32, 108, 40, 0.08) 100%), linear-gradient(90deg, rgb(249, 249, 252) 0%, rgb(249, 249, 252) 100%)';

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.gap = 'var(--size-element-gap-xs)';
    header.style.alignItems = 'center';
    header.style.width = '100%';

    const title = document.createElement('div');
    title.style.fontFamily = 'var(--font-family-header)';
    title.style.fontSize = 'var(--font-size-h6)';
    title.style.fontWeight = 'var(--font-weight-semibold)';
    title.style.lineHeight = '1.5';
    title.style.color = 'var(--color-advocacy-text)';
    title.style.whiteSpace = 'nowrap';
    title.textContent = 'Tutor Need';
    header.appendChild(title);

    const infoIcon = document.createElement('i');
    infoIcon.className = 'fas fa-circle-info';
    infoIcon.style.fontSize = '13px';
    infoIcon.style.color = 'var(--color-advocacy-text)';
    infoIcon.style.flexShrink = '0';
    header.appendChild(infoIcon);

    card.appendChild(header);

    // Body container
    const bodyContainer = document.createElement('div');
    bodyContainer.style.display = 'flex';
    bodyContainer.style.gap = 'var(--size-card-gap-md)';
    bodyContainer.style.alignItems = 'flex-start';
    bodyContainer.style.flex = '1';
    bodyContainer.style.width = '100%';

    // Text container
    const textContainer = document.createElement('div');
    textContainer.style.display = 'flex';
    textContainer.style.flexDirection = 'column';
    textContainer.style.gap = 'var(--size-element-gap-xs)';
    textContainer.style.flex = '1';

    const subtitle = document.createElement('div');
    subtitle.style.fontFamily = 'var(--font-family-body)';
    subtitle.style.fontSize = 'var(--font-size-body2)';
    subtitle.style.fontWeight = 'var(--font-weight-bold)';
    subtitle.style.lineHeight = '1.571';
    subtitle.style.color = 'var(--color-advocacy-text)';
    subtitle.textContent = 'Advocacy';
    textContainer.appendChild(subtitle);

    const description = document.createElement('p');
    description.style.fontFamily = 'var(--font-family-body)';
    description.style.fontSize = 'var(--font-size-body3)';
    description.style.fontWeight = 'var(--font-weight-light)';
    description.style.lineHeight = '1.667';
    description.style.color = 'var(--color-advocacy-text)';
    description.style.margin = '0';
    description.textContent = 'is where tutors had received least training.';
    textContainer.appendChild(description);

    bodyContainer.appendChild(textContainer);

    // Visualization container - SMART bars
    const vizContainer = document.createElement('div');
    vizContainer.style.display = 'flex';
    vizContainer.style.gap = 'var(--size-element-gap-xs)';
    vizContainer.style.alignItems = 'flex-start';

    // SMART bars: S, M, A, R, T
    const smartData = [
        { letter: 'S', height: '60px', color: 'var(--color-social-emotional-container)' },
        { letter: 'M', height: '60px', color: 'var(--color-mastering-content-container)' },
        { letter: 'A', height: '10px', color: 'var(--color-advocacy-text)' },
        { letter: 'R', height: '60px', color: 'var(--color-relationship-container)' },
        { letter: 'T', height: '60px', color: 'var(--color-technology-tools-container)' }
    ];

    smartData.forEach((item) => {
        const barContainer = document.createElement('div');
        barContainer.style.display = 'flex';
        barContainer.style.flexDirection = 'column';
        barContainer.style.gap = 'var(--size-element-gap-xs)';
        barContainer.style.alignItems = 'center';

        // Bar visualization
        const barWrapper = document.createElement('div');
        barWrapper.style.position = 'relative';
        barWrapper.style.width = '6px';
        barWrapper.style.height = '80px';
        barWrapper.style.display = 'flex';
        barWrapper.style.alignItems = 'flex-end';

        const barBg = document.createElement('div');
        barBg.style.width = '6px';
        barBg.style.height = '80px';
        barBg.style.backgroundColor = 'var(--color-surface-container-lowest)';
        barBg.style.borderRadius = '16px';
        barWrapper.appendChild(barBg);

        const bar = document.createElement('div');
        bar.style.width = '6px';
        bar.style.height = item.height;
        bar.style.backgroundColor = item.color;
        bar.style.borderRadius = '16px';
        bar.style.position = 'absolute';
        bar.style.bottom = '0';
        barWrapper.appendChild(bar);

        barContainer.appendChild(barWrapper);

        // Letter label
        const label = document.createElement('div');
        label.style.fontFamily = 'var(--font-family-body)';
        label.style.fontSize = 'var(--font-size-body3)';
        label.style.fontWeight = 'var(--font-weight-light)';
        label.style.lineHeight = '1.667';
        label.style.color = item.letter === 'A' ? 'var(--color-advocacy-text)' : 
                           item.letter === 'S' ? 'var(--color-social-emotional-text)' :
                           item.letter === 'M' ? 'var(--color-mastering-content-text)' :
                           item.letter === 'R' ? 'var(--color-relationship-text)' :
                           'var(--color-technology-tools-text)';
        label.style.textTransform = 'uppercase';
        label.textContent = item.letter;
        barContainer.appendChild(label);

        vizContainer.appendChild(barContainer);
    });

    bodyContainer.appendChild(vizContainer);
    card.appendChild(bodyContainer);

    return card;
}

/**
 * Creates an overview card for training progress metrics
 * @param {Object} options - Card configuration
 * @param {string} options.title - Card title
 * @param {string} options.value - Value to display (e.g., "20%")
 * @param {string} options.description - Description text
 * @returns {HTMLElement} Card element
 */
function createOverviewCard({ title, value, description }) {
    const card = document.createElement('div');
    card.style.backgroundColor = 'var(--color-surface-container-lowest)';
    card.style.borderRadius = 'var(--size-card-radius-md)';
    card.style.padding = 'var(--size-card-pad-x-md) var(--size-card-pad-x-md)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = 'var(--size-card-gap-md)';
    card.style.width = '218px';
    card.style.minWidth = '162px';
    card.style.height = '180px';
    card.style.maxWidth = '218px';
    card.style.boxShadow = 'var(--elevation-light-1)';

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.gap = 'var(--size-element-gap-xs)';
    header.style.alignItems = 'center';
    header.style.width = '100%';

    const titleEl = document.createElement('div');
    titleEl.style.fontFamily = 'var(--font-family-header)';
    titleEl.style.fontSize = 'var(--font-size-h6)';
    titleEl.style.fontWeight = 'var(--font-weight-semibold)';
    titleEl.style.lineHeight = '1.5';
    titleEl.style.color = 'var(--color-on-surface-variant)';
    titleEl.style.whiteSpace = 'nowrap';
    titleEl.style.overflow = 'hidden';
    titleEl.style.textOverflow = 'ellipsis';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const infoIcon = document.createElement('i');
    infoIcon.className = 'fas fa-circle-info';
    infoIcon.style.fontSize = '13px';
    infoIcon.style.color = 'var(--color-on-surface-variant)';
    infoIcon.style.flexShrink = '0';
    header.appendChild(infoIcon);

    card.appendChild(header);

    // Body container
    const bodyContainer = document.createElement('div');
    bodyContainer.style.display = 'flex';
    bodyContainer.style.gap = 'var(--size-card-gap-md)';
    bodyContainer.style.alignItems = 'center';
    bodyContainer.style.flex = '1';
    bodyContainer.style.width = '100%';

    // Text container
    const textContainer = document.createElement('div');
    textContainer.style.display = 'flex';
    textContainer.style.flexDirection = 'column';
    textContainer.style.gap = 'var(--size-element-gap-xs)';
    textContainer.style.flex = '1';

    const valueEl = document.createElement('div');
    valueEl.style.fontFamily = 'var(--font-family-body)';
    valueEl.style.fontSize = 'var(--font-size-body2)';
    valueEl.style.fontWeight = 'var(--font-weight-bold)';
    valueEl.style.lineHeight = '1.571';
    valueEl.style.color = 'var(--color-on-surface-variant)';
    valueEl.textContent = value;
    textContainer.appendChild(valueEl);

    const descEl = document.createElement('p');
    descEl.style.fontFamily = 'var(--font-family-body)';
    descEl.style.fontSize = 'var(--font-size-body3)';
    descEl.style.fontWeight = 'var(--font-weight-light)';
    descEl.style.lineHeight = '1.667';
    descEl.style.color = 'var(--color-on-surface-variant)';
    descEl.style.margin = '0';
    descEl.style.height = '80px';
    descEl.textContent = description;
    textContainer.appendChild(descEl);

    bodyContainer.appendChild(textContainer);

    // Progress indicator placeholder (circular chart)
    const progressContainer = document.createElement('div');
    progressContainer.style.display = 'flex';
    progressContainer.style.flexDirection = 'column';
    progressContainer.style.alignItems = 'center';
    progressContainer.style.justifyContent = 'flex-end';
    progressContainer.style.padding = '0 var(--size-element-pad-x-md)';
    progressContainer.style.position = 'relative';
    progressContainer.style.width = '96px';
    progressContainer.style.height = '80px';

    // Placeholder for circular progress chart (96px)
    const chartPlaceholder = document.createElement('div');
    chartPlaceholder.style.width = '96px';
    chartPlaceholder.style.height = '80px';
    chartPlaceholder.style.position = 'relative';
    chartPlaceholder.style.backgroundColor = 'transparent';
    progressContainer.appendChild(chartPlaceholder);

    // Value overlay
    const valueOverlay = document.createElement('div');
    valueOverlay.style.position = 'absolute';
    valueOverlay.style.top = 'calc(50% + 4px)';
    valueOverlay.style.left = '50%';
    valueOverlay.style.transform = 'translate(-50%, -50%)';
    valueOverlay.style.fontFamily = 'var(--font-family-header)';
    valueOverlay.style.fontSize = 'var(--font-size-h4)';
    valueOverlay.style.fontWeight = 'var(--font-weight-semibold)';
    valueOverlay.style.lineHeight = '1.333';
    valueOverlay.style.color = 'var(--color-on-surface-variant)';
    valueOverlay.style.width = '96px';
    valueOverlay.style.textAlign = 'center';
    valueOverlay.textContent = value;
    progressContainer.appendChild(valueOverlay);

    bodyContainer.appendChild(progressContainer);
    card.appendChild(bodyContainer);

    return card;
}

/**
 * Creates a TutorsTrainingProgressPage component
 * @returns {HTMLElement} Page element
 */
export function createTutorsTrainingProgressPage() {
    const page = document.createElement('div');
    page.style.display = 'flex';
    page.style.flexDirection = 'column';
    page.style.backgroundColor = 'var(--color-surface-container)';
    page.style.minHeight = '100vh';
    page.style.maxWidth = '991.98px';
    page.style.minWidth = '768px';
    page.style.padding = 'var(--size-surface-container-pad-y-sm) var(--size-surface-container-pad-x-sm)';
    page.style.gap = 'var(--size-surface-container-gap-sm)';
    page.style.overflowX = 'auto';
    page.style.overflowY = 'auto';

    // Top bar
    const topBar = createTopBar({
        mode: 'expanded',
        breadcrumbItems: [
            { text: 'Home', href: '#' },
            { text: 'Tutor Admin' }
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
    mainContent.style.gap = 'var(--size-surface-container-gap-sm)';
    mainContent.style.width = '100%';

    // Content container (white background) - tabs and buttons go inside
    const contentContainer = document.createElement('div');
    contentContainer.style.backgroundColor = 'var(--color-surface)';
    contentContainer.style.borderRadius = 'var(--size-surface-radius)';
    contentContainer.style.padding = 'var(--size-surface-pad-y) var(--size-surface-pad-x)';
    contentContainer.style.display = 'flex';
    contentContainer.style.flexDirection = 'column';
    contentContainer.style.gap = '24px'; // spacer-3-base-between-sections

    // Tab navigation and action buttons container - INSIDE content container
    const headerContainer = document.createElement('div');
    headerContainer.style.display = 'flex';
    headerContainer.style.flexWrap = 'wrap';
    headerContainer.style.gap = '0';
    headerContainer.style.alignItems = 'center';
    headerContainer.style.justifyContent = 'space-between';
    headerContainer.style.width = '100%';

    // Tab navigation wrapper
    const tabsWrapper = document.createElement('div');
    tabsWrapper.style.display = 'flex';
    tabsWrapper.style.alignItems = 'center';
    tabsWrapper.style.flexShrink = '0';

    // Tab navigation
    const tabs = createNavigation({
        type: 'tabs',
        items: [
            { text: 'Tutor Performance', selected: false },
            { text: 'Status And Warnings', selected: false },
            { text: 'Tool Usage', selected: false },
            { text: 'Training Progress', selected: true }
        ]
    });
    tabsWrapper.appendChild(tabs);
    headerContainer.appendChild(tabsWrapper);

    // Action buttons section
    const actionSection = document.createElement('div');
    actionSection.style.display = 'flex';
    actionSection.style.gap = '10px';
    actionSection.style.justifyContent = 'flex-end';
    actionSection.style.alignItems = 'center';
    actionSection.style.flexShrink = '0';

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
    contentContainer.appendChild(headerContainer);

    // Section: Training Progress Overview
    const trainingOverviewSection = document.createElement('div');
    trainingOverviewSection.style.display = 'flex';
    trainingOverviewSection.style.flexDirection = 'column';
    trainingOverviewSection.style.gap = 'var(--size-section-gap-sm)';

    // Section header
    const overviewHeader = document.createElement('div');
    overviewHeader.style.display = 'flex';
    overviewHeader.style.justifyContent = 'space-between';
    overviewHeader.style.alignItems = 'center';
    overviewHeader.style.flexWrap = 'wrap';
    overviewHeader.style.gap = '12px';
    overviewHeader.style.width = '100%';

    const overviewTitle = document.createElement('h2');
    overviewTitle.style.fontFamily = 'var(--font-family-header)';
    overviewTitle.style.fontSize = 'var(--font-size-h4)';
    overviewTitle.style.fontWeight = 'var(--font-weight-semibold)';
    overviewTitle.style.lineHeight = '1.333';
    overviewTitle.style.color = 'var(--color-on-surface)';
    overviewTitle.style.whiteSpace = 'nowrap';
    overviewTitle.textContent = 'Training Progress Overview';
    overviewHeader.appendChild(overviewTitle);

    // Button group: By Tutor / By Lesson
    const buttonGroup = document.createElement('div');
    buttonGroup.style.display = 'flex';
    buttonGroup.style.borderRadius = 'var(--size-element-radius-md)';
    buttonGroup.style.overflow = 'hidden';

    const byTutorButton = createButton({
        btnText: 'By Tutor',
        btnStyle: 'primary',
        btnFill: 'tonal',
        btnSize: 'small'
    });
    // Left button: rounded left corners only
    const byTutorButtonContent = byTutorButton.querySelector('.pbtn-state-screen');
    if (byTutorButtonContent) {
        byTutorButtonContent.style.borderTopLeftRadius = 'var(--size-element-radius-sm)';
        byTutorButtonContent.style.borderBottomLeftRadius = 'var(--size-element-radius-sm)';
        byTutorButtonContent.style.borderTopRightRadius = '0';
        byTutorButtonContent.style.borderBottomRightRadius = '0';
    }
    buttonGroup.appendChild(byTutorButton);

    const byLessonButton = createButton({
        btnText: 'By Lesson',
        btnStyle: 'secondary',
        btnFill: 'tonal',
        btnSize: 'small'
    });
    // Right button: rounded right corners only
    const byLessonButtonContent = byLessonButton.querySelector('.pbtn-state-screen');
    if (byLessonButtonContent) {
        byLessonButtonContent.style.borderTopLeftRadius = '0';
        byLessonButtonContent.style.borderBottomLeftRadius = '0';
        byLessonButtonContent.style.borderTopRightRadius = 'var(--size-element-radius-md)';
        byLessonButtonContent.style.borderBottomRightRadius = 'var(--size-element-radius-md)';
    }
    buttonGroup.appendChild(byLessonButton);

    overviewHeader.appendChild(buttonGroup);
    trainingOverviewSection.appendChild(overviewHeader);

    // Overview cards row
    const cardsRow = document.createElement('div');
    cardsRow.style.display = 'flex';
    cardsRow.style.gap = 'var(--size-element-gap-sm)';
    cardsRow.style.flexWrap = 'wrap';

    // Tutor Need card
    const tutorNeedCard = createTutorNeedCard();
    cardsRow.appendChild(tutorNeedCard);

    // Avg Completion Rate card
    const avgCompletionCard = createOverviewCard({
        title: 'Avg Completion Rate',
        value: '20%',
        description: 'of total lessons have been completed by <placeholder>.'
    });
    cardsRow.appendChild(avgCompletionCard);

    // Tutor Badge Completions card
    const badgeCompletionsCard = createOverviewCard({
        title: 'Tutor Badge Completions',
        value: '20%',
        description: 'of eligible tutors have claimed badges.'
    });
    cardsRow.appendChild(badgeCompletionsCard);

    // Onboarding Completion card
    const onboardingCard = createOverviewCard({
        title: 'Onboarding Completion',
        value: '20%',
        description: 'of tutors had finished all onboarding modules.'
    });
    cardsRow.appendChild(onboardingCard);

    trainingOverviewSection.appendChild(cardsRow);
    contentContainer.appendChild(trainingOverviewSection);
    
    mainContent.appendChild(contentContainer);

    // Section: Training Progress Details
    const trainingDetailsSection = document.createElement('div');
    trainingDetailsSection.style.display = 'flex';
    trainingDetailsSection.style.flexDirection = 'column';
    trainingDetailsSection.style.gap = 'var(--size-section-gap-sm)';
    trainingDetailsSection.style.isolation = 'isolate';

    // Section header for table
    const detailsHeader = document.createElement('div');
    detailsHeader.style.display = 'flex';
    detailsHeader.style.justifyContent = 'space-between';
    detailsHeader.style.alignItems = 'center';
    detailsHeader.style.flexWrap = 'wrap';
    detailsHeader.style.gap = 'var(--size-element-gap-md)';

    const detailsTitle = document.createElement('h2');
    detailsTitle.style.fontFamily = 'var(--font-family-header)';
    detailsTitle.style.fontSize = 'var(--font-size-h4)';
    detailsTitle.style.fontWeight = 'var(--font-weight-semibold)';
    detailsTitle.style.lineHeight = '1.333';
    detailsTitle.style.color = 'var(--color-on-surface)';
    detailsTitle.style.whiteSpace = 'nowrap';
    detailsTitle.textContent = 'Training Progress Details';
    detailsHeader.appendChild(detailsTitle);

    trainingDetailsSection.appendChild(detailsHeader);

    // Filter component
    const filter = createTrainingAdminFilter({ breakpoint: 'medium' });
    trainingDetailsSection.appendChild(filter);

    // Table section
    const tableSection = document.createElement('div');
    tableSection.style.display = 'flex';
    tableSection.style.flexDirection = 'column';
    tableSection.style.gap = 'var(--size-section-gap-sm)';
    tableSection.style.height = '660px';
    tableSection.style.width = '100%';
    tableSection.style.zIndex = '2';
    tableSection.style.overflowX = 'auto';
    tableSection.style.overflowY = 'auto';

    // Table container with fixed width
    const tableContainer = document.createElement('div');
    tableContainer.style.display = 'flex';
    tableContainer.style.flexDirection = 'column';
    tableContainer.style.gap = '0';
    tableContainer.style.minWidth = '1000px';
    tableContainer.style.width = '100%';

    // Table header
    const tableHeader = createTutorsTrainingProgressTableRow({ type: 'header' });
    tableContainer.appendChild(tableHeader);

    // Table rows
    const tableData = [
        { tutorName: 'Ben Green', email: 'dummy@gmail.com', completion: '8/18', accuracy: '30%', badgeClaimed: true, timeSpent: '328' },
        { tutorName: 'Ben Green', email: 'dummy@gmail.com', completion: '8/18', accuracy: '30%', badgeClaimed: false, timeSpent: '328' },
        { tutorName: 'Ben Green', email: 'dummy@gmail.com', completion: '8/18', accuracy: '30%', badgeClaimed: null, timeSpent: '328' },
        { tutorName: 'Ben Green', email: 'dummy@gmail.com', completion: '8/18', accuracy: '30%', badgeClaimed: null, timeSpent: '328' },
        { tutorName: 'Ben Green', email: 'dummy@gmail.com', completion: '8/18', accuracy: '30%', badgeClaimed: null, timeSpent: '328' },
        { tutorName: 'Ben Green', email: 'dummy@gmail.com', completion: '8/18', accuracy: '30%', badgeClaimed: null, timeSpent: '328' },
        { tutorName: 'Ben Green', email: 'dummy@gmail.com', completion: '8/18', accuracy: '30%', badgeClaimed: null, timeSpent: '328' },
        { tutorName: 'Ben Green', email: 'dummy@gmail.com', completion: '8/18', accuracy: '30%', badgeClaimed: null, timeSpent: '328' },
        { tutorName: 'Ben Green', email: 'dummy@gmail.com', completion: '8/18', accuracy: '30%', badgeClaimed: null, timeSpent: '328' },
        { tutorName: 'Ben Green', email: 'dummy@gmail.com', completion: '8/18', accuracy: '30%', badgeClaimed: null, timeSpent: '328' }
    ];

    tableData.forEach((rowData) => {
        const row = createTutorsTrainingProgressTableRow({
            type: 'item row',
            state: 'default',
            data: rowData
        });
        tableContainer.appendChild(row);
    });

    tableSection.appendChild(tableContainer);

    trainingDetailsSection.appendChild(tableSection);

    // Pagination container
    const paginationContainer = document.createElement('div');
    paginationContainer.style.display = 'flex';
    paginationContainer.style.justifyContent = 'space-between';
    paginationContainer.style.alignItems = 'center';
    paginationContainer.style.flexWrap = 'wrap';
    paginationContainer.style.gap = 'var(--size-element-gap-md)';
    paginationContainer.style.width = '100%';
    paginationContainer.style.zIndex = '1';

    const paginationText = document.createElement('div');
    paginationText.style.fontFamily = 'var(--font-family-body)';
    paginationText.style.fontSize = 'var(--font-size-body2)';
    paginationText.style.fontWeight = 'var(--font-weight-light)';
    paginationText.style.lineHeight = '1.571';
    paginationText.style.color = 'var(--color-on-surface)';
    paginationText.style.whiteSpace = 'nowrap';
    paginationText.textContent = 'Showing 1 to 10 of 200 entries';
    paginationContainer.appendChild(paginationText);

    const pagination = createPagination({
        currentPage: 1,
        totalPages: 10,
        type: 'text',
        size: 'default'
    });
    paginationContainer.appendChild(pagination);
    trainingDetailsSection.appendChild(paginationContainer);

    contentContainer.appendChild(trainingDetailsSection);
    page.appendChild(mainContent);

    return page;
}

