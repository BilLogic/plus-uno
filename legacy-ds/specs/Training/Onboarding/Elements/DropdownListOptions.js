/**
 * @fileoverview DropdownListOptions component for Training Onboarding Elements
 * Dropdown menu with sorting options: name, duration, progress
 * Matches Figma design system specifications
 */

/**
 * Creates a DropdownListOptions component
 * @param {Object} options - Component configuration
 * @param {string} [options.type="name"] - Dropdown type: "name", "duration", "progress"
 * @returns {HTMLElement} DropdownListOptions element
 */
export function createDropdownListOptions({ type = "name" } = {}) {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "flex-start";
    
    const dropdownList = document.createElement("div");
    dropdownList.style.backgroundColor = "var(--color-surface-container-high)";
    dropdownList.style.borderRadius = "var(--size-element-radius-md)";
    dropdownList.style.boxShadow = "var(--elevation-light-3)";
    dropdownList.style.minWidth = "162px";
    dropdownList.style.maxWidth = "218px";
    dropdownList.style.width = "332px";
    dropdownList.style.overflow = "hidden";
    dropdownList.style.display = "flex";
    dropdownList.style.flexDirection = "column";
    
    // "Sort by" header (disabled)
    const sortByHeader = createDropdownItem("Sort by", false, false, true);
    dropdownList.appendChild(sortByHeader);
    
    // Options based on type
    if (type === "name") {
        const nameItem = createDropdownItem("Name", true, false, false);
        nameItem.style.backgroundColor = "var(--color-surface-container-highest)";
        dropdownList.appendChild(nameItem);
        
        dropdownList.appendChild(createDropdownItem("Duration", false, false, false));
        dropdownList.appendChild(createDropdownItem("Progress", false, false, false));
        
        // Divider
        const divider = createDivider();
        dropdownList.appendChild(divider);
        
        // Order section
        const orderHeader = createDropdownItem("Order", false, false, true);
        dropdownList.appendChild(orderHeader);
        
        const azItem = createDropdownItem("A-Z", true, false, false);
        azItem.style.backgroundColor = "var(--color-surface-container-highest)";
        dropdownList.appendChild(azItem);
        
        dropdownList.appendChild(createDropdownItem("Z-A", false, false, false));
    } else if (type === "duration") {
        dropdownList.appendChild(createDropdownItem("Name", false, false, false));
        
        const durationItem = createDropdownItem("Duration", true, false, false);
        durationItem.style.backgroundColor = "var(--color-surface-container-highest)";
        dropdownList.appendChild(durationItem);
        
        dropdownList.appendChild(createDropdownItem("Progress", false, false, false));
        
        // Divider
        const divider = createDivider();
        dropdownList.appendChild(divider);
        
        // Order section
        const orderHeader = createDropdownItem("Order", false, false, true);
        dropdownList.appendChild(orderHeader);
        
        const shortestItem = createDropdownItem("Shortest First", true, false, false);
        shortestItem.style.backgroundColor = "var(--color-surface-container-highest)";
        dropdownList.appendChild(shortestItem);
        
        dropdownList.appendChild(createDropdownItem("Longest Last", false, false, false));
    } else if (type === "progress") {
        dropdownList.appendChild(createDropdownItem("Name", false, false, false));
        dropdownList.appendChild(createDropdownItem("Duration", false, false, false));
        
        const progressItem = createDropdownItem("Progress", true, false, false);
        progressItem.style.backgroundColor = "var(--color-surface-container-highest)";
        dropdownList.appendChild(progressItem);
        
        // Divider
        const divider = createDivider();
        dropdownList.appendChild(divider);
        
        // Order section
        const orderHeader = createDropdownItem("Order", false, false, true);
        dropdownList.appendChild(orderHeader);
        
        const completedFirstItem = createDropdownItem("Completed First", true, false, false);
        completedFirstItem.style.backgroundColor = "var(--color-surface-container-highest)";
        dropdownList.appendChild(completedFirstItem);
        
        dropdownList.appendChild(createDropdownItem("Completed Last", false, false, false));
    }
    
    container.appendChild(dropdownList);
    return container;
}

/**
 * Creates a dropdown item
 * @param {string} text - Item text
 * @param {boolean} selected - Whether item is selected
 * @param {boolean} disabled - Whether item is disabled
 * @returns {HTMLElement} Dropdown item element
 */
function createDropdownItem(text, selected = false, disabled = false, isHeader = false) {
    const item = document.createElement(selected && !isHeader ? "button" : "div");
    if (item.tagName === "button") {
        item.type = "button";
        item.style.border = "none";
        item.style.cursor = "pointer";
        item.style.width = "100%";
        item.style.textAlign = "left";
        item.style.fontFamily = "inherit";
        item.style.fontSize = "inherit";
    }
    item.style.display = "flex";
    item.style.flexDirection = "column";
    item.style.alignItems = "flex-start";
    item.style.justifyContent = "center";
    item.style.width = "100%";
    item.style.padding = "var(--size-element-pad-y-md) var(--size-element-pad-x-md)";
    item.style.gap = "var(--size-element-gap-md)";
    
    if (!selected || isHeader) {
        item.style.cursor = isHeader ? "default" : "pointer";
    }
    
    if (disabled || isHeader) {
        item.style.opacity = "0.38";
    }
    
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "var(--size-element-gap-md)";
    container.style.width = "100%";
    
    // Checkmark icon
    const checkIcon = document.createElement("i");
    checkIcon.className = "fas fa-check";
    checkIcon.style.fontSize = "12px";
    checkIcon.style.color = selected ? "var(--color-on-surface)" : "var(--color-on-surface-variant)";
    checkIcon.style.opacity = selected ? "1" : "0";
    checkIcon.style.width = "12px";
    checkIcon.style.display = "flex";
    checkIcon.style.alignItems = "center";
    checkIcon.style.justifyContent = "center";
    checkIcon.style.flexShrink = "0";
    
    container.appendChild(checkIcon);
    
    // Text
    const textElement = document.createElement("span");
    textElement.style.fontFamily = "var(--font-family-body)";
    textElement.style.fontSize = "var(--font-size-body2)";
    textElement.style.fontWeight = "var(--font-weight-normal)";
    textElement.style.lineHeight = "1.571";
    textElement.style.color = "var(--color-on-surface)";
    textElement.style.whiteSpace = "nowrap";
    textElement.style.overflow = "hidden";
    textElement.style.textOverflow = "ellipsis";
    textElement.style.flex = "1";
    textElement.textContent = text;
    
    container.appendChild(textElement);
    item.appendChild(container);
    
    return item;
}

/**
 * Creates a divider element
 * @returns {HTMLElement} Divider element
 */
function createDivider() {
    const divider = document.createElement("div");
    divider.style.borderTop = "1px solid var(--color-outline)";
    divider.style.opacity = "0.38";
    divider.style.width = "100%";
    return divider;
}

