/**
 * @fileoverview TutorsStatusWarningsTable component for Admin specs
 * Table showing tutor status and warnings
 */

/**
 * Creates a TutorsStatusWarningsTable row component
 * @param {Object} options - Table row configuration
 * @param {string} [options.type="header"] - Row type: "header" or "list item"
 * @param {Object} [options.data] - Row data (only for list item type)
 * @returns {HTMLElement} Table row element
 */
export function createTutorsStatusWarningsTableRow({
    type = "header",
    data = null
} = {}) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "repeat(7, 1fr)";
    row.style.height = "44px";
    row.style.borderRadius = "var(--size-table-radius-md)";
    row.style.width = "1121px";

    if (type === "header") {
        const headers = [
            { text: "Tutor Name", sortable: true, active: true },
            { text: "Status", sortable: true },
            { text: "Total Warnings", sortable: true },
            { text: "Mic off", sortable: true },
            { text: "Cam off", sortable: true },
            { text: "Absence", sortable: true },
            { text: "Late Call-off", sortable: true }
        ];

        headers.forEach((header, index) => {
            const cell = document.createElement("div");
            cell.style.display = "flex";
            cell.style.gap = "var(--size-table-cell-gap)";
            cell.style.alignItems = "center";
            cell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

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
        const rowData = data || {
            tutorName: "Floyd Miles",
            status: "Check-In Needed",
            totalWarnings: 16,
            micOff: 4,
            camOff: 4,
            absence: 4,
            lateCalloff: 4
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

        // Status
        const statusCell = document.createElement("div");
        statusCell.style.display = "flex";
        statusCell.style.gap = "var(--size-table-cell-gap)";
        statusCell.style.alignItems = "center";
        statusCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

        const statusButton = document.createElement("button");
        statusButton.className = "btn btn-link";
        statusButton.style.padding = "var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)";
        statusButton.style.border = "none";
        statusButton.style.background = "none";
        statusButton.style.color = "var(--color-secondary)";
        statusButton.style.fontSize = "12px";
        statusButton.style.fontWeight = "400";
        statusButton.style.textTransform = "capitalize";
        statusButton.style.display = "flex";
        statusButton.style.gap = "var(--size-element-gap-sm)";
        statusButton.style.alignItems = "center";
        statusButton.textContent = rowData.status;

        const dropdownIcon = document.createElement("i");
        dropdownIcon.className = "fas fa-caret-down";
        dropdownIcon.style.fontSize = "10px";
        dropdownIcon.style.color = "var(--color-on-surface-variant)";
        statusButton.appendChild(dropdownIcon);
        statusCell.appendChild(statusButton);
        row.appendChild(statusCell);

        // Total Warnings (danger badge)
        const warningsCell = createWarningBadgeCell(rowData.totalWarnings, "danger");
        row.appendChild(warningsCell);

        // Mic off (warning badge)
        const micCell = createWarningBadgeCell(rowData.micOff, "warning");
        row.appendChild(micCell);

        // Cam off (warning badge)
        const camCell = createWarningBadgeCell(rowData.camOff, "warning");
        row.appendChild(camCell);

        // Absence (warning badge)
        const absenceCell = createWarningBadgeCell(rowData.absence, "warning");
        row.appendChild(absenceCell);

        // Late Call-off (warning badge)
        const lateCell = createWarningBadgeCell(rowData.lateCalloff, "warning");
        row.appendChild(lateCell);
    }

    return row;
}

/**
 * Creates a warning badge cell
 */
function createWarningBadgeCell(value, type = "warning") {
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

    if (type === "danger") {
        badge.style.color = "var(--color-danger)";
        badge.style.backgroundColor = "var(--color-danger-state-08)";
    } else {
        badge.style.color = "var(--color-warning-text)";
        badge.style.backgroundColor = "var(--color-warning-state-08)";
    }

    badge.textContent = value.toString();
    cell.appendChild(badge);
    return cell;
}

