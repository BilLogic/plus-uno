/**
 * @fileoverview TrainingLessonStatusSelect component for Training Lessons specs
 * Status filter dropdown with counters and icons (All, Assigned, In Progress, Completed, Not Started)
 * Matches Figma design system specifications
 */

/**
 * Creates a counter badge for status items
 * @param {Object} options - Counter configuration
 * @param {string|number} options.count - Counter value
 * @param {string} [options.colorStyle="primary"] - Color style: "primary", "info", "warning", "success", "danger"
 * @returns {HTMLElement} Counter badge element
 */
function createStatusCounter({ count, colorStyle = "primary" }) {
    const counter = document.createElement('div');
    counter.style.display = 'flex';
    counter.style.alignItems = 'center';
    counter.style.justifyContent = 'center';
    counter.style.height = 'var(--font-size-fa-body1-solid)'; // 16px - matches icon size
    counter.style.padding = '0 var(--size-element-pad-x-sm)';
    counter.style.borderRadius = 'var(--size-element-radius-pill)';
    counter.style.flexShrink = '0';

    // Color mapping based on style
    let bgColor, textColor;
    if (colorStyle === "primary") {
        bgColor = 'var(--color-primary-state-08)';
        textColor = 'var(--color-primary-text)';
    } else if (colorStyle === "info") {
        bgColor = 'var(--color-info-state-08)';
        textColor = 'var(--color-info-text)';
    } else if (colorStyle === "warning") {
        bgColor = 'var(--color-warning-state-08)';
        textColor = 'var(--color-warning-text)';
    } else if (colorStyle === "success") {
        bgColor = 'var(--color-success-state-08)';
        textColor = 'var(--color-success-text)';
    } else if (colorStyle === "danger") {
        bgColor = 'var(--color-danger-state-08)';
        textColor = 'var(--color-danger-text)';
    }

    counter.style.backgroundColor = bgColor;

    const countText = document.createElement('div');
    countText.style.fontFamily = 'var(--font-family-body)';
    countText.style.fontSize = 'var(--font-size-body3)';
    countText.style.fontWeight = 'var(--font-weight-semibold-1)';
    countText.style.lineHeight = '1.667';
    countText.style.color = textColor;
    countText.style.textAlign = 'center';
    countText.textContent = count.toString();
    counter.appendChild(countText);

    return counter;
}

/**
 * Creates a status dropdown item
 * @param {Object} options - Item configuration
 * @param {string} options.text - Item text
 * @param {string|number} options.count - Counter value
 * @param {string} options.icon - Font Awesome icon name
 * @param {string} options.colorStyle - Color style for icon and counter
 * @param {boolean} [options.selected=false] - Whether item is selected
 * @param {Function} [options.onClick] - Click handler
 * @returns {HTMLElement} Status item element
 */
function createStatusItem({ text, count, icon, colorStyle, selected = false, onClick = null }) {
    const item = document.createElement('button');
    item.type = 'button';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.width = '100%';
    item.style.padding = '0';
    item.style.border = 'none';
    item.style.background = selected ? 'var(--color-surface-container-highest)' : 'transparent';
    item.style.cursor = 'pointer';
    item.style.fontFamily = 'var(--font-family-body)';

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.alignItems = 'center';
    container.style.padding = selected ? 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)' : 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)';
    container.style.width = '100%';

    // Checkmark icon (always present, opacity based on selection)
    const checkIcon = document.createElement('i');
    checkIcon.className = 'fas fa-check';
    checkIcon.style.fontSize = 'var(--font-size-body3)';
    checkIcon.style.color = selected ? 'var(--color-primary)' : 'var(--color-on-surface)';
    checkIcon.style.opacity = selected ? '1' : '0';
    checkIcon.style.flexShrink = '0';
    checkIcon.style.width = 'var(--font-size-fa-body2-solid)'; // 12px
    checkIcon.style.textAlign = 'center';
    container.appendChild(checkIcon);

    // Leading icon (status icon)
    const leadingIcon = document.createElement('i');
    leadingIcon.className = `fas fa-${icon}`;
    leadingIcon.style.fontSize = 'var(--font-size-body3)';
    
    // Icon color based on colorStyle
    if (colorStyle === "primary") {
        leadingIcon.style.color = 'var(--color-primary)';
    } else if (colorStyle === "info") {
        leadingIcon.style.color = 'var(--color-info)';
    } else if (colorStyle === "warning") {
        leadingIcon.style.color = 'var(--color-warning)';
    } else if (colorStyle === "success") {
        leadingIcon.style.color = 'var(--color-success)';
    } else if (colorStyle === "danger") {
        leadingIcon.style.color = 'var(--color-danger)';
    }
    
    leadingIcon.style.flexShrink = '0';
    leadingIcon.style.width = 'var(--font-size-fa-body2-solid)'; // 12px
    leadingIcon.style.textAlign = 'center';
    container.appendChild(leadingIcon);

    // Text
    const textEl = document.createElement('div');
    textEl.style.fontFamily = 'var(--font-family-body)';
    textEl.style.fontSize = 'var(--font-size-body2)';
    textEl.style.fontWeight = 'var(--font-weight-normal)';
    textEl.style.lineHeight = '1.571';
    
    // Text color based on colorStyle
    if (colorStyle === "primary") {
        textEl.style.color = 'var(--color-primary-text)';
    } else if (colorStyle === "info") {
        textEl.style.color = 'var(--color-info-text)';
    } else if (colorStyle === "warning") {
        textEl.style.color = 'var(--color-warning-text)';
    } else if (colorStyle === "success") {
        textEl.style.color = 'var(--color-success-text)';
    } else if (colorStyle === "danger") {
        textEl.style.color = 'var(--color-danger-text)';
    }
    
    textEl.style.flex = '1';
    textEl.style.minWidth = '0';
    textEl.style.overflow = 'hidden';
    textEl.style.textOverflow = 'ellipsis';
    textEl.style.whiteSpace = 'nowrap';
    textEl.textContent = text;
    container.appendChild(textEl);

    // Counter
    const counter = createStatusCounter({ count, colorStyle });
    container.appendChild(counter);

    item.appendChild(container);

    if (onClick) {
        item.addEventListener('click', onClick);
    }

    return item;
}

/**
 * Creates a TrainingLessonStatusSelect component
 * @param {Object} options - Status select configuration
 * @param {boolean} [options.open=false] - Whether dropdown is open
 * @param {string} [options.selectedStatus="All"] - Currently selected status
 * @param {Object} [options.counts] - Status counts object
 * @param {number} [options.counts.all=20] - All count
 * @param {number} [options.counts.assigned=0] - Assigned count
 * @param {number} [options.counts.inProgress=0] - In Progress count
 * @param {number} [options.counts.completed=5] - Completed count
 * @param {number} [options.counts.notStarted=15] - Not Started count
 * @param {Function} [options.onStatusChange] - Status change handler
 * @returns {HTMLElement} Status select element
 */
export function createTrainingLessonStatusSelect({
    open = false,
    selectedStatus = "All",
    counts = {
        all: 20,
        assigned: 0,
        inProgress: 0,
        completed: 5,
        notStarted: 15
    },
    onStatusChange = null
} = {}) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-start';
    container.style.position = 'relative';
    container.setAttribute('data-node-id', open ? '779:75361' : '778:68959');

    // Button - Figma: border primary, rounded element/radius-sm, outlined button style
    const button = document.createElement('button');
    button.type = 'button';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.gap = 'var(--size-element-gap-sm)';
    button.style.padding = 'var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)';
    button.style.minWidth = '28px';
    button.style.border = '1px solid var(--color-primary)';
    button.style.borderRadius = 'var(--size-element-radius-sm)';
    button.style.backgroundColor = open ? 'var(--color-primary-state-16)' : 'transparent';
    button.style.cursor = 'pointer';
    button.style.fontFamily = 'var(--font-family-body)';
    button.style.fontSize = 'var(--font-size-body3)';
    button.style.fontWeight = 'var(--font-weight-semibold-1)';
    button.style.lineHeight = '1.667';
    button.style.color = 'var(--color-primary-text)';

    // Button text
    const buttonText = document.createElement('span');
    buttonText.textContent = 'All';
    button.appendChild(buttonText);

    // Counter on button
    const buttonCounter = createStatusCounter({ count: counts.all, colorStyle: "primary" });
    button.appendChild(buttonCounter);

    // Caret icon
    const caretIcon = document.createElement('i');
    caretIcon.className = 'fas fa-caret-down';
    caretIcon.style.fontSize = 'var(--font-size-body3)';
    caretIcon.style.color = 'var(--color-on-surface-variant)';
    caretIcon.style.flexShrink = '0';
    caretIcon.style.width = 'var(--font-size-fa-body3-solid)'; // 10px
    caretIcon.style.textAlign = 'center';
    button.appendChild(caretIcon);

    container.appendChild(button);

    // Dropdown menu - Figma: bg surface-container-high, rounded element/radius-sm, shadow elevation-light-2
    const menu = document.createElement('div');
    menu.style.display = open ? 'flex' : 'none';
    menu.style.position = 'absolute';
    menu.style.top = '100%';
    menu.style.left = '74px';
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
    menu.setAttribute('data-node-id', '778:68762');

    // Status items
    const statusItems = [
        {
            text: "All",
            count: counts.all,
            icon: "list",
            colorStyle: "primary",
            selected: selectedStatus === "All"
        },
        {
            text: "Assigned",
            count: counts.assigned,
            icon: "circle-check",
            colorStyle: "info",
            selected: selectedStatus === "Assigned"
        },
        {
            text: "In Progress",
            count: counts.inProgress,
            icon: "spinner",
            colorStyle: "warning",
            selected: selectedStatus === "In Progress"
        },
        {
            text: "Completed",
            count: counts.completed,
            icon: "circle-check",
            colorStyle: "success",
            selected: selectedStatus === "Completed"
        },
        {
            text: "Not Started",
            count: counts.notStarted,
            icon: "circle-stop",
            colorStyle: "danger",
            selected: selectedStatus === "Not Started"
        }
    ];

    statusItems.forEach((item) => {
        const statusItem = createStatusItem({
            text: item.text,
            count: item.count,
            icon: item.icon,
            colorStyle: item.colorStyle,
            selected: item.selected,
            onClick: () => {
                if (onStatusChange) {
                    onStatusChange(item.text);
                }
                menu.style.display = 'none';
            }
        });
        menu.appendChild(statusItem);
    });

    // Toggle menu on button click
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            menu.style.display = 'none';
        }
    });

    container.appendChild(menu);

    return container;
}

