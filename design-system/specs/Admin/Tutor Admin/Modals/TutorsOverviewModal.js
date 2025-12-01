/**
 * @fileoverview TutorsOverviewModal component for Admin specs
 * Modal for viewing and editing tutor information with tabs for Info, Sessions, and Add a new tutor
 */

import { createButton } from '../../../../components/Button/index.js';
import { createSwitch } from '../../../../components/Switch/index.js';

/**
 * Creates a TutorsOverviewModal component
 * @param {Object} options - Modal configuration
 * @param {string} [options.tab="Info"] - Active tab: "Info", "Sessions", or "Add a new tutor"
 * @param {string} [options.tutorName="Amelia Blue"] - Tutor name
 * @param {Function} [options.onClose] - Close button handler
 * @returns {HTMLElement} Modal element
 */
export function createTutorsOverviewModal({
    tab = "Info",
    tutorName = "Amelia Blue",
    onClose = null
} = {}) {
    const modal = document.createElement("div");
    modal.classList.add("plus-modal", "plus-modal-scrollable", "plus-modal-pad-md", "plus-modal-gap-md", "plus-modal-radius-md");
    modal.style.width = "672px";
    modal.style.minWidth = "672px";
    modal.style.maxWidth = "672px";
    modal.style.backgroundColor = "var(--color-surface-container)";
    
    // Adjust padding-y based on tab: "Add a new tutor" uses gap-sm (8px), others use gap-md (12px)
    if (tab === "Add a new tutor") {
        modal.style.paddingTop = "var(--size-modal-gap-sm)";
        modal.style.paddingBottom = "var(--size-modal-gap-sm)";
    }

    // Header
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.gap = "var(--size-element-gap-lg)";
    header.style.alignItems = "center";
    header.style.borderBottom = "1px solid var(--color-outline-variant)";
    header.style.paddingBottom = "var(--size-modal-pad-y-md)";
    header.style.marginBottom = "var(--size-modal-gap-md)";

    const title = document.createElement("div");
    title.className = "h4";
    title.textContent = tab === "Add a new tutor" ? "Add a new tutor:" : tutorName;
    title.style.flex = "1";
    header.appendChild(title);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "btn btn-link";
    closeButton.style.border = "none";
    closeButton.style.background = "none";
    closeButton.style.padding = "0";
    closeButton.style.cursor = "pointer";
    closeButton.innerHTML = '<i class="fas fa-xmark" style="font-size: 24px; color: var(--color-on-surface-variant);"></i>';
    if (onClose) {
        closeButton.addEventListener("click", onClose);
    }
    header.appendChild(closeButton);

    modal.appendChild(header);

    // Tab buttons
    const tabContainer = document.createElement("div");
    tabContainer.style.display = "flex";
    tabContainer.style.gap = "0";
    tabContainer.style.borderRadius = "var(--size-element-radius-md)";
    tabContainer.style.overflow = "hidden";
    tabContainer.style.marginBottom = "var(--size-modal-gap-md)";

    const infoTab = document.createElement("button");
    infoTab.type = "button";
    infoTab.className = "btn";
    infoTab.textContent = "Tutor Info";
    infoTab.style.flex = "1";
    infoTab.style.borderRadius = "var(--size-element-radius-md) 0 0 var(--size-element-radius-md)";
    infoTab.style.border = "none";
    infoTab.style.padding = "var(--size-element-pad-y-md) var(--size-element-pad-x-md)";
    if (tab === "Info") {
        infoTab.style.backgroundColor = "var(--color-primary-state-08)";
        infoTab.style.color = "var(--color-primary-text)";
        infoTab.style.fontWeight = "600";
    } else {
        infoTab.style.backgroundColor = "var(--color-secondary-state-08)";
        infoTab.style.color = "var(--color-secondary-text)";
        infoTab.style.fontWeight = "600";
    }

    const sessionsTab = document.createElement("button");
    sessionsTab.type = "button";
    sessionsTab.className = "btn";
    sessionsTab.textContent = "Sessions";
    sessionsTab.style.flex = "1";
    sessionsTab.style.borderRadius = "0 var(--size-element-radius-md) var(--size-element-radius-md) 0";
    sessionsTab.style.border = "none";
    sessionsTab.style.padding = "var(--size-element-pad-y-md) var(--size-element-pad-x-md)";
    
    const sessionsCounter = document.createElement("span");
    sessionsCounter.style.backgroundColor = "var(--color-on-surface-state-08)";
    sessionsCounter.style.borderRadius = "var(--size-element-radius-pill)";
    sessionsCounter.style.padding = "0 var(--size-element-pad-x-sm)";
    sessionsCounter.style.height = "16px";
    sessionsCounter.style.display = "inline-flex";
    sessionsCounter.style.alignItems = "center";
    sessionsCounter.style.marginLeft = "var(--size-element-gap-sm)";
    sessionsCounter.style.fontSize = "12px";
    sessionsCounter.textContent = "20";
    sessionsTab.appendChild(document.createTextNode("Sessions "));
    sessionsTab.appendChild(sessionsCounter);

    if (tab === "Sessions") {
        sessionsTab.style.backgroundColor = "var(--color-primary-state-08)";
        sessionsTab.style.color = "var(--color-primary-text)";
        sessionsTab.style.fontWeight = "600";
    } else {
        sessionsTab.style.backgroundColor = "var(--color-secondary-state-08)";
        sessionsTab.style.color = "var(--color-secondary-text)";
        sessionsTab.style.fontWeight = "600";
    }

    tabContainer.appendChild(infoTab);
    tabContainer.appendChild(sessionsTab);
    modal.appendChild(tabContainer);

    // Body content based on active tab
    const body = document.createElement("div");
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.gap = "var(--size-modal-gap-md)";

    if (tab === "Info") {
        // View Training Progress button
        const viewTrainingBtn = createButton({
            btnText: "View Training Progress",
            btnStyle: "primary",
            btnFill: "text",
            btnSize: "default",
            icon: "arrow-up-right-from-square",
            iconPosition: "right",
            iconStyle: "solid"
        });
        viewTrainingBtn.style.marginBottom = "var(--size-element-gap-lg)";
        body.appendChild(viewTrainingBtn);

        // Preferred name field
        const preferredNameContainer = createFormField({
            label: "Preferred name",
            value: "Amy",
            readonly: true
        });
        body.appendChild(preferredNameContainer);

        // Email field
        const emailContainer = createFormField({
            label: "Email",
            value: "name@example.com",
            readonly: true
        });
        body.appendChild(emailContainer);

        // Schools field (read-only with badges)
        const schoolsContainer = createFormFieldWithBadges({
            label: "Schools this tutor works with",
            badges: ["Option #1", "Option #2", "Option #3"],
            readonly: true
        });
        body.appendChild(schoolsContainer);

        // Students field (read-only with badges)
        const studentsContainer = createFormFieldWithBadges({
            label: "Students this tutor has worked with",
            badges: ["Option #1", "Option #2", "Option #3"],
            readonly: true,
            caption: "(#) students"
        });
        body.appendChild(studentsContainer);

        // Lead switch
        const leadSwitch = createSwitch({
            label: "This tutor is a lead",
            name: "isLead",
            id: "isLead-switch",
            checked: true
        });
        leadSwitch.style.marginTop = "var(--size-element-gap-sm)";
        body.appendChild(leadSwitch);

    } else if (tab === "Sessions") {
        // Show Future Sessions switch
        const futureSessionsSwitch = createSwitch({
            label: "Show Future Sessions",
            name: "showFuture",
            id: "showFuture-switch",
            checked: true
        });
        body.appendChild(futureSessionsSwitch);

        // Sessions table
        const table = createSessionsTable();
        body.appendChild(table);

        // Pagination footer
        const paginationFooter = createPaginationFooter();
        body.appendChild(paginationFooter);

    } else if (tab === "Add a new tutor") {
        // Tab buttons for Individual/Multiple
        const tutorTypeContainer = document.createElement("div");
        tutorTypeContainer.style.display = "flex";
        tutorTypeContainer.style.gap = "0";
        tutorTypeContainer.style.borderRadius = "var(--size-element-radius-md)";
        tutorTypeContainer.style.overflow = "hidden";
        tutorTypeContainer.style.marginBottom = "var(--size-modal-gap-md)";

        const individualTab = document.createElement("button");
        individualTab.type = "button";
        individualTab.className = "btn";
        individualTab.innerHTML = '<i class="fas fa-user" style="margin-right: var(--size-element-gap-md);"></i>Individual Tutor';
        individualTab.style.flex = "1";
        individualTab.style.borderRadius = "var(--size-element-radius-md) 0 0 var(--size-element-radius-md)";
        individualTab.style.border = "none";
        individualTab.style.padding = "var(--size-element-pad-y-md) var(--size-element-pad-x-md)";
        individualTab.style.backgroundColor = "var(--color-primary-state-08)";
        individualTab.style.color = "var(--color-primary-text)";
        individualTab.style.fontWeight = "600";

        const multipleTab = document.createElement("button");
        multipleTab.type = "button";
        multipleTab.className = "btn";
        multipleTab.innerHTML = '<i class="fas fa-users" style="margin-right: var(--size-element-gap-md);"></i>Multiple Tutors';
        multipleTab.style.flex = "1";
        multipleTab.style.borderRadius = "0 var(--size-element-radius-md) var(--size-element-radius-md) 0";
        multipleTab.style.border = "none";
        multipleTab.style.padding = "var(--size-element-pad-y-md) var(--size-element-pad-x-md)";
        multipleTab.style.backgroundColor = "var(--color-secondary-state-08)";
        multipleTab.style.color = "var(--color-secondary-text)";
        multipleTab.style.fontWeight = "600";

        tutorTypeContainer.appendChild(individualTab);
        tutorTypeContainer.appendChild(multipleTab);
        body.appendChild(tutorTypeContainer);

        // Form fields
        const formFieldsContainer = document.createElement("div");
        formFieldsContainer.style.display = "flex";
        formFieldsContainer.style.gap = "var(--size-element-gap-lg)";
        formFieldsContainer.style.marginBottom = "var(--size-element-gap-lg)";

        const firstNameField = createFormField({
            label: "First Name",
            placeholder: "E.x. Jon",
            required: true
        });
        firstNameField.style.width = "275px";
        formFieldsContainer.appendChild(firstNameField);

        const lastNameField = createFormField({
            label: "Last Name",
            placeholder: "E.x. Doe",
            required: true
        });
        lastNameField.style.width = "275px";
        formFieldsContainer.appendChild(lastNameField);

        body.appendChild(formFieldsContainer);

        // Preferred Name field
        const preferredNameField = createFormField({
            label: "Preferred Name",
            placeholder: "Preferred Name (optional)"
        });
        body.appendChild(preferredNameField);

        // Tutor Email field
        const tutorEmailField = createFormField({
            label: "Tutor Email",
            placeholder: "Tutor email (optional)"
        });
        body.appendChild(tutorEmailField);

        // Groups dropdown
        const groupsField = createSelectField({
            label: "Groups this tutor is enrolled in",
            placeholder: "None selected"
        });
        body.appendChild(groupsField);

        // Students dropdown
        const studentsField = createSelectField({
            label: "Students this tutor has worked with",
            placeholder: "For Toolkit Admin only"
        });
        body.appendChild(studentsField);

        // Lead switch
        const leadSwitch = createSwitch({
            label: "This tutor is a lead.",
            name: "isLeadNew",
            id: "isLeadNew-switch",
            checked: true
        });
        leadSwitch.style.marginTop = "var(--size-element-gap-sm)";
        body.appendChild(leadSwitch);
    }

    modal.appendChild(body);

    // Footer buttons
    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.gap = "var(--size-element-gap-lg)";
    footer.style.justifyContent = "flex-end";
    footer.style.borderTop = "1px solid var(--color-outline-variant)";
    footer.style.padding = "var(--size-element-pad-y-lg) var(--size-element-pad-x-lg)";
    footer.style.marginTop = "var(--size-modal-gap-md)";

    if (tab === "Add a new tutor") {
        const cancelBtn = createButton({
            btnText: "Cancel",
            btnStyle: "secondary",
            btnFill: "tonal",
            btnSize: "default"
        });
        footer.appendChild(cancelBtn);

        const saveBtn = createButton({
            btnText: "Save",
            btnStyle: "default",
            btnFill: "filled",
            btnSize: "default"
        });
        saveBtn.style.opacity = "0.38";
        saveBtn.disabled = true;
        footer.appendChild(saveBtn);
    } else {
        const deleteBtn = createButton({
            btnText: "Delete This Tutor",
            btnStyle: "error",
            btnFill: "text",
            btnSize: "default"
        });
        footer.appendChild(deleteBtn);

        const cancelBtn = createButton({
            btnText: "Cancel",
            btnStyle: "secondary",
            btnFill: "tonal",
            btnSize: "default"
        });
        footer.appendChild(cancelBtn);

        const saveBtn = createButton({
            btnText: "Save",
            btnStyle: "default",
            btnFill: "filled",
            btnSize: "default"
        });
        saveBtn.style.opacity = "0.38";
        saveBtn.disabled = true;
        footer.appendChild(saveBtn);
    }

    modal.appendChild(footer);

    return modal;
}

/**
 * Creates a form field with label and input
 */
function createFormField({ label, value, placeholder, readonly = false, required = false }) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "var(--size-element-gap-xs)";

    const labelEl = document.createElement("label");
    labelEl.className = "body3-txt";
    labelEl.style.fontWeight = "300";
    labelEl.style.color = "var(--color-on-surface)";
    
    const labelText = document.createElement("span");
    labelText.textContent = label;
    labelEl.appendChild(labelText);

    if (required) {
        const asterisk = document.createElement("span");
        asterisk.textContent = " *";
        asterisk.style.color = "var(--color-danger)";
        labelEl.appendChild(asterisk);
    }

    container.appendChild(labelEl);

    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-control plus-text-field body2-txt";
    if (value) {
        input.value = value;
    }
    if (placeholder) {
        input.placeholder = placeholder;
    }
    if (readonly) {
        input.readOnly = true;
        input.style.backgroundColor = "var(--color-surface-variant)";
    }

    container.appendChild(input);

    return container;
}

/**
 * Creates a form field with badges (read-only)
 */
function createFormFieldWithBadges({ label, badges, readonly = false, caption = null }) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "var(--size-element-gap-xs)";

    const labelEl = document.createElement("label");
    labelEl.className = "body3-txt";
    labelEl.style.fontWeight = readonly ? "400" : "300";
    labelEl.style.color = readonly ? "var(--color-on-surface-variant)" : "var(--color-on-surface)";
    labelEl.textContent = label;
    container.appendChild(labelEl);

    const badgesContainer = document.createElement("div");
    badgesContainer.style.display = "flex";
    badgesContainer.style.flexWrap = "wrap";
    badgesContainer.style.gap = "4px";
    badgesContainer.style.padding = "var(--size-element-pad-y-lg) var(--size-element-pad-x-lg)";
    badgesContainer.style.backgroundColor = readonly ? "var(--color-surface-variant)" : "var(--color-surface)";
    badgesContainer.style.border = "0.8px solid var(--color-outline-variant)";
    badgesContainer.style.borderRadius = readonly ? "var(--size-element-radius-sm)" : "var(--size-element-radius-sm)";
    badgesContainer.style.minHeight = "34px";

    badges.forEach(badgeText => {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.style.backgroundColor = "var(--color-on-surface-state-08)";
        badge.style.color = "var(--color-on-surface)";
        badge.style.padding = "0 var(--size-element-pad-x-md)";
        badge.style.borderRadius = "var(--size-element-radius-pill)";
        badge.style.fontSize = "14px";
        badge.style.fontWeight = "400";
        badge.textContent = badgeText;
        badgesContainer.appendChild(badge);
    });

    container.appendChild(badgesContainer);

    if (caption) {
        const captionEl = document.createElement("div");
        captionEl.className = "body3-txt";
        captionEl.style.fontWeight = "300";
        captionEl.style.color = "var(--color-on-surface)";
        captionEl.style.marginTop = "var(--size-element-gap-xs)";
        captionEl.textContent = caption;
        container.appendChild(captionEl);
    }

    return container;
}

/**
 * Creates a select field
 */
function createSelectField({ label, placeholder }) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "var(--size-element-gap-xs)";

    const labelEl = document.createElement("label");
    labelEl.className = "body3-txt";
    labelEl.style.fontWeight = "300";
    labelEl.style.color = "var(--color-on-surface)";
    labelEl.textContent = label;
    container.appendChild(labelEl);

    const selectContainer = document.createElement("div");
    selectContainer.style.position = "relative";

    const select = document.createElement("select");
    select.className = "form-control plus-text-field body2-txt";
    select.style.paddingRight = "var(--size-element-pad-x-lg)";
    select.style.appearance = "none";
    select.style.backgroundImage = "url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%233f484a\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E')";
    select.style.backgroundRepeat = "no-repeat";
    select.style.backgroundPosition = "right var(--size-element-pad-x-md) center";
    select.style.backgroundSize = "12px";

    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholder;
    option.disabled = true;
    option.selected = true;
    select.appendChild(option);

    selectContainer.appendChild(select);
    container.appendChild(selectContainer);

    return container;
}

/**
 * Creates sessions table
 */
function createSessionsTable() {
    const tableContainer = document.createElement("div");
    tableContainer.style.display = "flex";
    tableContainer.style.flexDirection = "column";
    tableContainer.style.gap = "0";

    // Table header
    const headerRow = document.createElement("div");
    headerRow.style.display = "grid";
    headerRow.style.gridTemplateColumns = "repeat(3, 1fr)";
    headerRow.style.gap = "var(--size-table-cell-gap)";
    headerRow.style.height = "40px";
    headerRow.style.alignItems = "center";
    headerRow.style.borderRadius = "var(--size-element-radius-sm)";
    headerRow.style.backgroundColor = "transparent";

    const headers = [
        { text: "Day (Date)", icon: "arrow-up" },
        { text: "Shift (ET)", icon: "arrow-up" },
        { text: "School", icon: "arrow-up" }
    ];

    headers.forEach((header, index) => {
        const headerCell = document.createElement("div");
        headerCell.style.display = "flex";
        headerCell.style.gap = "var(--size-element-gap-md)";
        headerCell.style.alignItems = "center";
        headerCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        headerCell.style.fontSize = "12px";
        headerCell.style.fontWeight = "400";
        headerCell.style.color = index === 0 ? "var(--color-secondary-text)" : "var(--color-on-surface)";

        const headerText = document.createElement("span");
        headerText.textContent = header.text;
        headerCell.appendChild(headerText);

        const icon = document.createElement("i");
        icon.className = `fas fa-${header.icon}`;
        icon.style.fontSize = "10px";
        icon.style.color = "var(--color-on-surface-variant)";
        headerCell.appendChild(icon);

        headerRow.appendChild(headerCell);
    });

    tableContainer.appendChild(headerRow);

    // Table rows
    const rows = [
        { day: "Monday (01/31/25)", shift: "0:00 PM - 0:00 PM", school: "No" },
        { day: "Friday (01/28/25)", shift: "0:00 PM - 0:00 PM", school: "No" },
        { day: "Thursday (01/27/25)", shift: "0:00 PM - 0:00 PM", school: "No" },
        { day: "Wednesday (01/26/25)", shift: "0:00 PM - 0:00 PM", school: "No" },
        { day: "Tuesday (01/25/25)", shift: "0:00 PM - 0:00 PM", school: "No" }
    ];

    rows.forEach((row, index) => {
        const rowEl = document.createElement("div");
        rowEl.style.display = "grid";
        rowEl.style.gridTemplateColumns = "repeat(3, 1fr)";
        rowEl.style.gap = "var(--size-table-cell-gap)";
        rowEl.style.height = "36px";
        rowEl.style.alignItems = "center";
        rowEl.style.borderRadius = index === rows.length - 1 ? "var(--size-element-radius-sm)" : "var(--size-table-radius-md)";

        const dayCell = document.createElement("div");
        dayCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        dayCell.style.fontSize = "12px";
        dayCell.style.fontWeight = "300";
        dayCell.style.color = "var(--color-on-surface)";
        dayCell.textContent = row.day;
        rowEl.appendChild(dayCell);

        const shiftCell = document.createElement("div");
        shiftCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        shiftCell.style.fontSize = "12px";
        shiftCell.style.fontWeight = "300";
        shiftCell.style.color = "var(--color-on-surface)";
        shiftCell.textContent = row.shift;
        rowEl.appendChild(shiftCell);

        const schoolCell = document.createElement("div");
        schoolCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.style.backgroundColor = "var(--color-on-surface-state-08)";
        badge.style.color = "var(--color-on-surface)";
        badge.style.padding = "0 var(--size-element-pad-x-md)";
        badge.style.borderRadius = "var(--size-element-radius-pill)";
        badge.style.fontSize = "12px";
        badge.style.fontWeight = "400";
        badge.textContent = row.school;
        schoolCell.appendChild(badge);
        rowEl.appendChild(schoolCell);

        tableContainer.appendChild(rowEl);
    });

    return tableContainer;
}

/**
 * Creates pagination footer
 */
function createPaginationFooter() {
    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.justifyContent = "space-between";
    footer.style.alignItems = "center";
    footer.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

    const info = document.createElement("div");
    info.className = "body2-txt";
    info.style.fontWeight = "300";
    info.style.color = "var(--color-on-surface)";
    info.textContent = "Showing 1 to 5 of 36 entries";
    footer.appendChild(info);

    const pagination = document.createElement("div");
    pagination.style.display = "flex";
    pagination.style.gap = "0";
    pagination.style.borderRadius = "var(--size-element-radius-sm)";
    pagination.style.overflow = "hidden";

    // Previous button
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "btn btn-sm";
    prevBtn.innerHTML = '<i class="fas fa-caret-left"></i>';
    prevBtn.style.border = "1px solid var(--color-outline-variant)";
    prevBtn.style.borderRight = "none";
    prevBtn.style.borderRadius = "var(--size-element-radius-pill) 0 0 var(--size-element-radius-pill)";
    prevBtn.style.padding = "var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)";
    prevBtn.style.backgroundColor = "transparent";
    pagination.appendChild(prevBtn);

    // Page numbers
    const pages = [1, "...", 4, 5, 6, "...", 10];
    pages.forEach((page, index) => {
        const pageBtn = document.createElement("button");
        pageBtn.type = "button";
        pageBtn.className = "btn btn-sm";
        pageBtn.textContent = page;
        pageBtn.style.border = "1px solid var(--color-outline-variant)";
        pageBtn.style.borderLeft = index === 0 ? "none" : "1px solid var(--color-outline-variant)";
        pageBtn.style.borderRight = index === pages.length - 1 ? "none" : "1px solid var(--color-outline-variant)";
        pageBtn.style.padding = "var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)";
        pageBtn.style.backgroundColor = page === 1 ? "var(--color-secondary-state-08)" : "transparent";
        pageBtn.style.color = page === 1 ? "var(--color-secondary-text)" : "var(--color-on-surface)";
        pageBtn.style.fontSize = "12px";
        pageBtn.style.fontWeight = page === 1 ? "400" : "300";
        if (page === "...") {
            pageBtn.disabled = true;
            pageBtn.style.cursor = "default";
        }
        pagination.appendChild(pageBtn);
    });

    // Next button
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn btn-sm";
    nextBtn.innerHTML = '<i class="fas fa-caret-right"></i>';
    nextBtn.style.border = "1px solid var(--color-outline-variant)";
    nextBtn.style.borderLeft = "none";
    nextBtn.style.borderRadius = "0 var(--size-element-radius-pill) var(--size-element-radius-pill) 0";
    nextBtn.style.padding = "var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)";
    nextBtn.style.backgroundColor = "transparent";
    pagination.appendChild(nextBtn);

    footer.appendChild(pagination);

    return footer;
}

