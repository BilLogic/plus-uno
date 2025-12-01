/**
 * @fileoverview LessonInnerPage component for Training Lessons specs
 * Full page layout for individual lesson detail page with multiple variants
 * Matches Figma design system specifications exactly (node-id=63-178289)
 * Supports variants: page-one, page-two, page-three, page-four, page-five
 */

import { createAlertForSupervisors } from '../Cards/AlertForSupervisors.js';
import { createLikertScale } from '../Elements/LikertScale.js';
import { PlusInterface } from '../../../../components/index.js';

/**
 * Creates a LessonInnerPage component with multiple variants
 * @param {Object} options - Page configuration
 * @param {string} [options.variant="page-one"] - Page variant: "page-one", "page-two", "page-three", "page-four", "page-five"
 * @param {string} [options.lessonTitle="Giving Effective Praise"] - Lesson title
 * @param {string} [options.estimatedTime="15 Minutes"] - Estimated time
 * @param {Array<number>} [options.progressBars] - Progress bar widths (px) - auto-calculated based on variant
 * @param {Function} [options.onSidebarToggle] - Sidebar toggle handler
 * @param {Function} [options.onPrevious] - Previous button handler
 * @param {Function} [options.onNext] - Next button handler
 * @returns {HTMLElement} Page element
 */
export function createLessonInnerPage({
    variant = "page-one",
    lessonTitle = 'Giving Effective Praise',
    estimatedTime = '15 Minutes',
    progressBars = null,
    onSidebarToggle = null,
    onPrevious = null,
    onNext = null
} = {}) {
    // Auto-calculate progress bars based on variant if not provided
    if (!progressBars) {
        if (variant === "page-one") {
            progressBars = [160, 0, 0, 0, 0, 0, 0, 0, 0];
        } else if (variant === "page-two") {
            progressBars = [160, 0, 0, 0, 0, 0, 0, 0, 0];
        } else if (variant === "page-three") {
            progressBars = [160, 160, 160, 160, 160, 160, 160, 0, 0]; // Bars 0-6 filled, bars 7-8 empty
        } else if (variant === "page-four") {
            progressBars = [160, 160, 160, 160, 160, 160, 0, 0, 0];
        } else if (variant === "page-five") {
            progressBars = [160, 160, 160, 160, 160, 160, 160, 160, 160];
        }
    }

    // Map variant to node-id
    const variantNodeIds = {
        "page-one": "63:178290",
        "page-two": "63:178394",
        "page-three": "63:178466",
        "page-four": "63:178429",
        "page-five": "63:178356"
    };

    // Page container - Figma: size-full
    const page = document.createElement('div');
    page.style.backgroundColor = 'var(--color-surface-container)';
    page.style.boxSizing = 'border-box';
    page.style.display = 'flex';
    page.style.flexDirection = 'column';
    page.style.gap = 'var(--size-surface-container-gap-sm)';
    page.style.alignItems = 'flex-start';
    page.style.padding = 'var(--size-surface-container-pad-y-sm) var(--size-surface-container-pad-x-sm)';
    page.style.position = 'relative';
    page.style.width = '100%';
    page.style.height = '100%';
    page.setAttribute('data-name', `page=${variant.replace('page-', '')}`);
    page.setAttribute('data-node-id', variantNodeIds[variant] || variantNodeIds["page-one"]);

    // Top Bar (shared across all variants)
    const topBar = createTopBar(onSidebarToggle, variant);
    page.appendChild(topBar);

    // Main Container
    const mainContainer = document.createElement('div');
    mainContainer.style.display = 'flex';
    mainContainer.style.gap = variant === "page-two" ? 'var(--size-section-gap-md)' : 'var(--size-surface-container-gap-sm)';
    mainContainer.style.alignItems = 'flex-start';
    mainContainer.style.position = 'relative';
    mainContainer.style.flexShrink = '0';
    mainContainer.style.width = '100%';
    if (variant === "page-two") {
        mainContainer.style.height = '1298px';
    }
    mainContainer.setAttribute('data-name', 'Main Container');
    mainContainer.setAttribute('data-node-id', variant === "page-one" ? '63:178292' : variant === "page-two" ? '63:178396' : variant === "page-three" ? '63:178468' : variant === "page-four" ? '63:178431' : '63:178358');

    // Content Container
    const contentContainer = document.createElement('div');
    contentContainer.style.flexBasis = '0';
    contentContainer.style.backgroundColor = 'var(--color-surface)';
    contentContainer.style.boxSizing = 'border-box';
    contentContainer.style.display = 'flex';
    contentContainer.style.flexDirection = 'column';
    contentContainer.style.gap = variant === "page-two" ? 'var(--size-section-gap-md)' : variant === "page-three" || variant === "page-four" ? 'var(--size-surface-gap-sm)' : 'var(--size-surface-gap-md)';
    contentContainer.style.flexGrow = '1';
    contentContainer.style.alignItems = 'flex-start';
    contentContainer.style.minHeight = '1px';
    contentContainer.style.minWidth = '1px';
    // Allow overflow for page-two to show all content
    contentContainer.style.overflow = variant === "page-two" ? 'visible' : 'hidden';
    contentContainer.style.padding = variant === "page-two" ? 'var(--size-section-pad-y-md) var(--size-section-pad-x-lg)' : 'var(--size-surface-pad-y) var(--size-surface-pad-x)';
    contentContainer.style.position = 'relative';
    contentContainer.style.borderRadius = 'var(--size-surface-radius)';
    contentContainer.style.flexShrink = '0';
    contentContainer.setAttribute('data-name', 'Content Container');
    contentContainer.setAttribute('data-node-id', variant === "page-one" ? '63:178294' : variant === "page-two" ? '63:178398' : variant === "page-three" ? '63:178470' : variant === "page-four" ? '63:178433' : '63:178360');

    // Content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.style.display = 'flex';
    contentWrapper.style.flexDirection = 'column';
    contentWrapper.style.gap = variant === "page-one" ? 'var(--size-section-gap-md)' : variant === "page-two" ? 'var(--size-section-gap-md)' : variant === "page-three" || variant === "page-four" ? 'var(--size-section-gap-lg)' : 'var(--size-section-gap-md)';
    contentWrapper.style.alignItems = 'flex-start';
    contentWrapper.style.maxWidth = '896px';
    contentWrapper.style.position = 'relative';
    contentWrapper.style.flexShrink = '0';
    contentWrapper.style.width = '100%';
    // Remove fixed height constraints to allow all content to be visible
    if (variant === "page-two") {
        contentWrapper.style.minHeight = '1032px'; // Use minHeight instead of fixed height
        contentWrapper.style.overflow = 'visible'; // Allow content to be visible
    } else if (variant === "page-three" || variant === "page-four") {
        contentWrapper.style.overflow = 'visible'; // Allow content to be visible
    }
    contentWrapper.setAttribute('data-node-id', variant === "page-one" ? '63:178295' : variant === "page-two" ? '63:178399' : variant === "page-three" ? '63:178471' : variant === "page-four" ? '63:178434' : '63:178361');

    // Lesson Progress Bar (shared across all variants)
    const progressBarContainer = createLessonProgressBar(progressBars, variant);
    contentWrapper.appendChild(progressBarContainer);

    // Alert (shared across all variants)
    const alert = createAlertForSupervisors({ aiFeature: true });
    alert.style.width = '100%';
    contentWrapper.appendChild(alert);

    // Variant-specific content
    if (variant === "page-one") {
        const pageOneContent = createPageOneContent(lessonTitle, estimatedTime);
        contentWrapper.appendChild(pageOneContent);
    } else if (variant === "page-two") {
        const pageTwoContent = createPageTwoContent(onPrevious, onNext);
        contentWrapper.appendChild(pageTwoContent);
    } else if (variant === "page-three") {
        const pageThreeContent = createPageThreeContent(onPrevious, onNext);
        contentWrapper.appendChild(pageThreeContent);
    } else if (variant === "page-four") {
        const pageFourContent = createPageFourContent(onPrevious, onNext);
        contentWrapper.appendChild(pageFourContent);
    } else if (variant === "page-five") {
        const pageFiveContent = createPageFiveContent(onPrevious, onNext);
        contentWrapper.appendChild(pageFiveContent);
    }

    contentContainer.appendChild(contentWrapper);

    // Footnote (shared across all variants)
    const footnote = createFootnote(variant);
    contentContainer.appendChild(footnote);

    mainContainer.appendChild(contentContainer);
    page.appendChild(mainContainer);

    return page;
}

/**
 * Creates top bar (shared across all variants)
 */
function createTopBar(onSidebarToggle, variant) {
    const topBar = document.createElement('div');
    topBar.style.display = 'flex';
    topBar.style.gap = 'var(--size-element-gap-lg)';
    topBar.style.alignItems = 'center';
    topBar.style.position = 'relative';
    topBar.style.flexShrink = '0';
    topBar.style.width = '100%';
    topBar.setAttribute('data-name', 'Top Bar');
    topBar.setAttribute('data-node-id', variant === "page-one" ? '551:316973' : variant === "page-two" ? '551:318061' : variant === "page-three" ? '551:319005' : variant === "page-four" ? '551:319815' : '551:320841');

    // Sidebar Control
    const sidebarControl = document.createElement('div');
    sidebarControl.style.display = 'flex';
    sidebarControl.style.flexDirection = 'row';
    sidebarControl.style.alignItems = 'center';
    sidebarControl.style.alignSelf = 'stretch';
    sidebarControl.style.position = 'relative';
    sidebarControl.style.flexShrink = '0';
    sidebarControl.style.width = '168px';
    sidebarControl.setAttribute('data-name', 'Sidebar Control');
    sidebarControl.setAttribute('data-node-id', 'I551:316973;111:227861');

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
    sidebarButton.setAttribute('data-node-id', 'I551:316973;111:227862');
    sidebarControl.appendChild(sidebarButton);
    topBar.appendChild(sidebarControl);

    // Page Control (Breadcrumb)
    const pageControl = document.createElement('div');
    pageControl.style.display = 'flex';
    pageControl.style.flexGrow = '1';
    pageControl.style.alignItems = 'center';
    pageControl.style.position = 'relative';
    pageControl.style.flexShrink = '0';
    pageControl.setAttribute('data-name', 'Page Control');
    pageControl.setAttribute('data-node-id', 'I551:316973;111:227863');

    const breadcrumb = document.createElement('div');
    breadcrumb.style.boxSizing = 'border-box';
    breadcrumb.style.display = 'flex';
    breadcrumb.style.gap = 'var(--size-element-gap-sm)';
    breadcrumb.style.alignItems = 'flex-start';
    breadcrumb.style.padding = 'var(--size-element-pad-y-lg) var(--size-element-pad-x-lg)';
    breadcrumb.style.position = 'relative';
    breadcrumb.style.flexShrink = '0';
    breadcrumb.setAttribute('data-name', 'Breadcrumb');
    breadcrumb.setAttribute('data-node-id', 'I551:316973;111:227864');

    // Breadcrumb items - variant-specific last item
    const breadcrumbLastItem = variant === "page-one" ? 'Page Now' : variant === "page-five" ? 'Page Now' : 'Giving Effective Praise';
    const breadcrumbItems = ['Home', '/', 'Lessons', '/', breadcrumbLastItem];
    
    breadcrumbItems.forEach((item, index) => {
        const breadcrumbItem = document.createElement('div');
        breadcrumbItem.style.display = 'flex';
        breadcrumbItem.style.gap = 'var(--size-element-gap-md)'; // 10px
        breadcrumbItem.style.alignItems = 'flex-start';
        breadcrumbItem.style.position = 'relative';
        breadcrumbItem.style.flexShrink = '0';
        breadcrumbItem.setAttribute('data-name', '_Breadcrumb');
        breadcrumbItem.setAttribute('data-node-id', `I551:316973;111:227864;27:${549 + index}`);

        const breadcrumbText = document.createElement('div');
        breadcrumbText.style.fontFamily = 'var(--font-family-body)';
        breadcrumbText.style.fontSize = 'var(--font-size-body1)';
        breadcrumbText.style.fontWeight = 'var(--font-weight-normal)';
        breadcrumbText.style.lineHeight = '1.5';
        breadcrumbText.style.color = item === '/' ? 'var(--color-on-surface-variant)' : (index === 0 || index === 2 ? 'var(--color-primary-text)' : 'var(--color-on-surface-variant)');
        breadcrumbText.style.whiteSpace = 'nowrap';
        breadcrumbText.textContent = item;
        breadcrumbItem.appendChild(breadcrumbText);
        breadcrumb.appendChild(breadcrumbItem);
    });

    pageControl.appendChild(breadcrumb);
    topBar.appendChild(pageControl);

    // User Avatar (shared)
    const userAvatar = createUserAvatar();
    topBar.appendChild(userAvatar);

    return topBar;
}

/**
 * Creates user avatar (shared)
 */
function createUserAvatar() {
    const userAvatar = document.createElement('div');
    userAvatar.style.backgroundColor = 'var(--color-surface-container-lowest)';
    userAvatar.style.boxSizing = 'border-box';
    userAvatar.style.display = 'flex';
    userAvatar.style.gap = 'var(--size-element-gap-sm)';
    userAvatar.style.alignItems = 'center';
    userAvatar.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
    userAvatar.style.position = 'relative';
    userAvatar.style.borderRadius = 'var(--size-element-radius-sm)';
    userAvatar.style.width = '168px';
    userAvatar.style.flexShrink = '0';
    userAvatar.setAttribute('data-name', 'User Avatar');
    userAvatar.setAttribute('data-node-id', 'I551:316973;111:227865');

    const userNameContainer = document.createElement('div');
    userNameContainer.style.display = 'flex';
    userNameContainer.style.gap = '6px';
    userNameContainer.style.alignItems = 'center';
    userNameContainer.style.flexGrow = '1';
    userNameContainer.style.position = 'relative';
    userNameContainer.style.flexShrink = '0';
    userNameContainer.setAttribute('data-name', 'User Name');
    userNameContainer.setAttribute('data-node-id', 'I551:316973;111:227865;111:227878');

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
    namePill.setAttribute('data-node-id', 'I551:316973;111:227865;111:227879');

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
    notificationBadge.setAttribute('data-node-id', 'I551:316973;111:227865;111:227883');

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

    return userAvatar;
}

/**
 * Creates lesson progress bar (shared, but variant-specific progress values)
 */
function createLessonProgressBar(progressBars, variant) {
    const container = document.createElement('div');
    container.style.boxSizing = 'border-box';
    container.style.display = 'flex';
    container.style.gap = 'var(--size-element-gap-md)'; // 10px
    container.style.alignItems = 'flex-start';
    container.style.padding = 'var(--size-card-pad-x-sm)'; // 16px
    container.style.position = 'relative';
    container.style.flexShrink = '0';
    container.style.width = '100%';
    container.setAttribute('data-name', 'Lesson Progress Bar');
    container.setAttribute('data-node-id', variant === "page-one" ? '63:178296' : variant === "page-two" ? '63:178400' : variant === "page-three" ? '63:178472' : variant === "page-four" ? '63:178435' : '63:178362');

    progressBars.forEach((width, index) => {
        const barContainer = document.createElement('div');
        barContainer.style.flexBasis = '0';
        barContainer.style.display = 'flex';
        barContainer.style.flexDirection = 'column';
        barContainer.style.gap = 'var(--size-element-gap-sm)'; // 8px
        barContainer.style.flexGrow = '1';
        barContainer.style.alignItems = 'center';
        barContainer.style.justifyContent = 'center';
        barContainer.style.minHeight = '1px';
        barContainer.style.minWidth = '1px';
        barContainer.style.position = 'relative';
        barContainer.style.flexShrink = '0';
        barContainer.setAttribute('data-name', index === 6 && variant === "page-three" ? 'Progress' : 'Bar');
        barContainer.setAttribute('data-node-id', `I63:178296;7253:${3465 + index}`);

        const progressBar = document.createElement('div');
        progressBar.style.display = 'flex';
        progressBar.style.flexDirection = 'column';
        // Page-three bars 1-6 use gap var(--spacing/medium/space-150,10px), others use var(--spacing/small/space-150,10px)
        progressBar.style.gap = variant === "page-three" && index >= 1 && index <= 6 ? 'var(--size-element-gap-md)' : 'var(--size-element-gap-md)'; // Both are 10px
        progressBar.style.alignItems = 'flex-start';
        progressBar.style.position = 'relative';
        progressBar.style.flexShrink = '0';
        progressBar.style.width = '100%';
        progressBar.setAttribute('data-name', 'Progress Bar');
        progressBar.setAttribute('data-node-id', variant === "page-three" && index >= 1 && index <= 6 ? `I63:178472;7253:${3465 + index};406:31864` : `I63:178296;7253:${3465 + index};7253:${index === 0 ? '3459' : '3453'}`);

        const progressBarBg = document.createElement('div');
        progressBarBg.style.backgroundColor = 'var(--color-surface-container-highest)';
        progressBarBg.style.display = 'flex';
        progressBarBg.style.flexDirection = 'column';
        progressBarBg.style.gap = 'var(--size-element-gap-md)'; // 10px
        progressBarBg.style.alignItems = 'flex-start';
        progressBarBg.style.overflow = 'hidden';
        progressBarBg.style.position = 'relative';
        progressBarBg.style.borderRadius = variant === "page-three" && index >= 1 && index <= 6 ? '12px' : '12px';
        progressBarBg.style.flexShrink = '0';
        progressBarBg.style.width = '100%';
        progressBarBg.setAttribute('data-name', '_Progress Bar');
        progressBarBg.setAttribute('data-node-id', variant === "page-three" && index >= 1 && index <= 6 ? `I63:178472;7253:${3465 + index};406:31865` : `I63:178296;7253:${3465 + index};7253:${index === 0 ? '3460' : '3454'}`);

        const barTrack = document.createElement('div');
        barTrack.style.height = '6px';
        barTrack.style.position = 'relative';
        barTrack.style.flexShrink = '0';
        barTrack.style.width = index === 0 ? '100px' : '100%';
        barTrack.setAttribute('data-name', 'Bar');
        barTrack.setAttribute('data-node-id', variant === "page-three" && index >= 1 && index <= 6 ? `I63:178472;7253:${3465 + index};406:31866` : `I63:178296;7253:${3465 + index};7253:${index === 0 ? '3461' : '3455'}`);

        if (width > 0) {
            const barFill = document.createElement('div');
            barFill.style.position = 'absolute';
            // Page-three bars 1-6 use var(--color-primary-dark) (#00658e), bar 0 and others use var(--color-primary) (#0472a8)
            barFill.style.backgroundColor = variant === "page-three" && index >= 1 && index <= 6 ? '#00658e' : 'var(--color-primary)';
            barFill.style.bottom = '0';
            barFill.style.height = '6px';
            barFill.style.left = '0';
            barFill.style.width = `${width}px`;
            barFill.setAttribute('data-name', 'Bar');
            barFill.setAttribute('data-node-id', variant === "page-three" && index >= 1 && index <= 6 ? `I63:178472;7253:${3465 + index};406:31867` : `I63:178296;7253:${3465 + index};7253:${index === 0 ? '3462' : '3456'}`);
            barTrack.appendChild(barFill);
        } else {
            const barEmpty = document.createElement('div');
            barEmpty.style.position = 'absolute';
            barEmpty.style.backgroundColor = 'var(--color-surface-container-highest)';
            barEmpty.style.bottom = '0';
            barEmpty.style.height = '6px';
            barEmpty.style.left = '0';
            barEmpty.style.width = index === 0 ? '100px' : '100%';
            barEmpty.setAttribute('data-name', 'Bar');
            barEmpty.setAttribute('data-node-id', variant === "page-three" && index >= 1 && index <= 6 ? `I63:178472;7253:${3465 + index};406:31867` : `I63:178296;7253:${3465 + index};7253:${index === 0 ? '3462' : '3456'}`);
            barTrack.appendChild(barEmpty);
        }

        // Add indicator line for completed pages (page-three bar 6, page-four bar 6, page-five bar 8)
        if ((variant === "page-three" && index === 6) || (variant === "page-four" && index === 6) || (variant === "page-five" && index === 8)) {
            const indicatorLine = document.createElement('div');
            indicatorLine.style.height = '0';
            indicatorLine.style.position = 'relative';
            indicatorLine.style.flexShrink = '0';
            indicatorLine.style.width = '100%';
            indicatorLine.setAttribute('data-node-id', variant === "page-three" ? `I63:178472;7253:${3465 + index};406:31868` : `I63:178296;7253:${3465 + index};7253:3463`);
            const indicatorSVG = document.createElement('div');
            indicatorSVG.style.position = 'absolute';
            indicatorSVG.style.bottom = '0';
            indicatorSVG.style.left = '0';
            indicatorSVG.style.right = '0';
            indicatorSVG.style.top = '-2px';
            // Page-three uses #00658e (primary-dark from Figma), others use var(--color-primary)
            indicatorSVG.style.borderBottom = variant === "page-three" ? '2px solid #00658e' : '2px solid var(--color-primary)';
            indicatorLine.appendChild(indicatorSVG);
            barContainer.appendChild(indicatorLine);
        }

        progressBarBg.appendChild(barTrack);
        progressBar.appendChild(progressBarBg);
        barContainer.appendChild(progressBar);
        container.appendChild(barContainer);
    });

    return container;
}

/**
 * Creates page-one content (initial page with intro and likert scales)
 */
function createPageOneContent(lessonTitle, estimatedTime) {
    const contentSections = document.createElement('div');
    contentSections.style.display = 'flex';
    contentSections.style.flexDirection = 'column';
    contentSections.style.gap = 'var(--size-section-gap-lg)'; // 24px
    contentSections.style.alignItems = 'flex-start';
    contentSections.style.maxWidth = '896px';
    contentSections.style.overflow = 'hidden';
    contentSections.style.position = 'relative';
    contentSections.style.flexShrink = '0';
    contentSections.style.width = '100%';
    contentSections.setAttribute('data-node-id', '63:178298');

    // Title Section
    const titleSection = document.createElement('div');
    titleSection.style.display = 'flex';
    titleSection.style.flexDirection = 'column';
    titleSection.style.alignItems = 'flex-start';
    titleSection.style.justifyContent = 'center';
    titleSection.style.position = 'relative';
    titleSection.style.flexShrink = '0';
    titleSection.style.width = '100%';
    titleSection.setAttribute('data-name', 'Title');
    titleSection.setAttribute('data-node-id', '63:178299');

    const title = document.createElement('div');
    title.style.fontFamily = 'var(--font-family-header)';
    title.style.fontSize = 'var(--font-size-h4)';
    title.style.fontWeight = 'var(--font-weight-semibold-2)';
    title.style.lineHeight = '1.333';
    title.style.color = 'var(--color-on-primary-container)';
    title.style.width = '100%';
    title.textContent = lessonTitle;
    titleSection.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.style.display = 'flex';
    subtitle.style.gap = 'var(--size-element-gap-sm)';
    subtitle.style.alignItems = 'center';
    subtitle.style.position = 'relative';
    subtitle.style.flexShrink = '0';
    subtitle.style.width = '100%';
    subtitle.setAttribute('data-name', 'Subtitle');
    subtitle.setAttribute('data-node-id', '63:178301');

    const clockIcon = document.createElement('i');
    clockIcon.className = 'far fa-clock';
    clockIcon.style.fontSize = 'var(--font-size-fa-h6-regular)';
    clockIcon.style.color = 'var(--color-on-primary-container)';
    subtitle.appendChild(clockIcon);

    const timeText = document.createElement('div');
    timeText.style.fontFamily = 'var(--font-family-header)';
    timeText.style.fontSize = 'var(--font-size-h6)';
    timeText.style.fontWeight = 'var(--font-weight-semibold-2)';
    timeText.style.lineHeight = '1.5';
    timeText.style.color = 'var(--color-on-surface-variant)';
    timeText.textContent = `Estimate Time: ${estimatedTime}`;
    subtitle.appendChild(timeText);
    titleSection.appendChild(subtitle);
    contentSections.appendChild(titleSection);

    // Content Section
    const contentSection = document.createElement('div');
    contentSection.style.display = 'flex';
    contentSection.style.flexDirection = 'column';
    contentSection.style.gap = 'var(--size-section-gap-lg)';
    contentSection.style.alignItems = 'flex-start';
    contentSection.style.justifyContent = 'center';
    contentSection.style.position = 'relative';
    contentSection.style.flexShrink = '0';
    contentSection.style.width = '100%';
    contentSection.setAttribute('data-name', 'Content');
    contentSection.setAttribute('data-node-id', '63:178304');

    // Image - Figma: node-id=63-178306
    const imageContainer = document.createElement('div');
    imageContainer.style.boxSizing = 'border-box';
    imageContainer.style.display = 'flex';
    imageContainer.style.flexDirection = 'column';
    imageContainer.style.height = '208px';
    imageContainer.style.alignItems = 'center';
    imageContainer.style.justifyContent = 'center';
    imageContainer.style.padding = '0 var(--size-section-pad-x-md)'; // 24px
    imageContainer.style.position = 'relative';
    imageContainer.style.flexShrink = '0';
    imageContainer.style.width = '100%';
    imageContainer.setAttribute('data-node-id', '63:178305');
    
    const imageWrapper = document.createElement('div');
    imageWrapper.style.height = '159.654px';
    imageWrapper.style.position = 'relative';
    imageWrapper.style.flexShrink = '0';
    imageWrapper.style.width = '200px';
    imageWrapper.setAttribute('data-name', 'image 12');
    imageWrapper.setAttribute('data-node-id', '63:178306');
    
    const image = document.createElement('img');
    image.src = 'http://localhost:3845/assets/735e5e5eb60dd6430d7cbe12333e91485b70612b.png';
    image.alt = 'Lesson illustration';
    image.style.position = 'absolute';
    image.style.inset = '0';
    image.style.maxWidth = 'none';
    image.style.objectFit = 'cover';
    image.style.objectPosition = '50% 50%';
    image.style.pointerEvents = 'none';
    image.style.width = '100%';
    image.style.height = '100%';
    imageWrapper.appendChild(image);
    imageContainer.appendChild(imageWrapper);
    contentSection.appendChild(imageContainer);

    // Text content
    const textContainer = document.createElement('div');
    textContainer.style.boxSizing = 'border-box';
    textContainer.style.display = 'flex';
    textContainer.style.flexDirection = 'column';
    textContainer.style.alignItems = 'center';
    textContainer.style.justifyContent = 'center';
    textContainer.style.padding = '0 var(--size-card-pad-x-sm)'; // 16px
    textContainer.style.position = 'relative';
    textContainer.style.flexShrink = '0';
    textContainer.style.width = '100%';
    const textContent = document.createElement('div');
    textContent.style.fontFamily = 'var(--font-family-body)';
    textContent.style.fontSize = 'var(--font-size-body1)';
    textContent.style.fontWeight = 'var(--font-weight-normal)';
    textContent.style.lineHeight = '1.5';
    textContent.style.color = 'var(--color-on-surface-variant)';
    textContent.style.width = '100%';
    textContent.innerHTML = `
      <p style="line-height:1.5; margin-bottom:0;">Praising students for working hard and putting forth effort is a great way to increase student motivation. When the learning gets tough, giving effective praise is a powerful strategy to encourage students to keep going.</p>
      <p style="line-height:1.5; margin-bottom:0;">&nbsp;</p>
      <p style="line-height:1.5; margin-bottom:0;">Upon completion you will be able to:</p>
      <ul style="list-style-type:disc;">
        <li style="margin-bottom:0; margin-left:24px;"><span style="line-height:1.5;">Explain how to increase student motivation by giving praise</span></li>
        <li style="margin-bottom:0; margin-left:24px;"><span style="line-height:1.5;">Identify features of effective praise</span></li>
        <li style="margin-left:24px;"><span style="line-height:1.5;">Apply strategies by responding to students through praise</span></li>
      </ul>
    `;
    textContainer.appendChild(textContent);
    contentSection.appendChild(textContainer);
    contentSections.appendChild(contentSection);

    // Question 1: Likert Scale
    const question1 = createQuestionSection(
        'How confident are you in your knowledge of this topic?',
        'Not at all confident',
        'Extremely confident'
    );
    contentSections.appendChild(question1);

    // Question 2: Likert Scale
    const question2 = createQuestionSection(
        'How would you describe your tutoring experience and skills?',
        'Beginner Tutor',
        'Expert Tutor'
    );
    contentSections.appendChild(question2);

    // Actions
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.flexDirection = 'column';
    actions.style.gap = 'var(--size-element-gap-lg)';
    actions.style.alignItems = 'flex-start';
    actions.style.position = 'relative';
    actions.style.flexShrink = '0';
    actions.style.width = '100%';
    actions.setAttribute('data-name', 'Actions');
    actions.setAttribute('data-node-id', '63:178353');

    const nextButton = PlusInterface.createButton({
        btnText: 'Next',
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: 'default',
        buttonOnClick: null
    });
    nextButton.style.opacity = '0.38';
    nextButton.style.flexShrink = '0';
    nextButton.setAttribute('data-name', 'Filled buttons');
    nextButton.setAttribute('data-node-id', '63:178354');
    actions.appendChild(nextButton);

    contentSections.appendChild(actions);

    return contentSections;
}

/**
 * Creates page-two content ("Research says..." with table)
 */
function createPageTwoContent(onPrevious = null, onNext = null) {
    const contentSections = document.createElement('div');
    contentSections.style.display = 'flex';
    contentSections.style.flexDirection = 'column';
    contentSections.style.gap = 'var(--size-section-gap-lg)'; // 24px
    contentSections.style.alignItems = 'flex-start';
    contentSections.style.maxWidth = '896px';
    contentSections.style.minHeight = '1032px'; // Use minHeight instead of fixed height
    contentSections.style.overflow = 'visible'; // Allow content to be visible
    contentSections.style.position = 'relative';
    contentSections.style.flexShrink = '0';
    contentSections.style.width = '100%';
    contentSections.setAttribute('data-node-id', '63:178402');

    // Title: "Research says..."
    const titleSection = document.createElement('div');
    titleSection.style.boxSizing = 'border-box';
    titleSection.style.display = 'flex';
    titleSection.style.flexDirection = 'column';
    titleSection.style.alignItems = 'flex-start';
    titleSection.style.justifyContent = 'center';
    titleSection.style.padding = '0 0 var(--size-element-pad-y-lg) 0';
    titleSection.style.position = 'relative';
    titleSection.style.flexShrink = '0';
    titleSection.style.width = '100%';
    titleSection.setAttribute('data-name', 'Title');
    titleSection.setAttribute('data-node-id', '63:178403');

    const title = document.createElement('div');
    title.style.fontFamily = 'var(--font-family-header)';
    title.style.fontSize = 'var(--font-size-h4)';
    title.style.fontWeight = 'var(--font-weight-semibold-2)';
    title.style.lineHeight = '1.333';
    title.style.color = 'var(--color-on-primary-container)';
    title.style.width = '100%';
    title.textContent = 'Research says...';
    titleSection.appendChild(title);
    contentSections.appendChild(titleSection);

    // Research text
    const researchText = document.createElement('div');
    researchText.style.fontFamily = 'var(--font-family-body)';
    researchText.style.fontSize = 'var(--font-size-body1)';
    researchText.style.fontWeight = 'var(--font-weight-normal)';
    researchText.style.lineHeight = '1.5';
    researchText.style.color = 'var(--color-on-surface-variant)';
    researchText.style.width = '703.98px';
    researchText.textContent = 'Research supports praising students when they achieve a goal, demonstrate perseverance, or are exhibiting a desired behavior. For this reason, an example of the most desired response is:';
    contentSections.appendChild(researchText);

    // Example quote card
    const quoteCard = document.createElement('div');
    quoteCard.style.boxSizing = 'border-box';
    quoteCard.style.display = 'flex';
    quoteCard.style.flexDirection = 'column';
    quoteCard.style.gap = 'var(--size-element-gap-sm)'; // 8px
    quoteCard.style.alignItems = 'flex-start';
    quoteCard.style.padding = 'var(--size-section-pad-x-md)';
    quoteCard.style.position = 'relative';
    quoteCard.style.flexShrink = '0';
    quoteCard.style.width = '100%';
    const quoteCardInner = document.createElement('div');
    quoteCardInner.style.backgroundColor = 'var(--color-primary-state-08)';
    quoteCardInner.style.boxSizing = 'border-box';
    quoteCardInner.style.display = 'flex';
    quoteCardInner.style.gap = 'var(--size-element-gap-sm)'; // 8px
    quoteCardInner.style.alignItems = 'flex-start';
    quoteCardInner.style.padding = 'var(--size-card-pad-x-sm)'; // 16px
    quoteCardInner.style.position = 'relative';
    quoteCardInner.style.borderRadius = '16px';
    quoteCardInner.style.flexShrink = '0';
    quoteCardInner.style.width = '100%';
    const quoteText = document.createElement('div');
    quoteText.style.fontFamily = 'var(--font-family-body)';
    quoteText.style.fontSize = 'var(--font-size-body1)';
    quoteText.style.fontWeight = 'var(--font-weight-normal)';
    quoteText.style.lineHeight = '1.5';
    quoteText.style.color = 'var(--color-on-surface-variant)';
    quoteText.style.flexGrow = '1';
    quoteText.textContent = '"Kevin, fantastic job solving the math problem. I\'m impressed with your hard work in persevering through the problem!"';
    quoteCardInner.appendChild(quoteText);
    quoteCard.appendChild(quoteCardInner);
    contentSections.appendChild(quoteCard);

    // Research details text
    const researchDetails = document.createElement('div');
    researchDetails.style.fontFamily = 'var(--font-family-body)';
    researchDetails.style.fontSize = 'var(--font-size-body1)';
    researchDetails.style.fontWeight = 'var(--font-weight-normal)';
    researchDetails.style.lineHeight = '1.5';
    researchDetails.style.color = 'var(--color-on-surface-variant)';
    researchDetails.style.minWidth = '100%';
    researchDetails.innerHTML = `
      <p style="margin-bottom:0;">Studies show praise is most effective when it has certain qualities.</p>
      <p style="margin-bottom:0;">Praise should be:</p>
      <p style="margin-bottom:0;">&nbsp;</p>
      <p style="margin-bottom:0;">perceived as sincere, earned, and truthful.</p>
      <p style="margin-bottom:0;">specific by giving details of what the student did well.</p>
      <p style="margin-bottom:0;">immediate with praise given right after the student action.</p>
      <p style="margin-bottom:0;">authentic and is not repeated often, such as "great job" which loses meaning and becomes predictable.</p>
      <p style="margin-bottom:0;">focused on the learning process, not ability</p>
      <p style="margin-bottom:0;">&nbsp;</p>
      <p>(AJTutoring.com, 2022)</p>
    `;
    contentSections.appendChild(researchDetails);

    // Additional research text paragraphs
    const researchText2 = document.createElement('div');
    researchText2.style.fontFamily = 'var(--font-family-body)';
    researchText2.style.fontSize = 'var(--font-size-body1)';
    researchText2.style.fontWeight = 'var(--font-weight-normal)';
    researchText2.style.lineHeight = '1.5';
    researchText2.style.color = 'var(--color-on-surface-variant)';
    researchText2.style.minWidth = '100%';
    researchText2.textContent = 'Giving students consistent, specific praise when they perform in a desired manner is important to motivate students and increase their engagement to learn. Expert tutors and research suggest giving praise that focuses on the process and not merely student ability. Process-focused praise recognizes students for putting forth effort and persevering through the learning process instead of focusing on whether a student got the problem correct or pure ability. Process-focused praise motivates students to learn and fosters a growth mindset (Dweck, 2008).';
    contentSections.appendChild(researchText2);

    const researchText3 = document.createElement('div');
    researchText3.style.fontFamily = 'var(--font-family-body)';
    researchText3.style.fontSize = 'var(--font-size-body1)';
    researchText3.style.fontWeight = 'var(--font-weight-normal)';
    researchText3.style.lineHeight = '1.5';
    researchText3.style.color = 'var(--color-on-surface-variant)';
    researchText3.style.minWidth = '100%';
    researchText3.textContent = 'Some common examples of ability-focused praise are shown on the left in the table below with a corresponding more effective process-focused praise shown on the right. It is important to note that praise can be given throughout the learning process, not only upon getting the correct answer or finishing a problem or assignment. Oftentimes, encouragement and praise can be given while the student is going through the learning process to increase motivation and maintain engagement.';
    contentSections.appendChild(researchText3);

    // Comparison Table - Wrapper for horizontal scrolling
    const tableWrapper = document.createElement('div');
    tableWrapper.style.width = '100%';
    tableWrapper.style.overflowX = 'auto';
    tableWrapper.style.overflowY = 'hidden';
    tableWrapper.style.scrollBehavior = 'smooth';
    tableWrapper.style.webkitOverflowScrolling = 'touch';
    tableWrapper.setAttribute('data-name', 'Table Wrapper');
    
    const tableContainer = document.createElement('div');
    tableContainer.style.boxSizing = 'border-box';
    tableContainer.style.display = 'flex';
    tableContainer.style.flexDirection = 'column';
    tableContainer.style.gap = '2px'; // Very small gap for table cells - specific design requirement
    tableContainer.style.alignItems = 'flex-start';
    tableContainer.style.padding = '0 0 var(--size-surface-pad-x) 0';
    tableContainer.style.position = 'relative';
    tableContainer.style.flexShrink = '0';
    tableContainer.style.minWidth = '600px'; // Ensure table can be wider than container
    tableContainer.style.width = '100%';
    tableContainer.setAttribute('data-name', 'Title');
    tableContainer.setAttribute('data-node-id', '63:178412');

    // Table header row
    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.gap = '2px'; // Very small gap for table cells - specific design requirement
    headerRow.style.alignItems = 'flex-start';
    headerRow.style.position = 'relative';
    headerRow.style.flexShrink = '0';
    headerRow.style.minWidth = '600px'; // Match table container minWidth
    headerRow.style.width = '100%';
    const headerCell1 = createTableCell('Ability-Focused Praise', true, '220px');
    const headerCell2 = createTableCell('Process-Focused Praise', true);
    headerRow.appendChild(headerCell1);
    headerRow.appendChild(headerCell2);
    tableContainer.appendChild(headerRow);

    // Table data rows
    const tableData = [
        ['"Great job! You are a genius!"', '"Great job on solving that math problem. You persevered through solving by using a new math concept."'],
        ['"Fantastic! You are so talented!"', '"I love how you tried very hard and focused on the problem!"'],
        ['"You are so smart and almost got the problem correct."', '"You are almost there! I am proud of how you are persevering through and striving to solve the problem. Keep going!']
    ];

    tableData.forEach((rowData) => {
        const dataRow = document.createElement('div');
        dataRow.style.display = 'flex';
        dataRow.style.gap = '2px'; // Very small gap for table cells - specific design requirement
        dataRow.style.alignItems = 'flex-start';
        dataRow.style.position = 'relative';
        dataRow.style.flexShrink = '0';
        dataRow.style.minWidth = '600px'; // Match table container minWidth
        dataRow.style.width = '100%';
        const dataCell1 = createTableCell(rowData[0], false, '220px');
        const dataCell2 = createTableCell(rowData[1], false);
        dataRow.appendChild(dataCell1);
        dataRow.appendChild(dataCell2);
        tableContainer.appendChild(dataRow);
    });

    tableWrapper.appendChild(tableContainer);
    contentSections.appendChild(tableWrapper);

    // Actions: Previous/Next buttons
    const actions = document.createElement('div');
    actions.style.boxSizing = 'border-box';
    actions.style.display = 'flex';
    actions.style.alignItems = 'flex-start';
    actions.style.justifyContent = 'space-between';
    actions.style.padding = 'var(--size-section-pad-x-md) 0 0 0';
    actions.style.position = 'relative';
    actions.style.flexShrink = '0';
    actions.style.width = '100%';
    actions.setAttribute('data-node-id', '63:178425');

    const previousButton = PlusInterface.createButton({
        btnText: 'Previous',
        btnStyle: 'primary',
        btnFill: 'outline',
        btnSize: 'large',
        buttonOnClick: onPrevious
    });
    previousButton.setAttribute('data-name', 'Outlined buttons');
    previousButton.setAttribute('data-node-id', '63:178426');
    actions.appendChild(previousButton);

    const nextButton = PlusInterface.createButton({
        btnText: 'Next',
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: 'large',
        buttonOnClick: onNext
    });
    nextButton.setAttribute('data-name', 'Filled buttons');
    nextButton.setAttribute('data-node-id', '63:178427');
    actions.appendChild(nextButton);

    contentSections.appendChild(actions);

    return contentSections;
}

/**
 * Helper: Creates table cell
 */
function createTableCell(text, isHeader = false, width = null) {
    const cell = document.createElement('div');
    cell.style.backgroundColor = isHeader ? 'var(--color-primary-container)' : 'var(--color-surface-variant)';
    cell.style.display = 'flex';
    cell.style.flexGrow = isHeader && width ? '0' : '1';
    cell.style.alignItems = 'flex-start';
    cell.style.position = 'relative';
    cell.style.flexShrink = '0';
    if (width) {
        cell.style.width = width;
    }
    const cellInner = document.createElement('div');
    cellInner.style.boxSizing = 'border-box';
    cellInner.style.display = 'flex';
    cellInner.style.flexGrow = '1';
    cellInner.style.alignItems = 'center';
    cellInner.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
    const cellText = document.createElement('div');
    cellText.style.fontFamily = 'var(--font-family-body)';
    cellText.style.fontSize = isHeader ? 'var(--font-size-body2)' : 'var(--font-size-body2)';
    cellText.style.fontWeight = isHeader ? 'var(--font-weight-semibold-1)' : 'var(--font-weight-normal)';
    cellText.style.lineHeight = '1.571';
    cellText.style.color = isHeader ? 'var(--color-on-primary-container)' : 'var(--color-on-surface-variant)';
    cellText.style.flexGrow = '1';
    cellText.textContent = text;
    cellInner.appendChild(cellText);
    cell.appendChild(cellInner);
    return cell;
}

/**
 * Creates page-three content ("Conclusion & Feedback")
 */
function createPageThreeContent(onPrevious = null, onNext = null) {
    const contentSections = document.createElement('div');
    contentSections.style.display = 'flex';
    contentSections.style.flexDirection = 'column';
    contentSections.style.gap = 'var(--size-section-gap-lg)';
    contentSections.style.alignItems = 'flex-start';
    contentSections.style.maxWidth = '896px';
    contentSections.style.overflow = 'hidden';
    contentSections.style.position = 'relative';
    contentSections.style.flexShrink = '0';
    contentSections.style.width = '100%';
    contentSections.setAttribute('data-node-id', '63:178471');

    // Title: "Conclusion & Feedback"
    const titleSection = document.createElement('div');
    titleSection.style.boxSizing = 'border-box';
    titleSection.style.display = 'flex';
    titleSection.style.flexDirection = 'column';
    titleSection.style.alignItems = 'flex-start';
    titleSection.style.justifyContent = 'center';
    titleSection.style.padding = '0 0 var(--size-element-pad-y-lg) 0';
    titleSection.style.position = 'relative';
    titleSection.style.flexShrink = '0';
    titleSection.style.width = '100%';
    titleSection.setAttribute('data-name', 'Title');
    titleSection.setAttribute('data-node-id', '63:178474');

    const title = document.createElement('div');
    title.style.fontFamily = 'var(--font-family-header)';
    title.style.fontSize = 'var(--font-size-h4)';
    title.style.fontWeight = 'var(--font-weight-semibold-2)';
    title.style.lineHeight = '1.333';
    title.style.color = 'var(--color-on-primary-container)';
    title.style.width = '100%';
    title.textContent = 'Conclusion & Feedback';
    titleSection.appendChild(title);
    contentSections.appendChild(titleSection);

    // Conclusion text
    const conclusionText = document.createElement('div');
    conclusionText.style.fontFamily = 'var(--font-family-body)';
    conclusionText.style.fontSize = 'var(--font-size-body1)';
    conclusionText.style.fontWeight = 'var(--font-weight-normal)';
    conclusionText.style.lineHeight = '1.5';
    conclusionText.style.color = 'var(--color-on-surface-variant)';
    conclusionText.style.width = '100%';
    conclusionText.textContent = 'Experts believe that the best approach is:';
    contentSections.appendChild(conclusionText);

    // Example quote card
    const quoteCard = document.createElement('div');
    quoteCard.style.boxSizing = 'border-box';
    quoteCard.style.display = 'flex';
    quoteCard.style.flexDirection = 'column';
    quoteCard.style.gap = 'var(--size-section-gap-sm)';
    quoteCard.style.alignItems = 'flex-start';
    quoteCard.style.padding = '0 var(--size-section-pad-x-md)';
    quoteCard.style.position = 'relative';
    quoteCard.style.flexShrink = '0';
    quoteCard.style.width = '100%';
    const quoteCardInner = document.createElement('div');
    quoteCardInner.style.backgroundColor = 'var(--color-primary-state-08)';
    quoteCardInner.style.boxSizing = 'border-box';
    quoteCardInner.style.display = 'flex';
    quoteCardInner.style.gap = 'var(--size-element-gap-sm)'; // 8px
    quoteCardInner.style.alignItems = 'flex-start';
    quoteCardInner.style.padding = 'var(--size-card-pad-x-sm)'; // 16px
    quoteCardInner.style.position = 'relative';
    quoteCardInner.style.borderRadius = '16px';
    quoteCardInner.style.flexShrink = '0';
    quoteCardInner.style.width = '100%';
    const quoteText = document.createElement('div');
    quoteText.style.fontFamily = 'var(--font-family-body)';
    quoteText.style.fontSize = 'var(--font-size-body1)';
    quoteText.style.fontWeight = 'var(--font-weight-normal)';
    quoteText.style.lineHeight = '1.5';
    quoteText.style.color = 'var(--color-on-surface-variant)';
    quoteText.style.flexGrow = '1';
    quoteText.textContent = '"Carla, you are doing a great job in continuing on the assignment. Your understanding is improving as we work through it."';
    quoteCardInner.appendChild(quoteText);
    quoteCard.appendChild(quoteCardInner);
    contentSections.appendChild(quoteCard);

    // Conclusion details
    const conclusionDetails = document.createElement('div');
    conclusionDetails.style.fontFamily = 'var(--font-family-body)';
    conclusionDetails.style.fontSize = 'var(--font-size-body1)';
    conclusionDetails.style.fontWeight = 'var(--font-weight-normal)';
    conclusionDetails.style.lineHeight = '1.5';
    conclusionDetails.style.color = 'var(--color-on-surface-variant)';
    conclusionDetails.style.width = '100%';
    conclusionDetails.innerHTML = `
      <p style="margin-bottom:0;">This approach recognizes Carla's effort towards the math assignment and is process-focused.</p>
      <p style="margin-bottom:0;">&nbsp;</p>
      <p>For more information about how to give effective praise to increase student motivation, check out the following resources. They can also be accessed from within the PLUS app.</p>
    `;
    contentSections.appendChild(conclusionDetails);

    // Feedback Section
    const feedbackTitle = document.createElement('div');
    feedbackTitle.style.boxSizing = 'border-box';
    feedbackTitle.style.display = 'flex';
    feedbackTitle.style.flexDirection = 'column';
    feedbackTitle.style.alignItems = 'flex-start';
    feedbackTitle.style.justifyContent = 'center';
    feedbackTitle.style.padding = '0 0 var(--size-element-pad-y-lg) 0';
    feedbackTitle.style.position = 'relative';
    feedbackTitle.style.flexShrink = '0';
    feedbackTitle.style.width = '100%';
    feedbackTitle.setAttribute('data-name', 'Title');
    feedbackTitle.setAttribute('data-node-id', '63:178481');
    const feedbackTitleText = document.createElement('div');
    feedbackTitleText.style.fontFamily = 'var(--font-family-header)';
    feedbackTitleText.style.fontSize = 'var(--font-size-h4)';
    feedbackTitleText.style.fontWeight = 'var(--font-weight-semibold-2)';
    feedbackTitleText.style.lineHeight = '1.333';
    feedbackTitleText.style.color = 'var(--color-on-primary-container)';
    feedbackTitleText.style.width = '100%';
    feedbackTitleText.textContent = 'Feedback';
    feedbackTitle.appendChild(feedbackTitleText);
    contentSections.appendChild(feedbackTitle);

    // Feedback textarea placeholder
    const feedbackText = document.createElement('div');
    feedbackText.style.fontFamily = 'var(--font-family-body)';
    feedbackText.style.fontSize = 'var(--font-size-body1)';
    feedbackText.style.fontWeight = 'var(--font-weight-normal)';
    feedbackText.style.lineHeight = '1.5';
    feedbackText.style.color = 'var(--color-on-surface-variant)';
    feedbackText.style.width = '100%';
    feedbackText.innerHTML = `
      <span>Please provide any feedback or comments related to this training module.</span>
      <br aria-hidden="true" />
      <br aria-hidden="true" />
      <span>For more information regarding how to give effective praise, check out the resources below:</span>
      <br aria-hidden="true" />
      <span style="color: var(--color-primary); text-decoration: underline;">The Power of Effective Praise</span>
      <br aria-hidden="true" />
      <span style="color: var(--color-primary); text-decoration: underline;">How to Give Effective Praise in Tutoring</span>
      <br aria-hidden="true" />
      <span style="color: var(--color-primary); text-decoration: underline;">Tutoring Tips: How to Give Meaningful Praise</span>
    `;
    contentSections.appendChild(feedbackText);

    // References Section
    const referencesTitle = document.createElement('div');
    referencesTitle.style.boxSizing = 'border-box';
    referencesTitle.style.display = 'flex';
    referencesTitle.style.flexDirection = 'column';
    referencesTitle.style.alignItems = 'flex-start';
    referencesTitle.style.justifyContent = 'center';
    referencesTitle.style.padding = '0 0 var(--size-element-pad-y-lg) 0';
    referencesTitle.style.position = 'relative';
    referencesTitle.style.flexShrink = '0';
    referencesTitle.style.width = '100%';
    referencesTitle.setAttribute('data-name', 'Title');
    referencesTitle.setAttribute('data-node-id', '63:178484');
    const referencesTitleText = document.createElement('div');
    referencesTitleText.style.fontFamily = 'var(--font-family-header)';
    referencesTitleText.style.fontSize = 'var(--font-size-h4)';
    referencesTitleText.style.fontWeight = 'var(--font-weight-semibold-2)';
    referencesTitleText.style.lineHeight = '1.333';
    referencesTitleText.style.color = 'var(--color-on-primary-container)';
    referencesTitleText.style.width = '100%';
    referencesTitleText.textContent = 'References';
    referencesTitle.appendChild(referencesTitleText);
    contentSections.appendChild(referencesTitle);

    // References text
    const referencesText = document.createElement('div');
    referencesText.style.fontFamily = 'var(--font-family-body)';
    referencesText.style.fontSize = 'var(--font-size-body1)';
    referencesText.style.fontWeight = 'var(--font-weight-normal)';
    referencesText.style.lineHeight = '1.5';
    referencesText.style.color = 'var(--color-on-surface-variant)';
    referencesText.style.width = '100%';
    referencesText.innerHTML = `
      <p style="margin-bottom:0;"><span>AJ Tutoring. (2022). How to Give Effective Praise. Retrieved from </span><span style="color: var(--color-primary); text-decoration: underline;">https://www.ajtutoring.com/blog/effective-praise/</span></p>
      <p style="margin-bottom:0;">&nbsp;</p>
      <p>Dweck, C. S. (2008). Mindset: The new psychology of success. Random House.</p>
    `;
    contentSections.appendChild(referencesText);

    // Actions: Previous/Next buttons
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.alignItems = 'center';
    actions.style.justifyContent = 'space-between';
    actions.style.position = 'relative';
    actions.style.flexShrink = '0';
    actions.style.width = '100%';
    actions.setAttribute('data-node-id', '63:178487');

    const previousButton = PlusInterface.createButton({
        btnText: 'Previous',
        btnStyle: 'primary',
        btnFill: 'outline',
        btnSize: 'default',
        buttonOnClick: onPrevious
    });
    previousButton.setAttribute('data-name', 'Outlined buttons');
    previousButton.setAttribute('data-node-id', '63:178488');
    actions.appendChild(previousButton);

    const nextButton = PlusInterface.createButton({
        btnText: 'Next',
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: 'default',
        buttonOnClick: onNext
    });
    nextButton.setAttribute('data-name', 'Filled buttons');
    nextButton.setAttribute('data-node-id', '63:178489');
    actions.appendChild(nextButton);

    contentSections.appendChild(actions);

    return contentSections;
}

/**
 * Creates page-four content ("Scenario 2" with questions)
 */
function createPageFourContent(onPrevious = null, onNext = null) {
    const contentSections = document.createElement('div');
    contentSections.style.display = 'flex';
    contentSections.style.flexDirection = 'column';
    contentSections.style.gap = 'var(--size-section-gap-lg)'; // 24px
    contentSections.style.alignItems = 'flex-start';
    contentSections.style.maxWidth = '896px';
    contentSections.style.overflow = 'hidden';
    contentSections.style.position = 'relative';
    contentSections.style.flexShrink = '0';
    contentSections.style.width = '100%';
    contentSections.setAttribute('data-node-id', '63:178434');

    // Title: "Scenario 2"
    const titleSection = document.createElement('div');
    titleSection.style.boxSizing = 'border-box';
    titleSection.style.display = 'flex';
    titleSection.style.flexDirection = 'column';
    titleSection.style.alignItems = 'flex-start';
    titleSection.style.justifyContent = 'center';
    titleSection.style.padding = '0 0 var(--size-element-gap-sm) 0';
    titleSection.style.position = 'relative';
    titleSection.style.flexShrink = '0';
    titleSection.style.width = '100%';
    titleSection.setAttribute('data-name', 'Title');
    titleSection.setAttribute('data-node-id', '63:178437');

    const title = document.createElement('div');
    title.style.fontFamily = 'var(--font-family-header)';
    title.style.fontSize = 'var(--font-size-h4)';
    title.style.fontWeight = 'var(--font-weight-semibold-2)';
    title.style.lineHeight = '1.333';
    title.style.color = 'var(--color-on-primary-container)';
    title.style.width = '100%';
    title.textContent = 'Scenario 2';
    titleSection.appendChild(title);
    contentSections.appendChild(titleSection);

    // Scenario description
    const scenarioText = document.createElement('div');
    scenarioText.style.fontFamily = 'var(--font-family-body)';
    scenarioText.style.fontSize = 'var(--font-size-body1)';
    scenarioText.style.fontWeight = 'var(--font-weight-normal)';
    scenarioText.style.lineHeight = '1.5';
    scenarioText.style.color = 'var(--color-on-surface-variant)';
    scenarioText.style.width = '100%';
    scenarioText.textContent = 'You are tutoring a student named Carla, who came to you for help with solving a story problem from her algebra homework. As her tutor, you are providing feedback and asking Carla prompting questions to help her solve the word problem. You are trying to encourage her to continue trying to solve the problem.';
    contentSections.appendChild(scenarioText);

    // Image - Figma: node-id=63-178441
    const imageContainer = document.createElement('div');
    imageContainer.style.boxSizing = 'border-box';
    imageContainer.style.display = 'flex';
    imageContainer.style.flexDirection = 'column';
    imageContainer.style.gap = 'var(--size-section-gap-sm)';
    imageContainer.style.alignItems = 'center';
    imageContainer.style.justifyContent = 'center';
    imageContainer.style.padding = '0 var(--size-section-pad-x-sm)';
    imageContainer.style.position = 'relative';
    imageContainer.style.flexShrink = '0';
    imageContainer.style.width = '100%';
    imageContainer.setAttribute('data-node-id', '63:178440');
    
    const imageWrapper = document.createElement('div');
    imageWrapper.style.height = '341px';
    imageWrapper.style.position = 'relative';
    imageWrapper.style.flexShrink = '0';
    imageWrapper.style.width = '227px';
    imageWrapper.setAttribute('data-name', 'image 11');
    imageWrapper.setAttribute('data-node-id', '63:178441');
    
    const image = document.createElement('img');
    image.src = 'http://localhost:3845/assets/a7278a7bb30d120c76047ba4aba407d3288e4d37.png';
    image.alt = 'Scenario illustration';
    image.style.position = 'absolute';
    image.style.inset = '0';
    image.style.maxWidth = 'none';
    image.style.objectFit = 'cover';
    image.style.objectPosition = '50% 50%';
    image.style.pointerEvents = 'none';
    image.style.width = '100%';
    image.style.height = '100%';
    imageWrapper.appendChild(image);
    imageContainer.appendChild(imageWrapper);
    contentSections.appendChild(imageContainer);

    // Question 7: Textarea
    const question7 = createTextareaQuestion(
        '7. What exactly would you say to Carla to provide effective praise that will increase her motivation to complete her math work and increase engagement?',
        '63:178442'
    );
    contentSections.appendChild(question7);

    // Question 8: Radio buttons
    const question8 = createRadioQuestion(
        '8. Which of the following strategies below do you think would best support and increase Carla\'s motivation to complete her assignment and increase engagement?',
        'I would say to the student:',
        [
            '"Carla, we really need to continue this assignment. You can\'t quit on me now. Keep going!"',
            '"Carla, you are doing a great job in continuing on the assignment. Your understanding is improving as we work through it."',
            '"Carla, you are doing a fantastic job! Don\'t quit like some of my other students do when they have assignments."',
            '"Carla, you are the best student! I know you can finish this assignment as you are the smartest student I work with."'
        ],
        '63:178445'
    );
    contentSections.appendChild(question8);

    // Question 9: Textarea
    const question9 = createTextareaQuestion(
        '9. Why do you think the approach you selected in the above question will best support and increase Carla\'s motivation to complete her math work and increase engagement?',
        '63:178452'
    );
    contentSections.appendChild(question9);

    // Question 10: Radio buttons
    const question10 = createRadioQuestion(
        '10. Which of the following statements aligns with the rationale you chose and explained in the previous two questions?',
        '',
        [
            'When you provide encouragement and praise to students while working to solve problems, you are emphasizing to students that they can learn.',
            'When you praise a student by telling them they are smart you are providing a boost of confidence and increasing their self-esteem. This encourages students to work hard.',
            'As a tutor, when you tell a student they are smarter than other students you are encouraging the student to continue to work hard and motivates them to learn.',
            'When you praise a student for what they did right, it is crucial that tutors point out exactly what the students did wrong so they do not do it again.'
        ],
        '63:178455'
    );
    contentSections.appendChild(question10);

    // Actions: Previous/Next buttons
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.alignItems = 'center';
    actions.style.justifyContent = 'space-between';
    actions.style.position = 'relative';
    actions.style.flexShrink = '0';
    actions.style.width = '100%';
    actions.setAttribute('data-node-id', '63:178462');

    const previousButton = PlusInterface.createButton({
        btnText: 'Previous',
        btnStyle: 'primary',
        btnFill: 'outline',
        btnSize: 'default',
        buttonOnClick: onPrevious
    });
    previousButton.setAttribute('data-name', 'Outlined buttons');
    previousButton.setAttribute('data-node-id', '63:178463');
    actions.appendChild(previousButton);

    const nextButton = PlusInterface.createButton({
        btnText: 'Next',
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: 'default',
        buttonOnClick: onNext
    });
    nextButton.setAttribute('data-name', 'Filled buttons');
    nextButton.setAttribute('data-node-id', '63:178464');
    actions.appendChild(nextButton);

    contentSections.appendChild(actions);

    return contentSections;
}

/**
 * Helper: Creates textarea question
 */
function createTextareaQuestion(questionText, nodeId) {
    const questionSection = document.createElement('div');
    questionSection.style.boxSizing = 'border-box';
    questionSection.style.display = 'flex';
    questionSection.style.flexDirection = 'column';
    questionSection.style.gap = 'var(--size-section-gap-md)';
    questionSection.style.alignItems = 'center';
    questionSection.style.justifyContent = 'center';
    questionSection.style.padding = '0 0 var(--size-section-pad-y-sm) 0';
    questionSection.style.position = 'relative';
    questionSection.style.flexShrink = '0';
    questionSection.style.width = '100%';
    questionSection.setAttribute('data-name', 'Title');
    questionSection.setAttribute('data-node-id', nodeId);

    const questionTitle = document.createElement('div');
    questionTitle.style.fontFamily = 'var(--font-family-body)';
    questionTitle.style.fontSize = 'var(--font-size-body1)';
    questionTitle.style.fontWeight = 'var(--font-weight-bold)';
    questionTitle.style.lineHeight = '1.5';
    questionTitle.style.color = 'var(--color-on-primary-container)';
    questionTitle.style.width = '100%';
    questionTitle.textContent = questionText;
    questionSection.appendChild(questionTitle);

    const textarea = document.createElement('textarea');
    textarea.style.backgroundColor = 'var(--color-surface)';
    textarea.style.border = '0.6px solid var(--color-outline-variant)';
    textarea.style.borderRadius = 'var(--size-element-radius-sm)';
    textarea.style.height = '100px';
    textarea.style.width = '100%';
    textarea.style.padding = 'var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)';
    textarea.style.fontFamily = 'var(--font-family-body)';
    textarea.style.fontSize = 'var(--font-size-body3)';
    textarea.style.fontWeight = 'var(--font-weight-normal)';
    textarea.style.lineHeight = '1.667';
    textarea.style.color = 'var(--color-on-surface-variant)';
    textarea.placeholder = 'Placeholder';
    textarea.setAttribute('data-name', 'Form Textarea');
    textarea.setAttribute('data-node-id', nodeId === '63:178442' ? '63:178444' : '63:178454');
    questionSection.appendChild(textarea);

    return questionSection;
}

/**
 * Helper: Creates radio question
 */
function createRadioQuestion(questionText, subtitleText, options, nodeId) {
    const questionSection = document.createElement('div');
    questionSection.style.boxSizing = 'border-box';
    questionSection.style.display = 'flex';
    questionSection.style.flexDirection = 'column';
    questionSection.style.gap = 'var(--size-section-gap-md)';
    questionSection.style.alignItems = 'center';
    questionSection.style.justifyContent = 'center';
    questionSection.style.padding = '0 0 var(--size-section-pad-y-sm) 0';
    questionSection.style.position = 'relative';
    questionSection.style.flexShrink = '0';
    questionSection.style.width = '100%';
    questionSection.setAttribute('data-name', 'Title');
    questionSection.setAttribute('data-node-id', nodeId);

    const questionTitle = document.createElement('div');
    questionTitle.style.fontFamily = 'var(--font-family-body)';
    questionTitle.style.fontSize = 'var(--font-size-body1)';
    questionTitle.style.fontWeight = 'var(--font-weight-bold)';
    questionTitle.style.lineHeight = '1.5';
    questionTitle.style.color = 'var(--color-on-primary-container)';
    questionTitle.style.width = '100%';
    questionTitle.innerHTML = subtitleText ? `<p style="margin-bottom:0;">${questionText}</p><p>${subtitleText}</p>` : `<p>${questionText}</p>`;
    questionSection.appendChild(questionTitle);

    const optionsContainer = document.createElement('div');
    optionsContainer.style.boxSizing = 'border-box';
    optionsContainer.style.display = 'flex';
    optionsContainer.style.flexDirection = 'column';
    optionsContainer.style.gap = 'var(--size-element-gap-sm)';
    optionsContainer.style.alignItems = 'flex-start';
    optionsContainer.style.justifyContent = 'center';
    optionsContainer.style.padding = '0 var(--size-section-pad-x-md)';
    optionsContainer.style.position = 'relative';
    optionsContainer.style.flexShrink = '0';
    optionsContainer.style.width = '100%';

    options.forEach((optionText, index) => {
        const radioOption = document.createElement('div');
        radioOption.style.display = 'flex';
        radioOption.style.gap = 'var(--size-element-gap-sm)';
        radioOption.style.alignItems = 'flex-start';
        radioOption.style.position = 'relative';
        radioOption.style.flexShrink = '0';
        radioOption.style.width = '100%';
        radioOption.setAttribute('data-name', 'Form Radio Button');
        radioOption.setAttribute('data-node-id', nodeId === '63:178445' ? `63:178${448 + index}` : `63:178${458 + index}`);

        const radioButton = document.createElement('div');
        radioButton.style.backgroundColor = 'var(--color-on-primary)';
        radioButton.style.border = '1px solid var(--color-primary)';
        radioButton.style.borderRadius = 'var(--size-element-radius-pill)';
        radioButton.style.width = 'var(--font-size-fa-body2-solid)'; // 12px
        radioButton.style.height = 'var(--font-size-fa-body2-solid)'; // 12px
        radioButton.style.flexShrink = '0';
        radioButton.style.position = 'relative';
        const radioDot = document.createElement('div');
        radioDot.style.position = 'absolute';
        // Inner dot: 12px container - 2px padding on each side = 8px
        // Inner dot: 12px container - 2px padding on each side = 8px
        radioDot.style.width = 'calc(var(--font-size-fa-body2-solid) - 4px)'; // 8px (2px padding * 2)
        radioDot.style.height = 'calc(var(--font-size-fa-body2-solid) - 4px)'; // 8px (2px padding * 2)
        radioDot.style.backgroundColor = 'var(--color-on-primary)';
        radioDot.style.borderRadius = '50%';
        radioDot.style.top = '50%';
        radioDot.style.left = '50%';
        radioDot.style.transform = 'translate(-50%, -50%)';
        radioButton.appendChild(radioDot);
        radioOption.appendChild(radioButton);

        const optionLabel = document.createElement('div');
        optionLabel.style.fontFamily = 'var(--font-family-body)';
        optionLabel.style.fontSize = 'var(--font-size-body1)';
        optionLabel.style.fontWeight = 'var(--font-weight-normal)';
        optionLabel.style.lineHeight = '1.5';
        optionLabel.style.color = 'var(--color-on-surface)';
        optionLabel.style.flexGrow = '1';
        optionLabel.textContent = optionText;
        radioOption.appendChild(optionLabel);

        optionsContainer.appendChild(radioOption);
    });

    questionSection.appendChild(optionsContainer);
    return questionSection;
}

/**
 * Creates page-five content ("Congratulations" completion page)
 */
function createPageFiveContent(onPrevious = null, onNext = null) {
    const contentSections = document.createElement('div');
    contentSections.style.display = 'flex';
    contentSections.style.flexDirection = 'column';
    contentSections.style.gap = 'var(--size-section-gap-md)'; // 16px
    contentSections.style.alignItems = 'flex-start';
    contentSections.style.maxWidth = '896px';
    contentSections.style.position = 'relative';
    contentSections.style.flexShrink = '0';
    contentSections.style.width = '100%';
    contentSections.setAttribute('data-node-id', '63:178361');

    // Congratulations title
    const congratsTitle = document.createElement('div');
    congratsTitle.style.boxSizing = 'border-box';
    congratsTitle.style.display = 'flex';
    congratsTitle.style.gap = 'var(--size-element-gap-sm)';
    congratsTitle.style.alignItems = 'center';
    congratsTitle.style.padding = '0 0 var(--size-element-gap-sm) 0';
    congratsTitle.style.position = 'relative';
    congratsTitle.style.flexShrink = '0';
    congratsTitle.style.width = '100%';
    congratsTitle.setAttribute('data-name', 'Title');
    congratsTitle.setAttribute('data-node-id', '63:178364');
    const congratsTitleText = document.createElement('div');
    congratsTitleText.style.fontFamily = 'var(--font-family-header)';
    congratsTitleText.style.fontSize = 'var(--font-size-h1)';
    congratsTitleText.style.fontWeight = 'var(--font-weight-bold)';
    congratsTitleText.style.lineHeight = '1.6';
    congratsTitleText.style.color = 'var(--color-on-primary-container)';
    congratsTitleText.style.textAlign = 'center';
    congratsTitleText.style.flexGrow = '1';
    congratsTitleText.textContent = 'Congratulations on finishing the Lesson!';
    congratsTitle.appendChild(congratsTitleText);
    contentSections.appendChild(congratsTitle);

    // Score display
    const scoreTitle = document.createElement('div');
    scoreTitle.style.boxSizing = 'border-box';
    scoreTitle.style.display = 'flex';
    scoreTitle.style.gap = 'var(--size-element-gap-sm)';
    scoreTitle.style.alignItems = 'center';
    scoreTitle.style.padding = '0 0 var(--size-element-pad-y-lg) 0';
    scoreTitle.style.position = 'relative';
    scoreTitle.style.flexShrink = '0';
    scoreTitle.style.width = '100%';
    scoreTitle.setAttribute('data-name', 'Title');
    scoreTitle.setAttribute('data-node-id', '63:178366');
    const scoreTitleText = document.createElement('div');
    scoreTitleText.style.fontFamily = 'var(--font-family-header)';
    scoreTitleText.style.fontSize = 'var(--font-size-h1)';
    scoreTitleText.style.fontWeight = 'var(--font-weight-bold)';
    scoreTitleText.style.lineHeight = '1.6';
    scoreTitleText.style.color = 'var(--color-on-primary-container)';
    scoreTitleText.style.textAlign = 'center';
    scoreTitleText.style.flexGrow = '1';
    scoreTitleText.innerHTML = '<p style="margin-bottom:0;">0/2</p><p>Answered Correctly</p>';
    scoreTitle.appendChild(scoreTitleText);
    contentSections.appendChild(scoreTitle);

    // Final Likert Scale
    const finalQuestion = document.createElement('div');
    finalQuestion.style.boxSizing = 'border-box';
    finalQuestion.style.display = 'flex';
    finalQuestion.style.flexDirection = 'column';
    finalQuestion.style.gap = 'var(--size-section-gap-md)';
    finalQuestion.style.alignItems = 'center';
    finalQuestion.style.justifyContent = 'center';
    finalQuestion.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    finalQuestion.style.position = 'relative';
    finalQuestion.style.flexShrink = '0';
    finalQuestion.style.width = '100%';
    finalQuestion.setAttribute('data-name', 'Title');
    finalQuestion.setAttribute('data-node-id', '63:178368');

    const finalQuestionTitle = document.createElement('div');
    finalQuestionTitle.style.fontFamily = 'var(--font-family-header)';
    finalQuestionTitle.style.fontSize = 'var(--font-size-h4)';
    finalQuestionTitle.style.fontWeight = 'var(--font-weight-semibold-2)';
    finalQuestionTitle.style.lineHeight = '1.333';
    finalQuestionTitle.style.color = 'var(--color-on-primary-container)';
    finalQuestionTitle.style.minWidth = '100%';
    finalQuestionTitle.textContent = 'Now that you\'ve completed the module, how confident are you in your knowledge of this topic?';
    finalQuestion.appendChild(finalQuestionTitle);

    const finalLikertScale = createLikertScale({
        leftLabel: 'Not at all confident',
        rightLabel: 'Extremely confident'
    });
    finalLikertScale.style.boxSizing = 'border-box';
    finalLikertScale.style.display = 'flex';
    finalLikertScale.style.gap = 'var(--size-element-gap-xs)'; // 4px
    finalLikertScale.style.alignItems = 'flex-start';
    finalLikertScale.style.padding = '0 var(--size-element-pad-y-sm)'; // 4px - using smallest available padding token
    finalLikertScale.setAttribute('data-name', 'Likert Scale');
    finalLikertScale.setAttribute('data-node-id', '63:178370');
    finalQuestion.appendChild(finalLikertScale);
    contentSections.appendChild(finalQuestion);

    // Actions: Previous/Next buttons
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.alignItems = 'center';
    actions.style.justifyContent = 'space-between';
    actions.style.position = 'relative';
    actions.style.flexShrink = '0';
    actions.style.width = '100%';
    actions.setAttribute('data-node-id', '63:178390');

    const previousButton = PlusInterface.createButton({
        btnText: 'Previous',
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: 'default',
        buttonOnClick: onPrevious
    });
    previousButton.setAttribute('data-name', 'Filled buttons');
    previousButton.setAttribute('data-node-id', '63:178391');
    actions.appendChild(previousButton);

    const nextButton = PlusInterface.createButton({
        btnText: 'Next',
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: 'default',
        buttonOnClick: onNext
    });
    nextButton.style.opacity = '0.38';
    nextButton.setAttribute('data-name', 'Filled buttons');
    nextButton.setAttribute('data-node-id', '63:178392');
    actions.appendChild(nextButton);

    contentSections.appendChild(actions);

    return contentSections;
}

/**
 * Creates question section with Likert Scale (for page-one)
 */
function createQuestionSection(question, leftLabel, rightLabel) {
    const questionSection = document.createElement('div');
    questionSection.style.boxSizing = 'border-box';
    questionSection.style.display = 'flex';
    questionSection.style.flexDirection = 'column';
    questionSection.style.gap = 'var(--size-section-gap-lg)';
    questionSection.style.alignItems = 'center';
    questionSection.style.justifyContent = 'center';
    questionSection.style.padding = 'var(--size-section-pad-y-sm) var(--size-section-pad-x-sm)';
    questionSection.style.position = 'relative';
    questionSection.style.flexShrink = '0';
    questionSection.style.width = '100%';
    questionSection.setAttribute('data-name', 'Title');
    questionSection.setAttribute('data-node-id', question.includes('confident') ? '63:178309' : '63:178331');

    const questionTitle = document.createElement('div');
    questionTitle.style.fontFamily = 'var(--font-family-header)';
    questionTitle.style.fontSize = 'var(--font-size-h4)';
    questionTitle.style.fontWeight = 'var(--font-weight-semibold-2)';
    questionTitle.style.lineHeight = '1.333';
    questionTitle.style.color = 'var(--color-on-primary-container)';
    questionTitle.style.minWidth = '100%';
    questionTitle.textContent = question;
    questionSection.appendChild(questionTitle);

    const likertScale = createLikertScale({ leftLabel, rightLabel });
    likertScale.style.boxSizing = 'border-box';
    likertScale.style.display = 'flex';
    likertScale.style.gap = 'var(--size-element-gap-xs)'; // 4px
    likertScale.style.alignItems = 'flex-start';
    likertScale.style.padding = '0 var(--size-element-pad-y-sm)'; // 4px - using smallest available padding token
    likertScale.style.position = 'relative';
    likertScale.style.flexShrink = '0';
    likertScale.setAttribute('data-name', 'Likert Scale');
    likertScale.setAttribute('data-node-id', question.includes('confident') ? '63:178330' : '63:178352');
    questionSection.appendChild(likertScale);

    return questionSection;
}

/**
 * Creates footnote (shared across all variants)
 */
function createFootnote(variant) {
    const footnote = document.createElement('div');
    footnote.style.boxSizing = 'border-box';
    footnote.style.display = 'flex';
    footnote.style.alignItems = 'center';
    footnote.style.justifyContent = 'space-between';
    footnote.style.padding = variant === "page-two" ? 'var(--size-section-pad-y-md) 0' : variant === "page-three" || variant === "page-four" ? 'var(--size-section-gap-lg) 0' : variant === "page-five" ? 'var(--size-section-gap-lg) 0' : 'var(--size-section-gap-lg) 0';
    footnote.style.position = 'relative';
    footnote.style.flexShrink = '0';
    footnote.style.width = '100%';
    footnote.setAttribute('data-name', 'Footnote');
    footnote.setAttribute('data-node-id', variant === "page-one" ? '63:178355' : variant === "page-two" ? '63:178428' : variant === "page-three" ? '63:178490' : variant === "page-four" ? '560:121404' : '63:178393');

    const footnoteText = document.createElement('div');
    footnoteText.style.display = 'flex';
    footnoteText.style.gap = 'var(--size-element-gap-xs)'; // 4px
    footnoteText.style.alignItems = 'center';
    footnoteText.style.position = 'relative';
    footnoteText.style.flexShrink = '0';
    if (variant === "page-two" || variant === "page-three" || variant === "page-four") {
        footnoteText.style.flexGrow = '1';
    }
    footnoteText.setAttribute('data-node-id', 'I63:178355;6631:4061');

    const copyrightText = document.createElement('p');
    copyrightText.style.fontFamily = 'var(--font-family-body)';
    copyrightText.style.fontSize = 'var(--font-size-body3)';
    copyrightText.style.fontWeight = 'var(--font-weight-normal)';
    copyrightText.style.lineHeight = '1.667';
    copyrightText.style.position = 'relative';
    copyrightText.style.flexShrink = '0';
    copyrightText.style.color = 'var(--color-on-surface)';
    copyrightText.style.whiteSpace = 'nowrap';
    if (variant === "page-two" || variant === "page-three" || variant === "page-four") {
        copyrightText.style.flexGrow = '1';
        copyrightText.style.textAlign = 'center';
    }
    copyrightText.textContent = 'v5.2.0 | Copyright © Carnegie Mellon University 2024 | Terms of Use';
    copyrightText.setAttribute('data-node-id', 'I63:178355;6631:4062');
    footnoteText.appendChild(copyrightText);
    footnote.appendChild(footnoteText);

    return footnote;
}

