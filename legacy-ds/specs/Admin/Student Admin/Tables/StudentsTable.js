/**
 * @fileoverview StudentsTable component for Student Admin specs
 * Complete table component with title, header, rows, and pagination
 */

import { createButton } from '../../../../components/Button/index.js';
import { createPagination } from '../../../../components/Pagination/index.js';

/**
 * Creates a StudentsTable row component
 * @param {Object} options - Table row configuration
 * @param {string} [options.type="header"] - Row type: "header" or "list item"
 * @param {string} [options.state="default"] - Row state: "default" or "hover"
 * @param {Object} [options.data] - Row data (only for list item type)
 * @returns {HTMLElement} Table row element
 */
export function createStudentsTableRow({
    type = "header",
    state = "default",
    data = null
} = {}) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "repeat(5, minmax(0, 1fr))";
    row.style.height = type === "header" ? "44px" : "44px";
    row.style.borderRadius = "var(--size-table-radius-md)";
    row.style.width = "100%";

    // Apply state styling
    if (type === "list item" && state === "hover") {
        row.style.backgroundColor = "var(--color-on-surface-state-08)";
    }

    if (type === "header") {
        const headers = [
            { text: "Student", sortable: true, active: true },
            { text: "School", sortable: true },
            { text: "Teacher", sortable: true },
            { text: "Latest Status", sortable: true },
            { text: "Action", sortable: true }
        ];

        headers.forEach((header, index) => {
            const cell = document.createElement("div");
            cell.style.display = "flex";
            cell.style.gap = "var(--size-table-cell-gap)";
            cell.style.alignItems = "center";
            cell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

            const text = document.createElement("div");
            text.className = "body3-txt";
            text.style.fontWeight = "var(--font-weight-semibold-1)";
            text.style.color = index === 0 ? "var(--color-secondary-text)" : "var(--color-on-surface)";
            text.style.textTransform = "capitalize";
            text.textContent = header.text;
            cell.appendChild(text);

            if (header.sortable) {
                const icon = document.createElement("i");
                icon.className = `fas fa-arrow-up`;
                icon.style.fontSize = "var(--font-size-body3)";
                icon.style.color = index === 0 ? "var(--color-secondary)" : "var(--color-outline-variant)";
                cell.appendChild(icon);
            }

            row.appendChild(cell);
        });
    } else {
        const rowData = data || {
            student: "Jose D.",
            school: "Langley",
            teacher: "Jose D.",
            latestStatus: "Needs to set goals",
            action: "View goals"
        };

        // Student - column 1
        const studentCell = document.createElement("div");
        studentCell.style.display = "flex";
        studentCell.style.alignItems = "center";
        studentCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        studentCell.style.overflow = "hidden";

        const studentText = document.createElement("div");
        studentText.className = "body3-txt";
        studentText.style.fontWeight = "var(--font-weight-semibold-1)";
        studentText.style.color = "var(--color-on-surface)";
        studentText.style.overflow = "ellipsis";
        studentText.style.whiteSpace = "nowrap";
        studentText.textContent = rowData.student;
        studentCell.appendChild(studentText);
        row.appendChild(studentCell);

        // School - column 2
        const schoolCell = document.createElement("div");
        schoolCell.style.display = "flex";
        schoolCell.style.alignItems = "center";
        schoolCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        schoolCell.style.overflow = "hidden";

        const schoolText = document.createElement("div");
        schoolText.className = "body3-txt";
        schoolText.style.fontWeight = "var(--font-weight-normal)";
        schoolText.style.color = "var(--color-on-surface)";
        schoolText.style.overflow = "ellipsis";
        schoolText.style.whiteSpace = "nowrap";
        schoolText.textContent = rowData.school;
        schoolCell.appendChild(schoolText);
        row.appendChild(schoolCell);

        // Teacher - column 3
        const teacherCell = document.createElement("div");
        teacherCell.style.display = "flex";
        teacherCell.style.alignItems = "center";
        teacherCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        teacherCell.style.overflow = "hidden";

        const teacherText = document.createElement("div");
        teacherText.className = "body3-txt";
        teacherText.style.fontWeight = "var(--font-weight-normal)";
        teacherText.style.color = "var(--color-on-surface)";
        teacherText.textContent = rowData.teacher;
        teacherCell.appendChild(teacherText);
        row.appendChild(teacherCell);

        // Latest Status - column 4
        const statusCell = document.createElement("div");
        statusCell.style.display = "flex";
        statusCell.style.alignItems = "center";
        statusCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        statusCell.style.overflow = "hidden";

        const statusBadge = document.createElement("span");
        statusBadge.className = "badge";
        statusBadge.style.fontSize = "var(--font-size-body3)";
        statusBadge.style.fontWeight = "var(--font-weight-semibold-1)";
        statusBadge.style.color = "var(--color-info-text)";
        statusBadge.style.padding = "0 var(--size-element-pad-x-sm)";
        statusBadge.style.borderRadius = "var(--size-element-radius-pill)";
        statusBadge.style.backgroundColor = "var(--color-info-state-08)";
        statusBadge.textContent = rowData.latestStatus;
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        // Action - column 5
        const actionCell = document.createElement("div");
        actionCell.style.display = "flex";
        actionCell.style.alignItems = "center";
        actionCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        actionCell.style.overflow = "hidden";

        const actionButton = createButton({
            btnText: rowData.action,
            btnStyle: "primary",
            btnFill: "text",
            btnSize: "small"
        });
        actionCell.appendChild(actionButton);
        row.appendChild(actionCell);
    }

    return row;
}

/**
 * Creates a complete StudentsTable component with title, header, rows, and pagination
 * @param {Object} options - Table configuration
 * @param {string} [options.title="Student Details"] - Table title
 * @param {Array<Object>} [options.data=[]] - Array of student data objects
 * @param {Object} [options.pagination] - Pagination configuration
 * @param {number} [options.pagination.currentPage=1] - Current page number
 * @param {number} [options.pagination.totalPages=20] - Total number of pages
 * @param {string} [options.pagination.text="Showing 1 to 10 of 200 entries"] - Pagination text
 * @param {Function} [options.pagination.onPageChange] - Page change callback
 * @param {Function} [options.onAddStudent] - Add Student button click handler
 * @returns {HTMLElement} Complete table component
 */
export function createStudentsTable({
    title = "Student Details",
    data = [],
    pagination = {
        currentPage: 1,
        totalPages: 20,
        text: "Showing 1 to 10 of 200 entries",
        onPageChange: null
    },
    onAddStudent = null
} = {}) {
    const tableComponent = document.createElement("div");
    tableComponent.style.display = "flex";
    tableComponent.style.flexDirection = "column";
    tableComponent.style.gap = "var(--size-section-gap-md)";
    tableComponent.style.width = "100%";

    // Header section with title and Add Student button
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.flexWrap = "wrap";
    header.style.gap = "var(--size-section-gap-md)";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.width = "100%";

    const titleEl = document.createElement("div");
    titleEl.className = "h4-txt";
    titleEl.style.color = "var(--color-on-surface)";
    titleEl.textContent = title;
    header.appendChild(titleEl);

    // Add Student button
    const addStudentButton = createButton({
        btnText: "Add Student",
        btnStyle: "primary",
        btnFill: "filled",
        btnSize: "small",
        icon: "user-plus",
        iconPosition: "left"
    });
    if (onAddStudent) {
        addStudentButton.addEventListener("click", onAddStudent);
    }
    header.appendChild(addStudentButton);

    tableComponent.appendChild(header);

    // Table wrapper with scrolling
    const tableWrapper = document.createElement("div");
    tableWrapper.style.width = "100%";
    tableWrapper.style.overflowX = "auto";
    tableWrapper.style.overflowY = "hidden";

    // Table container
    const tableContainer = document.createElement("div");
    tableContainer.style.display = "flex";
    tableContainer.style.flexDirection = "column";
    tableContainer.style.gap = "var(--size-element-gap-sm)";
    tableContainer.style.minWidth = "1000px";
    tableContainer.style.width = "1500px";

    // Table Header
    const tableHeaderRow = createStudentsTableRow({ type: "header" });
    tableContainer.appendChild(tableHeaderRow);

    // Table Rows
    const tableData = data.length > 0 ? data : [
        { student: "Jose Dolus", school: "Langley", teacher: "Jose Mura", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Chris Hudson", school: "Langley", teacher: "Ruth Perez", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Irene White", school: "Langley", teacher: "Ruth Perez", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Jacqueline Traine", school: "Langley", teacher: "Erin Hunter", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Jerome Brown", school: "Langley", teacher: "Katie Strong", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Jose Darrell", school: "Langley", teacher: "Tisha Bryan", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Joy Jones", school: "Langley", teacher: "Aaron Zhang", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Ksenia Gato", school: "Langley", teacher: "Ruth Perez", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Lesley Mora", school: "Langley", teacher: "Tisha Bryan", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Manny Jones", school: "Langley", teacher: "Tisha Bryan", latestStatus: "Needs to set goals", action: "View goals" }
    ];

    tableData.forEach((rowData) => {
        const tableRow = createStudentsTableRow({
            type: "list item",
            state: "default",
            data: rowData
        });
        tableContainer.appendChild(tableRow);
    });

    tableWrapper.appendChild(tableContainer);
    tableComponent.appendChild(tableWrapper);

    // Pagination footer
    const paginationContainer = document.createElement("div");
    paginationContainer.style.display = "flex";
    paginationContainer.style.justifyContent = "space-between";
    paginationContainer.style.alignItems = "center";
    paginationContainer.style.width = "100%";

    const paginationText = document.createElement("div");
    paginationText.className = "body2-txt";
    paginationText.style.fontWeight = "var(--font-weight-normal)";
    paginationText.style.color = "var(--color-on-surface)";
    paginationText.textContent = pagination.text || "Showing 1 to 10 of 200 entries";
    paginationContainer.appendChild(paginationText);

    const paginationEl = createPagination({
        currentPage: pagination.currentPage || 1,
        totalPages: pagination.totalPages || 20,
        onPageChange: pagination.onPageChange || ((page) => console.log(`Page changed to ${page}`))
    });
    paginationContainer.appendChild(paginationEl);
    tableComponent.appendChild(paginationContainer);

    return tableComponent;
}
