/**
 * @fileoverview LessonsOverviewPage component for Training Lessons specs
 * Full page layout for Lessons Overview with filter bar, lesson list, and navigation
 * Matches Figma design system specifications exactly (node-id=63-178237)
 */

import { createLessonListItem } from '../Tables/LessonListItem.js';
import { createTrainingLessonStatusSelect } from '../Elements/TrainingLessonStatusSelect.js';
import { createSortControl } from '../Elements/SortControl.js';
import { PlusInterface } from '../../../../components/index.js';

/**
 * Creates a LessonsOverviewPage component
 * @param {Object} options - Page configuration
 * @param {Array<Object>} [options.lessons=[]] - Array of lesson objects
 * @param {Function} [options.onSidebarToggle] - Sidebar toggle handler
 * @param {Function} [options.onExpandAll] - Expand all handler
 * @param {Function} [options.onViewToggle] - View toggle handler (list/grid)
 * @returns {HTMLElement} Page element
 */
export function createLessonsOverviewPage({
    lessons = [],
    onSidebarToggle = null,
    onExpandAll = null,
    onViewToggle = null
} = {}) {
    // Default sample lessons if none provided
    if (lessons.length === 0) {
        lessons = [
            { title: 'Lesson Title', competencyArea: 'social-emotional', status: 'in progress', duration: '12mins', showAiIndicator: true },
            { title: 'Lesson Title', competencyArea: 'social-emotional', status: 'in progress', duration: '12mins', showAiIndicator: false },
            { title: 'Lesson Title', competencyArea: 'social-emotional', status: 'in progress', duration: '12mins', showAiIndicator: true },
            { title: 'Lesson Title', competencyArea: 'social-emotional', status: 'in progress', duration: '12mins', showAiIndicator: false },
            { title: 'Lesson Title', competencyArea: 'social-emotional', status: 'in progress', duration: '12mins', showAiIndicator: false },
            { title: 'Lesson Title', competencyArea: 'social-emotional', status: 'in progress', duration: '12mins', showAiIndicator: true },
            { title: 'Lesson Title', competencyArea: 'social-emotional', status: 'in progress', duration: '12mins', showAiIndicator: false }
        ];
    }

    // Page container - Figma: w-[var(--breakpoints/min-width,768px)], max-w-[991.98px], min-w-[768px], h-[746px]
    const page = document.createElement('div');
    page.style.backgroundColor = 'var(--color-surface-container)';
    page.style.boxSizing = 'border-box';
    page.style.display = 'flex';
    page.style.flexDirection = 'column';
    page.style.gap = 'var(--size-surface-container-gap-sm)';
    page.style.height = '746px';
    page.style.alignItems = 'flex-start';
    page.style.maxWidth = '991.98px';
    page.style.minWidth = '768px';
    page.style.padding = 'var(--size-surface-container-pad-y-sm) var(--size-surface-container-pad-x-sm)';
    page.style.position = 'relative';
    page.style.width = '768px';
    page.setAttribute('data-name', 'List View');
    page.setAttribute('data-node-id', '63:178237');

    // Top Bar - Figma: gap-[var(--element/gap-lg,12px)]
    const topBar = document.createElement('div');
    topBar.style.display = 'flex';
    topBar.style.gap = 'var(--size-element-gap-lg)';
    topBar.style.alignItems = 'center';
    topBar.style.position = 'relative';
    topBar.style.flexShrink = '0';
    topBar.style.width = '100%';
    topBar.setAttribute('data-name', 'Top Bar');
    topBar.setAttribute('data-node-id', '549:115499');

    // Sidebar Control - Figma: w-[168px]
    const sidebarControl = document.createElement('div');
    sidebarControl.style.display = 'flex';
    sidebarControl.style.flexDirection = 'row';
    sidebarControl.style.alignItems = 'center';
    sidebarControl.style.alignSelf = 'stretch';
    sidebarControl.style.position = 'relative';
    sidebarControl.style.flexShrink = '0';
    sidebarControl.style.width = '168px';
    sidebarControl.setAttribute('data-name', 'Sidebar Control');
    sidebarControl.setAttribute('data-node-id', 'I549:115499;111:227861');

    const sidebarButton = PlusInterface.createButton({
        btnText: '',
        btnStyle: 'primary',
        btnFill: 'tonal',
        btnSize: 'default',
        buttonOnClick: onSidebarToggle,
        icon: 'angles-left',
        iconPosition: 'left',
        iconStyle: 'solid'
    });
    sidebarButton.style.cursor = 'pointer';
    sidebarButton.setAttribute('data-name', 'Tonal buttons');
    sidebarButton.setAttribute('data-node-id', 'I549:115499;111:227862');
    sidebarControl.appendChild(sidebarButton);
    topBar.appendChild(sidebarControl);

    // Page Control (Breadcrumb) - Figma: flex-grow
    const pageControl = document.createElement('div');
    pageControl.style.display = 'flex';
    pageControl.style.flexGrow = '1';
    pageControl.style.alignItems = 'center';
    pageControl.style.position = 'relative';
    pageControl.style.flexShrink = '0';
    pageControl.setAttribute('data-name', 'Page Control');
    pageControl.setAttribute('data-node-id', 'I549:115499;111:227863');

    const breadcrumb = document.createElement('div');
    breadcrumb.style.boxSizing = 'border-box';
    breadcrumb.style.display = 'flex';
    breadcrumb.style.gap = 'var(--size-element-gap-sm)';
    breadcrumb.style.alignItems = 'flex-start';
    breadcrumb.style.padding = 'var(--size-element-pad-x-lg) var(--size-element-pad-x-sm)';
    breadcrumb.style.position = 'relative';
    breadcrumb.style.flexShrink = '0';
    breadcrumb.setAttribute('data-name', 'Breadcrumb');
    breadcrumb.setAttribute('data-node-id', 'I549:115499;111:227864');

    // Home link
    const homeLink = document.createElement('div');
    homeLink.style.display = 'flex';
    homeLink.style.gap = 'var(--size-element-gap-md)'; // 10px
    homeLink.style.alignItems = 'flex-start';
    homeLink.style.position = 'relative';
    homeLink.style.flexShrink = '0';
    const homeText = document.createElement('div');
    homeText.style.fontFamily = 'var(--font-family-body)';
    homeText.style.fontSize = 'var(--font-size-body1)';
    homeText.style.fontWeight = 'var(--font-weight-normal)';
    homeText.style.lineHeight = '1.5';
    homeText.style.color = 'var(--color-primary-text)';
    homeText.style.whiteSpace = 'nowrap';
    homeText.textContent = 'Home';
    homeLink.appendChild(homeText);
    breadcrumb.appendChild(homeLink);

    // Divider
    const divider1 = document.createElement('div');
    divider1.style.display = 'flex';
    divider1.style.gap = 'var(--size-element-gap-md)'; // 10px
    divider1.style.alignItems = 'flex-start';
    divider1.style.position = 'relative';
    divider1.style.flexShrink = '0';
    const dividerText1 = document.createElement('div');
    dividerText1.style.fontFamily = 'var(--font-family-body)';
    dividerText1.style.fontSize = 'var(--font-size-body1)';
    dividerText1.style.fontWeight = 'var(--font-weight-normal)';
    dividerText1.style.lineHeight = '1.5';
    dividerText1.style.color = 'var(--color-on-surface-variant)';
    dividerText1.style.whiteSpace = 'nowrap';
    dividerText1.textContent = '/';
    divider1.appendChild(dividerText1);
    breadcrumb.appendChild(divider1);

    // Lessons link
    const lessonsLink = document.createElement('div');
    lessonsLink.style.display = 'flex';
    lessonsLink.style.gap = 'var(--size-element-gap-md)'; // 10px
    lessonsLink.style.alignItems = 'flex-start';
    lessonsLink.style.position = 'relative';
    lessonsLink.style.flexShrink = '0';
    const lessonsText = document.createElement('div');
    lessonsText.style.fontFamily = 'var(--font-family-body)';
    lessonsText.style.fontSize = 'var(--font-size-body1)';
    lessonsText.style.fontWeight = 'var(--font-weight-normal)';
    lessonsText.style.lineHeight = '1.5';
    lessonsText.style.color = 'var(--color-on-surface-variant)';
    lessonsText.style.whiteSpace = 'nowrap';
    lessonsText.textContent = 'Lessons';
    lessonsLink.appendChild(lessonsText);
    breadcrumb.appendChild(lessonsLink);

    pageControl.appendChild(breadcrumb);
    topBar.appendChild(pageControl);

    // User Avatar - Figma: w-[168px]
    const userAvatar = document.createElement('div');
    userAvatar.style.backgroundColor = 'var(--color-surface-container-lowest)';
    userAvatar.style.boxSizing = 'border-box';
    userAvatar.style.display = 'flex';
    userAvatar.style.gap = 'var(--size-element-gap-sm)';
    userAvatar.style.alignItems = 'center';
    userAvatar.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
    userAvatar.style.position = 'relative';
    userAvatar.style.borderRadius = 'var(--size-element-radius-sm)';
    userAvatar.style.flexShrink = '0';
    userAvatar.style.width = '168px';
    userAvatar.setAttribute('data-name', 'User Avatar');
    userAvatar.setAttribute('data-node-id', 'I549:115499;111:227865');

    // User Name container
    const userNameContainer = document.createElement('div');
    userNameContainer.style.display = 'flex';
    userNameContainer.style.gap = '6px'; // Specific spacing from design - no direct token
    userNameContainer.style.alignItems = 'center';
    userNameContainer.style.flexGrow = '1';
    userNameContainer.style.position = 'relative';
    userNameContainer.style.flexShrink = '0';
    userNameContainer.setAttribute('data-name', 'User Name');
    userNameContainer.setAttribute('data-node-id', 'I549:115499;111:227865;111:227878');

    // Name Pill
    const namePill = document.createElement('div');
    namePill.style.backgroundColor = 'var(--color-primary-state-08)';
    namePill.style.boxSizing = 'border-box';
    namePill.style.display = 'flex';
    namePill.style.alignItems = 'center';
    namePill.style.padding = '0 var(--size-element-pad-y-sm)'; // 4px - using smallest available padding token
    namePill.style.position = 'relative';
    namePill.style.borderRadius = 'var(--size-element-radius-pill)';
    namePill.style.flexShrink = '0';
    namePill.setAttribute('data-name', 'Name Pill');
    namePill.setAttribute('data-node-id', 'I549:115499;111:227865;111:227879');

    const namePillContent = document.createElement('div');
    namePillContent.style.display = 'flex';
    namePillContent.style.gap = 'var(--size-element-gap-md)'; // 10px
    namePillContent.style.height = '24px';
    namePillContent.style.alignItems = 'center';
    namePillContent.style.justifyContent = 'center';
    namePillContent.style.minWidth = '16px';
    namePillContent.style.position = 'relative';
    namePillContent.style.flexShrink = '0';
    const nameInitial = document.createElement('div');
    nameInitial.style.fontFamily = 'var(--font-family-body)';
    nameInitial.style.fontSize = 'var(--font-size-body2)';
    nameInitial.style.fontWeight = 'var(--font-weight-semibold-1)';
    nameInitial.style.lineHeight = '1.571';
    nameInitial.style.color = 'var(--color-primary-text)';
    nameInitial.textContent = 'J';
    namePillContent.appendChild(nameInitial);
    namePill.appendChild(namePillContent);
    userNameContainer.appendChild(namePill);

    // User name text
    const userNameText = document.createElement('p');
    userNameText.style.fontFamily = 'var(--font-family-body)';
    userNameText.style.fontSize = 'var(--font-size-body2)';
    userNameText.style.fontWeight = 'var(--font-weight-normal)';
    userNameText.style.lineHeight = '1.571';
    userNameText.style.color = 'var(--color-on-surface)';
    userNameText.style.whiteSpace = 'nowrap';
    userNameText.style.textOverflow = 'ellipsis';
    userNameText.style.overflow = 'hidden';
    userNameText.textContent = 'John Doe';
    userNameContainer.appendChild(userNameText);
    userAvatar.appendChild(userNameContainer);

    // Notification badge
    const notificationBadge = document.createElement('div');
    notificationBadge.style.backgroundColor = 'var(--color-danger-state-08)';
    notificationBadge.style.boxSizing = 'border-box';
    notificationBadge.style.display = 'flex';
    notificationBadge.style.alignItems = 'center';
    notificationBadge.style.padding = '0 var(--size-element-pad-x-sm)';
    notificationBadge.style.position = 'relative';
    notificationBadge.style.borderRadius = 'var(--size-element-radius-pill)';
    notificationBadge.style.flexShrink = '0';
    notificationBadge.setAttribute('data-name', 'Static Badge');
    notificationBadge.setAttribute('data-node-id', 'I549:115499;111:227865;111:227883');

    const badgeContent = document.createElement('div');
    badgeContent.style.display = 'flex';
    badgeContent.style.gap = 'var(--size-element-gap-sm)';
    badgeContent.style.alignItems = 'center';
    badgeContent.style.justifyContent = 'center';
    badgeContent.style.minWidth = '12px';
    const badgeText = document.createElement('div');
    badgeText.style.fontFamily = 'var(--font-family-body)';
    badgeText.style.fontSize = 'var(--font-size-body3)';
    badgeText.style.fontWeight = 'var(--font-weight-semibold-1)';
    badgeText.style.lineHeight = '1.667';
    badgeText.style.color = 'var(--color-danger-text)';
    badgeText.style.textAlign = 'center';
    badgeText.textContent = '2';
    badgeContent.appendChild(badgeText);
    notificationBadge.appendChild(badgeContent);
    userAvatar.appendChild(notificationBadge);
    topBar.appendChild(userAvatar);
    page.appendChild(topBar);

    // Main Container - Figma: gap-[var(--surface-container/gap-sm,16px)], h-[666px]
    const mainContainer = document.createElement('div');
    mainContainer.style.display = 'flex';
    mainContainer.style.gap = 'var(--size-surface-container-gap-sm)';
    mainContainer.style.height = '666px';
    mainContainer.style.alignItems = 'flex-start';
    mainContainer.style.position = 'relative';
    mainContainer.style.flexShrink = '0';
    mainContainer.style.width = '100%';
    mainContainer.setAttribute('data-name', 'Main Container');
    mainContainer.setAttribute('data-node-id', '63:178239');

    // Content Container - Figma: bg surface, gap-[var(--surface/gap-md,24px)], pad-[var(--surface/pad-x,32px)] py-[var(--surface/pad-y,24px)], rounded-[var(--surface/radius,16px)]
    const contentContainer = document.createElement('div');
    contentContainer.style.flexBasis = '0';
    contentContainer.style.backgroundColor = 'var(--color-surface)';
    contentContainer.style.boxSizing = 'border-box';
    contentContainer.style.display = 'flex';
    contentContainer.style.flexDirection = 'column';
    contentContainer.style.gap = 'var(--size-surface-gap-md)';
    contentContainer.style.flexGrow = '1';
    contentContainer.style.height = '666px';
    contentContainer.style.alignItems = 'flex-start';
    contentContainer.style.minHeight = '1px';
    contentContainer.style.minWidth = '1px';
    contentContainer.style.overflow = 'hidden';
    contentContainer.style.padding = 'var(--size-surface-pad-y) var(--size-surface-pad-x)';
    contentContainer.style.position = 'relative';
    contentContainer.style.borderRadius = 'var(--size-surface-radius)';
    contentContainer.style.flexShrink = '0';
    contentContainer.setAttribute('data-name', 'Content Container');
    contentContainer.setAttribute('data-node-id', '63:178241');

    // Content wrapper - Figma: gap-[var(--legacy/spacing/spacer-1-between-sections,8px)]
    const contentWrapper = document.createElement('div');
    contentWrapper.style.display = 'flex';
    contentWrapper.style.flexDirection = 'column';
    contentWrapper.style.gap = 'var(--size-element-gap-sm)'; // 8px
    contentWrapper.style.alignItems = 'flex-start';
    contentWrapper.style.flexGrow = '1';
    contentWrapper.style.position = 'relative';
    contentWrapper.style.flexShrink = '0';
    contentWrapper.style.width = '100%';
    contentWrapper.setAttribute('data-node-id', '63:178242');

    // Filter Bar - Figma: gap-[10px], justify-between
    const filterBar = document.createElement('div');
    filterBar.style.display = 'flex';
    filterBar.style.flexWrap = 'wrap';
    filterBar.style.gap = 'var(--size-element-gap-md)'; // 10px
    filterBar.style.alignItems = 'flex-start';
    filterBar.style.justifyContent = 'space-between';
    filterBar.style.position = 'relative';
    filterBar.style.flexShrink = '0';
    filterBar.style.width = '100%';
    filterBar.setAttribute('data-name', 'Filter Bar');
    filterBar.setAttribute('data-node-id', '1104:95511');

    // Filter Left - Figma: w-[531.5px]
    const filterLeft = document.createElement('div');
    filterLeft.style.display = 'flex';
    filterLeft.style.gap = 'var(--size-element-gap-sm)'; // 8px
    filterLeft.style.alignItems = 'flex-start';
    filterLeft.style.position = 'relative';
    filterLeft.style.flexShrink = '0';
    filterLeft.style.width = '531.5px';
    filterLeft.setAttribute('data-node-id', '1104:95512');

    const statusSelect = createTrainingLessonStatusSelect({ open: false });
    filterLeft.appendChild(statusSelect);
    filterBar.appendChild(filterLeft);

    // Filter Right - Figma: gap-[var(--element/gap-sm,8px)]
    const filterRight = document.createElement('div');
    filterRight.style.display = 'flex';
    filterRight.style.gap = 'var(--size-element-gap-sm)';
    filterRight.style.alignItems = 'flex-start';
    filterRight.style.position = 'relative';
    filterRight.style.flexShrink = '0';
    filterRight.setAttribute('data-node-id', '1104:95515');

    // Expand All button
    const expandAllButton = PlusInterface.createButton({
        btnText: 'Expand All',
        btnStyle: 'secondary',
        btnFill: 'outline',
        btnSize: 'small',
        buttonOnClick: onExpandAll
    });
    expandAllButton.style.flexShrink = '0';
    expandAllButton.setAttribute('data-name', 'Outlined buttons');
    expandAllButton.setAttribute('data-node-id', '1104:95516');
    filterRight.appendChild(expandAllButton);

    // Sort Control
    const sortControl = createSortControl({ variant: 'name' });
    sortControl.style.display = 'flex';
    sortControl.style.flexDirection = 'column';
    sortControl.style.alignItems = 'flex-start';
    sortControl.style.position = 'relative';
    sortControl.style.flexShrink = '0';
    sortControl.setAttribute('data-name', 'Sort Control');
    sortControl.setAttribute('data-node-id', '1104:95517');
    filterRight.appendChild(sortControl);

    // View toggle buttons - Figma: gap-[8px]
    const viewToggleButtons = document.createElement('div');
    viewToggleButtons.style.display = 'flex';
    viewToggleButtons.style.gap = 'var(--size-element-gap-sm)'; // 8px
    viewToggleButtons.style.alignItems = 'center';
    viewToggleButtons.style.position = 'relative';
    viewToggleButtons.style.borderRadius = 'var(--size-element-radius-sm)';
    viewToggleButtons.style.flexShrink = '0';
    viewToggleButtons.setAttribute('data-name', 'Buttons');
    viewToggleButtons.setAttribute('data-node-id', '1104:95518');

    // List view button (selected)
    const listViewButton = PlusInterface.createButton({
        btnText: '',
        btnStyle: 'primary',
        btnFill: 'tonal',
        btnSize: 'small',
        buttonOnClick: () => onViewToggle && onViewToggle('list'),
        icon: 'list-ul',
        iconPosition: 'left',
        iconStyle: 'solid'
    });
    listViewButton.style.flexShrink = '0';
    viewToggleButtons.appendChild(listViewButton);

    // Grid view button
    const gridViewButton = PlusInterface.createButton({
        btnText: '',
        btnStyle: 'primary',
        btnFill: 'text',
        btnSize: 'small',
        buttonOnClick: () => onViewToggle && onViewToggle('grid'),
        icon: 'table-cells-large',
        iconPosition: 'left',
        iconStyle: 'solid'
    });
    gridViewButton.style.flexShrink = '0';
    viewToggleButtons.appendChild(gridViewButton);

    filterRight.appendChild(viewToggleButtons);
    filterBar.appendChild(filterRight);
    contentWrapper.appendChild(filterBar);

    // Lesson List - Wrapper for horizontal scrolling
    const lessonListWrapper = document.createElement('div');
    lessonListWrapper.style.width = '100%';
    lessonListWrapper.style.height = '456px';
    lessonListWrapper.style.overflowX = 'auto';
    lessonListWrapper.style.overflowY = 'hidden';
    lessonListWrapper.style.scrollBehavior = 'smooth';
    lessonListWrapper.style.webkitOverflowScrolling = 'touch';
    lessonListWrapper.setAttribute('data-name', 'Lesson List Wrapper');
    
    // Lesson List - Figma: h-[456px], min-w-[700px]
    const lessonList = document.createElement('div');
    lessonList.style.display = 'flex';
    lessonList.style.flexDirection = 'column';
    lessonList.style.height = '456px';
    lessonList.style.alignItems = 'flex-start';
    lessonList.style.minWidth = '755px'; // Match LessonListItem width (755px)
    lessonList.style.position = 'relative';
    lessonList.style.flexShrink = '0';
    lessonList.style.width = '100%';
    lessonList.setAttribute('data-name', 'Lesson List');
    lessonList.setAttribute('data-node-id', '63:178255');

    // Table header
    const tableHeader = createLessonListItem({ type: 'header' });
    lessonList.appendChild(tableHeader);

    // Lesson items
    lessons.forEach((lesson, index) => {
        const lessonItem = createLessonListItem({
            type: 'item',
            lessonTitle: lesson.title,
            competencyArea: lesson.competencyArea,
            status: lesson.status,
            duration: lesson.duration,
            showAiIndicator: lesson.showAiIndicator
        });
        lessonList.appendChild(lessonItem);
    });

    lessonListWrapper.appendChild(lessonList);
    contentWrapper.appendChild(lessonListWrapper);
    contentContainer.appendChild(contentWrapper);

    // Footnote - Figma: py-[var(--legacy/spacing/spacer-3-(base)-between-sections,24px)]
    const footnote = document.createElement('div');
    footnote.style.boxSizing = 'border-box';
    footnote.style.display = 'flex';
    footnote.style.alignItems = 'center';
    footnote.style.justifyContent = 'space-between';
    footnote.style.padding = 'var(--size-section-gap-lg) 0';
    footnote.style.position = 'relative';
    footnote.style.flexShrink = '0';
    footnote.style.width = '100%';
    footnote.setAttribute('data-name', 'Footnote');
    footnote.setAttribute('data-node-id', '63:178264');

    const footnoteText = document.createElement('div');
    footnoteText.style.display = 'flex';
    footnoteText.style.gap = 'var(--size-element-gap-xs)'; // 4px
    footnoteText.style.alignItems = 'center';
    footnoteText.style.position = 'relative';
    footnoteText.style.flexShrink = '0';
    const footnoteContent = document.createElement('p');
    footnoteContent.style.fontFamily = 'var(--font-family-body)';
    footnoteContent.style.fontSize = 'var(--font-size-body3)';
    footnoteContent.style.fontWeight = 'var(--font-weight-normal)';
    footnoteContent.style.lineHeight = '1.667';
    footnoteContent.style.color = 'var(--color-on-surface)';
    footnoteContent.style.whiteSpace = 'nowrap';
    footnoteContent.textContent = 'v5.2.0 | Copyright © Carnegie Mellon University 2024 | Terms of Use';
    footnoteText.appendChild(footnoteContent);
    footnote.appendChild(footnoteText);
    contentContainer.appendChild(footnote);

    mainContainer.appendChild(contentContainer);
    page.appendChild(mainContainer);

    return page;
}

