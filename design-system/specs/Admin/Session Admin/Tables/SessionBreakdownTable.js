/**
 * @fileoverview SessionBreakdownTable component for Session Admin specs
 * Table showing session breakdown details with columns: Student Name, Student Status, Tutor Name, Tutor Type, Time Spent (Mins)
 */

/**
 * Creates a Session Breakdown Table row component
 * @param {Object} options - Table row configuration
 * @param {string} [options.type="header"] - Row type: "header" or "list item"
 * @param {string} [options.state="default"] - Row state: "default" (not used for header)
 * @param {Object} [options.data] - Row data (only for list item type)
 * @returns {HTMLElement} Table row element
 */
export function createSessionBreakdownTableRow({
    type = "header",
    state = "default",
    data = null
} = {}) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "repeat(5, minmax(0, 1fr))";
    row.style.height = type === "header" ? "44px" : "44px";
    row.style.borderRadius = "var(--size-table-radius-sm)";
    row.style.width = "1120px";

    if (type === "header") {
        const headers = [
            { text: "Student Name", sortable: true },
            { text: "Student Status", sortable: true },
            { text: "Tutor Name", sortable: true, active: true },
            { text: "Tutor Type", sortable: true },
            { text: "Time Spent (Mins)", sortable: true }
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
            text.style.color = header.active ? "var(--color-on-surface)" : "var(--color-on-surface)";
            text.textContent = header.text;
            cell.appendChild(text);

            if (header.sortable) {
                const icon = document.createElement("i");
                icon.className = `fas fa-arrow-up`;
                icon.style.fontSize = "10px";
                icon.style.color = header.active ? "var(--color-on-surface)" : "var(--color-outline-variant)";
                cell.appendChild(icon);
            }

            row.appendChild(cell);
        });
    } else {
        const rowData = data || {
            studentName: "Frank A.",
            studentStatus: "Needs to set goals",
            tutorName: "Jose D.",
            tutorType: "Lead",
            timeSpent: "11"
        };

        // Student Name
        const studentNameCell = document.createElement("div");
        studentNameCell.style.display = "flex";
        studentNameCell.style.alignItems = "center";
        studentNameCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        studentNameCell.style.overflow = "hidden";

        const studentNameText = document.createElement("div");
        studentNameText.className = "body3-txt";
        studentNameText.style.fontWeight = "300";
        studentNameText.style.color = "var(--color-on-surface)";
        studentNameText.style.overflow = "ellipsis";
        studentNameText.style.whiteSpace = "nowrap";
        studentNameText.textContent = rowData.studentName;
        studentNameCell.appendChild(studentNameText);
        row.appendChild(studentNameCell);

        // Student Status
        const studentStatusCell = document.createElement("div");
        studentStatusCell.style.display = "flex";
        studentStatusCell.style.alignItems = "center";
        studentStatusCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        studentStatusCell.style.overflow = "hidden";

        const statusBadge = document.createElement("span");
        statusBadge.className = "badge";
        statusBadge.style.fontSize = "12px";
        statusBadge.style.fontWeight = "400";
        statusBadge.style.color = "var(--color-info-text)";
        statusBadge.style.padding = "0 var(--size-element-pad-x-sm)";
        statusBadge.style.borderRadius = "var(--size-element-radius-pill)";
        statusBadge.style.backgroundColor = "var(--color-info-state-08)";
        statusBadge.textContent = rowData.studentStatus;
        studentStatusCell.appendChild(statusBadge);
        row.appendChild(studentStatusCell);

        // Tutor Name
        const tutorNameCell = document.createElement("div");
        tutorNameCell.style.display = "flex";
        tutorNameCell.style.alignItems = "center";
        tutorNameCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        tutorNameCell.style.overflow = "hidden";

        const tutorNameText = document.createElement("div");
        tutorNameText.className = "body3-txt";
        tutorNameText.style.fontWeight = "300";
        tutorNameText.style.color = "var(--color-on-surface)";
        tutorNameText.style.overflow = "ellipsis";
        tutorNameText.style.whiteSpace = "nowrap";
        tutorNameText.textContent = rowData.tutorName;
        tutorNameCell.appendChild(tutorNameText);
        row.appendChild(tutorNameCell);

        // Tutor Type
        const tutorTypeCell = document.createElement("div");
        tutorTypeCell.style.display = "flex";
        tutorTypeCell.style.alignItems = "center";
        tutorTypeCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        tutorTypeCell.style.overflow = "hidden";

        const tutorTypeBadge = document.createElement("span");
        tutorTypeBadge.className = "badge";
        tutorTypeBadge.style.fontSize = "12px";
        tutorTypeBadge.style.fontWeight = "400";
        tutorTypeBadge.style.color = rowData.tutorType === "Lead" ? "var(--color-info-text)" : "var(--color-on-surface)";
        tutorTypeBadge.style.padding = "0 var(--size-element-pad-x-sm)";
        tutorTypeBadge.style.borderRadius = "var(--size-element-radius-pill)";
        tutorTypeBadge.style.backgroundColor = rowData.tutorType === "Lead" ? "var(--color-info-state-08)" : "var(--color-on-surface-state-08)";
        tutorTypeBadge.style.maxWidth = "67.33px";
        tutorTypeBadge.textContent = rowData.tutorType;
        tutorTypeCell.appendChild(tutorTypeBadge);
        row.appendChild(tutorTypeCell);

        // Time Spent
        const timeSpentCell = document.createElement("div");
        timeSpentCell.style.display = "flex";
        timeSpentCell.style.alignItems = "center";
        timeSpentCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        timeSpentCell.style.overflow = "hidden";

        const timeSpentText = document.createElement("div");
        timeSpentText.className = "body3-txt";
        timeSpentText.style.fontWeight = "300";
        timeSpentText.style.color = "var(--color-on-surface)";
        timeSpentText.textContent = rowData.timeSpent;
        timeSpentCell.appendChild(timeSpentText);
        row.appendChild(timeSpentCell);
    }

    return row;
}



