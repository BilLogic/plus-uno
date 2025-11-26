/**
 * @fileoverview Date Picker component for PLUS design system.
 * Universal element component for selecting dates with a calendar popup.
 * Uses the dropdown component structure with a custom input field toggle.
 * Matches Figma design system specifications.
 * 
 * Component Type: Element (uses `element-*` tokens for input, `modal-*` tokens for calendar)
 * Token Usage: --size-element-* for input field, --size-modal-* for calendar popup
 */

/**
 * Creates a date picker component
 * @param {Object} options - Date picker configuration
 * @param {string} [options.id] - Date picker ID
 * @param {string} [options.name] - Input name attribute
 * @param {string} [options.placeholder] - Placeholder text
 * @param {string} [options.value] - Initial date value (YYYY-MM-DD format)
 * @param {"small"|"medium"|"large"} [options.size="medium"] - Date picker size
 * @param {boolean} [options.disabled=false] - Whether the date picker is disabled
 * @param {boolean} [options.readonly=false] - Whether the date picker is read-only
 * @param {Date|string} [options.minDate] - Minimum selectable date (Date object or YYYY-MM-DD string)
 * @param {Date|string} [options.maxDate] - Maximum selectable date (Date object or YYYY-MM-DD string)
 * @param {"left"|"center"|"right"} [options.calendarAlign="left"] - Calendar alignment relative to input
 * @param {Function} [options.onChange] - Change handler (receives date string in YYYY-MM-DD format)
 * @param {Function} [options.onFocus] - Focus handler
 * @param {Function} [options.onBlur] - Blur handler
 * @param {Array<string>} [options.classes] - Additional CSS classes
 * @param {Object} [options.styles] - Additional inline styles
 * @returns {HTMLElement} Date picker element wrapped in a container
 */
export function createDatePicker({
    id,
    name,
    placeholder = "Select date",
    value,
    size = "medium",
    disabled = false,
    readonly = false,
    minDate,
    maxDate,
    calendarAlign = "left",
    onChange = null,
    onFocus = null,
    onBlur = null,
    classes = [],
    styles = null
}) {
    // Use dropdown component structure - create container with pdropdown and dropdown classes
    // Date picker uses primary (blue) style by default
    const container = document.createElement("div");
    container.classList.add("plus-date-picker-wrapper");
    container.classList.add("pdropdown", "dropdown");
    container.classList.add("pdropdown-primary"); // Use primary (blue) style for date picker
    
    if (id) {
        container.id = `${id}-wrapper`;
    }
    
    // Add additional classes
    if (classes && classes.length > 0) {
        container.classList.add(...classes);
    }
    
    // Apply inline styles
    if (styles) {
        Object.assign(container.style, styles);
    }
    
    // Create toggle button - matching dropdown component structure exactly
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.classList.add("pdropdown-default-toggle", "dropdown-toggle"); // Use dropdown component's toggle class
    toggle.setAttribute("data-toggle", "dropdown");
    toggle.setAttribute("aria-haspopup", "true");
    toggle.setAttribute("aria-expanded", "false");
    
    // Add typography class to toggle based on size (for icon sizing)
    if (size === "small") {
        toggle.classList.add("body3-txt");
        container.classList.add("small");
    } else if (size === "large") {
        toggle.classList.add("body1-txt");
        container.classList.add("large");
    } else {
        toggle.classList.add("body2-txt");
    }
    
    if (id) {
        toggle.setAttribute("id", `${id}-toggle`);
    }
    
    if (disabled) {
        toggle.disabled = true;
    }
    
    // Create content wrapper (like dropdown's buttonContent span)
    // No leading icon - just the input text
    const contentWrapper = document.createElement("span");
    contentWrapper.classList.add("plus-date-picker-content");
    
    // Update selected state when value changes
    function updateSelectedState() {
        if (input.value && input.value !== "") {
            toggle.classList.add("selected");
        } else {
            toggle.classList.remove("selected");
        }
    }
    
    // Create input field - styled to look like dropdown text
    // Match dropdown's buttonContent span structure - just text, no inline color
    const input = document.createElement("input");
    input.type = "text";
    input.classList.add("plus-date-picker-input");
    input.style.border = "none";
    input.style.background = "transparent";
    input.style.padding = "0";
    input.style.margin = "0";
    input.style.width = "100%";
    input.style.outline = "none";
    // Don't set color inline - CSS handles it (blue for primary dropdowns)
    input.style.fontFamily = "inherit";
    input.style.fontSize = "inherit";
    input.style.fontWeight = "inherit";
    input.style.lineHeight = "inherit";
    input.readOnly = true; // Make input read-only to prevent manual typing, use calendar only
    
    if (id) {
        input.id = id;
    }
    
    if (name) {
        input.name = name;
    }
    
    if (placeholder) {
        input.placeholder = placeholder;
    }
    
    if (value) {
        input.value = formatDateForInput(value);
    }
    
    // Set initial selected state
    updateSelectedState();
    
    if (disabled) {
        input.disabled = true;
        input.classList.add("plus-date-picker-disabled");
        container.classList.add("plus-date-picker-disabled");
        toggle.style.pointerEvents = "none";
    }
    
    if (readonly) {
        input.setAttribute("readonly", "readonly");
        input.classList.add("plus-date-picker-readonly");
        toggle.style.pointerEvents = "none";
    }
    
    if (classes && classes.length > 0) {
        toggle.classList.add(...classes);
        input.classList.add(...classes);
    }
    
    // Create calendar dropdown menu (using dropdown component's dropdown-menu structure)
    const calendarContainer = document.createElement("div");
    calendarContainer.classList.add("plus-date-picker-calendar");
    calendarContainer.classList.add("dropdown-menu"); // Use dropdown component's menu class
    calendarContainer.classList.add(`plus-date-picker-calendar-align-${calendarAlign}`);
    
    // Calendar header
    const calendarHeader = document.createElement("div");
    calendarHeader.classList.add("plus-date-picker-calendar-header");
    
    const prevButton = document.createElement("button");
    prevButton.type = "button";
    prevButton.classList.add("plus-date-picker-calendar-nav");
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.setAttribute("aria-label", "Previous month");
    
    const monthYear = document.createElement("div");
    monthYear.classList.add("plus-date-picker-calendar-month-year");
    monthYear.classList.add("h6");
    
    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.classList.add("plus-date-picker-calendar-nav");
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.setAttribute("aria-label", "Next month");
    
    calendarHeader.appendChild(prevButton);
    calendarHeader.appendChild(monthYear);
    calendarHeader.appendChild(nextButton);
    
    // Calendar weekdays header
    const weekdaysHeader = document.createElement("div");
    weekdaysHeader.classList.add("plus-date-picker-calendar-weekdays");
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    weekdays.forEach(day => {
        const weekday = document.createElement("div");
        weekday.classList.add("plus-date-picker-calendar-weekday");
        weekday.classList.add("body3-txt");
        weekday.textContent = day;
        weekdaysHeader.appendChild(weekday);
    });
    
    // Calendar days grid
    const daysGrid = document.createElement("div");
    daysGrid.classList.add("plus-date-picker-calendar-days");
    
    calendarContainer.appendChild(calendarHeader);
    calendarContainer.appendChild(weekdaysHeader);
    calendarContainer.appendChild(daysGrid);
    
    // Assemble content wrapper - just input (no leading icon)
    contentWrapper.appendChild(input);
    
    // Assemble toggle - content wrapper (dropdown arrow ::after will be added by CSS)
    toggle.appendChild(contentWrapper);
    
    // Assemble container - matching dropdown component structure
    container.appendChild(toggle);
    container.appendChild(calendarContainer);
    
    // Current date state
    let currentDate = value ? parseDate(value) : new Date();
    let selectedDate = value ? parseDate(value) : null;
    
    // Normalize minDate and maxDate to Date objects
    let normalizedMinDate = null;
    let normalizedMaxDate = null;
    
    if (minDate) {
        normalizedMinDate = minDate instanceof Date ? minDate : parseDate(minDate);
    }
    
    if (maxDate) {
        normalizedMaxDate = maxDate instanceof Date ? maxDate : parseDate(maxDate);
    }
    
    /**
     * Formats a date for input display (YYYY-MM-DD)
     */
    function formatDateForInput(date) {
        if (!date) return "";
        const d = typeof date === "string" ? parseDate(date) : date;
        if (!d) return "";
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Parses a date string (YYYY-MM-DD) to Date object
     */
    function parseDate(dateString) {
        if (!dateString) return null;
        const parts = dateString.split("-");
        if (parts.length !== 3) return null;
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return isNaN(date.getTime()) ? null : date;
    }
    
    /**
     * Formats date for display (e.g., "January 2024")
     */
    function formatMonthYear(date) {
        const months = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
    
    /**
     * Renders the calendar
     */
    function renderCalendar() {
        monthYear.textContent = formatMonthYear(currentDate);
        daysGrid.innerHTML = "";
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // First day of month
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();
        
        // Last day of month
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Previous month's last days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        // Render previous month's trailing days
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = document.createElement("div");
            day.classList.add("plus-date-picker-calendar-day");
            day.classList.add("plus-date-picker-calendar-day-other-month");
            day.classList.add("body2-txt");
            day.textContent = prevMonthLastDay - i;
            daysGrid.appendChild(day);
        }
        
        // Render current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement("button");
            day.type = "button";
            day.classList.add("plus-date-picker-calendar-day");
            day.classList.add("body2-txt");
            day.textContent = i;
            
            const dayDate = new Date(year, month, i);
            
            // Check if disabled (compare dates without time)
            if (normalizedMinDate) {
                const minDateOnly = new Date(normalizedMinDate.getFullYear(), normalizedMinDate.getMonth(), normalizedMinDate.getDate());
                const dayDateOnly = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
                if (dayDateOnly < minDateOnly) {
                    day.disabled = true;
                    day.classList.add("plus-date-picker-calendar-day-disabled");
                }
            }
            if (normalizedMaxDate) {
                const maxDateOnly = new Date(normalizedMaxDate.getFullYear(), normalizedMaxDate.getMonth(), normalizedMaxDate.getDate());
                const dayDateOnly = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
                if (dayDateOnly > maxDateOnly) {
                    day.disabled = true;
                    day.classList.add("plus-date-picker-calendar-day-disabled");
                }
            }
            
            // Check if selected
            if (selectedDate && 
                dayDate.getDate() === selectedDate.getDate() &&
                dayDate.getMonth() === selectedDate.getMonth() &&
                dayDate.getFullYear() === selectedDate.getFullYear()) {
                day.classList.add("plus-date-picker-calendar-day-selected");
            }
            
            // Check if today
            const today = new Date();
            if (dayDate.getDate() === today.getDate() &&
                dayDate.getMonth() === today.getMonth() &&
                dayDate.getFullYear() === today.getFullYear()) {
                day.classList.add("plus-date-picker-calendar-day-today");
            }
            
            day.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!day.disabled) {
                    selectedDate = dayDate;
                    input.value = formatDateForInput(selectedDate);
                    updateSelectedState(); // Update selected state
                    renderCalendar();
                    // Close Bootstrap dropdown
                    if (typeof $ !== 'undefined' && $.fn.dropdown) {
                        $(toggle).dropdown('hide');
                    }
                    if (onChange) {
                        onChange(formatDateForInput(selectedDate));
                    }
                }
            });
            
            daysGrid.appendChild(day);
        }
        
        // Render next month's leading days
        const totalCells = firstDayOfWeek + daysInMonth;
        const remainingCells = 42 - totalCells; // 6 rows × 7 days
        for (let i = 1; i <= remainingCells && i <= 14; i++) {
            const day = document.createElement("div");
            day.classList.add("plus-date-picker-calendar-day");
            day.classList.add("plus-date-picker-calendar-day-other-month");
            day.classList.add("body2-txt");
            day.textContent = i;
            daysGrid.appendChild(day);
        }
    }
    
    /**
     * Updates the calendar display
     */
    function updateCalendar() {
        renderCalendar();
    }
    
    // Event handlers - Bootstrap dropdown handles open/close
    // We just need to update calendar when it opens
    $(toggle).on('show.bs.dropdown', function () {
        if (disabled || readonly) {
            return false; // Prevent dropdown from opening
        }
        updateCalendar();
    });
    
    input.addEventListener("focus", (e) => {
        if (onFocus) {
            onFocus(e);
        }
    });
    
    input.addEventListener("blur", (e) => {
        if (onBlur) {
            onBlur(e);
        }
    });
    
    // Navigation buttons
    prevButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        renderCalendar();
    });
    
    nextButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        renderCalendar();
    });
    
    // Initial render
    renderCalendar();
    
    // Initialize Bootstrap dropdown after DOM is ready
    // Use setTimeout to ensure jQuery and Bootstrap are loaded
    setTimeout(() => {
        if (typeof $ !== 'undefined' && $.fn.dropdown) {
            $(toggle).dropdown();
        }
    }, 0);
    
    return container;
}

