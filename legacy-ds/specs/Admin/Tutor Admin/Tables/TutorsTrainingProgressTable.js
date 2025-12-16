/**
 * @fileoverview TutorsTrainingProgressTable component for Admin specs
 * Table showing tutor training progress
 */

import { createButton } from '../../../../components/Button/index.js';

/**
 * Creates a TutorsTrainingProgressTable row component
 * @param {Object} options - Table row configuration
 * @param {string} [options.type="header"] - Row type: "header" or "item row"
 * @param {string} [options.state="default"] - Row state: "default" or "hover"
 * @param {Object} [options.data] - Row data (only for item row type)
 * @returns {HTMLElement} Table row element
 */
export function createTutorsTrainingProgressTableRow({
    type = "header",
    state = "default",
    data = null
} = {}) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "repeat(7, minmax(0, 1fr))";
    row.style.minHeight = "56.364px";
    row.style.borderRadius = "var(--size-table-radius-md)";
    row.style.width = "1000px";

    // Apply state styling
    if (type === "item row" && state === "hover") {
        row.style.backgroundColor = "var(--color-on-surface-state-08)";
    }

    if (type === "header") {
        const headers = [
            { text: "Tutor Name", span: 2, sortable: true, active: true },
            { text: "Completion", sortable: true },
            { text: "Accuracy", sortable: true },
            { text: "Badge Claimed", sortable: true },
            { text: "Time Spent (mins)", sortable: true },
            { text: "Action", sortable: true }
        ];

        headers.forEach((header, index) => {
            const cell = document.createElement("div");
            if (index === 0) {
                // Tutor Name spans 2 columns
                cell.style.gridColumn = "span 2";
            }
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
            tutorName: "Ben Green",
            email: "dummy@gmail.com",
            completion: "8/18",
            accuracy: "30%",
            badgeClaimed: true,
            timeSpent: "328"
        };

        // Tutor Name (spans 2 columns)
        const nameCell = document.createElement("div");
        nameCell.style.gridColumn = "span 2";
        nameCell.style.display = "flex";
        nameCell.style.gap = "var(--size-table-cell-gap)";
        nameCell.style.alignItems = "center";
        nameCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

        const avatar = document.createElement("div");
        avatar.style.width = "40px";
        avatar.style.height = "40px";
        avatar.style.borderRadius = "var(--size-element-radius-pill)";
        avatar.style.backgroundColor = "var(--color-surface-container-lowest)";
        avatar.style.display = "flex";
        avatar.style.alignItems = "center";
        avatar.style.justifyContent = "center";
        avatar.style.padding = "var(--size-element-pad-x-sm)";

        const avatarIcon = document.createElement("i");
        avatarIcon.className = "fas fa-chalkboard-teacher";
        avatarIcon.style.fontSize = "16px";
        avatarIcon.style.color = "var(--color-on-surface-variant)";
        avatar.appendChild(avatarIcon);
        nameCell.appendChild(avatar);

        const nameContent = document.createElement("div");
        nameContent.style.display = "flex";
        nameContent.style.flexDirection = "column";
        nameContent.style.gap = "0";

        const nameText = document.createElement("div");
        nameText.className = "body2-txt";
        nameText.style.fontWeight = "400";
        nameText.style.color = "var(--color-on-surface)";
        nameText.textContent = rowData.tutorName;
        nameContent.appendChild(nameText);

        const emailText = document.createElement("div");
        emailText.className = "body3-txt";
        emailText.style.fontWeight = "300";
        emailText.style.color = "var(--color-on-surface-variant)";
        emailText.textContent = rowData.email;
        nameContent.appendChild(emailText);

        nameCell.appendChild(nameContent);
        row.appendChild(nameCell);

        // Completion (progress indicator placeholder)
        const completionCell = createProgressCell(rowData.completion);
        row.appendChild(completionCell);

        // Accuracy (progress indicator placeholder)
        const accuracyCell = createProgressCell(rowData.accuracy);
        row.appendChild(accuracyCell);

        // Badge Claimed
        const badgeCell = document.createElement("div");
        badgeCell.style.display = "flex";
        badgeCell.style.alignItems = "center";
        badgeCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

        const badgePill = document.createElement("span");
        badgePill.className = "badge";
        badgePill.style.fontSize = "12px";
        badgePill.style.fontWeight = "400";
        badgePill.style.color = "var(--color-on-surface)";
        badgePill.style.padding = "0 var(--size-element-pad-x-sm)";
        badgePill.style.borderRadius = "var(--size-element-radius-pill)";
        badgePill.style.display = "flex";
        badgePill.style.alignItems = "center";
        badgePill.style.gap = "var(--size-element-gap-xs)";

        // Determine badge state and styling
        if (rowData.badgeClaimed === true) {
            // Green checkmark with "Yes"
            badgePill.style.backgroundColor = "var(--color-success-container)";
            const icon = document.createElement("i");
            icon.className = "fas fa-check";
            icon.style.fontSize = "10px";
            icon.style.color = "var(--color-on-surface)";
            badgePill.appendChild(icon);
            const text = document.createElement("span");
            text.textContent = "Yes";
            badgePill.appendChild(text);
        } else if (rowData.badgeClaimed === false) {
            // Red exclamation mark with "No"
            badgePill.style.backgroundColor = "var(--color-danger-container)";
            const icon = document.createElement("i");
            icon.className = "fas fa-exclamation";
            icon.style.fontSize = "10px";
            icon.style.color = "var(--color-on-surface)";
            badgePill.appendChild(icon);
            const text = document.createElement("span");
            text.textContent = "No";
            badgePill.appendChild(text);
        } else {
            // Gray "X" with "N/A"
            badgePill.style.backgroundColor = "var(--color-surface-container)";
            const icon = document.createElement("i");
            icon.className = "fas fa-xmark";
            icon.style.fontSize = "10px";
            icon.style.color = "var(--color-on-surface-variant)";
            badgePill.appendChild(icon);
            const text = document.createElement("span");
            text.textContent = "N/A";
            badgePill.appendChild(text);
        }

        badgeCell.appendChild(badgePill);
        row.appendChild(badgeCell);

        // Time Spent
        const timeCell = document.createElement("div");
        timeCell.style.display = "flex";
        timeCell.style.alignItems = "center";
        timeCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

        const timeText = document.createElement("div");
        timeText.className = "body3-txt";
        timeText.style.fontWeight = "300";
        timeText.style.color = "var(--color-on-surface-variant)";
        timeText.textContent = rowData.timeSpent;
        timeCell.appendChild(timeText);
        row.appendChild(timeCell);

        // Action button
        const actionCell = document.createElement("div");
        actionCell.style.display = "flex";
        actionCell.style.alignItems = "center";
        actionCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        actionCell.style.flex = "1";
        actionCell.style.minWidth = "0";

        const actionButton = createButton({
            btnText: "View Progress",
            btnStyle: "primary",
            btnFill: "text",
            btnSize: "small"
        });
        actionButton.style.minWidth = "28px";
        actionCell.appendChild(actionButton);
        row.appendChild(actionCell);
    }

    return row;
}

/**
 * Creates a progress indicator cell with circular progress chart
 * @param {string} value - Value to display (e.g., "8/18" or "30%")
 */
function createProgressCell(value) {
    const cell = document.createElement("div");
    cell.style.display = "flex";
    cell.style.flexDirection = "column";
    cell.style.alignItems = "center";
    cell.style.justifyContent = "flex-end";
    cell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
    cell.style.position = "relative";

    // Progress indicators container
    const progressContainer = document.createElement("div");
    progressContainer.style.display = "flex";
    progressContainer.style.flexDirection = "column";
    progressContainer.style.alignItems = "center";
    progressContainer.style.justifyContent = "flex-end";
    progressContainer.style.padding = "0 var(--size-element-pad-x-md)";
    progressContainer.style.position = "relative";
    progressContainer.style.width = "48px";
    progressContainer.style.height = "40px";

    // Circular progress chart placeholder (48px width, 40px height)
    const chartWrapper = document.createElement("div");
    chartWrapper.style.width = "48px";
    chartWrapper.style.height = "40px";
    chartWrapper.style.position = "relative";
    chartWrapper.style.display = "flex";
    chartWrapper.style.alignItems = "center";
    chartWrapper.style.justifyContent = "center";

    // Value text overlay - positioned absolutely in center
    const valueText = document.createElement("div");
    valueText.style.position = "absolute";
    valueText.style.top = "calc(50% + 2.5px)";
    valueText.style.left = "50%";
    valueText.style.transform = "translate(-50%, -50%)";
    valueText.style.fontFamily = "var(--font-family-body)";
    valueText.style.fontSize = "var(--font-size-body3)";
    valueText.style.fontWeight = "var(--font-weight-light)";
    valueText.style.lineHeight = "1.4";
    valueText.style.color = "var(--color-on-surface-variant)";
    valueText.style.textAlign = "center";
    valueText.style.width = "48px";
    valueText.textContent = value;
    chartWrapper.appendChild(valueText);

    progressContainer.appendChild(chartWrapper);
    cell.appendChild(progressContainer);
    return cell;
}

