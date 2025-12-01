/**
 * @fileoverview LessonsStudentOverviewSection component for Training Lessons specs
 * Section with "My Students" title, "View All" button, and student table
 * Matches Figma design system specifications exactly (node-id=686-296266)
 */

import { createStaticBadgeSmart } from '../../../../components/StaticBadgeSmart/index.js';
import { PlusInterface } from '../../../../components/index.js';

/**
 * Creates a LessonsStudentOverviewSection component
 * @param {Object} options - Section configuration
 * @param {Array<Object>} [options.students=[]] - Array of student objects with name, status, focusArea
 * @param {Function} [options.onViewAll] - View All button click handler
 * @returns {HTMLElement} Section element
 */
export function createLessonsStudentOverviewSection({
    students = [],
    onViewAll = null
} = {}) {
    // Default sample data if none provided
    if (students.length === 0) {
        students = [
            { name: 'Hermione Granger', status: 'Needs Motivation', focusArea: null },
            { name: 'Ron Weasley', status: 'Needs Motivation', focusArea: null },
            { name: 'Harry Potter', status: 'Needs Motivation', focusArea: null },
            { name: 'Luna Lovegood', status: 'Needs Motivation', focusArea: 'relationships' },
            { name: 'Harry Potter', status: 'Needs Motivation', focusArea: 'advocacy' }
        ];
    }

    // Section container - Figma: bg-[var(--neutral-colors/surface-container/surface-container-low,#f3f3f6)], w-[1112px], px-[var(--section/pad-x-md,24px)] py-[var(--section/pad-y-md,24px)], rounded-[var(--section/radius-sm,8px)], gap-[var(--section/gap-md,16px)]
    const section = document.createElement('div');
    section.style.backgroundColor = 'var(--color-surface-container-low)';
    section.style.boxSizing = 'border-box';
    section.style.display = 'flex';
    section.style.flexDirection = 'column';
    section.style.gap = 'var(--size-section-gap-md)';
    section.style.alignItems = 'flex-start';
    section.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    section.style.position = 'relative';
    section.style.borderRadius = 'var(--size-section-radius-sm)';
    section.style.maxWidth = '1112px';
    section.style.width = '100%';

    // Title row - Figma: flex items-center justify-between
    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.alignItems = 'center';
    titleRow.style.justifyContent = 'space-between';
    titleRow.style.position = 'relative';
    titleRow.style.flexShrink = '0';
    titleRow.style.width = '100%';

    // Title - Figma: font-['Lato:SemiBold'], text-[24px], leading-[1.333], text-[color:var(--neutral-colors/on-surface,#191c1e)]
    const title = document.createElement('p');
    title.style.fontFamily = 'var(--font-family-header)';
    title.style.fontSize = 'var(--font-size-h4)';
    title.style.fontWeight = 'var(--font-weight-semibold-2)';
    title.style.lineHeight = '1.333';
    title.style.fontStyle = 'normal';
    title.style.position = 'relative';
    title.style.flexShrink = '0';
    title.style.color = 'var(--color-on-surface)';
    title.style.whiteSpace = 'nowrap';
    title.textContent = 'My Students';
    titleRow.appendChild(title);

    // View All button - Figma: Text button, text-[12px], color-[var(--_primary/primary-(text),#00547e)]
    const viewAllButton = PlusInterface.createButton({
        btnText: 'View All',
        btnStyle: 'primary',
        btnFill: 'text',
        btnSize: 'small',
        buttonOnClick: onViewAll
    });
    viewAllButton.style.flexShrink = '0';
    titleRow.appendChild(viewAllButton);

    section.appendChild(titleRow);

    // Table container - Figma: h-[312px], w-[1064px]
    const tableContainer = document.createElement('div');
    tableContainer.style.display = 'flex';
    tableContainer.style.flexDirection = 'column';
    tableContainer.style.height = '312px';
    tableContainer.style.alignItems = 'flex-start';
    tableContainer.style.position = 'relative';
    tableContainer.style.flexShrink = '0';
    tableContainer.style.width = '100%';
    tableContainer.style.maxWidth = '1064px';

    // Table header - Figma: grid-cols-[repeat(3,_minmax(0px,_1fr))]
    const tableHeader = document.createElement('div');
    tableHeader.style.display = 'grid';
    tableHeader.style.gridTemplateColumns = 'repeat(3, minmax(0px, 1fr))';
    tableHeader.style.flexGrow = '1';
    tableHeader.style.width = '100%';
    tableHeader.style.flexShrink = '0';

    // Name header - Figma: text-[14px], leading-[1.571]
    const nameHeader = createTableHeader('1 / 1', 'Name', true);
    tableHeader.appendChild(nameHeader);

    // Status header - Figma: text-[12px], leading-[1.667]
    const statusHeader = createTableHeader('1 / 2', 'Status', false);
    tableHeader.appendChild(statusHeader);

    // Focus Area header - Figma: text-[12px], leading-[1.667]
    const focusHeader = createTableHeader('1 / 3', 'Focus Area', false);
    tableHeader.appendChild(focusHeader);

    tableContainer.appendChild(tableHeader);

    // Table body - Figma: h-[256px]
    const tableBody = document.createElement('div');
    tableBody.style.display = 'flex';
    tableBody.style.flexDirection = 'column';
    tableBody.style.height = '256px';
    tableBody.style.alignItems = 'flex-start';
    tableBody.style.position = 'relative';
    tableBody.style.flexShrink = '0';
    tableBody.style.width = '100%';

    // Create rows for each student
    students.forEach((student) => {
        const row = document.createElement('div');
        row.style.display = 'grid';
        row.style.gridTemplateColumns = 'repeat(3, minmax(0px, 1fr))';
        row.style.flexGrow = '1';
        row.style.width = '100%';
        row.style.flexShrink = '0';

        // Name cell - Figma: text-[12px], leading-[1.667], color-[var(--neutral-colors/outline,#6f797a)]
        const nameCell = document.createElement('div');
        nameCell.style.gridArea = '1 / 1';
        nameCell.style.boxSizing = 'border-box';
        nameCell.style.display = 'flex';
        nameCell.style.alignItems = 'center';
        nameCell.style.overflow = 'hidden';
        nameCell.style.alignSelf = 'stretch';
        nameCell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';

        const nameText = document.createElement('p');
        nameText.style.fontFamily = 'var(--font-family-body)';
        nameText.style.fontSize = 'var(--font-size-body3)';
        nameText.style.fontWeight = 'var(--font-weight-semibold-1)';
        nameText.style.lineHeight = '1.667';
        nameText.style.flexBasis = '0';
        nameText.style.flexGrow = '1';
        nameText.style.textOverflow = 'ellipsis';
        nameText.style.overflow = 'hidden';
        nameText.style.color = 'var(--color-outline)';
        nameText.style.whiteSpace = 'nowrap';
        nameText.textContent = student.name;
        nameCell.appendChild(nameText);
        row.appendChild(nameCell);

        // Status cell - Figma: Static Badge with danger text color
        const statusCell = document.createElement('div');
        statusCell.style.gridArea = '1 / 2';
        statusCell.style.boxSizing = 'border-box';
        statusCell.style.display = 'flex';
        statusCell.style.alignItems = 'center';
        statusCell.style.alignSelf = 'stretch';
        statusCell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';

        const statusBadge = document.createElement('div');
        statusBadge.style.display = 'flex';
        statusBadge.style.alignItems = 'center';
        statusBadge.style.position = 'relative';
        statusBadge.style.borderRadius = 'var(--size-element-radius-pill)';
        statusBadge.style.flexShrink = '0';

        const statusBadgeContent = document.createElement('div');
        statusBadgeContent.style.display = 'flex';
        statusBadgeContent.style.gap = 'var(--size-element-gap-sm)';
        statusBadgeContent.style.alignItems = 'center';
        statusBadgeContent.style.justifyContent = 'center';
        statusBadgeContent.style.minWidth = '12px';

        const statusText = document.createElement('div');
        statusText.style.fontFamily = 'var(--font-family-body)';
        statusText.style.fontSize = 'var(--font-size-body3)';
        statusText.style.fontWeight = 'var(--font-weight-semibold-1)';
        statusText.style.lineHeight = '1.667';
        statusText.style.color = 'var(--color-danger-text)';
        statusText.style.textAlign = 'center';
        statusText.textContent = student.status;
        statusBadgeContent.appendChild(statusText);
        statusBadge.appendChild(statusBadgeContent);
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        // Focus Area cell
        const focusCell = document.createElement('div');
        focusCell.style.gridArea = '1 / 3';
        focusCell.style.boxSizing = 'border-box';
        focusCell.style.display = 'flex';
        focusCell.style.alignItems = 'center';
        focusCell.style.overflow = 'hidden';
        focusCell.style.alignSelf = 'stretch';
        focusCell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';

        if (student.focusArea) {
            const focusBadge = createStaticBadgeSmart({
                type: student.focusArea,
                size: 'b3'
            });
            focusBadge.style.display = 'flex';
            focusBadge.style.alignItems = 'center';
            focusBadge.style.justifyContent = 'center';
            focusBadge.style.position = 'relative';
            focusBadge.style.flexShrink = '0';
            focusCell.appendChild(focusBadge);
        } else {
            // Dash - Figma: text-[16px], leading-[1.5], font-light
            const dashText = document.createElement('div');
            dashText.style.fontFamily = 'var(--font-family-body)';
            dashText.style.fontSize = 'var(--font-size-body1)';
            dashText.style.fontWeight = 'var(--font-weight-normal)';
            dashText.style.lineHeight = '1.5';
            dashText.style.color = 'var(--color-on-surface)';
            dashText.textContent = '-';
            focusCell.appendChild(dashText);
        }

        row.appendChild(focusCell);
        tableBody.appendChild(row);
    });

    tableContainer.appendChild(tableBody);
    section.appendChild(tableContainer);

    return section;
}

/**
 * Creates a table header cell
 * @param {string} gridArea - Grid area specification
 * @param {string} text - Header text
 * @param {boolean} [isName=false] - Whether this is the Name column (uses larger font)
 * @returns {HTMLElement} Header cell element
 */
function createTableHeader(gridArea, text, isName = false) {
    const header = document.createElement('div');
    header.style.gridArea = gridArea;
    header.style.display = 'flex';
    header.style.alignItems = 'center';
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
    headerText.style.fontSize = isName ? 'var(--font-size-body2)' : 'var(--font-size-body3)';
    headerText.style.fontWeight = 'var(--font-weight-semibold-1)';
    headerText.style.lineHeight = isName ? '1.571' : '1.667';
    headerText.style.color = 'var(--color-on-surface)';
    headerText.style.textAlign = 'center';
    headerText.style.whiteSpace = 'nowrap';
    headerText.style.flexShrink = '0';
    headerText.textContent = text;
    headerCell.appendChild(headerText);

    // Sort icon - Figma: text-[10px], leading-[2], color-[var(--neutral-colors/outline-variant,#bec8ca)]
    const sortIcon = document.createElement('div');
    sortIcon.style.display = 'flex';
    sortIcon.style.alignItems = 'center';
    sortIcon.style.justifyContent = 'center';
    sortIcon.style.position = 'relative';
    sortIcon.style.flexShrink = '0';

    const icon = document.createElement('i');
    icon.className = 'fas fa-arrow-up';
    icon.style.fontSize = 'var(--font-size-fa-body3-solid)'; // 10px
    icon.style.lineHeight = '2';
    icon.style.color = 'var(--color-outline-variant)';
    icon.style.textAlign = 'center';
    icon.style.whiteSpace = 'nowrap';
    sortIcon.appendChild(icon);
    headerCell.appendChild(sortIcon);

    header.appendChild(headerCell);
    return header;
}

