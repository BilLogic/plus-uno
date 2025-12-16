/**
 * @fileoverview SessionsTable component for Session Admin specs
 * Table showing session details with columns: Day (Date), Shift (ET), School, Teacher, Attended students, Engaged student, Attended tutors, Completed Check-in
 */

/**
 * Creates a SessionsTable row component
 * @param {Object} options - Table row configuration
 * @param {string} [options.type="header"] - Row type: "header" or "item row"
 * @param {string} [options.state="default"] - Row state: "default" or "hover"
 * @param {Object} [options.data] - Row data (only for item row type)
 * @returns {HTMLElement} Table row element
 */
export function createSessionsTableRow({
    type = "header",
    state = "default",
    data = null
} = {}) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "repeat(8, minmax(0, 1fr))";
    row.style.height = type === "header" ? "70.667px" : "70.667px";
    row.style.borderRadius = "var(--size-table-radius-md)";
    row.style.width = "1545px";

    // Apply state styling
    if (type === "item row" && state === "hover") {
        row.style.backgroundColor = "var(--color-on-surface-state-08)";
    }

    if (type === "header") {
        const headers = [
            { text: "Day (Date)", sortable: true, active: true },
            { text: "Shift (ET)", sortable: true },
            { text: "School", sortable: true },
            { text: "Teacher", sortable: true },
            { text: "Attended students", sortable: true },
            { text: "Engaged student", sortable: true },
            { text: "Attended tutors", sortable: true },
            { text: "Completed Check-in", sortable: true }
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
            text.style.textTransform = "capitalize";
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
            day: "DoW (00/00/00)",
            shift: "2:25 PM - 3:15 PM",
            school: "Hogwarts",
            teacher: "Snape",
            attendedStudents: "20%",
            engagedStudent: "20%",
            attendedTutors: "20%",
            completedCheckin: "20%"
        };

        // Day (Date) - column 1
        const dayCell = document.createElement("div");
        dayCell.style.display = "flex";
        dayCell.style.flexDirection = "column";
        dayCell.style.justifyContent = "center";
        dayCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        dayCell.style.overflow = "hidden";

        const dayText = document.createElement("div");
        dayText.className = "body3-txt";
        dayText.style.fontWeight = "300";
        dayText.style.color = "var(--color-on-surface)";
        dayText.style.overflow = "ellipsis";
        dayText.style.whiteSpace = "nowrap";
        dayText.textContent = rowData.day;
        dayCell.appendChild(dayText);
        row.appendChild(dayCell);

        // Shift (ET) - column 2
        const shiftCell = document.createElement("div");
        shiftCell.style.display = "flex";
        shiftCell.style.alignItems = "center";
        shiftCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        shiftCell.style.overflow = "hidden";

        const shiftText = document.createElement("div");
        shiftText.className = "body3-txt";
        shiftText.style.fontWeight = "300";
        shiftText.style.color = "var(--color-on-surface)";
        shiftText.style.overflow = "ellipsis";
        shiftText.style.whiteSpace = "nowrap";
        shiftText.textContent = rowData.shift;
        shiftCell.appendChild(shiftText);
        row.appendChild(shiftCell);

        // School - column 3
        const schoolCell = document.createElement("div");
        schoolCell.style.display = "flex";
        schoolCell.style.alignItems = "center";
        schoolCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        schoolCell.style.overflow = "hidden";

        const schoolBadge = document.createElement("span");
        schoolBadge.className = "badge";
        schoolBadge.style.fontSize = "12px";
        schoolBadge.style.fontWeight = "400";
        schoolBadge.style.color = "var(--color-on-surface)";
        schoolBadge.style.padding = "0 var(--size-element-pad-x-sm)";
        schoolBadge.style.borderRadius = "var(--size-element-radius-pill)";
        schoolBadge.style.backgroundColor = "var(--color-on-surface-state-08)";
        schoolBadge.style.textTransform = "capitalize";
        schoolBadge.textContent = rowData.school;
        schoolCell.appendChild(schoolBadge);
        row.appendChild(schoolCell);

        // Teacher - column 4
        const teacherCell = document.createElement("div");
        teacherCell.style.display = "flex";
        teacherCell.style.alignItems = "center";
        teacherCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        teacherCell.style.overflow = "hidden";

        const teacherText = document.createElement("div");
        teacherText.className = "body3-txt";
        teacherText.style.fontWeight = "300";
        teacherText.style.color = "var(--color-on-surface)";
        teacherText.textContent = rowData.teacher;
        teacherCell.appendChild(teacherText);
        row.appendChild(teacherCell);

        // Attended students - column 5
        const attendedStudentsCell = document.createElement("div");
        attendedStudentsCell.style.display = "flex";
        attendedStudentsCell.style.alignItems = "center";
        attendedStudentsCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        attendedStudentsCell.style.overflow = "hidden";

        const attendedStudentsBadge = createNumericStatsBadge(rowData.attendedStudents);
        attendedStudentsCell.appendChild(attendedStudentsBadge);
        row.appendChild(attendedStudentsCell);

        // Engaged student - column 6
        const engagedStudentCell = document.createElement("div");
        engagedStudentCell.style.display = "flex";
        engagedStudentCell.style.alignItems = "center";
        engagedStudentCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        engagedStudentCell.style.overflow = "hidden";

        const engagedStudentBadge = createNumericStatsBadge(rowData.engagedStudent);
        engagedStudentCell.appendChild(engagedStudentBadge);
        row.appendChild(engagedStudentCell);

        // Attended tutors - column 7
        const attendedTutorsCell = document.createElement("div");
        attendedTutorsCell.style.display = "flex";
        attendedTutorsCell.style.alignItems = "center";
        attendedTutorsCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        attendedTutorsCell.style.overflow = "hidden";

        const attendedTutorsBadge = createNumericStatsBadge(rowData.attendedTutors);
        attendedTutorsCell.appendChild(attendedTutorsBadge);
        row.appendChild(attendedTutorsCell);

        // Completed Check-in - column 8
        const completedCheckinCell = document.createElement("div");
        completedCheckinCell.style.display = "flex";
        completedCheckinCell.style.alignItems = "center";
        completedCheckinCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        completedCheckinCell.style.overflow = "hidden";

        // Check if it's a badge or just text
        if (rowData.completedCheckin === "Badge") {
            const badge = document.createElement("span");
            badge.className = "badge";
            badge.style.fontSize = "12px";
            badge.style.fontWeight = "400";
            badge.style.color = "var(--color-on-surface)";
            badge.style.padding = "0 var(--size-element-pad-x-sm)";
            badge.style.borderRadius = "var(--size-element-radius-pill)";
            badge.style.backgroundColor = "var(--color-on-surface-state-08)";
            badge.textContent = "Badge";
            completedCheckinCell.appendChild(badge);
        } else {
            const completedCheckinBadge = createNumericStatsBadge(rowData.completedCheckin);
            completedCheckinCell.appendChild(completedCheckinBadge);
        }
        row.appendChild(completedCheckinCell);
    }

    return row;
}

/**
 * Creates a numeric stats badge (percentage badge) with color thresholds
 * Color thresholds:
 * - ≥80% → Green/Success
 * - 50–79% → Yellow/Warning
 * - <50% → Red/Danger
 * @param {string} value - Percentage value (e.g., "20%", "8%")
 * @returns {HTMLElement} Badge element
 */
function createNumericStatsBadge(value) {
    // Extract numeric value from string (e.g., "20%" -> 20, "8%" -> 8)
    const numericValue = parseFloat(value.replace('%', ''));
    
    let colorText, backgroundColor;
    
    if (numericValue >= 80) {
        // Green/Success for ≥80%
        colorText = "var(--color-success-text)";
        backgroundColor = "var(--color-success-state-08)";
    } else if (numericValue >= 50) {
        // Yellow/Warning for 50–79%
        colorText = "var(--color-warning-text)";
        backgroundColor = "var(--color-warning-state-08)";
    } else {
        // Red/Danger for <50%
        colorText = "var(--color-danger-text)";
        backgroundColor = "var(--color-danger-state-08)";
    }
    
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.style.fontSize = "12px";
    badge.style.fontWeight = "400";
    badge.style.color = colorText;
    badge.style.padding = "0 var(--size-element-pad-x-sm)";
    badge.style.borderRadius = "var(--size-element-radius-pill)";
    badge.style.backgroundColor = backgroundColor;
    badge.style.textTransform = "capitalize";
    badge.textContent = value;
    return badge;
}

