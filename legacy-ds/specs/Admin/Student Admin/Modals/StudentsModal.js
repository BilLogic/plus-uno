/**
 * @fileoverview StudentsModal component for Student Admin specs
 * Modal showing student information with Info and Sessions tabs
 */

import { createModal } from '../../../../components/Modal/index.js';
import { createButton } from '../../../../components/Button/index.js';
import { createPagination } from '../../../../components/Pagination/index.js';

/**
 * Creates a Students Modal component
 * @param {Object} options - Modal configuration
 * @param {string} [options.type="Info"] - Tab type: "Info" or "Sessions"
 * @param {string} [options.studentName="Student Name"] - Student name for the title
 * @param {Object} [options.studentInfo] - Student information data
 * @param {Array<Object>} [options.sessions] - Array of session data
 * @returns {HTMLElement} Modal element
 */
export function createStudentsModal({
    type = "Info",
    studentName = "Student Name",
    studentInfo = {
        preferredName: "Name",
        email: "name@example.com",
        studentStatus: "Placeholder",
        school: "Placeholder",
        tutors: "Placeholder"
    },
    sessions = []
} = {}) {
    // Create modal body content
    const modalBodyContent = document.createElement('div');
    modalBodyContent.style.display = 'flex';
    modalBodyContent.style.flexDirection = 'column';
    modalBodyContent.style.gap = 'var(--size-modal-gap-md)';
    modalBodyContent.style.width = '100%';

    // Tab buttons - matching Figma button group pattern
    const tabButtons = document.createElement('div');
    tabButtons.style.display = 'flex';
    tabButtons.style.borderRadius = 'var(--size-element-radius-lg)';
    tabButtons.style.overflow = 'hidden';
    tabButtons.style.width = '100%';

    // Info tab button
    const infoTab = document.createElement('div');
    infoTab.style.flex = '1';
    infoTab.style.display = 'flex';
    infoTab.style.alignItems = 'center';
    infoTab.style.justifyContent = 'center';
    infoTab.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
    infoTab.style.gap = 'var(--size-element-gap-md)';
    infoTab.style.borderRadius = type === "Info" ? 'var(--size-element-radius-md) 0 0 var(--size-element-radius-md)' : '0';
    infoTab.style.backgroundColor = type === "Info" 
        ? 'var(--color-primary-state-08)' 
        : 'var(--color-secondary-state-08)';
    infoTab.style.cursor = 'pointer';

    const infoTabText = document.createElement('div');
    infoTabText.style.fontFamily = 'var(--font-family-header)';
    infoTabText.style.fontSize = 'var(--font-size-h6)';
    infoTabText.style.fontWeight = 'var(--font-weight-semibold)';
    infoTabText.style.lineHeight = '1.5';
    infoTabText.style.color = type === "Info" 
        ? 'var(--color-primary-text)' 
        : 'var(--color-secondary-text)';
    infoTabText.style.whiteSpace = 'nowrap';
    infoTabText.textContent = 'Student Info';
    infoTab.appendChild(infoTabText);
    tabButtons.appendChild(infoTab);

    // Sessions tab button
    const sessionsTab = document.createElement('div');
    sessionsTab.style.flex = '1';
    sessionsTab.style.display = 'flex';
    sessionsTab.style.alignItems = 'center';
    sessionsTab.style.justifyContent = 'center';
    sessionsTab.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
    sessionsTab.style.gap = 'var(--size-element-gap-md)';
    sessionsTab.style.borderRadius = type === "Sessions" ? '0 var(--size-element-radius-md) var(--size-element-radius-md) 0' : '0';
    sessionsTab.style.backgroundColor = type === "Sessions" 
        ? 'var(--color-primary-state-08)' 
        : 'var(--color-secondary-state-08)';
    sessionsTab.style.cursor = 'pointer';

    const sessionsTabText = document.createElement('div');
    sessionsTabText.style.fontFamily = 'var(--font-family-header)';
    sessionsTabText.style.fontSize = 'var(--font-size-h6)';
    sessionsTabText.style.fontWeight = 'var(--font-weight-semibold)';
    sessionsTabText.style.lineHeight = '1.5';
    sessionsTabText.style.color = type === "Sessions" 
        ? 'var(--color-primary-text)' 
        : 'var(--color-secondary-text)';
    sessionsTabText.style.whiteSpace = 'nowrap';
    sessionsTabText.textContent = 'Sessions';
    sessionsTab.appendChild(sessionsTabText);

    // Add counter badge for Sessions tab
    const counter = document.createElement('div');
    counter.style.display = 'flex';
    counter.style.alignItems = 'center';
    counter.style.justifyContent = 'center';
    counter.style.height = '16px';
    counter.style.padding = '0 var(--size-element-pad-x-sm)';
    counter.style.borderRadius = 'var(--size-element-radius-pill)';
    counter.style.backgroundColor = 'var(--color-on-surface-state-08)';
    counter.style.marginLeft = '0';
    
    const counterText = document.createElement('div');
    counterText.style.fontFamily = 'var(--font-family-body)';
    counterText.style.fontSize = 'var(--font-size-body3)';
    counterText.style.fontWeight = 'var(--font-weight-regular)';
    counterText.style.lineHeight = '1.667';
    counterText.style.color = 'var(--color-on-surface)';
    counterText.style.textAlign = 'center';
    counterText.style.whiteSpace = 'nowrap';
    counterText.textContent = '20';
    counter.appendChild(counterText);
    sessionsTab.appendChild(counter);

    tabButtons.appendChild(sessionsTab);
    modalBodyContent.appendChild(tabButtons);

    if (type === "Info") {
        // Info tab content - Read-only form fields
        const infoContent = document.createElement('div');
        infoContent.style.display = 'flex';
        infoContent.style.flexDirection = 'column';
        infoContent.style.gap = '12px';
        infoContent.style.width = '100%';

        // Preferred name field
        const preferredNameField = createFormField({
            label: 'Preferred name',
            value: studentInfo.preferredName
        });
        infoContent.appendChild(preferredNameField);

        // Email field
        const emailField = createFormField({
            label: 'Email',
            value: studentInfo.email
        });
        infoContent.appendChild(emailField);

        // Student status field (with icons)
        const studentStatusField = createFormField({
            label: 'Student status',
            value: studentInfo.studentStatus,
            withIcons: true
        });
        infoContent.appendChild(studentStatusField);

        // School field (with icons)
        const schoolField = createFormField({
            label: 'School this student attends',
            value: studentInfo.school,
            withIcons: true
        });
        infoContent.appendChild(schoolField);

        // Tutors field (with icons and caption)
        const tutorsField = createFormField({
            label: 'Tutors this student has worked with',
            value: studentInfo.tutors,
            withIcons: true,
            caption: '# tutors'
        });
        infoContent.appendChild(tutorsField);

        modalBodyContent.appendChild(infoContent);

        // Footer buttons - matching Figma design
        const footerButtons = document.createElement('div');
        footerButtons.style.display = 'flex';
        footerButtons.style.gap = 'var(--size-element-gap-lg)';
        footerButtons.style.justifyContent = 'flex-end';
        footerButtons.style.paddingTop = 'var(--size-element-pad-y-lg)';
        footerButtons.style.borderTop = '1px solid var(--color-outline-variant)';
        footerButtons.style.width = '100%';

        // Delete button (danger text)
        const deleteButton = createButton({
            btnText: 'Delete This Student',
            btnStyle: 'danger',
            btnFill: 'text',
            btnSize: 'default'
        });
        deleteButton.style.borderRadius = 'var(--size-element-radius-sm)';
        footerButtons.appendChild(deleteButton);

        // Cancel button (secondary tonal)
        const cancelButton = createButton({
            btnText: 'Cancel',
            btnStyle: 'secondary',
            btnFill: 'tonal',
            btnSize: 'default'
        });
        cancelButton.style.borderRadius = 'var(--size-element-radius-sm)';
        footerButtons.appendChild(cancelButton);

        // Save button (disabled filled)
        const saveButton = createButton({
            btnText: 'Save',
            btnStyle: 'default',
            btnFill: 'filled',
            btnSize: 'default'
        });
        saveButton.style.opacity = '0.38';
        saveButton.style.borderRadius = 'var(--size-element-radius-sm)';
        saveButton.disabled = true;
        footerButtons.appendChild(saveButton);

        modalBodyContent.appendChild(footerButtons);
    } else {
        // Sessions tab content
        const sessionsContent = document.createElement('div');
        sessionsContent.style.display = 'flex';
        sessionsContent.style.flexDirection = 'column';
        sessionsContent.style.gap = 'var(--size-modal-gap-md)';
        sessionsContent.style.width = '100%';

        // Show Future Sessions toggle - matching Figma design
        const toggleContainer = document.createElement('div');
        toggleContainer.style.display = 'flex';
        toggleContainer.style.gap = 'var(--size-element-gap-sm)';
        toggleContainer.style.alignItems = 'center';
        toggleContainer.style.width = '100%';

        // Toggle switch - matching Figma design (checked/on state)
        const toggleSwitch = document.createElement('div');
        toggleSwitch.style.width = '25px';
        toggleSwitch.style.height = '16px';
        toggleSwitch.style.borderRadius = 'var(--size-element-radius-pill)';
        toggleSwitch.style.backgroundColor = 'var(--color-surface)';
        toggleSwitch.style.border = '1px solid var(--color-primary)';
        toggleSwitch.style.padding = '2px';
        toggleSwitch.style.display = 'flex';
        toggleSwitch.style.alignItems = 'center';
        toggleSwitch.style.justifyContent = 'flex-end'; // Circle on right for checked state
        toggleSwitch.style.boxSizing = 'border-box';
        toggleSwitch.style.cursor = 'pointer';

        // Toggle circle (indicator) - on the right for checked state
        const toggleCircle = document.createElement('div');
        toggleCircle.style.width = '8px';
        toggleCircle.style.height = '8px';
        toggleCircle.style.borderRadius = '50%';
        toggleCircle.style.backgroundColor = 'var(--color-primary)';
        toggleCircle.style.flexShrink = '0';
        toggleSwitch.appendChild(toggleCircle);
        toggleContainer.appendChild(toggleSwitch);

        // Toggle label
        const toggleLabel = document.createElement('div');
        toggleLabel.style.fontFamily = 'var(--font-family-body)';
        toggleLabel.style.fontSize = 'var(--font-size-body2)';
        toggleLabel.style.fontWeight = 'var(--font-weight-light)';
        toggleLabel.style.lineHeight = '1.571';
        toggleLabel.style.color = 'var(--color-on-surface)';
        toggleLabel.style.opacity = '0.38';
        toggleLabel.style.whiteSpace = 'nowrap';
        toggleLabel.textContent = 'Show Future Sessions';
        toggleContainer.appendChild(toggleLabel);

        sessionsContent.appendChild(toggleContainer);

        // Sessions table container
        const tableWrapper = document.createElement('div');
        tableWrapper.style.display = 'flex';
        tableWrapper.style.flexDirection = 'column';
        tableWrapper.style.gap = '0';
        tableWrapper.style.width = '100%';
        tableWrapper.style.minWidth = '600px';

        // Sessions table
        const sessionsTable = createSessionsTable(sessions);
        tableWrapper.appendChild(sessionsTable);

        // Pagination footer - matching Figma design
        const paginationFooter = document.createElement('div');
        paginationFooter.style.display = 'flex';
        paginationFooter.style.justifyContent = 'space-between';
        paginationFooter.style.alignItems = 'center';
        paginationFooter.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md) var(--size-section-pad-y-sm)';
        paginationFooter.style.width = '100%';

        const paginationText = document.createElement('div');
        paginationText.style.fontFamily = 'var(--font-family-body)';
        paginationText.style.fontSize = 'var(--font-size-body2)';
        paginationText.style.fontWeight = 'var(--font-weight-light)';
        paginationText.style.lineHeight = '1.571';
        paginationText.style.color = 'var(--color-on-surface)';
        paginationText.style.whiteSpace = 'nowrap';
        paginationText.textContent = 'Showing 1 to 5 of 36 entries';
        paginationFooter.appendChild(paginationText);

        // Pagination component - matching Figma design (shows 1, ..., 4, 5, 6, ..., 10)
        const pagination = createPagination({
            currentPage: 1,
            totalPages: 10,
            type: 'icon',
            size: 'small',
            maxVisible: 3, // Show 3 pages around current (4, 5, 6) when on page 1
            onPageChange: (page) => console.log(`Page changed to ${page}`)
        });
        paginationFooter.appendChild(pagination);

        tableWrapper.appendChild(paginationFooter);
        sessionsContent.appendChild(tableWrapper);

        modalBodyContent.appendChild(sessionsContent);

        // Footer buttons - matching Figma design
        const footerButtons = document.createElement('div');
        footerButtons.style.display = 'flex';
        footerButtons.style.gap = 'var(--size-element-gap-lg)';
        footerButtons.style.justifyContent = 'flex-end';
        footerButtons.style.paddingTop = 'var(--size-element-pad-y-lg)';
        footerButtons.style.borderTop = '1px solid var(--color-outline-variant)';
        footerButtons.style.width = '100%';

        // Delete button (danger text)
        const deleteButton = createButton({
            btnText: 'Delete This Student',
            btnStyle: 'danger',
            btnFill: 'text',
            btnSize: 'default'
        });
        deleteButton.style.borderRadius = 'var(--size-element-radius-sm)';
        footerButtons.appendChild(deleteButton);

        // Cancel button (secondary tonal)
        const cancelButton = createButton({
            btnText: 'Cancel',
            btnStyle: 'secondary',
            btnFill: 'tonal',
            btnSize: 'default'
        });
        cancelButton.style.borderRadius = 'var(--size-element-radius-sm)';
        footerButtons.appendChild(cancelButton);

        // Save button (disabled filled)
        const saveButton = createButton({
            btnText: 'Save',
            btnStyle: 'default',
            btnFill: 'filled',
            btnSize: 'default'
        });
        saveButton.style.opacity = '0.38';
        saveButton.style.borderRadius = 'var(--size-element-radius-sm)';
        saveButton.disabled = true;
        footerButtons.appendChild(saveButton);

        modalBodyContent.appendChild(footerButtons);
    }

    // Create modal
    const modal = createModal({
        id: 'studentsModal',
        title: studentName,
        body: modalBodyContent,
        type: type === "Sessions" ? 'scrollable' : 'default',
        showBottomButtons: false,
        width: 502,
        onClose: () => console.log('Students Modal closed')
    });

    // Override header styling to match Figma
    const modalHeader = modal.querySelector('.plus-modal-header');
    if (modalHeader) {
        const headerContent = modalHeader.querySelector('.plus-modal-header-content');
        if (headerContent) {
            const titleEl = headerContent.querySelector('h4, .h4-txt');
            if (titleEl) {
                titleEl.style.fontFamily = 'var(--font-family-header)';
                titleEl.style.fontSize = 'var(--font-size-h4)';
                titleEl.style.fontWeight = 'var(--font-weight-semibold)';
                titleEl.style.lineHeight = '1.333';
                titleEl.style.color = 'var(--color-on-surface)';
            }
        }
        modalHeader.style.borderBottom = '1px solid var(--color-outline-variant)';
        modalHeader.style.padding = 'var(--size-element-pad-y-lg) var(--size-element-pad-x-lg)';
        modalHeader.style.display = 'flex';
        modalHeader.style.justifyContent = 'space-between';
        modalHeader.style.alignItems = 'center';
    }

    // Style close button
    const closeButton = modal.querySelector('.plus-modal-close');
    if (closeButton) {
        const closeIcon = closeButton.querySelector('i');
        if (closeIcon) {
            closeIcon.style.fontSize = '24px';
            closeIcon.style.color = 'var(--color-on-surface-variant)';
        }
    }

    return modal;
}

/**
 * Creates a form field (read-only)
 * @param {Object} options - Field configuration
 * @param {string} options.label - Field label
 * @param {string} options.value - Field value
 * @param {boolean} [options.withIcons=false] - Whether to show dropdown icons
 * @param {string} [options.caption] - Caption text below field
 * @returns {HTMLElement} Form field element
 */
function createFormField({ label, value, withIcons = false, caption = null }) {
    const fieldContainer = document.createElement('div');
    fieldContainer.style.display = 'flex';
    fieldContainer.style.flexDirection = 'column';
    fieldContainer.style.gap = 'var(--size-element-gap-xs)';
    fieldContainer.style.width = '100%';

    // Label
    const labelEl = document.createElement('div');
    labelEl.style.fontFamily = 'var(--font-family-body)';
    labelEl.style.fontSize = 'var(--font-size-body3)';
    labelEl.style.fontWeight = 'var(--font-weight-regular)';
    labelEl.style.lineHeight = '1.667';
    labelEl.style.color = 'var(--color-on-surface-variant)';
    labelEl.style.whiteSpace = 'nowrap';
    labelEl.textContent = label;
    fieldContainer.appendChild(labelEl);

    // Input field (read-only) - matching Figma design
    const inputContainer = document.createElement('div');
    inputContainer.style.backgroundColor = 'var(--color-surface)';
    inputContainer.style.border = '0.8px solid var(--color-outline-variant)';
    inputContainer.style.borderRadius = 'var(--size-border-radius-radius-50)';
    inputContainer.style.display = 'flex';
    inputContainer.style.gap = 'var(--size-element-gap-md)';
    inputContainer.style.alignItems = 'center';
    inputContainer.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
    inputContainer.style.width = '100%';
    inputContainer.style.boxSizing = 'border-box';

    if (withIcons) {
        const leftIcon = document.createElement('i');
        leftIcon.className = 'fas fa-icons';
        leftIcon.style.fontSize = 'var(--font-size-body2)';
        leftIcon.style.color = 'var(--color-on-surface-variant)';
        leftIcon.style.flexShrink = '0';
        inputContainer.appendChild(leftIcon);
    }

    const valueText = document.createElement('div');
    valueText.style.fontFamily = 'var(--font-family-body)';
    valueText.style.fontSize = 'var(--font-size-body2)';
    valueText.style.fontWeight = 'var(--font-weight-light)';
    valueText.style.lineHeight = '1.571';
    valueText.style.color = 'var(--color-on-surface-variant)';
    valueText.style.flex = '1';
    valueText.style.minWidth = '0';
    valueText.textContent = value;
    inputContainer.appendChild(valueText);

    if (withIcons) {
        const rightIcon = document.createElement('i');
        rightIcon.className = 'fas fa-icons';
        rightIcon.style.fontSize = 'var(--font-size-body2)';
        rightIcon.style.color = 'var(--color-on-surface-variant)';
        rightIcon.style.flexShrink = '0';
        inputContainer.appendChild(rightIcon);
    }

    fieldContainer.appendChild(inputContainer);

    // Caption
    if (caption) {
        const captionEl = document.createElement('div');
        captionEl.style.display = 'flex';
        captionEl.style.gap = 'var(--size-element-pad-y-sm)';
        captionEl.style.alignItems = 'center';
        captionEl.style.marginTop = 'var(--size-element-pad-y-sm)';

        // Icon placeholder (empty space)
        const iconPlaceholder = document.createElement('div');
        iconPlaceholder.style.width = '10px';
        iconPlaceholder.style.height = '10px';
        iconPlaceholder.style.flexShrink = '0';
        captionEl.appendChild(iconPlaceholder);

        const captionText = document.createElement('div');
        captionText.style.fontFamily = 'var(--font-family-body)';
        captionText.style.fontSize = 'var(--font-size-body3)';
        captionText.style.fontWeight = 'var(--font-weight-light)';
        captionText.style.lineHeight = '1.667';
        captionText.style.color = 'var(--color-on-surface)';
        captionText.style.whiteSpace = 'nowrap';
        captionText.textContent = caption;
        captionEl.appendChild(captionText);

        fieldContainer.appendChild(captionEl);
    }

    return fieldContainer;
}

/**
 * Creates sessions table for Sessions tab
 * @param {Array<Object>} sessions - Array of session data
 * @returns {HTMLElement} Sessions table element
 */
function createSessionsTable(sessions = []) {
    const defaultSessions = [
        { day: 'Monday (01/31/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { day: 'Friday (01/28/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { day: 'Thursday (01/27/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { day: 'Wednesday (01/26/25)', shift: '0:00 PM - 0:00 PM', school: 'School' },
        { day: 'Tuesday (01/25/25)', shift: '0:00 PM - 0:00 PM', school: 'School' }
    ];

    const sessionData = sessions.length > 0 ? sessions : defaultSessions;

    const tableContainer = document.createElement('div');
    tableContainer.style.display = 'flex';
    tableContainer.style.flexDirection = 'column';
    tableContainer.style.gap = '0';
    tableContainer.style.width = '100%';
    tableContainer.style.minWidth = '600px';

    // Table header
    const headerRow = document.createElement('div');
    headerRow.style.display = 'grid';
    headerRow.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
    headerRow.style.height = '44px';
    headerRow.style.borderRadius = 'var(--size-table-radius-md)';
    headerRow.style.width = '100%';

    const headers = [
        { text: 'Day (Date)', sortable: true, active: true },
        { text: 'Shift (ET)', sortable: true },
        { text: 'School', sortable: true }
    ];

    headers.forEach((header, index) => {
        const cell = document.createElement('div');
        cell.style.display = 'flex';
        cell.style.gap = 'var(--size-table-cell-gap)';
        cell.style.alignItems = 'center';
        cell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
        cell.style.borderRadius = 'var(--size-table-radius-sm)';
        cell.style.flex = index === 0 ? '0 1 auto' : '1';

        const text = document.createElement('div');
        text.style.fontFamily = 'var(--font-family-body)';
        text.style.fontSize = 'var(--font-size-body3)';
        text.style.fontWeight = 'var(--font-weight-regular)';
        text.style.lineHeight = '1.667';
        text.style.color = header.active ? 'var(--color-secondary-text)' : 'var(--color-on-surface)';
        text.style.textTransform = 'capitalize';
        text.style.textAlign = 'center';
        text.style.whiteSpace = 'nowrap';
        text.textContent = header.text;
        cell.appendChild(text);

        if (header.sortable) {
            const icon = document.createElement('i');
            icon.className = 'fas fa-arrow-up';
            icon.style.fontSize = '10px';
            icon.style.color = header.active ? 'var(--color-secondary)' : 'var(--color-outline-variant)';
            icon.style.flexShrink = '0';
            cell.appendChild(icon);
        }

        headerRow.appendChild(cell);
    });

    tableContainer.appendChild(headerRow);

    // Table rows
    sessionData.forEach((session) => {
        const row = document.createElement('div');
        row.style.display = 'grid';
        row.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
        row.style.height = '44px';
        row.style.borderRadius = 'var(--size-table-radius-md)';
        row.style.width = '100%';

        // Day (Date)
        const dayCell = document.createElement('div');
        dayCell.style.display = 'flex';
        dayCell.style.gap = 'var(--size-element-gap-xs)';
        dayCell.style.alignItems = 'center';
        dayCell.style.padding = 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
        dayCell.style.overflow = 'hidden';
        dayCell.style.flex = '0 1 auto';

        const dayText = document.createElement('div');
        dayText.style.fontFamily = 'var(--font-family-body)';
        dayText.style.fontSize = 'var(--font-size-body3)';
        dayText.style.fontWeight = 'var(--font-weight-light)';
        dayText.style.lineHeight = '1.667';
        dayText.style.color = 'var(--color-on-surface)';
        dayText.style.overflow = 'hidden';
        dayText.style.textOverflow = 'ellipsis';
        dayText.style.whiteSpace = 'nowrap';
        dayText.textContent = session.day;
        dayCell.appendChild(dayText);
        row.appendChild(dayCell);

        // Shift (ET)
        const shiftCell = document.createElement('div');
        shiftCell.style.display = 'flex';
        shiftCell.style.alignItems = 'center';
        shiftCell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
        shiftCell.style.overflow = 'hidden';
        shiftCell.style.flex = '1';

        const shiftText = document.createElement('div');
        shiftText.style.fontFamily = 'var(--font-family-body)';
        shiftText.style.fontSize = 'var(--font-size-body3)';
        shiftText.style.fontWeight = 'var(--font-weight-light)';
        shiftText.style.lineHeight = '1.667';
        shiftText.style.color = 'var(--color-on-surface)';
        shiftText.style.overflow = 'hidden';
        shiftText.style.textOverflow = 'ellipsis';
        shiftText.style.whiteSpace = 'nowrap';
        shiftText.textContent = session.shift;
        shiftCell.appendChild(shiftText);
        row.appendChild(shiftCell);

        // School (third column)
        const schoolCell = document.createElement('div');
        schoolCell.style.display = 'flex';
        schoolCell.style.alignItems = 'center';
        schoolCell.style.padding = 'var(--size-table-cell-y) var(--size-table-cell-x)';
        schoolCell.style.overflow = 'hidden';
        schoolCell.style.flex = '1';

        const schoolBadge = document.createElement('div');
        schoolBadge.style.display = 'flex';
        schoolBadge.style.alignItems = 'center';
        schoolBadge.style.padding = '0 var(--size-element-pad-x-sm)';
        schoolBadge.style.borderRadius = 'var(--size-element-radius-pill)';
        schoolBadge.style.backgroundColor = 'var(--color-secondary-state-08)';
        schoolBadge.style.minHeight = '12px';

        const schoolText = document.createElement('div');
        schoolText.style.fontFamily = 'var(--font-family-body)';
        schoolText.style.fontSize = 'var(--font-size-body3)';
        schoolText.style.fontWeight = 'var(--font-weight-regular)';
        schoolText.style.lineHeight = '1.667';
        schoolText.style.color = 'var(--color-secondary-text)';
        schoolText.style.textAlign = 'center';
        schoolText.style.whiteSpace = 'nowrap';
        schoolText.textContent = session.school || 'School';
        schoolBadge.appendChild(schoolText);
        schoolCell.appendChild(schoolBadge);
        row.appendChild(schoolCell);

        tableContainer.appendChild(row);
    });

    return tableContainer;
}

