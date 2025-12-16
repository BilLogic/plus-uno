/**
 * @fileoverview TutorsPerformanceTable component for Admin specs
 * Table showing tutor performance metrics
 */

import { createBadge } from '../../../../components/Badge/index.js';

/**
 * Creates a TutorsPerformanceTable row component
 * @param {Object} options - Table row configuration
 * @param {string} [options.type="header"] - Row type: "header" or "list item"
 * @param {string} [options.state="default"] - Row state: "default", "hover", "loading"
 * @param {Object} [options.data] - Row data (only for list item type)
 * @returns {HTMLElement} Table row element
 */
export function createTutorsPerformanceTableRow({
    type = "header",
    state = "default",
    data = null
} = {}) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "repeat(5, 1fr)";
    row.style.height = "47.5px";
    row.style.borderRadius = "var(--size-table-radius-md)";
    row.style.width = "1120px";

    // Apply state styling
    if (type === "list item" && state === "hover") {
        row.style.backgroundColor = "var(--color-on-surface-state-08)";
    }

    if (type === "header") {
        const headers = [
            { text: "Tutor Name", sortable: true, active: true },
            { text: "Signed-Up", sortable: true },
            { text: "% Attendance", sortable: true },
            { text: "Sessions", sortable: true },
            { text: "Students", sortable: true }
        ];

        headers.forEach((header, index) => {
            const cell = document.createElement("div");
            cell.style.display = "flex";
            cell.style.gap = "var(--size-table-cell-gap)";
            cell.style.alignItems = "center";
            cell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
            cell.style.borderRadius = "var(--size-element-radius-sm)";

            const text = document.createElement("div");
            text.className = "body3-txt";
            text.style.fontWeight = "400";
            text.style.color = index === 0 ? "var(--color-secondary-text)" : "var(--color-on-surface)";
            text.textContent = header.text;
            cell.appendChild(text);

            if (header.sortable) {
                const icon = document.createElement("i");
                icon.className = `fas fa-arrow-up`;
                icon.style.fontSize = "10px";
                icon.style.color = index === 0 ? "var(--color-secondary)" : "var(--color-outline-variant)";
                cell.appendChild(icon);
            }

            row.appendChild(cell);
        });
    } else if (state === "loading") {
        // Loading skeleton
        for (let i = 0; i < 5; i++) {
            const cell = document.createElement("div");
            cell.style.display = "flex";
            cell.style.gap = "var(--size-table-cell-gap)";
            cell.style.alignItems = "center";
            cell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

            const skeleton = document.createElement("div");
            skeleton.style.backgroundColor = "var(--color-on-surface-state-08)";
            skeleton.style.height = "22px";
            skeleton.style.borderRadius = "var(--size-element-radius-sm)";
            skeleton.style.width = i === 0 ? "120px" : "60px";
            cell.appendChild(skeleton);
            row.appendChild(cell);
        }
    } else {
        // Data row
        const rowData = data || {
            tutorName: "Floyd Miles",
            signedUp: "No",
            attendance: null,
            sessions: null,
            students: null
        };

        // Tutor Name
        const nameCell = document.createElement("div");
        nameCell.style.display = "flex";
        nameCell.style.gap = "var(--size-table-cell-gap)";
        nameCell.style.alignItems = "center";
        nameCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

        const nameContainer = document.createElement("div");
        nameContainer.style.display = "flex";
        nameContainer.style.gap = "var(--size-element-gap-sm)";
        nameContainer.style.alignItems = "center";
        nameContainer.style.flexWrap = "wrap";

        const nameText = document.createElement("div");
        nameText.className = "body3-txt";
        nameText.style.fontWeight = "400";
        nameText.style.color = "var(--color-on-surface)";
        nameText.textContent = rowData.tutorName;
        nameContainer.appendChild(nameText);

        // Add Admin badge if tutor is admin (e.g., Ethan Cole)
        if (rowData.isAdmin) {
            const adminBadge = createBadge({
                text: "Admin",
                style: "tertiary",
                size: "b3"
            });
            nameContainer.appendChild(adminBadge);
        }

        nameCell.appendChild(nameContainer);
        row.appendChild(nameCell);

        // Signed-Up - Binary badge (Yes/No)
        const signedUpCell = createBinaryBadgeCell(rowData.signedUp);
        row.appendChild(signedUpCell);

        // % Attendance - Numeric badge with color thresholds
        const attendanceCell = createNumericStatsBadge(rowData.attendance);
        row.appendChild(attendanceCell);

        // Sessions - Neutral badge (always gray)
        const sessionsCell = createNeutralBadgeCell(rowData.sessions);
        row.appendChild(sessionsCell);

        // Students - Neutral badge (always gray)
        const studentsCell = createNeutralBadgeCell(rowData.students);
        row.appendChild(studentsCell);
    }

    return row;
}

/**
 * Creates a binary badge cell (Yes/No) for Signed-Up column
 * Yes → Info style (blue), No → Neutral gray
 */
function createBinaryBadgeCell(value) {
    const cell = document.createElement("div");
    cell.style.display = "flex";
    cell.style.gap = "var(--size-table-cell-gap)";
    cell.style.alignItems = "center";
    cell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.style.fontSize = "12px";
    badge.style.fontWeight = "400";
    badge.style.textTransform = "capitalize";
    badge.style.padding = "0 var(--size-element-pad-x-sm)";
    badge.style.borderRadius = "var(--size-element-radius-pill)";
    badge.style.lineHeight = "1.667";
    badge.style.fontFamily = "var(--font-family-body)";
    
    if (value === "Yes" || value === true) {
        // Info style (blue) for "Yes" - Figma uses #0052dd for info
        // Using rgba(0, 82, 221, 0.08) for background and #0052dd for text to match Figma exactly
        badge.style.backgroundColor = "rgba(0, 82, 221, 0.08)";
        badge.style.color = "#0052dd";
        badge.textContent = "Yes";
    } else {
        // Neutral gray for "No"
        badge.style.backgroundColor = "var(--color-on-surface-state-08)";
        badge.style.color = "var(--color-on-surface)";
        badge.textContent = "No";
    }

    cell.appendChild(badge);
    return cell;
}

/**
 * Creates a numeric stats badge (percentage badge) with color thresholds
 * Color thresholds:
 * - ≥80% → Green/Success
 * - 50–79% → Yellow/Warning
 * - <50% → Red/Danger
 * - Null → Neutral gray with "N/A"
 */
function createNumericStatsBadge(value) {
    const cell = document.createElement("div");
    cell.style.display = "flex";
    cell.style.gap = "var(--size-table-cell-gap)";
    cell.style.alignItems = "center";
    cell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.style.fontSize = "12px";
    badge.style.fontWeight = "400";
    badge.style.textTransform = "capitalize";
    badge.style.padding = "0 var(--size-element-pad-x-sm)";
    badge.style.borderRadius = "var(--size-element-radius-pill)";
    badge.style.lineHeight = "1.667";
    badge.style.fontFamily = "var(--font-family-body)";

    if (value === null || value === undefined || value === "null" || value === "Null") {
        // Neutral gray for null values
        badge.style.backgroundColor = "var(--color-on-surface-state-08)";
        badge.style.color = "var(--color-on-surface)";
        badge.textContent = "N/A";
    } else {
        // Extract numeric value from string (e.g., "92%" -> 92, "22%" -> 22)
        const numericValue = parseFloat(String(value).replace('%', ''));
        
        if (numericValue >= 80) {
            // Green/Success for ≥80% - Figma: rgba(62, 105, 26, 0.08) bg, #3e691a text
            badge.style.backgroundColor = "var(--color-success-state-08)";
            badge.style.color = "#3e691a";
        } else if (numericValue >= 50) {
            // Yellow/Warning for 50–79% - Figma: rgba(113, 92, 0, 0.08) bg, #715c00 text
            badge.style.backgroundColor = "var(--color-warning-state-08)";
            badge.style.color = "#715c00";
        } else {
            // Red/Danger for <50% - Figma: rgba(190, 12, 22, 0.08) bg, #be0c16 text
            badge.style.backgroundColor = "var(--color-danger-state-08)";
            badge.style.color = "#be0c16";
        }
        
        badge.textContent = String(value).includes('%') ? value : `${value}%`;
    }

    cell.appendChild(badge);
    return cell;
}

/**
 * Creates a neutral badge cell (always gray) for Sessions and Students columns
 */
function createNeutralBadgeCell(value) {
    const cell = document.createElement("div");
    cell.style.display = "flex";
    cell.style.gap = "var(--size-table-cell-gap)";
    cell.style.alignItems = "flex-start";
    cell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.style.fontSize = "12px";
    badge.style.fontWeight = "400";
    badge.style.textTransform = "capitalize";
    badge.style.color = "var(--color-on-surface)";
    badge.style.backgroundColor = "var(--color-on-surface-state-08)";
    badge.style.padding = "0 var(--size-element-pad-x-sm)";
    badge.style.borderRadius = "var(--size-element-radius-pill)";
    badge.style.lineHeight = "1.667";
    badge.style.fontFamily = "var(--font-family-body)";
    
    if (value === null || value === undefined || value === "null" || value === "Null") {
        badge.textContent = "N/A";
    } else {
        badge.textContent = String(value);
    }

    cell.appendChild(badge);
    return cell;
}

