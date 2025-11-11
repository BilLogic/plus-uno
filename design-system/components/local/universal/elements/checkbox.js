/**
 * @fileoverview Checkbox component for PLUS design system.
 * Universal element component for creating checkboxes with labels.
 */

/**
 * Creates a checkbox with label
 * @param {Object} options - Checkbox configuration
 * @param {string} options.label - Label text
 * @param {string} options.name - Input name attribute
 * @param {string} options.value - Input value attribute
 * @param {string} options.id - Input ID
 * @param {Array} [options.classes] - Additional CSS classes
 * @param {boolean} [options.checked=false] - Whether checkbox is checked
 * @returns {HTMLElement} Checkbox element
 */
export function createCheckbox({label, name, value, id, classes = [], checked = false}) {
    const container = document.createElement("div");
    container.classList.add("form-check", "body2-txt");
    if (classes && classes.length > 0) {
        container.classList.add(...classes);
    }

    const input = document.createElement("input");
    input.type = "checkbox";
    input.classList.add("form-check-input", "plus-checkbox");
    input.name = name;
    input.id = id;
    input.value = value;
    if (checked) {
        input.checked = true;
    }

    const labelEl = document.createElement("label");
    labelEl.classList.add("form-check-label");
    labelEl.htmlFor = id;
    labelEl.textContent = label;

    container.appendChild(input);
    container.appendChild(labelEl);

    return container;
}

/**
 * Creates a group of related checkboxes
 * @param {Array} options - Array of checkbox option objects
 * @param {string} groupName - Common name for the group of checkboxes
 * @returns {Array<HTMLElement>} Array of checkbox elements
 */
export function createCheckboxGroup(options, groupName) {
    return options.map((option) => {
        option.name = groupName;
        return createCheckbox(option);
    });
}

