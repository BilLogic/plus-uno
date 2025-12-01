/**
 * @fileoverview LessonListItem component for Training Lessons specs
 * Single master component containing all states (header, item default, expanded, hover, pressed, focus, disabled)
 * Matches Figma design system specifications exactly
 */

import { createAiIndicator } from '../Elements/AIIndicator.js';
import { createStaticBadgeSmart } from '../../../../components/StaticBadgeSmart/index.js';
import { PlusInterface } from '../../../../components/index.js';

/**
 * Creates a LessonListItem component - single master component with all states
 * @param {Object} options - Row configuration
 * @param {string} [options.type="header"] - Row type: "header" or "item"
 * @param {string} [options.state="default"] - Row state: "default", "hover", "pressed", "focus", "disable"
 * @param {boolean} [options.expand=false] - Whether row is expanded (for item type)
 * @param {string} [options.lessonTitle="Lesson Title"] - Lesson title (for item type)
 * @param {string} [options.lessonDescription] - Lesson description (for expanded item type)
 * @param {string} [options.competencyArea="socio-emotional"] - SMART competency area (for item type)
 * @param {string} [options.duration="12mins"] - Lesson duration (for item type)
 * @param {string} [options.status="not started"] - Lesson status: "not started", "in progress", "started", "complete", "assigned" (for item type)
 * @param {boolean} [options.showAiIndicator=true] - Whether to show AI indicator (for item type)
 * @param {Function} [options.onToggle] - Toggle expand/collapse handler
 * @param {Function} [options.onContinue] - Continue button click handler
 * @returns {HTMLElement} Table row element
 */
export function createLessonListItem({
    type = "header",
    state = "default",
    expand = false,
    lessonTitle = "Lesson Title",
    lessonDescription = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    competencyArea = "socio-emotional",
    duration = "12mins",
    status = "not started",
    showAiIndicator = true,
    onToggle = null,
    onContinue = null
} = {}) {
    const row = document.createElement('div');
    row.style.width = '755px';
    
    if (type === "header") {
        // Header row - Figma: h-[58px], grid with 9 columns
        row.style.display = 'grid';
        row.style.gridTemplateColumns = 'repeat(9, minmax(0px, 1fr))';
        row.style.height = '58px';
        row.style.position = 'relative';

        // Column 1-3: Lesson
        const lessonHeader = createHeaderCell('1 / 1 / auto / span 3', 'Lesson');
        row.appendChild(lessonHeader);

        // Column 4-5: Competency Area
        const competencyHeader = createHeaderCell('1 / 4 / auto / span 2', 'Competency Area');
        row.appendChild(competencyHeader);

        // Column 6: Status
        const statusHeader = createHeaderCell('1 / 6', 'Status', true);
        row.appendChild(statusHeader);

        // Column 7-8: Duration
        const durationHeader = createHeaderCell('1 / 7 / auto / span 2', 'Duration');
        row.appendChild(durationHeader);

        // Column 9: Actions
        const actionsHeader = createHeaderCell('1 / 9', 'Actions');
        row.appendChild(actionsHeader);
    } else {
        // Item row - Figma: h-[48px], grid with 9 columns
        // Outer container for expanded state
        row.style.display = 'flex';
        row.style.flexDirection = 'column';
        row.style.alignItems = 'flex-start';
        
        // Apply state styling based on Figma spec
        applyItemStateStyles(row, state, expand);

        // Row 1 - Main content grid
        const row1 = document.createElement('div');
        row1.style.display = 'grid';
        row1.style.gridTemplateColumns = 'repeat(9, minmax(0px, 1fr))';
        row1.style.height = '48px';
        row1.style.width = '100%';
        row1.style.flexShrink = '0';

        // Column 1-3: Toggle + Title + AI Indicator
        const cell1 = createCell1(expand, lessonTitle, showAiIndicator, onToggle);
        row1.appendChild(cell1);

        // Column 4-5: Competency Area Badge
        const cell2 = createCell2(competencyArea);
        row1.appendChild(cell2);

        // Column 6: Status Indicator
        const cell3 = createCell3(status);
        row1.appendChild(cell3);

        // Column 7-8: Duration
        const cell4 = createCell4(duration);
        row1.appendChild(cell4);

        // Column 9: Continue Button
        const cell5 = createCell5(onContinue);
        row1.appendChild(cell5);

        row.appendChild(row1);

        // Row 2 - Expanded description (only if expanded)
        if (expand) {
            const row2 = createExpandedDescriptionRow(lessonDescription);
            row.appendChild(row2);
        }
    }

    return row;
}

/**
 * Creates a header cell
 * @param {string} gridArea - Grid area specification
 * @param {string} text - Header text
 * @param {boolean} [center=false] - Whether to center align
 * @returns {HTMLElement} Header cell element
 */
function createHeaderCell(gridArea, text, center = false) {
    const header = document.createElement('div');
    header.style.gridArea = gridArea;
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    if (center) {
        header.style.justifyContent = 'center';
    }
    header.style.overflow = 'hidden';
    header.style.alignSelf = 'stretch';
    header.style.position = 'relative';
    header.style.borderRadius = 'var(--size-element-radius-sm)';
    header.style.flexShrink = '0';

    const headerCell = document.createElement('div');
    headerCell.style.display = 'flex';
    headerCell.style.flexGrow = '1';
    headerCell.style.gap = 'var(--size-table-cell-gap)';
    headerCell.style.height = '100%';
    headerCell.style.alignItems = 'center';
    headerCell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
    headerCell.style.boxSizing = 'border-box';

    const headerText = document.createElement('div');
    headerText.style.fontFamily = 'var(--font-family-body)';
    headerText.style.fontSize = 'var(--font-size-body3)';
    headerText.style.fontWeight = 'var(--font-weight-semibold-1)'; // Regular (400)
    headerText.style.lineHeight = '1.667';
    headerText.style.color = 'var(--color-on-surface)';
    headerText.style.textAlign = 'center';
    headerText.style.whiteSpace = 'nowrap';
    headerText.style.flexShrink = '0';
    headerText.textContent = text;
    headerCell.appendChild(headerText);
    header.appendChild(headerCell);

    return header;
}

/**
 * Applies state styling to item row based on Figma spec
 * @param {HTMLElement} row - Row element
 * @param {string} state - State: "default", "hover", "pressed", "focus", "disable"
 * @param {boolean} expand - Whether row is expanded
 */
function applyItemStateStyles(row, state, expand) {
    if (state === "hover") {
        // Figma: bg-[var(--state-layers/on-surface/opacity-0_08,rgba(25,28,30,0.08))]
        row.style.backgroundColor = 'var(--color-on-surface-state-08)';
    } else if (state === "pressed") {
        // Figma: bg-[var(--state-layers/on-surface/opacity-0_16,rgba(25,28,30,0.16))]
        row.style.backgroundColor = 'var(--color-on-surface-state-16)';
    } else if (state === "focus") {
        // Figma: bg-[var(--state-layers/on-surface/opacity-0_12,rgba(25,28,30,0.12))] border-2 border-[var(--_primary/inverse-primary,#84cfff)]
        row.style.backgroundColor = 'var(--color-on-surface-state-12)';
        row.style.border = '2px solid var(--color-inverse-primary)';
        row.style.borderStyle = 'solid';
        row.style.boxSizing = 'border-box';
    } else if (state === "disable") {
        // Figma: bg-[var(--state-layers/on-surface/opacity-0_08,rgba(25,28,30,0.08))] opacity-[0.38]
        row.style.backgroundColor = 'var(--color-on-surface-state-08)';
        row.style.opacity = '0.38';
        if (expand) {
            // Figma: border-[0px_0px_1px] border-[var(--neutral-colors/outline-variant,#bec8ca)]
            row.style.borderBottom = '1px solid var(--color-outline-variant)';
        }
    }
    // Default state: transparent background (no styling needed)
}

/**
 * Creates cell 1: Toggle + Title + AI Indicator
 * @param {boolean} expand - Whether row is expanded
 * @param {string} lessonTitle - Lesson title
 * @param {boolean} showAiIndicator - Whether to show AI indicator
 * @param {Function} onToggle - Toggle handler
 * @returns {HTMLElement} Cell element
 */
function createCell1(expand, lessonTitle, showAiIndicator, onToggle) {
    const cell = document.createElement('div');
    cell.style.gridArea = '1 / 1 / auto / span 3';
    cell.style.boxSizing = 'border-box';
    cell.style.display = 'flex';
    cell.style.gap = 'var(--size-table-cell-gap)';
    cell.style.alignItems = 'center';
    cell.style.overflow = 'hidden';
    cell.style.alignSelf = 'stretch';
    cell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';

    // Toggle chevron - Figma: w-[12px], text-[10px], leading-[2]
    const toggle = document.createElement('div');
    toggle.style.display = 'flex';
    toggle.style.alignItems = 'center';
    toggle.style.justifyContent = 'center';
    toggle.style.position = 'relative';
    toggle.style.flexShrink = '0';
    toggle.style.width = 'var(--font-size-fa-body2-solid)'; // 12px
    toggle.style.cursor = 'pointer';
    if (onToggle) {
        toggle.addEventListener('click', onToggle);
    }

    const toggleIcon = document.createElement('i');
    toggleIcon.className = 'fas';
    toggleIcon.classList.add(expand ? 'fa-chevron-down' : 'fa-chevron-right');
    toggleIcon.style.fontSize = 'var(--font-size-fa-body3-solid)'; // 10px
    toggleIcon.style.lineHeight = '2';
    toggleIcon.style.color = 'var(--color-on-surface-variant)';
    toggleIcon.style.textAlign = 'center';
    toggleIcon.style.whiteSpace = 'nowrap';
    toggle.appendChild(toggleIcon);
    cell.appendChild(toggle);

    // Lesson title - Figma: font-['Merriweather_Sans:Regular'], text-[12px], leading-[1.667], max-w-[320px]
    const title = document.createElement('p');
    title.style.fontFamily = 'var(--font-family-body)';
    title.style.fontSize = 'var(--font-size-body3)';
    title.style.fontWeight = 'var(--font-weight-semibold-1)'; // Regular (400)
    title.style.lineHeight = '1.667';
    title.style.maxWidth = '320px';
    title.style.textOverflow = 'ellipsis';
    title.style.overflow = 'hidden';
    title.style.position = 'relative';
    title.style.flexShrink = '0';
    title.style.color = 'var(--color-on-surface-variant)';
    title.style.whiteSpace = 'pre';
    title.textContent = lessonTitle;
    cell.appendChild(title);

    // AI Indicator - Figma: w-[36px]
    if (showAiIndicator) {
        const aiIndicator = createAiIndicator();
        aiIndicator.style.display = 'flex';
        aiIndicator.style.alignItems = 'flex-start';
        aiIndicator.style.position = 'relative';
        aiIndicator.style.flexShrink = '0';
        aiIndicator.style.width = '36px';
        cell.appendChild(aiIndicator);
    }

    return cell;
}

/**
 * Creates cell 2: Competency Area Badge
 * @param {string} competencyArea - SMART competency area
 * @returns {HTMLElement} Cell element
 */
function createCell2(competencyArea) {
    const cell = document.createElement('div');
    cell.style.gridArea = '1 / 4 / auto / span 2';
    cell.style.boxSizing = 'border-box';
    cell.style.display = 'flex';
    cell.style.alignItems = 'center';
    cell.style.maxWidth = '218px';
    cell.style.minWidth = '162px';
    cell.style.overflow = 'hidden';
    cell.style.alignSelf = 'stretch';
    cell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';

    const badge = createStaticBadgeSmart({
        type: competencyArea,
        size: 'b3'
    });
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.position = 'relative';
    badge.style.flexShrink = '0';
    cell.appendChild(badge);

    return cell;
}

/**
 * Creates cell 3: Status Indicator
 * @param {string} status - Lesson status
 * @returns {HTMLElement} Cell element
 */
function createCell3(status) {
    const cell = document.createElement('div');
    cell.style.gridArea = '1 / 6';
    cell.style.boxSizing = 'border-box';
    cell.style.display = 'flex';
    cell.style.alignItems = 'center';
    cell.style.overflow = 'hidden';
    cell.style.alignSelf = 'stretch';
    cell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';

    const statusContainer = document.createElement('div');
    statusContainer.style.display = 'flex';
    statusContainer.style.flexDirection = 'column';
    statusContainer.style.alignItems = 'center';
    statusContainer.style.justifyContent = 'center';
    statusContainer.style.position = 'relative';
    statusContainer.style.flexShrink = '0';

    // Status indicator button (text button style) - Figma: min-w-[36px], px-[var(--element/pad-x-md,10px)] py-[var(--element/pad-y-md,6px)]
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
    statusButtonContent.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';

    const statusIcon = document.createElement('div');
    statusIcon.style.display = 'flex';
    statusIcon.style.flexDirection = 'row';
    statusIcon.style.alignItems = 'center';
    statusIcon.style.alignSelf = 'stretch';

    // Status icon wrapper - Figma: w-[12px] for spinner, w-[9px] for square-plus
    const statusIconWrapper = document.createElement('div');
    statusIconWrapper.style.display = 'flex';
    statusIconWrapper.style.height = '100%';
    statusIconWrapper.style.alignItems = 'center';
    statusIconWrapper.style.justifyContent = 'center';
    statusIconWrapper.style.position = 'relative';
    statusIconWrapper.style.flexShrink = '0';

    // Status icon - Figma: spinner uses text-[14px] leading-[1.714], square-plus uses text-[10px] leading-[2]
    const statusIconEl = document.createElement('i');
    // Map status to icon: "in progress" or "started" -> spinner, others -> square-plus
    const isInProgress = status === 'in progress' || status === 'started';
    statusIconEl.className = isInProgress ? 'fas fa-spinner' : 'fas fa-square-plus';
    
    if (isInProgress) {
        // Figma: spinner - w-[12px], text-[14px], leading-[1.714]
        statusIconWrapper.style.width = '12px';
        statusIconEl.style.fontSize = '14px';
        statusIconEl.style.lineHeight = '1.714';
    } else {
        // Figma: square-plus - w-[9px], text-[10px], leading-[2]
        statusIconWrapper.style.width = '9px'; // Specific icon wrapper size
        statusIconEl.style.fontSize = 'var(--font-size-fa-body3-solid)'; // 10px
        statusIconEl.style.lineHeight = '2';
    }
    statusIconEl.style.color = 'var(--color-warning)';
    statusIconEl.style.textAlign = 'center';
    statusIconEl.style.whiteSpace = 'nowrap';
    statusIconWrapper.appendChild(statusIconEl);
    statusIcon.appendChild(statusIconWrapper);
    statusButtonContent.appendChild(statusIcon);
    statusButton.appendChild(statusButtonContent);
    statusContainer.appendChild(statusButton);
    cell.appendChild(statusContainer);

    return cell;
}

/**
 * Creates cell 4: Duration
 * @param {string} duration - Lesson duration
 * @returns {HTMLElement} Cell element
 */
function createCell4(duration) {
    const cell = document.createElement('div');
    cell.style.gridArea = '1 / 7 / auto / span 2';
    cell.style.boxSizing = 'border-box';
    cell.style.display = 'flex';
    cell.style.alignItems = 'center';
    cell.style.overflow = 'hidden';
    cell.style.alignSelf = 'stretch';
    cell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';

    const durationText = document.createElement('p');
    durationText.style.fontFamily = 'var(--font-family-body)';
    durationText.style.fontSize = 'var(--font-size-body3)';
    durationText.style.fontWeight = 'var(--font-weight-normal)'; // Light (300)
    durationText.style.lineHeight = '1.667';
    durationText.style.position = 'relative';
    durationText.style.flexShrink = '0';
    durationText.style.color = 'var(--color-on-surface-variant)';
    durationText.style.whiteSpace = 'pre';
    durationText.textContent = duration;
    cell.appendChild(durationText);

    return cell;
}

/**
 * Creates cell 5: Continue Button
 * @param {Function} onContinue - Continue button handler
 * @returns {HTMLElement} Cell element
 */
function createCell5(onContinue) {
    const cell = document.createElement('div');
    cell.style.gridArea = '1 / 9';
    cell.style.boxSizing = 'border-box';
    cell.style.display = 'flex';
    cell.style.alignItems = 'center';
    cell.style.overflow = 'hidden';
    cell.style.alignSelf = 'stretch';
    cell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';

    const continueButton = PlusInterface.createButton({
        btnText: 'Continue',
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: 'small',
        buttonOnClick: onContinue
    });
    continueButton.style.flexShrink = '0';
    cell.appendChild(continueButton);

    return cell;
}

/**
 * Creates expanded description row
 * @param {string} lessonDescription - Lesson description
 * @returns {HTMLElement} Expanded row element
 */
function createExpandedDescriptionRow(lessonDescription) {
    // Figma: pl-[var(--card/gap-lg,32px)], pr-0, py-[var(--card/gap-sm,8px)], max-w-[444px], min-w-[332px]
    const row2 = document.createElement('div');
    row2.style.boxSizing = 'border-box';
    row2.style.display = 'flex';
    row2.style.gap = 'var(--size-element-gap-md)'; // 10px
    row2.style.alignItems = 'flex-start';
    row2.style.maxWidth = '444px';
    row2.style.minWidth = '332px';
    row2.style.paddingLeft = 'var(--size-card-gap-lg)';
    row2.style.paddingRight = '0';
    row2.style.paddingTop = 'var(--size-card-gap-sm)';
    row2.style.paddingBottom = 'var(--size-card-gap-sm)';
    row2.style.width = '100%';
    row2.style.flexShrink = '0';

    // Description - Figma: font-['Merriweather_Sans:Light'], text-[12px], leading-[1.667]
    const description = document.createElement('p');
    description.style.fontFamily = 'var(--font-family-body)';
    description.style.fontSize = 'var(--font-size-body3)';
    description.style.fontWeight = 'var(--font-weight-normal)'; // Light (300)
    description.style.lineHeight = '1.667';
    description.style.flexGrow = '1';
    description.style.color = 'var(--color-on-surface-variant)';
    description.textContent = lessonDescription;
    row2.appendChild(description);

    return row2;
}
