/**
 * @fileoverview Input Group component for PLUS design system.
 * Universal element component for creating input groups with addons (text, buttons, icons).
 * Uses Bootstrap 4.6.2's input-group pattern with PLUS design token customizations.
 * 
 * Reference: https://getbootstrap.com/docs/4.6/components/input-group/
 */

/**
 * Creates an input group with optional prepend/append addons
 * @param {Object} options - Input group configuration
 * @param {HTMLElement|string|Object} [options.input] - Input element, HTML string, or input config object
 * @param {HTMLElement|string|Object|Array} [options.prepend] - Prepend addon(s) - text, button, or icon
 * @param {HTMLElement|string|Object|Array} [options.append] - Append addon(s) - text, button, or icon
 * @param {string} [options.size] - Size variant (small, default, large) - affects typography
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @param {string} [options.id] - Input group ID
 * @returns {HTMLElement} Input group element
 */
export function createInputGroup({
    input,
    prepend = null,
    append = null,
    size = 'default',
    classes = [],
    id = null
} = {}) {
    // Create input group container
    const container = document.createElement("div");
    container.classList.add("input-group", "plus-input-group");
    
    if (id) {
        container.id = id;
    }
    
    if (classes && classes.length > 0) {
        container.classList.add(...classes);
    }
    
    // Add size class for typography
    if (size === 'small') {
        container.classList.add("body3-txt");
    } else if (size === 'large') {
        container.classList.add("body1-txt");
    } else {
        container.classList.add("body2-txt");
    }
    
    // Create prepend container if prepend addons exist
    if (prepend) {
        const prependContainer = document.createElement("div");
        prependContainer.classList.add("input-group-prepend", "plus-input-group-prepend");
        
        const addons = Array.isArray(prepend) ? prepend : [prepend];
        addons.forEach(addon => {
            const addonEl = createAddon(addon);
            if (addonEl) {
                prependContainer.appendChild(addonEl);
            }
        });
        
        container.appendChild(prependContainer);
    }
    
    // Create input element
    const inputEl = createInputElement(input);
    if (inputEl) {
        container.appendChild(inputEl);
    }
    
    // Create append container if append addons exist
    if (append) {
        const appendContainer = document.createElement("div");
        appendContainer.classList.add("input-group-append", "plus-input-group-append");
        
        const addons = Array.isArray(append) ? append : [append];
        addons.forEach(addon => {
            const addonEl = createAddon(addon);
            if (addonEl) {
                appendContainer.appendChild(addonEl);
            }
        });
        
        container.appendChild(appendContainer);
    }
    
    return container;
}

/**
 * Creates an addon element (text, button, or icon)
 * @param {HTMLElement|string|Object} addon - Addon configuration
 * @returns {HTMLElement} Addon element
 */
function createAddon(addon) {
    // If it's already an HTMLElement, return it
    if (addon instanceof HTMLElement) {
        return addon;
    }
    
    // If it's a string, create text addon
    if (typeof addon === 'string') {
        const textEl = document.createElement("span");
        textEl.classList.add("input-group-text", "plus-input-group-text");
        textEl.textContent = addon;
        return textEl;
    }
    
    // If it's an object, check the type
    if (typeof addon === 'object' && addon !== null) {
        if (addon.type === 'button' || addon.type === 'btn') {
            // Button addon - expects button element or button config
            if (addon.button instanceof HTMLElement) {
                return addon.button;
            }
            // Could import createButton here if needed
            // For now, return null and let user pass button element
            return null;
        } else if (addon.type === 'icon') {
            // Icon addon
            const iconEl = document.createElement("span");
            iconEl.classList.add("input-group-text", "plus-input-group-text", "plus-input-group-icon");
            const icon = document.createElement("i");
            icon.className = addon.iconClass || "fas fa-icon";
            iconEl.appendChild(icon);
            return iconEl;
        } else if (addon.type === 'checkbox') {
            // Checkbox addon - extract input from checkbox component
            if (addon.checkbox instanceof HTMLElement) {
                // Extract the input element from the checkbox wrapper
                const checkboxInput = addon.checkbox.querySelector('.plus-checkbox');
                if (checkboxInput) {
                    // Wrap in input-group-text for proper styling
                    const wrapper = document.createElement("div");
                    wrapper.classList.add("input-group-text", "plus-input-group-text", "plus-input-group-checkbox");
                    wrapper.appendChild(checkboxInput);
                    return wrapper;
                }
                return addon.checkbox;
            }
            return null;
        } else if (addon.type === 'radio') {
            // Radio addon - extract input from radio component
            if (addon.radio instanceof HTMLElement) {
                // Extract the input element from the radio wrapper
                const radioInput = addon.radio.querySelector('.plus-radio');
                if (radioInput) {
                    // Wrap in input-group-text for proper styling
                    const wrapper = document.createElement("div");
                    wrapper.classList.add("input-group-text", "plus-input-group-text", "plus-input-group-radio");
                    wrapper.appendChild(radioInput);
                    return wrapper;
                }
                return addon.radio;
            }
            return null;
        } else if (addon.type === 'text' || !addon.type) {
            // Text addon (default)
            const textEl = document.createElement("span");
            textEl.classList.add("input-group-text", "plus-input-group-text");
            textEl.textContent = addon.text || addon.content || '';
            if (addon.classes) {
                textEl.classList.add(...addon.classes);
            }
            return textEl;
        }
    }
    
    return null;
}

/**
 * Creates an input element from various input formats
 * @param {HTMLElement|string|Object} input - Input configuration
 * @returns {HTMLElement} Input element
 */
function createInputElement(input) {
    // If it's already an HTMLElement, return it
    if (input instanceof HTMLElement) {
        return input;
    }
    
    // If it's a string, treat as HTML string (not recommended, but supported)
    if (typeof input === 'string') {
        const temp = document.createElement('div');
        temp.innerHTML = input;
        return temp.firstElementChild;
    }
    
    // If it's an object, create input element
    if (typeof input === 'object' && input !== null) {
        const inputEl = document.createElement("input");
        inputEl.type = input.type || 'text';
        inputEl.classList.add("form-control", "plus-text-field");
        
        if (input.id) {
            inputEl.id = input.id;
        }
        if (input.name) {
            inputEl.name = input.name;
        }
        if (input.placeholder) {
            inputEl.placeholder = input.placeholder;
        }
        if (input.value) {
            inputEl.value = input.value;
        }
        if (input.disabled) {
            inputEl.disabled = true;
        }
        if (input.readonly) {
            inputEl.readonly = true;
        }
        if (input.classes) {
            inputEl.classList.add(...input.classes);
        }
        
        return inputEl;
    }
    
    // Default: create empty text input
    const inputEl = document.createElement("input");
    inputEl.type = 'text';
    inputEl.classList.add("form-control", "plus-text-field");
    return inputEl;
}

