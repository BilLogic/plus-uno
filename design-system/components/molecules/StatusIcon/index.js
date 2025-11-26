/**
 * @fileoverview Status Icon component for PLUS design system.
 * Universal element component for displaying status icons with SMART framework support.
 */

import { SMART_CONSTANTS } from '../constants.js';

/**
 * Creates a status icon element
 * @param {string} statusStr - Status string
 * @returns {HTMLElement} Status icon element
 */
export function createStatusIcon(statusStr) {
    const statusIcon = document.createElement("div");
    statusIcon.classList.add("padding-x-3-5", "lesson-card-status-indicator");
    const icon = document.createElement("i");
    icon.className = `${SMART_CONSTANTS.STATUS_ICONS[statusStr]} color-${SMART_CONSTANTS.STATUS_COLORS[statusStr]}`;
    statusIcon.appendChild(icon);
    return statusIcon;
}

