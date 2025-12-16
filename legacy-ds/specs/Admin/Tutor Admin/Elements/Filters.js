/**
 * @fileoverview Filters component for Admin specs
 * Filter component with dropdowns for Schools, Tutors, and date range
 * Matches Figma design system specifications
 */

import { createDropdown } from '../../../../components/Dropdown/index.js';

/**
 * Creates a date input styled like a button with dropdown icon (matching Figma design)
 * @param {string} value - Date value (DD/MM/YY format)
 * @returns {HTMLElement} Date input element
 */
function createDateInput(value) {
    const dateInputWrapper = document.createElement("div");
    dateInputWrapper.style.position = "relative";
    dateInputWrapper.style.display = "inline-flex";
    dateInputWrapper.style.alignItems = "center";
    
    // Create input styled like primary outline button
    const dateInput = document.createElement("input");
    dateInput.type = "text";
    dateInput.value = value;
    dateInput.style.fontFamily = "var(--font-family-body)";
    dateInput.style.fontSize = "var(--font-size-body3)";
    dateInput.style.fontWeight = "var(--font-weight-semibold-1)";
    dateInput.style.lineHeight = "1.667";
    dateInput.style.color = "var(--color-primary-text)";
    dateInput.style.border = "1px solid var(--color-primary)";
    dateInput.style.borderRadius = "var(--size-element-radius-sm)";
    dateInput.style.padding = "var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)";
    dateInput.style.paddingRight = "calc(var(--size-element-pad-x-sm) + var(--size-element-gap-md))"; // Space for icon
    dateInput.style.backgroundColor = "transparent";
    dateInput.style.outline = "none";
    dateInput.style.minWidth = "80px";
    dateInput.style.width = "auto";
    dateInput.style.cursor = "pointer";
    
    // Add caret-down icon using Font Awesome
    const icon = document.createElement("i");
    icon.className = "fas fa-caret-down";
    icon.style.position = "absolute";
    icon.style.right = "var(--size-element-pad-x-sm)";
    icon.style.fontSize = "10px";
    icon.style.color = "var(--color-primary-text)";
    icon.style.pointerEvents = "none";
    
    dateInputWrapper.appendChild(dateInput);
    dateInputWrapper.appendChild(icon);
    
    return dateInputWrapper;
}

/**
 * Creates a Filters component matching Figma design
 * @param {Object} options - Filter configuration
 * @param {string} [options.schoolFilter="All Schools"] - School filter text
 * @param {string} [options.tutorFilter="All Tutors"] - Tutor filter text
 * @param {string} [options.startDate="01/10/25"] - Start date (DD/MM/YY format)
 * @param {string} [options.endDate="02/10/25"] - End date (DD/MM/YY format)
 * @returns {HTMLElement} Filters element
 */
export function createFilters({
    schoolFilter = "All Schools",
    tutorFilter = "All Tutors",
    startDate = "01/10/25",
    endDate = "02/10/25"
} = {}) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.gap = "var(--size-element-gap-sm)";
    container.style.alignItems = "center";
    container.style.flexWrap = "wrap";

    // School dropdown
    const schoolDropdown = createDropdown({
        buttonText: schoolFilter,
        size: "small",
        style: "secondary",
        items: [
            { text: "All Schools", selected: true },
            { text: "School 1" },
            { text: "School 2" }
        ]
    });
    schoolDropdown.style.flexShrink = "0";
    container.appendChild(schoolDropdown);

    // Tutor dropdown
    const tutorDropdown = createDropdown({
        buttonText: tutorFilter,
        size: "small",
        style: "secondary",
        items: [
            { text: "All Tutors", selected: true },
            { text: "Tutor 1" },
            { text: "Tutor 2" }
        ]
    });
    tutorDropdown.style.flexShrink = "0";
    container.appendChild(tutorDropdown);

    // Start date input
    const startDateInput = createDateInput(startDate);
    startDateInput.style.flexShrink = "0";
    container.appendChild(startDateInput);

    // "to" text
    const toText = document.createElement("span");
    toText.style.fontFamily = "var(--font-family-body)";
    toText.style.fontSize = "var(--font-size-body2)";
    toText.style.fontWeight = "var(--font-weight-normal)";
    toText.style.lineHeight = "1.571";
    toText.style.color = "var(--color-on-surface)";
    toText.style.whiteSpace = "nowrap";
    toText.textContent = "to";
    container.appendChild(toText);

    // End date input
    const endDateInput = createDateInput(endDate);
    endDateInput.style.flexShrink = "0";
    container.appendChild(endDateInput);

    return container;
}

