/**
 * @fileoverview SortingDropdown component for Training Onboarding Elements
 * Dropdown button with open/closed states for sorting
 * Matches Figma design system specifications
 */

import { createDropdownListOptions } from './DropdownListOptions.js';

/**
 * Creates a SortingDropdown component
 * @param {Object} options - Component configuration
 * @param {boolean} [options.status=false] - Whether dropdown is open
 * @returns {HTMLElement} SortingDropdown element
 */
export function createSortingDropdown({ status = false } = {}) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "flex-start";
    container.style.gap = "0";
    
    // Button
    const button = document.createElement("div");
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";
    button.style.borderRadius = "var(--size-element-radius-sm)";
    button.style.minWidth = "28px";
    button.style.padding = "var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)";
    button.style.gap = "var(--size-element-gap-sm)";
    button.style.cursor = "pointer";
    
    if (status) {
        button.style.backgroundColor = "var(--color-secondary-state-08)";
    }
    
    const text = document.createElement("span");
    text.style.fontFamily = "var(--font-family-body)";
    text.style.fontSize = "var(--font-size-body3)";
    text.style.fontWeight = "var(--font-weight-normal)";
    text.style.lineHeight = "1.667";
    text.style.color = "var(--color-secondary-text)";
    text.style.whiteSpace = "nowrap";
    text.textContent = "Name";
    
    const iconWrapper = document.createElement("div");
    iconWrapper.style.display = "flex";
    iconWrapper.style.alignItems = "center";
    iconWrapper.style.justifyContent = "center";
    iconWrapper.style.width = "7px";
    iconWrapper.style.height = "100%";
    iconWrapper.style.flexShrink = "0";
    
    const icon = document.createElement("i");
    icon.className = "fas fa-caret-down";
    icon.style.fontSize = "10px";
    icon.style.color = "var(--color-on-surface-variant)";
    icon.style.lineHeight = "2";
    
    iconWrapper.appendChild(icon);
    button.appendChild(text);
    button.appendChild(iconWrapper);
    
    container.appendChild(button);
    
    // Dropdown list (shown when status is true)
    if (status) {
        const dropdownList = createDropdownListOptions({ type: "name" });
        dropdownList.style.marginTop = "0";
        container.appendChild(dropdownList);
    }
    
    return container;
}

