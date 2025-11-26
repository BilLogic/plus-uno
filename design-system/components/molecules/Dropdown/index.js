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
 * @param {string} [options.direction="dropdown"] - Dropdown direction ("dropdown", "dropup", "dropleft", "dropright")
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
    direction = "dropdown",
    classes = []
} = {}) {
    const dropdown = document.createElement("div");
    dropdown.classList.add("pdropdown", "dropdown");
    
    // Add direction class (Bootstrap 4 uses dropup, dropleft, dropright)
    if (direction === "dropup") {
        dropdown.classList.add("dropup");
    } else if (direction === "dropleft") {
        dropdown.classList.add("dropleft");
    } else if (direction === "dropright") {
        dropdown.classList.add("dropright");
    }
    // "dropdown" is default, no class needed
    
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
    
    // Create buttons for split or standard dropdown
    let textButton = null;
    let toggle = null;
    
    if (split) {
        // For split dropdown, buttons are direct children of dropdown container
        // No wrapper needed - CSS handles the flex layout
        
        // Create text button (main action) - NO caret icon
        textButton = document.createElement("button");
        textButton.type = "button";
        textButton.classList.add("pdropdown-split-text-btn", "pdropdown-default-toggle");
        const textContent = document.createElement("span");
        textContent.textContent = buttonText;
        textButton.appendChild(textContent);
        
        // Create toggle button (dropdown trigger) - ONLY caret icon, no text
        toggle = document.createElement("button");
        toggle.type = "button";
        toggle.classList.add("pdropdown-split-toggle-btn", "pdropdown-default-toggle", "dropdown-toggle");
        toggle.setAttribute("data-toggle", "dropdown");
        toggle.setAttribute("aria-haspopup", "true");
        toggle.setAttribute("aria-expanded", "false");
        // Toggle button should only contain the caret icon (added via CSS ::after)
    } else {
        // Create single toggle button
        toggle = document.createElement("button");
        toggle.type = "button";
        toggle.classList.add("pdropdown-default-toggle", "dropdown-toggle");
        toggle.setAttribute("data-toggle", "dropdown");
        toggle.setAttribute("aria-haspopup", "true");
        toggle.setAttribute("aria-expanded", "false");
        
        // Create button content wrapper
        const buttonContent = document.createElement("span");
        buttonContent.textContent = buttonText;
        toggle.appendChild(buttonContent);
    }
    
    // Add direction-specific caret icon class for CSS to style
    if (direction === "dropup") {
        toggle.classList.add("pdropdown-caret-up");
    } else if (direction === "dropleft") {
        toggle.classList.add("pdropdown-caret-left");
    } else if (direction === "dropright") {
        toggle.classList.add("pdropdown-caret-right");
    }
    // "dropdown" uses default caret-down (via CSS ::after)
    
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
        
        // 1. Add multi-select checkbox if provided (for multi-select scenarios)
        if (item.multiSelectCheckbox) {
            const checkboxWrapper = document.createElement("div");
            checkboxWrapper.style.cssText = `
                width: 12px;
                height: 12px;
                border: 1px solid var(--color-primary);
                border-radius: 2px;
                background-color: ${item.multiSelectChecked ? 'var(--color-primary)' : 'transparent'};
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            `;
            if (item.multiSelectChecked) {
                const checkmark = document.createElement("i");
                checkmark.classList.add("fas", "fa-check");
                checkmark.style.cssText = `
                    color: var(--color-on-primary);
                    font-size: 8px;
                `;
                checkboxWrapper.appendChild(checkmark);
            }
            itemContainer.appendChild(checkboxWrapper);
        }
        
        // 2. Add single-select checkmark (always present, opacity-0 when not selected)
        // This matches Figma: singleSelectCheckmark is always true, but opacity-0 when not selected
        const checkIcon = document.createElement("i");
        checkIcon.classList.add("fas", "fa-check", "selected-icon");
        if (!item.selected) {
            checkIcon.style.opacity = "0";
        }
        itemContainer.appendChild(checkIcon);
        
        // 3. Add leading visual (icon) if provided
        if (item.leadingIcon) {
            const leadingIcon = document.createElement("i");
            leadingIcon.classList.add("fas", `fa-${item.leadingIcon}`);
            itemContainer.appendChild(leadingIcon);
        }
        
        // 4. Add text
        const text = document.createElement("span");
        text.classList.add("pdropdown-item-text");
        text.textContent = item.text || item.label || "";
        text.style.flexGrow = "1";
        text.style.minWidth = "0";
        itemContainer.appendChild(text);
        
        // 5. Add trailing visual (icon) if provided (BEFORE counter, per Figma)
        if (item.trailingIcon) {
            const trailingIcon = document.createElement("i");
            trailingIcon.classList.add("fas", `fa-${item.trailingIcon}`);
            itemContainer.appendChild(trailingIcon);
        }
        
        // 6. Add counter/badge if provided
        if (item.counter !== undefined && item.counter !== null) {
            const counter = document.createElement("span");
            counter.style.cssText = `
                background-color: color-mix(in srgb, var(--color-on-surface) 16%, transparent);
                /* Figma: Border/Radius/radius-1000 (999px) for pill shape - using primitive token */
                border-radius: var(--size-border-radius-radius-1000);
                padding: 0 var(--size-element-pad-x-sm);
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: var(--font-size-body3);
                line-height: var(--font-line-height-body3);
                font-weight: var(--font-weight-semibold-1);
                flex-shrink: 0;
            `;
            counter.textContent = item.counter;
            itemContainer.appendChild(counter);
        }
        
        // 7. Add dropright arrow if provided (AFTER counter, per Figma)
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
    
    // Append buttons and menu
    if (split) {
        // For split dropdown, append both buttons directly to container
        // IMPORTANT: For dropleft, reverse the order (caret on left, text on right)
        // For all other directions, text on left, caret on right
        if (direction === "dropleft") {
            dropdown.appendChild(toggle);
            dropdown.appendChild(textButton);
        } else {
            dropdown.appendChild(textButton);
            dropdown.appendChild(toggle);
        }
    } else {
        dropdown.appendChild(toggle);
    }
    dropdown.appendChild(menu);
    
    return dropdown;
}

