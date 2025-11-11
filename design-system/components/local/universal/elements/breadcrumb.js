/**
 * @fileoverview Breadcrumb component for PLUS design system.
 * Universal element component for navigation breadcrumbs.
 * Matches Figma design system specifications.
 */

/**
 * Creates a breadcrumb component
 * @param {Object} options - Breadcrumb configuration
 * @param {Array<Object>} options.items - Array of breadcrumb items
 * @param {string} options.items[].text - Item text
 * @param {string} [options.items[].href] - Item link URL (if not provided, item is current/active)
 * @param {Function} [options.items[].onClick] - Click handler for item
 * @param {string} [options.id] - Breadcrumb ID
 * @param {string} [options.separator='/'] - Separator between items
 * @returns {HTMLElement} Breadcrumb element
 */
export function createBreadcrumb({items, id, separator = '/'}) {
    const breadcrumb = document.createElement("nav");
    breadcrumb.classList.add("plus-breadcrumb");
    if (id) {
        breadcrumb.id = id;
    }
    breadcrumb.setAttribute("aria-label", "Breadcrumb");

    items.forEach((item, index) => {
        // Item
        const itemContainer = document.createElement("div");
        itemContainer.classList.add("plus-breadcrumb-item");

        if (item.href || item.onClick) {
            // Link item
            const link = document.createElement("a");
            link.classList.add("plus-breadcrumb-link");
            link.textContent = item.text;
            if (item.href) {
                link.href = item.href;
            }
            if (item.onClick) {
                link.addEventListener("click", (e) => {
                    if (!item.href) {
                        e.preventDefault();
                    }
                    item.onClick(e);
                });
            }
            itemContainer.appendChild(link);
        } else {
            // Current/active item (no link)
            const current = document.createElement("span");
            current.classList.add("plus-breadcrumb-current");
            current.textContent = item.text;
            itemContainer.appendChild(current);
        }

        breadcrumb.appendChild(itemContainer);

        // Separator (except after last item)
        if (index < items.length - 1) {
            const sepContainer = document.createElement("div");
            sepContainer.classList.add("plus-breadcrumb-item");
            const sep = document.createElement("span");
            sep.classList.add("plus-breadcrumb-separator");
            sep.textContent = separator;
            sepContainer.appendChild(sep);
            breadcrumb.appendChild(sepContainer);
        }
    });

    return breadcrumb;
}

