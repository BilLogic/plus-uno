/**
 * @fileoverview Progress component for PLUS design system.
 * Universal element component for creating progress bars.
 * Uses Bootstrap 4.6.2's progress component pattern.
 * 
 * Reference: https://getbootstrap.com/docs/4.6/components/progress/
 */

/**
 * Creates a progress bar component
 * @param {Object} options - Progress configuration
 * @param {number} [options.value=0] - Current progress value (0-100)
 * @param {number} [options.min=0] - Minimum value
 * @param {number} [options.max=100] - Maximum value
 * @param {string} [options.style='primary'] - Progress bar style (primary, secondary, tertiary, success, danger, warning, info)
 * @param {string} [options.size='medium'] - Progress bar size (small, medium, large)
 * @param {boolean} [options.striped=false] - Whether to show striped animation
 * @param {boolean} [options.animated=false] - Whether to animate the stripes (requires striped=true)
 * @param {string} [options.label] - Optional label text to display inside progress bar
 * @param {boolean} [options.showLabel=false] - Whether to show the value as a label
 * @param {string} [options.id] - Progress container ID
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @returns {HTMLElement} Progress element
 */
export function createProgress({
    value = 0,
    min = 0,
    max = 100,
    style = 'primary',
    size = 'medium',
    striped = false,
    animated = false,
    label = null,
    showLabel = false,
    id = null,
    classes = []
} = {}) {
    // Bootstrap 4.6.2 progress container
    const container = document.createElement("div");
    container.classList.add("progress", "plus-progress", `plus-progress-${size}`);
    
    if (id) {
        container.id = id;
    }
    
    if (classes && classes.length > 0) {
        container.classList.add(...classes);
    }

    // Bootstrap 4.6.2 progress-bar
    const progressBar = document.createElement("div");
    progressBar.classList.add("progress-bar", "plus-progress-bar", `plus-progress-bar-${style}`);
    
    // Set ARIA attributes for accessibility
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-valuenow", value);
    progressBar.setAttribute("aria-valuemin", min);
    progressBar.setAttribute("aria-valuemax", max);
    
    // Calculate percentage
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
    progressBar.style.width = `${percentage}%`;
    
    // Add striped class if needed
    if (striped) {
        progressBar.classList.add("progress-bar-striped");
    }
    
    // Add animated class if needed (requires striped)
    if (animated && striped) {
        progressBar.classList.add("progress-bar-animated");
    }
    
    // Add label if provided or if showLabel is true
    if (label !== null) {
        progressBar.textContent = label;
    } else if (showLabel) {
        progressBar.textContent = `${Math.round(percentage)}%`;
    }
    
    container.appendChild(progressBar);
    
    return container;
}

/**
 * Updates the progress value of an existing progress bar
 * @param {HTMLElement} progressElement - The progress container element
 * @param {number} value - New progress value
 * @param {number} [min=0] - Minimum value
 * @param {number} [max=100] - Maximum value
 * @param {boolean} [updateLabel=false] - Whether to update the label if showLabel was used
 */
export function updateProgress(progressElement, value, min = 0, max = 100, updateLabel = false) {
    const progressBar = progressElement.querySelector(".plus-progress-bar");
    if (!progressBar) {
        console.warn("Progress bar element not found");
        return;
    }
    
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute("aria-valuenow", value);
    
    if (updateLabel && progressBar.textContent) {
        // Check if it's a percentage label
        if (progressBar.textContent.includes('%')) {
            progressBar.textContent = `${Math.round(percentage)}%`;
        }
    }
}



