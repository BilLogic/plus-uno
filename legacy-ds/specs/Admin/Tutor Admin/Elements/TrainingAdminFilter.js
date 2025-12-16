/**
 * @fileoverview TrainingAdminFilter component for Admin specs
 * Filter component for Training Admin with Export CSV, search, and filter dropdowns
 * Supports both medium and large breakpoint variants
 */

import { createButton } from '../../../../components/Button/index.js';
import { createDropdown } from '../../../../components/Dropdown/index.js';

/**
 * Creates a TrainingAdminFilter component
 * @param {Object} options - Filter configuration
 * @param {string} [options.breakpoint="medium"] - Breakpoint variant: "medium" or "large"
 * @returns {HTMLElement} Filter element
 */
export function createTrainingAdminFilter({
    breakpoint = "medium"
} = {}) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexWrap = "wrap";
    container.style.gap = "12px";
    container.style.alignItems = "center";
    container.style.justifyContent = "space-between";
    container.style.width = "100%";
    container.style.marginBottom = "var(--size-section-gap-sm)";

    // Left section: Export CSV button and Search
    const leftSection = document.createElement("div");
    leftSection.style.display = "flex";
    leftSection.style.gap = "var(--size-element-gap-sm)";
    leftSection.style.alignItems = "center";

    // Export CSV button
    // Figma: body3-txt (12px) text, icon size varies by breakpoint (16px medium, 10px large)
    const exportButton = createButton({
        btnText: "Export CSV",
        btnStyle: "primary",
        btnFill: "filled",
        btnSize: "small", // Use "small" to get body3-txt (12px) instead of body2-txt (14px)
        icon: "download",
        iconPosition: "leading"
    });
    
    // Set icon size based on breakpoint - Figma: 16px for medium, 10px for large
    const iconElement = exportButton.querySelector('i');
    if (iconElement) {
        iconElement.style.fontSize = breakpoint === "medium" ? "16px" : "10px";
        iconElement.style.lineHeight = breakpoint === "medium" ? "1.75" : "2";
    }
    
    leftSection.appendChild(exportButton);

    // Search input
    const searchContainer = document.createElement("div");
    searchContainer.style.display = "flex";
    searchContainer.style.alignItems = "center";
    searchContainer.style.maxWidth = breakpoint === "medium" ? "218px" : "142.66px";
    searchContainer.style.minWidth = breakpoint === "medium" ? "162px" : "105.33px";
    searchContainer.style.width = breakpoint === "medium" ? "218px" : "142.66px";

    const searchInput = document.createElement("div");
    searchInput.style.display = "flex";
    searchInput.style.flexDirection = "column";
    searchInput.style.gap = "var(--size-element-gap-xs)";
    searchInput.style.flex = "1 0 0";
    searchInput.style.minWidth = "0";
    searchInput.style.minHeight = "0";
    searchInput.style.overflow = "hidden";
    searchInput.style.borderRadius = "2px 2px 0 0";

    const inputWrapper = document.createElement("div");
    inputWrapper.style.backgroundColor = "var(--color-surface)";
    inputWrapper.style.border = "0.6px solid var(--color-outline-variant)";
    inputWrapper.style.borderRadius = "2px 2px 0 0";
    inputWrapper.style.width = "100%";

    const inputInner = document.createElement("div");
    inputInner.style.display = "flex";
    inputInner.style.gap = "var(--size-element-gap-md)";
    inputInner.style.alignItems = "center";
    inputInner.style.overflow = "hidden";
    inputInner.style.padding = "var(--size-element-pad-y-md) var(--size-element-pad-x-md)";
    inputInner.style.borderRadius = "inherit";
    inputInner.style.width = "100%";

    // Search icon (only for medium breakpoint)
    if (breakpoint === "medium") {
        const searchIcon = document.createElement("i");
        searchIcon.className = "fas fa-magnifying-glass";
        searchIcon.style.fontSize = "10px";
        searchIcon.style.color = "var(--color-on-surface-variant)";
        searchIcon.style.flexShrink = "0";
        inputInner.appendChild(searchIcon);
    }

    // Search input text
    const inputText = document.createElement("div");
    inputText.style.fontFamily = "var(--font-family-body)";
    inputText.style.fontSize = "var(--font-size-body3)";
    inputText.style.fontWeight = "var(--font-weight-light)";
    inputText.style.lineHeight = "1.667";
    inputText.style.color = "var(--color-on-surface-variant)";
    inputText.style.flex = "1 0 0";
    inputText.style.minWidth = "0";
    inputText.style.minHeight = "0";
    inputText.textContent = "Search";
    inputInner.appendChild(inputText);

    // Clear icon (only for medium breakpoint)
    if (breakpoint === "medium") {
        const clearIcon = document.createElement("i");
        clearIcon.className = "fas fa-xmark";
        clearIcon.style.fontSize = "10px";
        clearIcon.style.color = "var(--color-on-surface-variant)";
        clearIcon.style.flexShrink = "0";
        inputInner.appendChild(clearIcon);
    }

    inputWrapper.appendChild(inputInner);
    searchInput.appendChild(inputWrapper);
    searchContainer.appendChild(searchInput);
    leftSection.appendChild(searchContainer);

    container.appendChild(leftSection);

    // Right section: Filter dropdowns
    const rightSection = document.createElement("div");
    rightSection.style.display = "flex";
    rightSection.style.gap = "var(--size-element-gap-sm)";
    rightSection.style.alignItems = "flex-end";
    rightSection.style.justifyContent = "flex-end";

    // All Lessons dropdown
    const lessonsDropdownContainer = document.createElement("div");
    lessonsDropdownContainer.style.display = "flex";
    lessonsDropdownContainer.style.flexDirection = "column";
    lessonsDropdownContainer.style.gap = "var(--size-element-gap-md)";
    lessonsDropdownContainer.style.alignItems = "flex-start";

    const lessonsDropdown = createDropdown({
        buttonText: "All Lessons",
        size: breakpoint === "medium" ? "default" : "small",
        style: "secondary",
        items: [
            { text: "All Lessons", selected: true },
            { text: "Lesson 1" },
            { text: "Lesson 2" }
        ]
    });
    lessonsDropdown.style.width = "100%";
    lessonsDropdownContainer.appendChild(lessonsDropdown);
    rightSection.appendChild(lessonsDropdownContainer);

    // All Start Date dropdown
    const startDateDropdownContainer = document.createElement("div");
    startDateDropdownContainer.style.display = "flex";
    startDateDropdownContainer.style.alignItems = "flex-start";

    const startDateDropdown = createDropdown({
        buttonText: "All Start Date",
        size: breakpoint === "medium" ? "default" : "small",
        style: "secondary",
        items: [
            { text: "All Start Date", selected: true },
            { text: "Date 1" },
            { text: "Date 2" }
        ]
    });
    startDateDropdownContainer.appendChild(startDateDropdown);
    rightSection.appendChild(startDateDropdownContainer);

    // Name sorting dropdown
    const nameDropdownContainer = document.createElement("div");
    nameDropdownContainer.style.display = "flex";
    nameDropdownContainer.style.flexDirection = "column";
    nameDropdownContainer.style.gap = breakpoint === "medium" ? "var(--size-element-gap-md)" : "10px";
    nameDropdownContainer.style.alignItems = "center";
    nameDropdownContainer.style.justifyContent = "center";

    const nameDropdown = createDropdown({
        buttonText: "Name",
        size: breakpoint === "medium" ? "default" : "small",
        style: "secondary",
        items: [
            { text: "Name", selected: true },
            { text: "Date" },
            { text: "Status" }
        ]
    });
    nameDropdown.style.width = "100%";
    nameDropdownContainer.appendChild(nameDropdown);
    rightSection.appendChild(nameDropdownContainer);

    container.appendChild(rightSection);

    return container;
}

