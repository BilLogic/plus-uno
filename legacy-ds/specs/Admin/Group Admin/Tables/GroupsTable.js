/**
 * @fileoverview GroupsTable component for Group Admin specs
 * Table showing group details with columns: Group Name, Group Size, Action
 */

import { createButton } from '../../../../components/Button/index.js';
import { createBadge } from '../../../../components/Badge/index.js';

/**
 * Creates a GroupsTable row component
 * @param {Object} options - Table row configuration
 * @param {string} [options.type="header"] - Row type: "header" or "list item"
 * @param {string} [options.state="default"] - Row state: "default" or "hover"
 * @param {Object} [options.data] - Row data (only for list item type)
 * @returns {HTMLElement} Table row element
 */
export function createGroupsTableRow({
    type = "header",
    state = "default",
    data = null
} = {}) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
    row.style.height = type === "header" ? "48px" : "50px"; // Header height matches Figma (48px)
    row.style.borderRadius = "var(--size-table-radius-md)";
    row.style.width = "100%";
    row.setAttribute("data-node-id", "322:155598");

    // Apply state styling
    if (type === "list item" && state === "hover") {
        row.style.backgroundColor = "var(--color-on-surface-state-08)";
    }

    if (type === "header") {
        const headers = [
            { text: "Group Name", sortable: true, active: true },
            { text: "Group Size", sortable: true },
            { text: "Action", sortable: false }
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
                icon.style.fontSize = "var(--font-size-body3)";
                icon.style.color = index === 0 ? "var(--color-secondary)" : "var(--color-outline-variant)";
                cell.appendChild(icon);
            }

            row.appendChild(cell);
        });
    } else {
        const rowData = data || {
            groupName: "Math Masters",
            groupSize: 4
        };

        // Group Name - column 1 (with accordion button)
        const groupNameCell = document.createElement("div");
        groupNameCell.style.display = "flex";
        groupNameCell.style.gap = "var(--size-table-cell-gap)";
        groupNameCell.style.alignItems = "center";
        groupNameCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";
        groupNameCell.style.overflow = "hidden";

        // Accordion button
        const accordionButton = document.createElement("button");
        accordionButton.style.display = "flex";
        accordionButton.style.gap = "var(--size-element-gap-sm)";
        accordionButton.style.alignItems = "center";
        accordionButton.style.justifyContent = "center";
        accordionButton.style.minWidth = "28px";
        accordionButton.style.padding = "var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)";
        accordionButton.style.border = "none";
        accordionButton.style.background = "transparent";
        accordionButton.style.cursor = "pointer";
        accordionButton.style.borderRadius = "var(--size-element-radius-sm)";

            // Caret icon
            const caretIcon = document.createElement("i");
            caretIcon.className = "fas fa-caret-right";
            caretIcon.style.fontSize = "var(--font-size-body3)";
            caretIcon.style.color = "var(--color-on-surface-variant)";
            accordionButton.appendChild(caretIcon);

        // Group name text
        const groupNameText = document.createElement("div");
        groupNameText.className = "body3-txt";
        groupNameText.style.fontWeight = "400";
        groupNameText.style.color = "var(--color-secondary-text)";
        groupNameText.textContent = rowData.groupName;
        accordionButton.appendChild(groupNameText);

        groupNameCell.appendChild(accordionButton);
        row.appendChild(groupNameCell);

        // Group Size - column 2 (badge)
        const groupSizeCell = document.createElement("div");
        groupSizeCell.style.display = "flex";
        groupSizeCell.style.gap = "var(--size-table-cell-gap)";
        groupSizeCell.style.alignItems = "center";
        groupSizeCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

        const sizeBadge = createBadge({
            text: String(rowData.groupSize),
            style: "info",
            size: "b3"
        });
        sizeBadge.style.backgroundColor = "var(--color-info-state-08)";
        sizeBadge.style.padding = "0 var(--size-element-pad-x-sm)";
        sizeBadge.style.borderRadius = "var(--size-element-radius-pill)";
        groupSizeCell.appendChild(sizeBadge);
        row.appendChild(groupSizeCell);

        // Action - column 3 (Edit and View Progress buttons)
        const actionCell = document.createElement("div");
        actionCell.style.display = "flex";
        actionCell.style.gap = "var(--size-table-cell-gap)";
        actionCell.style.alignItems = "center";
        actionCell.style.padding = "var(--size-table-cell-y) var(--size-table-cell-x)";

        const editButton = createButton({
            btnText: "Edit",
            btnStyle: "default",
            btnFill: "text",
            btnSize: "small"
        });
        editButton.style.borderRadius = "var(--size-element-radius-sm)";
        actionCell.appendChild(editButton);

        const viewProgressButton = createButton({
            btnText: "View Progress",
            btnStyle: "default",
            btnFill: "text",
            btnSize: "small"
        });
        viewProgressButton.style.borderRadius = "var(--size-element-radius-sm)";
        actionCell.appendChild(viewProgressButton);

        row.appendChild(actionCell);
    }

    return row;
}

