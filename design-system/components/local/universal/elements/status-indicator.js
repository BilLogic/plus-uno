/**
 * @fileoverview Status Indicator component for PLUS design system.
 * Universal element component for displaying status indicators with icons.
 */

import { SMART_CONSTANTS } from '../constants.js';

/**
 * Creates a status indicator element
 * @param {string} status - Status string
 * @param {boolean} [tooltip=true] - Whether to show tooltip
 * @param {string} [statusDate=null] - Status date
 * @returns {HTMLElement} Status indicator element
 */
export function createStatusIndicator(status, tooltip = true, statusDate = null) {
    const div = document.createElement("div");
    div.classList.add("status-tag", getStatusClass(status));
    
    const icon = document.createElement("i");
    icon.className = SMART_CONSTANTS.STATUS_ICONS[status];
    div.appendChild(icon);

    if (tooltip && statusDate) {
        div.setAttribute("data-toggle", "tooltip");
        div.setAttribute("title", `Status: ${SMART_CONSTANTS.STATUS_TEXT[status]} - ${statusDate}`);
    }

    return div;
}

/**
 * Gets status class for styling
 * @param {string} status - Status string
 * @returns {string} Status class name
 */
function getStatusClass(status) {
    const statusClassMap = {
        "assigned": "plus-content-assigned",
        "started": "plus-content-started",
        "not started": "plus-content-not-started",
        "complete": "plus-content-complete"
    };
    return statusClassMap[status] || "";
}

