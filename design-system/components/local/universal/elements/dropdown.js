/**
 * @fileoverview Dropdown component for PLUS design system.
 * Universal element component for creating dropdown menus.
 */

/**
 * Creates a dropdown element styled according to PLUS design system
 * @param {Object} options - Dropdown configuration options
 * @param {string} [options.id] - Dropdown ID
 * @param {string} [options.buttonText="Dropdown"] - Button text
 * @param {Array<Object>} [options.items=[]] - Array of dropdown items
 * @param {string} [options.size="default"] - Dropdown size ("small", "default", "large")
 * @param {string} [options.style="default"] - Dropdown style ("primary", "secondary", "success", "danger", "warning", "info", "default")
 * @param {boolean} [options.split=false] - Whether to use split button dropdown
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @returns {HTMLElement} Dropdown element
 */
export function createDropdown({
    id,
    buttonText = "Dropdown",
    items = [],
    size = "default",
    style = "default",
    split = false,
    classes = []
} = {}) {
    const dropdown = document.createElement("div");
    dropdown.classList.add("pdropdown", "dropdown");
    
    if (size && size !== "default") {
        dropdown.classList.add(size);
    }
    
    if (style && style !== "default") {
        dropdown.classList.add(`pdropdown-${style}`);
    }
    
    if (split) {
        dropdown.classList.add("pdropdown-split-dropdown");
    }
    
    if (classes && classes.length > 0) {
        dropdown.classList.add(...classes);
    }
    
    if (id) {
        dropdown.id = id;
    }
    
    // Create toggle button
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.classList.add("pdropdown-default-toggle", "dropdown-toggle");
    toggle.setAttribute("data-toggle", "dropdown");
    toggle.setAttribute("aria-haspopup", "true");
    toggle.setAttribute("aria-expanded", "false");
    
    // Create button content wrapper
    const buttonContent = document.createElement("span");
    buttonContent.textContent = buttonText;
    toggle.appendChild(buttonContent);
    
    // Caret is added via CSS ::after pseudo-element, so we don't need to add it here
    
    // Create dropdown menu
    const menu = document.createElement("div");
    menu.classList.add("dropdown-menu");
    
    // Add items to menu
    items.forEach((item, index) => {
        const menuItem = document.createElement("button");
        menuItem.type = "button";
        menuItem.classList.add("dropdown-item");
        
        if (item.selected) {
            menuItem.classList.add("selected");
        }
        
        if (item.disabled) {
            menuItem.disabled = true;
            menuItem.classList.add("disabled");
        }
        
        if (item.header) {
            menuItem.classList.add("dropdown-section-header");
        }
        
        // Create item content container
        const itemContainer = document.createElement("div");
        itemContainer.style.display = "flex";
        itemContainer.style.alignItems = "center";
        itemContainer.style.gap = "var(--size-element-gap-md)";
        itemContainer.style.width = "100%";
        
        // Add checkmark icon if selected
        if (item.selected) {
            const checkIcon = document.createElement("i");
            checkIcon.classList.add("fas", "fa-check", "selected-icon");
            itemContainer.appendChild(checkIcon);
        }
        
        // Add leading visual (icon) if provided
        if (item.leadingIcon) {
            const leadingIcon = document.createElement("i");
            leadingIcon.classList.add("fas", `fa-${item.leadingIcon}`);
            itemContainer.appendChild(leadingIcon);
        }
        
        // Add text
        const text = document.createElement("span");
        text.classList.add("pdropdown-item-text");
        text.textContent = item.text || item.label || "";
        itemContainer.appendChild(text);
        
        // Add counter/badge if provided
        if (item.counter !== undefined) {
            const counter = document.createElement("span");
            counter.style.cssText = `
                background-color: color-mix(in srgb, var(--color-on-surface) 16%, transparent);
                border-radius: var(--size-border-radius-radius-1000); /* Figma: Border/Radius/radius-1000 (999px) for pill shape */
                padding: 0 var(--size-element-pad-x-sm);
                font-size: var(--font-size-body3);
                line-height: var(--font-line-height-body3);
                font-weight: var(--font-weight-semibold-1);
            `;
            counter.textContent = item.counter;
            itemContainer.appendChild(counter);
        }
        
        // Add trailing visual (icon) if provided
        if (item.trailingIcon) {
            const trailingIcon = document.createElement("i");
            trailingIcon.classList.add("fas", `fa-${item.trailingIcon}`);
            itemContainer.appendChild(trailingIcon);
        }
        
        // Add dropright arrow if provided
        if (item.dropright) {
            const droprightIcon = document.createElement("i");
            droprightIcon.classList.add("fas", "fa-caret-right");
            itemContainer.appendChild(droprightIcon);
        }
        
        menuItem.appendChild(itemContainer);
        
        // Add click handler if provided
        if (item.onClick) {
            menuItem.addEventListener("click", item.onClick);
        }
        
        menu.appendChild(menuItem);
        
        // Add divider if specified
        if (item.divider && index < items.length - 1) {
            const divider = document.createElement("div");
            divider.style.height = "1px";
            divider.style.backgroundColor = "var(--color-outline-variant)";
            divider.style.width = "100%";
            menu.appendChild(divider);
        }
    });
    
    dropdown.appendChild(toggle);
    dropdown.appendChild(menu);
    
    return dropdown;
}

