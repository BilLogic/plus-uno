/**
 * @fileoverview Alert component for PLUS design system.
 * Universal element component for displaying alert messages.
 * Matches Figma design system specifications.
 */

/**
 * Creates an alert component
 * @param {Object} options - Alert configuration
 * @param {string} [options.id] - Alert ID
 * @param {string} options.style - Alert style (primary, secondary, success, danger, warning, info)
 * @param {string} [options.title] - Alert title/header
 * @param {string} options.text - Alert body text
 * @param {boolean} [options.dismissable=true] - Whether alert can be dismissed
 * @param {Function} [options.onDismiss] - Function to call when alert is dismissed
 * @returns {HTMLElement} Alert element
 */
export function createAlert({id, style, title, text, dismissable = true, onDismiss = null}) {
    const alert = document.createElement("div");
    if (id) {
        alert.id = id;
    }
    alert.classList.add("plus-alert", style);

    const content = document.createElement("div");
    content.classList.add("plus-alert-content");

    // Title element
    if (title) {
        const titleEl = document.createElement("div");
        titleEl.classList.add("plus-alert-title", "h4");
        titleEl.textContent = title;
        content.appendChild(titleEl);
    }

    // Text element
    const textEl = document.createElement("div");
    textEl.classList.add("plus-alert-text", "body1-txt");
    textEl.textContent = text;
    content.appendChild(textEl);

    alert.appendChild(content);

    // Dismiss button
    if (dismissable) {
        const dismissBtn = document.createElement("div");
        dismissBtn.classList.add("plus-alert-dismiss-btn");
        dismissBtn.innerHTML = '<i class="fas fa-xmark"></i>';
        dismissBtn.style.cursor = 'pointer';
        
        dismissBtn.addEventListener("click", () => {
            alert.remove();
            if (onDismiss) {
                onDismiss();
            }
        });
        
        alert.appendChild(dismissBtn);
    }

    return alert;
}

