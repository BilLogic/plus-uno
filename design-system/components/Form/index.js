/**
 * @fileoverview Form components for PLUS design system.
 * Universal form element components for creating textareas, selects, and range inputs.
 * Matches Figma design system specifications.
 */

/**
 * Creates a textarea element styled according to PLUS design system.
 * @param {Object} options - Textarea configuration options.
 * @param {string} [options.id] - Textarea ID.
 * @param {string} [options.name] - Textarea name attribute.
 * @param {string} [options.placeholder] - Placeholder text.
 * @param {string} [options.value] - Initial value.
 * @param {"small"|"medium"|"large"} [options.size="medium"] - Textarea size.
 * @param {boolean} [options.readonly=false] - Whether the textarea is read-only.
 * @param {boolean} [options.disabled=false] - Whether the textarea is disabled.
 * @param {number} [options.rows] - Number of rows.
 * @param {number} [options.cols] - Number of columns.
 * @param {Array<string>} [options.classes] - Additional CSS classes.
 * @param {Object} [options.styles] - Additional inline styles.
 * @param {Function} [options.onChange] - Change handler.
 * @param {Function} [options.onFocus] - Focus handler.
 * @param {Function} [options.onBlur] - Blur handler.
 * @returns {HTMLElement} Textarea element.
 */
export function createTextarea({
    id,
    name,
    placeholder,
    value,
    size = "medium",
    readonly = false,
    disabled = false,
    rows,
    cols,
    classes = [],
    styles = null,
    onChange = null,
    onFocus = null,
    onBlur = null
}) {
    const textarea = document.createElement("textarea");
    
    if (id) {
        textarea.id = id;
    }
    
    if (name) {
        textarea.name = name;
    }
    
    // Base classes
    textarea.classList.add("plus-form-textarea");
    textarea.classList.add(`plus-form-textarea-${size}`);
    
    // Add typography class based on size
    if (size === "small") {
        textarea.classList.add("body3-txt");
    } else if (size === "large") {
        textarea.classList.add("body1-txt");
    } else {
        textarea.classList.add("body2-txt");
    }
    
    // State classes
    if (readonly) {
        textarea.classList.add("plus-form-textarea-readonly");
        textarea.setAttribute("readonly", "readonly");
    }
    
    if (disabled) {
        textarea.classList.add("plus-form-textarea-disabled");
        textarea.disabled = true;
    }
    
    // Add additional classes
    if (classes && classes.length > 0) {
        textarea.classList.add(...classes);
    }
    
    // Set attributes
    if (placeholder) {
        textarea.placeholder = placeholder;
    }
    
    if (value) {
        textarea.value = value;
    }
    
    if (rows) {
        textarea.rows = rows;
    }
    
    if (cols) {
        textarea.cols = cols;
    }
    
    // Apply inline styles
    if (styles) {
        Object.assign(textarea.style, styles);
    }
    
    // Event handlers
    if (onChange) {
        textarea.addEventListener("change", onChange);
    }
    
    if (onFocus) {
        textarea.addEventListener("focus", onFocus);
    }
    
    if (onBlur) {
        textarea.addEventListener("blur", onBlur);
    }
    
    return textarea;
}

/**
 * Creates a select element styled according to PLUS design system.
 * @param {Object} options - Select configuration options.
 * @param {string} [options.id] - Select ID.
 * @param {string} [options.name] - Select name attribute.
 * @param {"small"|"medium"|"large"} [options.size="medium"] - Select size.
 * @param {boolean} [options.readonly=false] - Whether the select is read-only.
 * @param {boolean} [options.disabled=false] - Whether the select is disabled.
 * @param {Array<Object>} [options.options] - Array of option objects: {value: string, text: string, selected: boolean}.
 * @param {string} [options.placeholder] - Placeholder option text.
 * @param {Array<string>} [options.classes] - Additional CSS classes.
 * @param {Object} [options.styles] - Additional inline styles.
 * @param {Function} [options.onChange] - Change handler.
 * @param {Function} [options.onFocus] - Focus handler.
 * @param {Function} [options.onBlur] - Blur handler.
 * @returns {HTMLElement} Select element wrapped in a container.
 */
export function createSelect({
    id,
    name,
    size = "medium",
    readonly = false,
    disabled = false,
    options = [],
    placeholder,
    classes = [],
    styles = null,
    onChange = null,
    onFocus = null,
    onBlur = null
}) {
    const container = document.createElement("div");
    container.classList.add("plus-form-select-wrapper");
    
    const select = document.createElement("select");
    
    if (id) {
        select.id = id;
        container.id = `${id}-wrapper`;
    }
    
    if (name) {
        select.name = name;
    }
    
    // Base classes
    select.classList.add("plus-form-select");
    select.classList.add(`plus-form-select-${size}`);
    
    // Add typography class based on size
    if (size === "small") {
        select.classList.add("body3-txt");
    } else if (size === "large") {
        select.classList.add("body1-txt");
    } else {
        select.classList.add("body2-txt");
    }
    
    // State classes
    if (readonly) {
        select.classList.add("plus-form-select-readonly");
        select.setAttribute("readonly", "readonly");
    }
    
    if (disabled) {
        select.classList.add("plus-form-select-disabled");
        select.disabled = true;
    }
    
    // Add additional classes
    if (classes && classes.length > 0) {
        select.classList.add(...classes);
    }
    
    // Apply inline styles
    if (styles) {
        Object.assign(select.style, styles);
    }
    
    // Add placeholder option if provided
    if (placeholder) {
        const placeholderOption = document.createElement("option");
        placeholderOption.value = "";
        placeholderOption.textContent = placeholder;
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        select.appendChild(placeholderOption);
    }
    
    // Add options
    let hasSelectedValue = false;
    options.forEach((option) => {
        const optionEl = document.createElement("option");
        optionEl.value = option.value || "";
        optionEl.textContent = option.text || "";
        if (option.selected) {
            optionEl.selected = true;
            hasSelectedValue = true;
        }
        select.appendChild(optionEl);
    });
    
    // Add class if has value (not placeholder)
    if (hasSelectedValue || (options.length > 0 && !placeholder)) {
        select.classList.add("plus-form-select-has-value");
    }
    
    // Update class on change
    const updateValueClass = () => {
        if (select.value && select.value !== "") {
            select.classList.add("plus-form-select-has-value");
        } else {
            select.classList.remove("plus-form-select-has-value");
        }
    };
    
    // Event handlers
    if (onChange) {
        select.addEventListener("change", (e) => {
            updateValueClass();
            onChange(e);
        });
    } else {
        select.addEventListener("change", updateValueClass);
    }
    
    if (onFocus) {
        select.addEventListener("focus", onFocus);
    }
    
    if (onBlur) {
        select.addEventListener("blur", onBlur);
    }
    
    container.appendChild(select);
    
    return container;
}

/**
 * Creates a range input (slider) element styled according to PLUS design system.
 * @param {Object} options - Range input configuration options.
 * @param {string} [options.id] - Range input ID.
 * @param {string} [options.name] - Range input name attribute.
 * @param {number} [options.min=0] - Minimum value.
 * @param {number} [options.max=100] - Maximum value.
 * @param {number} [options.value] - Current value.
 * @param {number} [options.step=1] - Step value.
 * @param {"small"|"medium"|"large"} [options.size="medium"] - Range input size.
 * @param {boolean} [options.disabled=false] - Whether the range input is disabled.
 * @param {Array<string>} [options.classes] - Additional CSS classes.
 * @param {Object} [options.styles] - Additional inline styles.
 * @param {Function} [options.onChange] - Change handler.
 * @param {Function} [options.onInput] - Input handler.
 * @returns {HTMLElement} Range input element.
 */
export function createRangeInput({
    id,
    name,
    min = 0,
    max = 100,
    value,
    step = 1,
    size = "medium",
    disabled = false,
    classes = [],
    styles = null,
    onChange = null,
    onInput = null
}) {
    const rangeInput = document.createElement("input");
    rangeInput.type = "range";
    
    if (id) {
        rangeInput.id = id;
    }
    
    if (name) {
        rangeInput.name = name;
    }
    
    // Base classes
    rangeInput.classList.add("plus-form-range");
    rangeInput.classList.add(`plus-form-range-${size}`);
    
    // Set attributes
    rangeInput.min = min;
    rangeInput.max = max;
    rangeInput.step = step;
    
    if (value !== undefined) {
        rangeInput.value = value;
    } else {
        rangeInput.value = min;
    }
    
    if (disabled) {
        rangeInput.disabled = true;
        rangeInput.classList.add("plus-form-range-disabled");
    }
    
    // Add additional classes
    if (classes && classes.length > 0) {
        rangeInput.classList.add(...classes);
    }
    
    // Update value percentage for filled track
    const updateValuePercent = () => {
        const currentValue = parseFloat(rangeInput.value);
        const percent = ((currentValue - min) / (max - min)) * 100;
        rangeInput.style.setProperty('--value-percent', `${percent}%`);
    };
    
    // Initial update
    updateValuePercent();
    
    // Apply inline styles
    if (styles) {
        Object.assign(rangeInput.style, styles);
    }
    
    // Event handlers
    const handleChange = (e) => {
        updateValuePercent();
        if (onChange) {
            onChange(e);
        }
    };
    
    const handleInput = (e) => {
        updateValuePercent();
        if (onInput) {
            onInput(e);
        }
    };
    
    rangeInput.addEventListener("change", handleChange);
    rangeInput.addEventListener("input", handleInput);
    
    return rangeInput;
}

/**
 * Creates a multiple select element styled according to PLUS design system.
 * @param {Object} options - Multiple select configuration options.
 * @param {string} [options.id] - Select ID.
 * @param {string} [options.name] - Select name attribute.
 * @param {"small"|"medium"|"large"} [options.size="medium"] - Select size.
 * @param {boolean} [options.disabled=false] - Whether the select is disabled.
 * @param {Array<Object>} [options.options] - Array of option objects: {value: string, text: string, selected: boolean}.
 * @param {Array<string>} [options.classes] - Additional CSS classes.
 * @param {Object} [options.styles] - Additional inline styles.
 * @param {Function} [options.onChange] - Change handler.
 * @returns {HTMLElement} Multiple select element wrapped in a container.
 */
export function createSelectMultiple({
    id,
    name,
    size = "medium",
    disabled = false,
    options = [],
    classes = [],
    styles = null,
    onChange = null
}) {
    const container = document.createElement("div");
    container.classList.add("plus-form-select-multiple-wrapper");
    
    const listContainer = document.createElement("div");
    listContainer.classList.add("plus-form-select-multiple-list");
    
    // Add typography class based on size
    if (size === "small") {
        listContainer.classList.add("body3-txt");
    } else if (size === "large") {
        listContainer.classList.add("body1-txt");
    } else {
        listContainer.classList.add("body2-txt");
    }
    
    // Add size class
    listContainer.classList.add(`plus-form-select-multiple-${size}`);
    
    // Add options as list items
    options.forEach((option) => {
        const item = document.createElement("div");
        item.classList.add("plus-form-select-multiple-item");
        item.textContent = option.text || option.value || "";
        if (option.selected) {
            item.classList.add("plus-form-select-multiple-item-selected");
        }
        if (onChange) {
            item.addEventListener("click", () => {
                item.classList.toggle("plus-form-select-multiple-item-selected");
                onChange({
                    value: option.value,
                    selected: item.classList.contains("plus-form-select-multiple-item-selected")
                });
            });
        }
        listContainer.appendChild(item);
    });
    
    // Scrollbar
    const scrollbar = document.createElement("div");
    scrollbar.classList.add("plus-form-select-multiple-scrollbar");
    scrollbar.innerHTML = `
        <div class="plus-form-select-multiple-scrollbar-icon">
            <i class="fas fa-caret-up"></i>
        </div>
        <div class="plus-form-select-multiple-scrollbar-track">
            <div class="plus-form-select-multiple-scrollbar-bar"></div>
        </div>
        <div class="plus-form-select-multiple-scrollbar-icon">
            <i class="fas fa-caret-down"></i>
        </div>
    `;
    
    container.appendChild(listContainer);
    container.appendChild(scrollbar);
    
    if (id) {
        container.id = id;
    }
    
    if (disabled) {
        container.classList.add("plus-form-select-multiple-disabled");
    }
    
    // Add additional classes
    if (classes && classes.length > 0) {
        container.classList.add(...classes);
    }
    
    // Apply inline styles
    if (styles) {
        Object.assign(container.style, styles);
    }
    
    return container;
}

