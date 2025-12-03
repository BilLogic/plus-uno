/**
 * @fileoverview DeleteTutorConfirmation modal component for Admin specs
 * Confirmation modal for deleting a tutor
 */

import { createButton } from '../../../../components/Button/index.js';

/**
 * Creates a DeleteTutorConfirmation modal component
 * @param {Object} options - Modal configuration
 * @param {Function} [options.onDelete] - Delete button handler
 * @param {Function} [options.onKeep] - Keep button handler
 * @param {Function} [options.onClose] - Close handler
 * @returns {HTMLElement} Modal element
 */
export function createDeleteTutorConfirmation({
    onDelete = null,
    onKeep = null,
    onClose = null
} = {}) {
    const modal = document.createElement("div");
    modal.classList.add("plus-modal", "plus-modal-default", "plus-modal-pad-md", "plus-modal-gap-md", "plus-modal-radius-md");
    modal.style.width = "672px";
    modal.style.minWidth = "672px";
    modal.style.maxWidth = "672px";
    modal.style.backgroundColor = "var(--color-surface-container)";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.alignItems = "center";
    modal.style.gap = "var(--size-modal-gap-md)";

    // Header
    const header = document.createElement("div");
    header.style.width = "100%";
    header.style.display = "flex";
    header.style.alignItems = "center";

    const title = document.createElement("div");
    title.className = "h4";
    title.textContent = "Delete Tutor?";
    title.style.flex = "1";
    header.appendChild(title);

    modal.appendChild(header);

    // Body text
    const body = document.createElement("div");
    body.style.width = "100%";
    body.style.display = "flex";
    body.style.flexDirection = "column";

    const message = document.createElement("p");
    message.className = "body1-txt";
    message.style.fontWeight = "300";
    message.style.color = "var(--color-on-surface)";
    message.style.lineHeight = "1.5";
    message.textContent = "All data related to this tutor will be removed. This tutor will lose access to the PLUS system.";
    body.appendChild(message);

    modal.appendChild(body);

    // Footer buttons
    const footer = document.createElement("div");
    footer.style.width = "626.64px";
    footer.style.display = "flex";
    footer.style.gap = "var(--size-element-gap-lg)";
    footer.style.justifyContent = "flex-end";

    const deleteBtn = createButton({
        btnText: "Delete Tutor",
        btnStyle: "error",
        btnFill: "text",
        btnSize: "default"
    });
    if (onDelete) {
        deleteBtn.addEventListener("click", onDelete);
    }
    footer.appendChild(deleteBtn);

    const keepBtn = createButton({
        btnText: "Keep Tutor",
        btnStyle: "primary",
        btnFill: "filled",
        btnSize: "default"
    });
    if (onKeep) {
        keepBtn.addEventListener("click", onKeep);
    }
    if (onClose && !onKeep) {
        keepBtn.addEventListener("click", onClose);
    }
    footer.appendChild(keepBtn);

    modal.appendChild(footer);

    return modal;
}

