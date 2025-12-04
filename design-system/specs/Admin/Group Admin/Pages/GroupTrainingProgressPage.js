/**
 * @fileoverview GroupTrainingProgressPage component for Group Admin specs
 * Full page layout for Group Training Progress with overview cards and training progress table
 */

import { createPageLayout } from '../../../Universal/Pages/PageLayout.js';
import { createTopBar } from '../../../Universal/Sections/topbar.js';
import { createNavigation } from '../../../../components/Navigation/index.js';
import { createButton } from '../../../../components/Button/index.js';
import { createGroupTrainingProgressTableRow } from '../Tables/GroupTrainingProgressTable.js';
import { createPagination } from '../../../../components/Pagination/index.js';

/**
 * Creates an overview card component
 * @param {Object} options - Card configuration
 * @param {string} options.title - Card title
 * @param {string} options.value - Card value
 * @param {string} options.description - Card description
 * @param {string} [options.competencyArea] - Competency area for Tutor Need card
 * @returns {HTMLElement} Card element
 */
/**
 * Creates a Student Need overview card with SMART bars visualization
 * @returns {HTMLElement} Card element
 */
function createStudentNeedCard() {
    const card = document.createElement('div');
    card.style.backgroundColor = 'var(--color-surface-container-lowest)';
    card.style.borderRadius = 'var(--size-card-radius-md)';
    card.style.padding = 'var(--size-card-pad-x-md) var(--size-card-pad-x-md)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = 'var(--size-card-gap-md)';
    card.style.width = '275.33px';
    card.style.minWidth = '162px';
    card.style.height = '180px';
    card.style.maxWidth = '275.33px';
    card.style.boxShadow = 'var(--elevation-light-1)';
    card.style.backgroundImage = 'linear-gradient(90deg, rgba(127, 63, 177, 0.08) 0%, rgba(127, 63, 177, 0.08) 100%), linear-gradient(90deg, rgb(249, 249, 252) 0%, rgb(249, 249, 252) 100%)';

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.gap = 'var(--size-element-gap-xs)';
    header.style.alignItems = 'center';
    header.style.width = '100%';

    const title = document.createElement('div');
    title.style.fontFamily = 'var(--font-family-header)';
    title.style.fontSize = 'var(--font-size-h5)';
    title.style.fontWeight = 'var(--font-weight-semibold)';
    title.style.lineHeight = '1.4';
    title.style.color = 'var(--color-mastering-content-text)';
    title.style.whiteSpace = 'nowrap';
    title.textContent = 'Student Need';
    header.appendChild(title);

    const infoIcon = document.createElement('i');
    infoIcon.className = 'fas fa-circle-info';
    infoIcon.style.fontSize = '20px';
    infoIcon.style.color = 'var(--color-mastering-content-text)';
    infoIcon.style.flexShrink = '0';
    infoIcon.style.width = '20px';
    infoIcon.style.height = '20px';
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
    subtitle.style.color = 'var(--color-mastering-content-text)';
    subtitle.textContent = 'Mastering Content';
    textContainer.appendChild(subtitle);

    const descEl = document.createElement('p');
    descEl.style.fontFamily = 'var(--font-family-body)';
    descEl.style.fontSize = 'var(--font-size-body3)';
    descEl.style.fontWeight = 'var(--font-weight-light)';
    descEl.style.lineHeight = '1.667';
    descEl.style.color = 'var(--color-mastering-content-text)';
    descEl.style.margin = '0';
    descEl.textContent = '3/3 students need mastering content support';
    textContainer.appendChild(descEl);

    bodyContainer.appendChild(textContainer);

    // Visualization container - SMART bars
    const vizContainer = document.createElement('div');
    vizContainer.style.display = 'flex';
    vizContainer.style.gap = 'var(--size-element-gap-xs)';
    vizContainer.style.alignItems = 'flex-start';

    // SMART bars: S, M, A, R, T
    const smartData = [
        { letter: 'S', height: '60px', color: 'var(--color-social-emotional-container)' },
        { letter: 'M', height: '70.136px', color: 'var(--color-mastering-content)' },
        { letter: 'A', height: '60px', color: 'var(--color-advocacy-container)' },
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
        const letterLabel = document.createElement('div');
        letterLabel.style.fontFamily = 'var(--font-family-body)';
        letterLabel.style.fontSize = 'var(--font-size-body3)';
        letterLabel.style.fontWeight = 'var(--font-weight-light)';
        letterLabel.style.lineHeight = '1.667';
        letterLabel.style.color = item.letter === 'M' ? 'var(--color-mastering-content-text)' :
            item.letter === 'S' ? 'var(--color-social-emotional-text)' :
                item.letter === 'A' ? 'var(--color-advocacy-text)' :
                    item.letter === 'R' ? 'var(--color-relationship-text)' :
                        'var(--color-technology-tools-text)';
        letterLabel.style.textTransform = 'uppercase';
        letterLabel.textContent = item.letter;
        barContainer.appendChild(letterLabel);

        vizContainer.appendChild(barContainer);
    });

    bodyContainer.appendChild(vizContainer);
    card.appendChild(bodyContainer);

    return card;
}

/**
 * Creates an overview card component
 * @param {Object} options - Card configuration
 * @param {string} options.title - Card title
 * @param {string} options.value - Card value
 * @param {string} options.description - Card description
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
    card.style.width = '275.33px';
    card.style.minWidth = '162px';
    card.style.height = '180px';
    card.style.maxWidth = '275.33px';
    card.style.boxShadow = 'var(--elevation-light-1)';

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.gap = 'var(--size-element-gap-xs)';
    header.style.alignItems = 'center';
    header.style.width = '100%';

    const titleEl = document.createElement('div');
    titleEl.style.fontFamily = 'var(--font-family-header)';
    titleEl.style.fontSize = 'var(--font-size-h5)';
    titleEl.style.fontWeight = 'var(--font-weight-semibold)';
    titleEl.style.lineHeight = '1.4';
    titleEl.style.color = 'var(--color-on-surface-variant)';
    titleEl.style.whiteSpace = 'nowrap';
    titleEl.style.overflow = 'hidden';
    titleEl.style.textOverflow = 'ellipsis';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const infoIcon = document.createElement('i');
    infoIcon.className = 'fas fa-circle-info';
    infoIcon.style.fontSize = '20px';
    infoIcon.style.color = 'var(--color-on-surface-variant)';
    infoIcon.style.flexShrink = '0';
    infoIcon.style.width = '20px';
    infoIcon.style.height = '20px';
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
 * Creates the Group Training Progress Page component
 * @returns {HTMLElement} The Group Training Progress Page element
 */
export function createGroupTrainingProgressPage() {
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
    content.style.gap = '24px'; // spacer-3-base-between-sections
    content.style.width = '100%';
    content.setAttribute("data-node-id", "531:62962");

    // Tab navigation - INSIDE content container
    const tabsWrapper = document.createElement('div');
    tabsWrapper.style.display = 'flex';
    tabsWrapper.style.alignItems = 'center';
    tabsWrapper.style.flexShrink = '0';

    // Tab navigation
    const tabs = createNavigation({
        type: 'tabs',
        items: [
            { text: 'Group Info', selected: false },
            { text: 'Training Progress', selected: true }
        ]
    });
    tabsWrapper.appendChild(tabs);
    content.appendChild(tabsWrapper);

    // Inner container
    const innerContainer = document.createElement('div');
    innerContainer.style.display = 'flex';
    innerContainer.style.flexDirection = 'column';
    innerContainer.style.gap = 'var(--size-section-gap-lg)';
    innerContainer.style.width = '100%';

    // Title section with filter
    const titleSection = document.createElement('div');
    titleSection.style.display = 'flex';
    titleSection.style.flexWrap = 'wrap';
    titleSection.style.gap = '24px';
    titleSection.style.alignItems = 'center';
    titleSection.style.justifyContent = 'space-between';
    titleSection.style.width = '100%';

    const title = document.createElement('h2');
    title.className = 'h4-txt';
    title.style.color = 'var(--color-on-surface)';
    title.textContent = 'Group Training Progress';
    titleSection.appendChild(title);

    // All Groups filter dropdown
    const filterDropdown = createButton({
        btnText: 'All Groups',
        btnStyle: 'primary',
        btnFill: 'outline',
        btnSize: 'small',
        iconName: 'caret-down',
        iconPosition: 'right'
    });
    filterDropdown.style.borderRadius = 'var(--size-element-radius-sm)';
    titleSection.appendChild(filterDropdown);

    innerContainer.appendChild(titleSection);

    // Scrollspy wrapper (contains overview cards and table)
    const scrollspyWrapper = document.createElement('div');
    scrollspyWrapper.style.display = 'flex';
    scrollspyWrapper.style.flexDirection = 'column';
    scrollspyWrapper.style.gap = 'var(--size-card-gap-sm)';
    scrollspyWrapper.style.width = '100%';

    // Overview cards wrapper with horizontal scroll
    const overviewCardsWrapper = document.createElement('div');
    overviewCardsWrapper.style.display = 'flex';
    overviewCardsWrapper.style.gap = 'var(--size-section-gap-sm)';
    overviewCardsWrapper.style.alignItems = 'center';
    overviewCardsWrapper.style.width = '100%';
    overviewCardsWrapper.style.overflowX = 'auto';
    overviewCardsWrapper.style.overflowY = 'hidden';

    // Student Need card
    const studentNeedCard = createStudentNeedCard();
    overviewCardsWrapper.appendChild(studentNeedCard);

    // Completion Rate card
    const completionCard = createOverviewCard({
        title: 'Completion Rate',
        value: '20%',
        description: 'of total lessons have been completed by <first name>.'
    });
    overviewCardsWrapper.appendChild(completionCard);

    // Avg Accuracy Rate card
    const avgAccuracyCard = createOverviewCard({
        title: 'Avg Accuracy Rate',
        value: '20%',
        description: 'is the average accuracy on the completed training lessons.'
    });
    overviewCardsWrapper.appendChild(avgAccuracyCard);

    // Avg Time Spent card
    const avgTimeCard = createOverviewCard({
        title: 'Avg Time Spent',
        value: '30 / 90 min',
        description: 'is the average time <placeholder> spent on training. Edit Goal'
    });
    overviewCardsWrapper.appendChild(avgTimeCard);

    scrollspyWrapper.appendChild(overviewCardsWrapper);

    // Main table - List Container with scrolling
    const listContainer = document.createElement('div');
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'column';
    listContainer.style.height = '696px';
    listContainer.style.width = '100%';
    listContainer.style.position = 'relative';
    listContainer.style.zIndex = '1';
    listContainer.style.overflowX = 'auto';
    listContainer.style.overflowY = 'auto';

    // Table header
    const tableHeader = createGroupTrainingProgressTableRow({ type: 'header' });
    tableHeader.style.height = '64px';
    tableHeader.style.borderRadius = 'var(--size-element-radius-sm)';
    listContainer.appendChild(tableHeader);

    // Table rows - Level 1 (competency area)
    const l1Row = createGroupTrainingProgressTableRow({
        type: 'content-l1',
        data: {
            competency: 'Social-Emotional Learning',
            competencyArea: 'socio-emotional',
            completion: '8/16',
            accuracy: '10%',
            rating: '5.0/5',
            timeSpent: '328 mins'
        }
    });
    listContainer.appendChild(l1Row);

    // Level 1 hover state
    const l1RowHover = createGroupTrainingProgressTableRow({
        type: 'content-l1-hover',
        data: {
            competency: 'Social-Emotional Learning',
            competencyArea: 'socio-emotional',
            completion: '8/16',
            accuracy: '10%',
            rating: '5.0/5',
            timeSpent: '328 mins'
        }
    });
    listContainer.appendChild(l1RowHover);

    // Level 2 (lesson)
    const l2Row = createGroupTrainingProgressTableRow({
        type: 'content-l2',
        data: {
            lessonName: 'Motivation to Learn',
            completion: '4/4',
            accuracy: '10%',
            rating: '5.0/5',
            timeSpent: '328 mins'
        }
    });
    listContainer.appendChild(l2Row);

    // Level 2 hover state
    const l2RowHover = createGroupTrainingProgressTableRow({
        type: 'content-l2-hover',
        data: {
            lessonName: 'Motivation to Learn',
            completion: '4/4',
            accuracy: '10%',
            rating: '5.0/5',
            timeSpent: '328 mins'
        }
    });
    listContainer.appendChild(l2RowHover);

    // Level 3 (sub-lesson)
    const l3Row = createGroupTrainingProgressTableRow({
        type: 'content-l3',
        data: {
            lessonName: 'Reacting to Errors',
            completion: '1/4',
            accuracy: '10%',
            rating: '5.0/5',
            timeSpent: '328 mins'
        }
    });
    listContainer.appendChild(l3Row);

    // Additional rows for demonstration
    const l1Row2 = createGroupTrainingProgressTableRow({
        type: 'content-l1',
        data: {
            competency: 'Mastering Content',
            competencyArea: 'mastering-content',
            completion: '8/16',
            accuracy: '10%',
            rating: '5.0/5',
            timeSpent: '328 mins'
        }
    });
    listContainer.appendChild(l1Row2);

    const l1Row3 = createGroupTrainingProgressTableRow({
        type: 'content-l1',
        data: {
            competency: 'Advocacy',
            competencyArea: 'advocacy',
            completion: '8/16',
            accuracy: '10%',
            rating: '5.0/5',
            timeSpent: '328 mins'
        }
    });
    listContainer.appendChild(l1Row3);

    const l1Row4 = createGroupTrainingProgressTableRow({
        type: 'content-l1',
        data: {
            competency: 'Relationships',
            competencyArea: 'relationships',
            completion: '8/16',
            accuracy: '10%',
            rating: '5.0/5',
            timeSpent: '328 mins'
        }
    });
    listContainer.appendChild(l1Row4);

    const l1Row5 = createGroupTrainingProgressTableRow({
        type: 'content-l1',
        data: {
            competency: 'Technology Tools',
            competencyArea: 'technology-tools',
            completion: '8/16',
            accuracy: '10%',
            rating: '5.0/5',
            timeSpent: '328 mins'
        }
    });
    listContainer.appendChild(l1Row5);

    scrollspyWrapper.appendChild(listContainer);
    innerContainer.appendChild(scrollspyWrapper);
    content.appendChild(innerContainer);

    // --- Page Layout Composition ---
    return createPageLayout({
        content: content,
        sidebarConfig: sidebarConfig,
        topBarConfig: topBarConfig,
        id: 'group-training-progress-page'
    });
}

