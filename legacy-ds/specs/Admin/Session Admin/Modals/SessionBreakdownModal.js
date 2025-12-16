/**
 * @fileoverview SessionBreakdownModal component for Session Admin specs
 * Modal showing session breakdown with student details table
 */

import { createModal } from '../../../../components/Modal/index.js';
import { createSessionBreakdownTableRow } from '../Tables/SessionBreakdownTable.js';

/**
 * Creates a Session Breakdown Modal component
 * @param {Object} options - Modal configuration
 * @param {string} [options.sessionDate="11/02/12"] - Session date to display in title
 * @param {Array<Object>} [options.students=[]] - Array of student data objects
 * @param {Function} [options.onClose] - Close button click handler
 * @returns {HTMLElement} Modal element
 */
export function createSessionBreakdownModal({
    sessionDate = "11/02/12",
    students = [],
    onClose = null
} = {}) {
    // Default student data if none provided
    const defaultStudents = [
        { studentName: "Amanda Novak", studentStatus: "Needs to set goals", tutorName: "Ethan Cole", tutorType: "Lead", timeSpent: "11" },
        { studentName: "Ashley Brown", studentStatus: "Needs to set goals", tutorName: "Martha Dunn", tutorType: "Regular", timeSpent: "8" },
        { studentName: "Frank Bass", studentStatus: "Needs to set goals", tutorName: "Martha Dunn", tutorType: "Regular", timeSpent: "11" },
        { studentName: "Henry Hamm", studentStatus: "Needs to set goals", tutorName: "Martha Dunn", tutorType: "Regular", timeSpent: "15" },
        { studentName: "Jose Green", studentStatus: "Needs to set goals", tutorName: "Ethan Cole", tutorType: "Lead", timeSpent: "10" },
        { studentName: "Miles Hazel", studentStatus: "Needs to set goals", tutorName: "Ethan Cole", tutorType: "Lead", timeSpent: "14" },
        { studentName: "Olga Petra", studentStatus: "Needs to set goals", tutorName: "Martha Dunn", tutorType: "Regular", timeSpent: "3" },
        { studentName: "Pete Smith", studentStatus: "Needs to set goals", tutorName: "Martha Dunn", tutorType: "Regular", timeSpent: "4" },
        { studentName: "Sam Morales", studentStatus: "Needs to set goals", tutorName: "Martha Dunn", tutorType: "Regular", timeSpent: "11" }
    ];

    const studentData = students.length > 0 ? students : defaultStudents;

    // Create modal body with table
    const modalBody = document.createElement("div");
    modalBody.style.display = "flex";
    modalBody.style.flexDirection = "column";
    modalBody.style.height = "456px";
    modalBody.style.minWidth = "700px";
    modalBody.style.padding = "var(--size-modal-pad-y-sm) var(--size-modal-pad-x-md)";
    modalBody.style.overflowY = "auto";

    // Table container
    const tableContainer = document.createElement("div");
    tableContainer.style.display = "flex";
    tableContainer.style.flexDirection = "column";
    tableContainer.style.gap = "0";
    tableContainer.style.width = "100%";

    // Table header row - use SessionBreakdownTable component
    const headerRow = createSessionBreakdownTableRow({ type: "header" });
    headerRow.style.width = "100%"; // Override fixed width to be responsive
    tableContainer.appendChild(headerRow);

    // Table data rows - use SessionBreakdownTable component
    studentData.forEach((student) => {
        const dataRow = createSessionBreakdownTableRow({
            type: "list item",
            state: "default",
            data: {
                studentName: student.studentName,
                studentStatus: student.studentStatus,
                tutorName: student.tutorName,
                tutorType: student.tutorType,
                timeSpent: student.timeSpent
            }
        });
        dataRow.style.width = "100%"; // Override fixed width to be responsive
        tableContainer.appendChild(dataRow);
    });

    modalBody.appendChild(tableContainer);

    // Create modal with custom header
    const modal = createModal({
        title: `${sessionDate} Session Breakdown`,
        body: modalBody,
        type: "scrollable",
        showBottomButtons: false,
        onClose: onClose,
        paddingSize: "md",
        width: 672
    });

    // Override header to match Figma exactly
    const modalHeader = modal.querySelector('.plus-modal-header');
    if (modalHeader) {
        modalHeader.style.borderBottom = "1px solid var(--color-outline-variant)";
        modalHeader.style.padding = "var(--size-element-pad-y-lg) var(--size-element-pad-x-lg)";
        modalHeader.style.display = "flex";
        modalHeader.style.justifyContent = "space-between";
        modalHeader.style.alignItems = "center";

        const title = modalHeader.querySelector('.plus-modal-title');
        if (title) {
            title.style.fontFamily = "var(--font-family-header)";
            title.style.fontSize = "var(--font-size-h4)";
            title.style.fontWeight = "var(--font-weight-semibold)";
            title.style.lineHeight = "1.333";
            title.style.color = "var(--color-on-surface)";
        }

        const closeButton = modalHeader.querySelector('.plus-modal-close-btn');
        if (closeButton) {
            closeButton.style.fontSize = "24px";
            closeButton.style.color = "var(--color-on-surface-variant)";
        }
    }

    // Remove custom scrollbar arrows - use native browser scrolling instead
    const scrollbar = modal.querySelector('.plus-modal-scrollbar');
    if (scrollbar) {
        scrollbar.style.display = "none";
    }

    return modal;
}


