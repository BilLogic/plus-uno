/**
 * @fileoverview Radio component for PLUS design system.
 * Universal element component for creating radio buttons with labels.
 * Uses Bootstrap 4.6.2's default form-check pattern.
 * 
 * Reference: https://getbootstrap.com/docs/4.6/components/forms/#radios
 */

/**
 * Creates a radio button with label using Bootstrap 4.6.2 default form-check pattern
 * The radio will use Bootstrap's native styling - no custom overrides.
 * 
 * @param {Object} options - Radio configuration
 * @param {string} options.label - Label text
 * @param {string} options.name - Input name attribute (required for radio groups)
 * @param {string} options.value - Input value attribute
 * @param {string} options.id - Input ID
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @param {boolean} [options.checked=false] - Whether radio is checked
 * @param {boolean} [options.disabled=false] - Whether radio is disabled
 * @param {Function} [options.onChange=null] - Change event handler
 * @returns {HTMLElement} Radio element
 */
export function createRadio({
    label,
    name,
    value,
    id,
    classes = [],
    checked = false,
    disabled = false,
    onChange = null
} = {}) {
    // Bootstrap 4.6.2 form-check container
    const container = document.createElement("div");
    container.classList.add("form-check", "plus-radio-wrapper", "body2-txt");
    
    if (classes && classes.length > 0) {
        container.classList.add(...classes);
    }

    // Bootstrap 4.6.2 form-check-input (radio input)
    const input = document.createElement("input");
    input.type = "radio";
    input.classList.add("form-check-input", "plus-radio");
    input.name = name;
    input.id = id;
    input.value = value;
    
    if (checked) {
        input.checked = true;
    }
    
    if (disabled) {
        input.disabled = true;
        container.classList.add("plus-radio-disabled");
    }

    // Bootstrap 4.6.2 form-check-label
    const labelEl = document.createElement("label");
    labelEl.classList.add("form-check-label", "plus-radio-label");
    labelEl.htmlFor = id;
    labelEl.textContent = label;

    // Assemble: input, label (Bootstrap 4.6.2 form-check structure)
    container.appendChild(input);
    container.appendChild(labelEl);
    
    if (onChange) {
        input.addEventListener("change", onChange);
    }

    return container;
}

/**
 * Creates a group of related radio buttons
 * @param {Array<Object>} options - Array of radio option objects
 * @param {string} groupName - Common name for the group of radios (required)
 * @param {Function} [onChange=null] - Change event handler for the group
 * @returns {Array<HTMLElement>} Array of radio elements
 */
export function createRadioGroup(options, groupName, onChange = null) {
    if (!groupName) {
        throw new Error("Radio group requires a name attribute");
    }
    
    return options.map((option) => {
        option.name = groupName;
        return createRadio({
            ...option,
            onChange: onChange
        });
    });
}

