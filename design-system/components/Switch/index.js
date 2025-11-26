/**
 * @fileoverview Switch component for PLUS design system.
 * Universal element component for creating toggle switches with labels.
 * Built on Bootstrap 4.6.2's custom-control custom-switch pattern with PLUS design token customizations.
 * 
 * Reference: https://getbootstrap.com/docs/4.6/components/forms/#switches
 */

/**
 * Creates a switch (toggle) with label using Bootstrap 4.6.2 custom-switch pattern
 * @param {Object} options - Switch configuration
 * @param {string} options.label - Label text
 * @param {string} options.name - Input name attribute
 * @param {string} options.id - Input ID
 * @param {string} [options.value="on"] - Input value attribute
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @param {boolean} [options.checked=false] - Whether switch is checked
 * @param {boolean} [options.disabled=false] - Whether switch is disabled
 * @param {Function} [options.onChange=null] - Change event handler
 * @returns {HTMLElement} Switch element
 */
export function createSwitch({
    label,
    name,
    id,
    value = "on",
    classes = [],
    checked = false,
    disabled = false,
    onChange = null
} = {}) {
    // Bootstrap 4.6.2 custom-control custom-switch container
    const container = document.createElement("div");
    container.classList.add("custom-control", "custom-switch", "plus-switch-wrapper", "body2-txt");
    
    if (classes && classes.length > 0) {
        container.classList.add(...classes);
    }

    // Bootstrap 4.6.2 custom-control-input (checkbox input)
    const input = document.createElement("input");
    input.type = "checkbox";
    input.classList.add("custom-control-input", "plus-switch-input");
    input.name = name;
    input.id = id;
    input.value = value;
    
    if (checked) {
        input.checked = true;
    }
    
    if (disabled) {
        input.disabled = true;
        container.classList.add("plus-switch-disabled");
    }

    // Bootstrap 4.6.2 custom-control-label
    const labelEl = document.createElement("label");
    labelEl.classList.add("custom-control-label", "plus-switch-label");
    labelEl.htmlFor = id;
    labelEl.textContent = label;

    // Assemble: input, label (Bootstrap 4.6.2 custom-switch structure)
    container.appendChild(input);
    container.appendChild(labelEl);
    
    // Update switch state when input changes
    function updateSwitchState() {
        if (input.checked) {
            container.classList.add("plus-switch-checked");
        } else {
            container.classList.remove("plus-switch-checked");
        }
    }
    
    // Set initial state
    updateSwitchState();
    
    // Listen for changes
    input.addEventListener("change", () => {
        updateSwitchState();
        if (onChange) {
            onChange(input.checked);
        }
    });
    
    // Handle focus/blur for focus state styling
    input.addEventListener("focus", () => {
        container.classList.add("plus-switch-focused");
    });
    
    input.addEventListener("blur", () => {
        container.classList.remove("plus-switch-focused");
    });

    return container;
}

