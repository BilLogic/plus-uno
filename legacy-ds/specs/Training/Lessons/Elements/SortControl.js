/**
 * @fileoverview SortControl component for Training Lessons specs
 * Dropdown sort control with variants (Dropdown, Status, Competency Areas, name)
 * Matches Figma design system specifications
 */

/**
 * Creates a dropdown item for sort control
 * @param {Object} options - Item configuration
 * @param {string} options.text - Item text
 * @param {boolean} [options.selected=false] - Whether item is selected
 * @param {boolean} [options.disabled=false] - Whether item is disabled
 * @param {boolean} [options.showCheckmark=true] - Whether to show checkmark icon
 * @returns {HTMLElement} Dropdown item element
 */
function createSortDropdownItem({ text, selected = false, disabled = false, showCheckmark = true }) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'dropdown-item';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.width = '100%';
    item.style.padding = '0';
    item.style.border = 'none';
    item.style.background = selected ? 'var(--color-on-surface-state-12)' : 'transparent';
    item.style.cursor = disabled ? 'not-allowed' : 'pointer';
    item.style.opacity = disabled ? '0.38' : '1';
    
    if (disabled) {
        item.disabled = true;
    }

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = 'var(--size-element-gap-sm)';
    container.style.alignItems = 'center';
    container.style.padding = 'var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)';
    container.style.width = '100%';

    // Checkmark icon - always present, opacity-0 when not selected
    const checkIcon = document.createElement('i');
    checkIcon.className = 'fas fa-check';
    checkIcon.style.fontSize = 'var(--font-size-fa-body2-solid)'; // 12px
    checkIcon.style.color = 'var(--color-on-surface)';
    checkIcon.style.opacity = selected ? '1' : '0';
    checkIcon.style.flexShrink = '0';
    checkIcon.style.width = 'var(--font-size-fa-body2-solid)'; // 12px
    checkIcon.style.textAlign = 'center';
    container.appendChild(checkIcon);

    // Text - Using body3 (small) for dropdown items
    const textEl = document.createElement('div');
    textEl.style.fontFamily = 'var(--font-family-body)';
    textEl.style.fontSize = 'var(--font-size-body3)';
    textEl.style.fontWeight = 'var(--font-weight-normal)';
    textEl.style.lineHeight = 'var(--font-line-height-body3)';
    textEl.style.color = 'var(--color-on-surface)';
    textEl.style.flex = '1';
    textEl.style.minWidth = '0';
    textEl.style.overflow = 'hidden';
    textEl.style.textOverflow = 'ellipsis';
    textEl.style.whiteSpace = 'nowrap';
    textEl.textContent = text;
    container.appendChild(textEl);

    item.appendChild(container);
    return item;
}

/**
 * Creates a SortControl component
 * @param {Object} options - Sort control configuration
 * @param {string} [options.variant="Dropdown"] - Variant: "Dropdown", "Status", "Competency Areas", or "name"
 * @param {string} [options.selectedValue] - Currently selected value
 * @param {Function} [options.onChange] - Change handler (receives selected value)
 * @returns {HTMLElement} Sort control element
 */
export function createSortControl({
    variant = "Dropdown",
    selectedValue = null,
    onChange = null
} = {}) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-start';
    container.setAttribute('data-node-id', variant === "name" ? "746:57248" : variant === "Status" ? "746:58190" : variant === "Competency Areas" ? "746:57903" : "746:57658");

    // Dropdown button wrapper
    const dropdownWrapper = document.createElement('div');
    dropdownWrapper.style.position = 'relative';
    dropdownWrapper.style.display = 'flex';
    dropdownWrapper.style.flexDirection = 'column';
    dropdownWrapper.style.alignItems = 'flex-start';

    // Button - Small dropdown: using element-pad-x-sm, element-pad-y-sm, element-radius-sm, body3 typography
    const button = document.createElement('button');
    button.type = 'button';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.gap = 'var(--size-element-gap-sm)';
    button.style.padding = 'var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)';
    button.style.minWidth = '36px';
    button.style.border = '1px solid var(--color-secondary)';
    button.style.borderRadius = 'var(--size-element-radius-sm)';
    button.style.backgroundColor = 'transparent';
    button.style.cursor = 'pointer';
    button.style.fontFamily = 'var(--font-family-body)';
    button.style.fontSize = 'var(--font-size-body3)';
    button.style.fontWeight = 'var(--font-weight-semibold-1)';
    button.style.lineHeight = 'var(--font-line-height-body3)';
    button.style.color = 'var(--color-secondary-text)';
    button.style.position = 'relative';
    
    // Hover state - Figma: bg secondary-state-16 on hover
    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = 'var(--color-secondary-state-16)';
    });
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = 'transparent';
    });

    // Button text
    const buttonText = document.createElement('span');
    buttonText.style.flex = '1';
    buttonText.style.minWidth = '0';
    buttonText.textContent = variant === "name" ? "Name" : variant === "Status" ? "Status" : variant === "Competency Areas" ? "Competency Areas" : "Name";
    button.appendChild(buttonText);

    // Caret icon - Small dropdown: 12px icon size
    const caretIcon = document.createElement('i');
    caretIcon.className = 'fas fa-caret-down';
    caretIcon.style.fontSize = 'var(--font-size-fa-body2-solid)'; // 12px
    caretIcon.style.color = 'var(--color-secondary)';
    caretIcon.style.flexShrink = '0';
    caretIcon.style.width = 'var(--font-size-fa-body2-solid)'; // 12px
    caretIcon.style.textAlign = 'center';
    button.appendChild(caretIcon);

    dropdownWrapper.appendChild(button);

    // Dropdown menu - Small dropdown: using element-radius-sm
    const menu = document.createElement('div');
    menu.style.display = 'none';
    menu.style.position = 'absolute';
    menu.style.top = '100%';
    menu.style.left = '0';
    menu.style.marginTop = 'var(--size-element-gap-xs)'; // 4px
    menu.style.backgroundColor = 'var(--color-surface-container-high)';
    menu.style.borderRadius = 'var(--size-element-radius-sm)';
    menu.style.boxShadow = 'var(--elevation-light-2)';
    menu.style.minWidth = '218.67px'; // Specific dropdown width from design
    menu.style.maxWidth = '332px';
    menu.style.width = '100%';
    menu.style.overflow = 'hidden';
    menu.style.zIndex = '1000';
    menu.style.flexDirection = 'column';
    menu.style.alignItems = 'flex-start';

    // Menu items based on variant
    let menuItems = [];
    
    if (variant === "name") {
        menuItems = [
            { text: "Sort by", disabled: true },
            { text: "Name", selected: true },
            { text: "SMART Competency", selected: false },
            { text: "Status", selected: false },
            { text: "Order", disabled: true },
            { text: "A-Z", selected: true },
            { text: "Z-A", selected: false }
        ];
    } else if (variant === "Status") {
        menuItems = [
            { text: "Sort by", disabled: true },
            { text: "Name", selected: false },
            { text: "SMART Competency", selected: false },
            { text: "Status", selected: true },
            { text: "Order", disabled: true },
            { text: "Least Progress First", selected: true },
            { text: "Most Progress First", selected: false }
        ];
    } else if (variant === "Competency Areas") {
        menuItems = [
            { text: "Sort by", disabled: true },
            { text: "Name", selected: false },
            { text: "Competency Areas", selected: true },
            { text: "Status", selected: false },
            { text: "Order", disabled: true },
            { text: "\"Technology\" Competencies First", selected: false },
            { text: "\"Technology\" Competencies First", selected: true }
        ];
    } else {
        // Default "Dropdown" variant
        menuItems = [
            { text: "Sort by", disabled: true },
            { text: "Name", selected: true },
            { text: "SMART Competency", selected: false },
            { text: "Status", selected: false },
            { text: "Order", disabled: true },
            { text: "A-Z", selected: true },
            { text: "Z-A", selected: false }
        ];
    }

    menuItems.forEach((item, index) => {
        const menuItem = createSortDropdownItem({
            text: item.text,
            selected: item.selected || false,
            disabled: item.disabled || false,
            showCheckmark: !item.disabled
        });
        
        if (!item.disabled && onChange) {
            menuItem.addEventListener('click', () => {
                // Update selected state
                menuItems.forEach((m, i) => {
                    if (i === index) {
                        m.selected = true;
                    } else if (!m.disabled) {
                        m.selected = false;
                    }
                });
                
                // Rebuild menu
                menu.innerHTML = '';
                menuItems.forEach(m => {
                    const newItem = createSortDropdownItem({
                        text: m.text,
                        selected: m.selected || false,
                        disabled: m.disabled || false,
                        showCheckmark: !m.disabled
                    });
                    if (!m.disabled) {
                        newItem.addEventListener('click', () => {
                            onChange(m.text);
                            menu.style.display = 'none';
                        });
                    }
                    menu.appendChild(newItem);
                });
                
                onChange(item.text);
                menu.style.display = 'none';
            });
        }
        
        menu.appendChild(menuItem);
    });

    // Toggle menu on button click
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdownWrapper.contains(e.target)) {
            menu.style.display = 'none';
        }
    });

    dropdownWrapper.appendChild(menu);
    container.appendChild(dropdownWrapper);

    return container;
}

