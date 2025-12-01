/**
 * @fileoverview TutorsToolUsageTable component for Admin specs
 * Table showing tutor tool usage metrics
 */

/**
 * @fileoverview TutorsToolUsageTable component for Admin specs
 * Table showing tutor tool usage metrics
 */

/**
 * Creates a TutorsToolUsageTable row component
 * @param {Object} options - Table row configuration
 * @param {string} [options.type="header"] - Row type: "header" or "item"
 * @param {string} [options.state="default"] - Row state: "default", "hovered", "pressed", "focus", "disabled"
 * @param {Object} [options.data] - Row data (only for item type)
 * @returns {HTMLElement} Table row element
 */
export function createTutorsToolUsageTableRow({
    type = "header",
    state = "default",
    data = null
} = {}) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "repeat(5, 1fr)";
    row.style.height = "44px";
    row.style.borderRadius = "var(--size-table-radius-md)";
    row.style.width = "1121px";

    // Apply state styling
    if (type === "item") {
        if (state === "hovered") {
            row.style.backgroundColor = "var(--color-on-surface-state-08)";
        } else if (state === "pressed") {
            row.style.backgroundColor = "var(--color-on-surface-state-16)";
        } else if (state === "focus") {
            row.style.backgroundColor = "var(--color-on-surface-state-12)";
            row.style.border = "2px solid var(--color-inverse-primary)";
        } else if (state === "disabled") {
            row.style.backgroundColor = "var(--color-on-surface-state-08)";
            row.style.opacity = "0.38";
        }
    }

    if (type === "header") {
        // Header row
        const headers = [
            { text: "Tutor name", sortable: true, active: true },
            { text: "# Help Center Visits", sortable: true },
            { text: "%Recording", sortable: true },
            { text: "%Reflection", sortable: true },
            { text: "Dashboard Adoption", sortable: true }
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
    } else {
        // Data row
        const rowData = data || {
            tutorName: "Floyd Miles",
            helpCenterVisits: "No",
            recording: null,
            reflection: null,
            dashboardAdoption: null
        };

        // Tutor Name
        const nameCell = document.createElement("div");
        nameCell.style.display = "flex";
        nameCell.style.gap = "var(--size-table-cell-gap)";
        nameCell.style.alignItems = "center";
        nameCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

        const nameText = document.createElement("div");
        nameText.className = "body3-txt";
        nameText.style.fontWeight = "400";
        nameText.style.color = "var(--color-on-surface)";
        nameText.textContent = rowData.tutorName;
        nameCell.appendChild(nameText);
        row.appendChild(nameCell);

        // # Help Center Visits (binary: Yes/No)
        const helpCenterCell = createBinaryBadgeCell(rowData.helpCenterVisits);
        row.appendChild(helpCenterCell);

        // %Recording
        const recordingCell = createBadgeCell(rowData.recording);
        row.appendChild(recordingCell);

        // %Reflection
        const reflectionCell = createBadgeCell(rowData.reflection);
        row.appendChild(reflectionCell);

        // Dashboard Adoption (binary: Yes/No)
        const dashboardCell = createBinaryBadgeCell(rowData.dashboardAdoption);
        row.appendChild(dashboardCell);
    }

    return row;
}

/**
 * Creates a badge cell for numeric values (percentages or null)
 */
function createBadgeCell(value) {
    const cell = document.createElement("div");
    cell.style.display = "flex";
    cell.style.gap = "var(--size-table-cell-gap)";
    cell.style.alignItems = "center";
    cell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

    if (value === null || value === undefined) {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.style.fontSize = "12px";
        badge.style.fontWeight = "400";
        badge.style.textTransform = "capitalize";
        badge.style.color = "var(--color-on-surface)";
        badge.style.backgroundColor = "var(--color-on-surface-state-08)";
        badge.style.padding = "0 var(--size-element-pad-x-sm)";
        badge.style.borderRadius = "var(--size-element-radius-pill)";
        badge.textContent = "null";
        cell.appendChild(badge);
    } else {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.style.fontSize = "12px";
        badge.style.fontWeight = "400";
        badge.style.color = "var(--color-secondary-text)";
        badge.style.backgroundColor = "var(--color-secondary-state-08)";
        badge.style.padding = "0 var(--size-element-pad-x-sm)";
        badge.style.borderRadius = "var(--size-element-radius-pill)";
        badge.textContent = value;
        cell.appendChild(badge);
    }

    return cell;
}

/**
 * Creates a binary badge cell (Yes/No)
 */
function createBinaryBadgeCell(value) {
    const cell = document.createElement("div");
    cell.style.display = "flex";
    cell.style.gap = "var(--size-table-cell-gap)";
    cell.style.alignItems = "center";
    cell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

    if (value === null || value === undefined) {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.style.fontSize = "12px";
        badge.style.fontWeight = "400";
        badge.style.textTransform = "capitalize";
        badge.style.color = "var(--color-on-surface)";
        badge.style.backgroundColor = "var(--color-on-surface-state-08)";
        badge.style.padding = "0 var(--size-element-pad-x-sm)";
        badge.style.borderRadius = "var(--size-element-radius-pill)";
        badge.textContent = "null";
        cell.appendChild(badge);
    } else {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.style.fontSize = "12px";
        badge.style.fontWeight = "400";
        badge.style.textTransform = "capitalize";
        badge.style.color = "var(--color-on-surface)";
        badge.style.backgroundColor = "var(--color-on-surface-state-08)";
        badge.style.padding = "0 var(--size-element-pad-x-sm)";
        badge.style.borderRadius = "var(--size-element-radius-pill)";
        badge.textContent = value;
        cell.appendChild(badge);
    }

    return cell;
}

