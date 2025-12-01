/**
 * @fileoverview LessonCardItem component for Training Lessons specs
 * Lesson card with thumbnail, tags, title, status, and action buttons
 * Matches Figma design system specifications
 */

import { createAiIndicator } from '../Elements/AIIndicator.js';
import { createStaticBadgeSmart } from '../../../../components/StaticBadgeSmart/index.js';
import { PlusInterface } from '../../../../components/index.js';

/**
 * Creates a LessonCardItem component
 * @param {Object} options - Card configuration
 * @param {string} [options.lessonTitle="Lesson Title"] - Lesson title
 * @param {string} [options.lessonDescription="Lesson Description"] - Lesson description for thumbnail
 * @param {string} [options.competencyArea="mastering-content"] - SMART competency area
 * @param {string} [options.duration="12 mins"] - Lesson duration
 * @param {string} [options.status="not started"] - Lesson status
 * @param {boolean} [options.showAiIndicator=true] - Whether to show AI indicator
 * @param {string} [options.state="default"] - Card state: "default" or "hover"
 * @param {Function} [options.onContinue] - Continue button click handler
 * @returns {HTMLElement} Lesson card element
 */
export function createLessonCardItem({
    lessonTitle = "Lesson Title",
    lessonDescription = "Lesson Description",
    competencyArea = "mastering-content",
    duration = "12 mins",
    status = "not started",
    showAiIndicator = true,
    state = "default",
    onContinue = null
} = {}) {
    // Outer container - Figma: max-w-[444px] min-w-[218.67px] w-[332px]
    const container = document.createElement('div');
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.border = '1px solid var(--color-outline-variant)';
    container.style.borderStyle = 'solid';
    container.style.maxWidth = '444px'; // Card max width from design
    container.style.minWidth = '218.67px'; // Card min width from design
    container.style.width = '100%';
    container.style.position = 'relative';
    container.style.borderRadius = 'var(--size-card-radius-sm)'; // 12px
    container.setAttribute('data-node-id', state === 'hover' ? '63:177616' : '63:177597');

    // Inner card wrapper
    const cardWrapper = document.createElement('div');
    cardWrapper.style.display = 'flex';
    cardWrapper.style.flexDirection = 'column';
    cardWrapper.style.alignItems = 'flex-start';
    cardWrapper.style.maxWidth = 'inherit';
    cardWrapper.style.minWidth = 'inherit';
    cardWrapper.style.overflow = 'hidden';
    cardWrapper.style.borderRadius = 'inherit';
    cardWrapper.style.width = '100%';

    // Card container
    const card = document.createElement('div');
    card.style.backgroundColor = 'var(--color-surface)';
    card.style.border = state === 'hover' ? '1px solid var(--color-outline-variant)' : 'none';
    card.style.borderStyle = 'solid';
    card.style.maxWidth = state === 'hover' ? '400px' : '332px';
    card.style.minWidth = state === 'hover' ? '296px' : '218.67px';
    card.style.width = '100%';
    card.style.position = 'relative';
    card.style.borderRadius = state === 'hover' ? 'var(--size-card-radius-sm)' : 'inherit';
    card.setAttribute('data-node-id', state === 'hover' ? '63:177617' : '63:177597');

    const cardContent = document.createElement('div');
    cardContent.style.display = 'flex';
    cardContent.style.flexDirection = 'column';
    cardContent.style.alignItems = 'flex-start';
    cardContent.style.maxWidth = 'inherit';
    cardContent.style.minWidth = 'inherit';
    cardContent.style.overflow = 'hidden';
    cardContent.style.borderRadius = 'inherit';
    cardContent.style.width = '100%';

    // Image Thumbnail - Figma: h-[184px]
    const thumbnail = document.createElement('div');
    thumbnail.style.backgroundColor = state === 'hover' 
        ? 'var(--color-tertiary-state-16)' 
        : 'var(--color-tertiary-state-08)';
    thumbnail.style.boxSizing = 'border-box';
    thumbnail.style.display = 'flex';
    thumbnail.style.flexDirection = 'column';
    thumbnail.style.gap = 'var(--size-card-gap-sm)';
    thumbnail.style.minHeight = '184px';
    thumbnail.style.height = 'auto';
    thumbnail.style.alignItems = 'center';
    thumbnail.style.justifyContent = 'center';
    thumbnail.style.padding = state === 'hover' 
        ? 'var(--size-card-pad-x-sm)' 
        : 'var(--size-card-pad-x-sm) var(--size-card-pad-y-sm)';
    thumbnail.style.width = '100%';
    thumbnail.style.opacity = state === 'hover' ? '1' : '0.38';
    thumbnail.setAttribute('data-node-id', state === 'hover' ? '63:177618' : '63:177598');

    const thumbnailText = document.createElement('div');
    thumbnailText.style.fontFamily = 'var(--font-family-body)';
    thumbnailText.style.fontSize = 'var(--font-size-body2)';
    thumbnailText.style.fontWeight = 'var(--font-weight-normal)';
    thumbnailText.style.lineHeight = '1.571';
    thumbnailText.style.color = 'var(--color-on-tertiary-container)';
    thumbnailText.style.textOverflow = 'ellipsis';
    thumbnailText.style.overflow = 'hidden';
    thumbnailText.style.whiteSpace = 'nowrap';
    thumbnailText.style.width = '100%';
    thumbnailText.textContent = lessonDescription;
    thumbnail.appendChild(thumbnailText);

    cardContent.appendChild(thumbnail);

    // Content area - Figma: h-[161px]
    const content = document.createElement('div');
    content.style.boxSizing = 'border-box';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = 'var(--size-card-gap-sm)';
    content.style.minHeight = '161px';
    content.style.height = 'auto';
    content.style.alignItems = 'flex-start';
    content.style.padding = 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)';
    content.style.width = '100%';
    content.setAttribute('data-node-id', state === 'hover' ? '544:53440' : '63:177599');

    // Container #1 - Tags and Title
    const container1 = document.createElement('div');
    container1.style.boxSizing = 'border-box';
    container1.style.display = 'flex';
    container1.style.flexDirection = 'column';
    container1.style.gap = 'var(--size-element-gap-sm)';
    container1.style.alignItems = 'flex-start';
    container1.style.padding = '0 var(--size-element-pad-y-sm)';
    container1.style.width = '100%';
    container1.setAttribute('data-node-id', state === 'hover' ? '544:53441' : '63:177600');

    // Tags row
    const tags = document.createElement('div');
    tags.style.boxSizing = 'border-box';
    tags.style.display = 'flex';
    tags.style.flexWrap = 'wrap';
    tags.style.alignContent = 'center';
    tags.style.gap = '0';
    tags.style.alignItems = 'center';
    tags.style.padding = '0 var(--size-element-gap-xs)';
    tags.style.width = '100%';
    tags.setAttribute('data-node-id', state === 'hover' ? '544:53442' : '63:177601');

    // SMART Badge
    const badgeContainer = document.createElement('div');
    badgeContainer.style.display = 'flex';
    badgeContainer.style.alignItems = 'center';
    badgeContainer.style.justifyContent = 'center';
    badgeContainer.style.position = 'relative';
    badgeContainer.style.flexShrink = '0';
    badgeContainer.setAttribute('data-node-id', state === 'hover' ? '544:53443' : '63:177602');

    const smartBadge = createStaticBadgeSmart({
        type: competencyArea,
        size: 'b3'
    });
    badgeContainer.appendChild(smartBadge);
    tags.appendChild(badgeContainer);

    // Bullet separator
    const bullet = document.createElement('div');
    bullet.style.fontFamily = 'var(--font-family-body)';
    bullet.style.fontSize = 'var(--font-size-body3)';
    bullet.style.fontWeight = 'var(--font-weight-normal)';
    bullet.style.lineHeight = '1.667';
    bullet.style.color = 'var(--color-on-surface-variant)';
    bullet.style.whiteSpace = 'nowrap';
    bullet.style.flexShrink = '0';
    bullet.innerHTML = '<ul><li class="list-disc ms-[18px]"><span class="leading-[1.667] text-[12px]">&nbsp;</span></li></ul>';
    tags.appendChild(bullet);

    // Duration
    const durationEl = document.createElement('div');
    durationEl.style.fontFamily = 'var(--font-family-body)';
    durationEl.style.fontSize = 'var(--font-size-body3)';
    durationEl.style.fontWeight = 'var(--font-weight-normal)';
    durationEl.style.lineHeight = '1.667';
    durationEl.style.color = 'var(--color-on-surface-variant)';
    durationEl.style.whiteSpace = 'nowrap';
    durationEl.style.flexShrink = '0';
    durationEl.textContent = duration;
    tags.appendChild(durationEl);

    container1.appendChild(tags);

    // Title
    const title = document.createElement('div');
    title.style.fontFamily = 'var(--font-family-header)';
    title.style.minHeight = '28px';
    title.style.height = 'auto';
    title.style.justifyContent = 'center';
    title.style.lineHeight = '0';
    title.style.fontStyle = 'normal';
    title.style.textOverflow = 'ellipsis';
    title.style.overflow = 'hidden';
    title.style.position = 'relative';
    title.style.flexShrink = '0';
    title.style.fontSize = 'var(--font-size-h5)';
    title.style.fontWeight = 'var(--font-weight-semibold)';
    title.style.color = 'var(--color-on-surface)';
    title.style.whiteSpace = 'nowrap';
    title.style.width = '100%';
    title.setAttribute('data-node-id', '63:177607');

    const titleText = document.createElement('p');
    titleText.style.whiteSpaceCollapse = 'collapse';
    titleText.style.lineHeight = '1.4';
    titleText.style.textOverflow = 'ellipsis';
    titleText.style.overflow = 'hidden';
    titleText.textContent = lessonTitle;
    title.appendChild(titleText);

    container1.appendChild(title);
    content.appendChild(container1);

    // Divider
    const divider = document.createElement('div');
    divider.style.height = 'var(--size-element-stroke-sm)'; // 1px
    divider.style.position = 'relative';
    divider.style.flexShrink = '0';
    divider.style.width = '100%';
    divider.style.opacity = '0.38';
    divider.setAttribute('data-node-id', state === 'hover' ? '544:53449' : '63:177608');

    const dividerLine = document.createElement('div');
    dividerLine.style.position = 'absolute';
    dividerLine.style.backgroundColor = 'var(--color-surface-container-highest)';
    dividerLine.style.inset = '0';
    dividerLine.style.borderRadius = '1px';
    divider.appendChild(dividerLine);

    content.appendChild(divider);

    // Container #2 - Buttons
    const container2 = document.createElement('div');
    container2.style.boxSizing = 'border-box';
    container2.style.display = 'flex';
    container2.style.gap = 'var(--size-element-gap-sm)';
    container2.style.flexGrow = '1';
    container2.style.alignItems = 'center';
    container2.style.padding = '0 var(--size-element-pad-y-sm)';
    container2.style.width = '100%';
    container2.setAttribute('data-node-id', state === 'hover' ? '544:53450' : '63:177609');

    // Continue button
    const continueButton = PlusInterface.createButton({
        btnText: 'Continue',
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: 'default',
        buttonOnClick: onContinue
    });
    continueButton.style.flexShrink = '0';
    continueButton.setAttribute('data-node-id', state === 'hover' ? '544:53451' : '63:177610');
    container2.appendChild(continueButton);

    // Button container (Status + AI Indicator)
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexGrow = '1';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.setAttribute('data-node-id', state === 'hover' ? '984:81517' : '63:177613');

    // Status Indicator
    const statusContainer = document.createElement('div');
    statusContainer.style.display = 'flex';
    statusContainer.style.flexDirection = 'column';
    statusContainer.style.alignItems = 'center';
    statusContainer.style.justifyContent = 'center';
    statusContainer.style.position = 'relative';
    statusContainer.style.flexShrink = '0';
    statusContainer.setAttribute('data-node-id', state === 'hover' ? '984:81518' : '63:177614');

    // Status indicator button (text button style)
    const statusButton = document.createElement('button');
    statusButton.style.display = 'flex';
    statusButton.style.alignItems = 'center';
    statusButton.style.justifyContent = 'center';
    statusButton.style.overflow = 'hidden';
    statusButton.style.borderRadius = 'var(--size-element-radius-md)';
    statusButton.style.flexShrink = '0';
    statusButton.style.border = 'none';
    statusButton.style.background = 'transparent';
    statusButton.style.padding = '0';
    statusButton.style.cursor = 'pointer';

    const statusButtonContent = document.createElement('div');
    statusButtonContent.style.boxSizing = 'border-box';
    statusButtonContent.style.display = 'flex';
    statusButtonContent.style.gap = 'var(--size-element-gap-md)';
    statusButtonContent.style.alignItems = 'center';
    statusButtonContent.style.justifyContent = 'center';
    statusButtonContent.style.minWidth = '36px';
    statusButtonContent.style.padding = 'var(--size-element-pad-x-md) var(--size-element-pad-y-md)';

    const statusIcon = document.createElement('div');
    statusIcon.style.display = 'flex';
    statusIcon.style.flexDirection = 'row';
    statusIcon.style.alignItems = 'center';
    statusIcon.style.alignSelf = 'stretch';

    const statusIconWrapper = document.createElement('div');
    statusIconWrapper.style.display = 'flex';
    statusIconWrapper.style.height = '100%';
    statusIconWrapper.style.alignItems = 'center';
    statusIconWrapper.style.justifyContent = 'center';
    statusIconWrapper.style.position = 'relative';
    statusIconWrapper.style.flexShrink = '0';
    statusIconWrapper.style.width = '14px'; // Specific icon wrapper width from design
    statusIconWrapper.style.minWidth = '14px';

    const statusIconEl = document.createElement('i');
    statusIconEl.className = 'fas fa-square-plus';
    statusIconEl.style.fontSize = 'var(--font-size-fa-body1-solid)'; // 16px
    statusIconEl.style.lineHeight = '1.75'; // Figma: leading-[1.75] for both states
    statusIconEl.style.color = 'var(--color-warning)';
    statusIconEl.style.textAlign = 'center';
    statusIconEl.style.whiteSpace = 'nowrap';
    statusIconWrapper.appendChild(statusIconEl);
    statusIcon.appendChild(statusIconWrapper);
    statusButtonContent.appendChild(statusIcon);
    statusButton.appendChild(statusButtonContent);
    statusContainer.appendChild(statusButton);
    buttonContainer.appendChild(statusContainer);

    // AI Indicator
    if (showAiIndicator) {
        const aiIndicator = createAiIndicator();
        aiIndicator.style.display = 'flex';
        aiIndicator.style.alignItems = 'flex-start';
        aiIndicator.style.position = 'relative';
        aiIndicator.style.flexShrink = '0';
        aiIndicator.style.width = '36px';
        buttonContainer.appendChild(aiIndicator);
    }

    container2.appendChild(buttonContainer);
    content.appendChild(container2);

    cardContent.appendChild(content);
    card.appendChild(cardContent);
    cardWrapper.appendChild(card);
    container.appendChild(cardWrapper);

    return container;
}

