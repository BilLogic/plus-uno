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
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @param {boolean} [options.checked=false] - Whether checkbox is checked
 * @param {boolean} [options.indeterminate=false] - Whether checkbox is in indeterminate state (shows dash/minus)
 * @param {boolean} [options.disabled=false] - Whether checkbox is disabled
 * @param {Function} [options.onChange=null] - Change event handler
 * @returns {HTMLElement} Checkbox element
 */
export function createCheckbox({
    label,
    name,
    value,
    id,
    classes = [],
    checked = false,
    indeterminate = false,
    disabled = false,
    onChange = null
} = {}) {
    const container = document.createElement("div");
    container.classList.add("form-check", "body2-txt");
    container.classList.add("plus-checkbox-wrapper");
    
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
    
    if (indeterminate) {
        input.indeterminate = true;
        container.classList.add("plus-checkbox-indeterminate");
    }
    
    if (disabled) {
        input.disabled = true;
        container.classList.add("plus-checkbox-disabled");
    }

    const labelEl = document.createElement("label");
    labelEl.classList.add("form-check-label", "plus-checkbox-label");
    labelEl.htmlFor = id;
    labelEl.textContent = label;

    container.appendChild(input);
    container.appendChild(labelEl);
    
    // Track if checkbox is currently indeterminate
    let isIndeterminate = indeterminate;
    // Track if checkbox was initially set to indeterminate (to enable 3-state cycle)
    let wasInitiallyIndeterminate = indeterminate;
    // Track previous state for indeterminate checkboxes only
    let previousState = indeterminate ? 'indeterminate' : null;
    
    // Handle change event
    input.addEventListener("change", (e) => {
        // Only apply 2-state cycle logic if checkbox was initially indeterminate
        if (wasInitiallyIndeterminate) {
            // 2-state cycle: unchecked <-> indeterminate (skip checked state)
            if (previousState === 'indeterminate') {
                // If it was indeterminate, browser toggles to checked
                // We want it to go to unchecked instead (cycle: indeterminate -> unchecked)
                input.indeterminate = false;
                input.checked = false;
                isIndeterminate = false;
                previousState = 'unchecked';
                container.classList.remove("plus-checkbox-indeterminate");
            } else if (previousState === 'unchecked') {
                // unchecked -> indeterminate (skip checked state)
                input.indeterminate = true;
                input.checked = false;
                isIndeterminate = true;
                previousState = 'indeterminate';
                container.classList.add("plus-checkbox-indeterminate");
            } else {
                // Fallback: update tracking
                isIndeterminate = input.indeterminate;
                if (isIndeterminate) {
                    previousState = 'indeterminate';
                    container.classList.add("plus-checkbox-indeterminate");
                } else {
                    previousState = 'unchecked';
                    container.classList.remove("plus-checkbox-indeterminate");
                }
            }
        } else {
            // Regular checkbox behavior - Bootstrap default (unchecked <-> checked)
            isIndeterminate = input.indeterminate;
            if (isIndeterminate) {
                container.classList.add("plus-checkbox-indeterminate");
            } else {
                container.classList.remove("plus-checkbox-indeterminate");
            }
        }
        
        if (onChange) {
            onChange(e);
        }
    });
    
    // Expose method to update indeterminate state programmatically
    container.updateIndeterminate = (value) => {
        isIndeterminate = value;
        input.indeterminate = value;
        if (value) {
            input.checked = false;
            wasInitiallyIndeterminate = true; // Enable 3-state cycle
            previousState = 'indeterminate';
            container.classList.add("plus-checkbox-indeterminate");
        } else {
            wasInitiallyIndeterminate = false; // Disable 3-state cycle
            previousState = input.checked ? 'checked' : 'unchecked';
            container.classList.remove("plus-checkbox-indeterminate");
        }
    };

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

