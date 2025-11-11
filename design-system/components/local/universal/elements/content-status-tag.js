/**
 * @fileoverview Content Status Tag component for PLUS design system.
 * Universal element component for displaying content status with icon and text.
 */

import { SMART_CONSTANTS } from '../constants.js';
import { createStatusIndicator } from './status-indicator.js';

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

/**
 * Creates a content status tag with icon and text
 * @param {string} status - Status string
 * @returns {HTMLElement} Status tag element
 */
export function createContentStatusTag(status) {
    const div = document.createElement("div");
    div.classList.add("align-items-center", "d-inline-flex");

    const tag = createStatusIndicator(status, false);
    div.appendChild(tag);
    
    const txtDiv = document.createElement("div");
    txtDiv.classList.add("status-tag-text", "font-weight-semibold", getStatusClass(status));
    txtDiv.textContent = SMART_CONSTANTS.STATUS_TEXT[status];
    div.appendChild(txtDiv);

    return div;
}

