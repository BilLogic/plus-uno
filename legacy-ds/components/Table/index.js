/**
 * @fileoverview Table component for PLUS design system.
 * Standard table component for displaying tabular data.
 */

/**
 * Creates a table element styled according to PLUS design system
 * @param {Object} options - Table configuration options
 * @param {string} [options.id] - Table ID
 * @param {Array<string|Object>} options.headers - Array of header strings or objects {text: string, width: string, align: string}
 * @param {Array<Array<string|HTMLElement>>} options.rows - Array of arrays containing cell data
 * @param {boolean} [options.striped=false] - Whether to show striped rows
 * @param {boolean} [options.hover=true] - Whether to show hover effect on rows
 * @param {boolean} [options.bordered=false] - Whether to show borders on all cells
 * @param {string} [options.density="md"] - Density/padding of cells ("sm", "md", "lg")
 * @param {Array} [options.classes] - Additional CSS classes
 * @param {Object} [options.styles] - Additional inline styles
 * @returns {HTMLElement} Table container element (wrapper + table)
 */
export function createTable({
    id,
    headers = [],
    rows = [],
    striped = false,
    hover = true,
    bordered = false,
    density = "md",
    classes = [],
    styles = null
}) {
    // Wrapper for responsive scrolling
    const wrapper = document.createElement("div");
    wrapper.classList.add("plus-table-wrapper");

    if (id) {
        wrapper.id = id;
    }

    const table = document.createElement("table");
    table.classList.add("plus-table");

    // Add modifiers
    if (striped) table.classList.add("plus-table-striped");
    if (hover) table.classList.add("plus-table-hover");
    if (bordered) table.classList.add("plus-table-bordered");
    if (density) table.classList.add(`plus-table-${density}`);

    // Add additional classes
    if (classes && classes.length > 0) {
        table.classList.add(...classes);
    }

    // Apply inline styles
    if (styles) {
        Object.assign(table.style, styles);
    }

    // Create Header
    if (headers && headers.length > 0) {
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        headers.forEach(header => {
            const th = document.createElement("th");

            if (typeof header === "string") {
                th.textContent = header;
            } else {
                th.textContent = header.text || "";
                if (header.width) th.style.width = header.width;
                if (header.align) th.style.textAlign = header.align;
                if (header.classes) th.classList.add(...header.classes);
            }

            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);
    }

    // Create Body
    if (rows && rows.length > 0) {
        const tbody = document.createElement("tbody");

        rows.forEach(rowData => {
            const tr = document.createElement("tr");

            rowData.forEach(cellData => {
                const td = document.createElement("td");

                if (cellData instanceof HTMLElement) {
                    td.appendChild(cellData);
                } else if (typeof cellData === "object" && cellData !== null && cellData.content) {
                    // Handle object with content and options
                    if (cellData.content instanceof HTMLElement) {
                        td.appendChild(cellData.content);
                    } else {
                        td.innerHTML = cellData.content;
                    }

                    if (cellData.align) td.style.textAlign = cellData.align;
                    if (cellData.classes) td.classList.add(...cellData.classes);
                    if (cellData.colSpan) td.colSpan = cellData.colSpan;
                } else {
                    // Simple string or number
                    td.innerHTML = String(cellData);
                }

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
    }

    wrapper.appendChild(table);
    return wrapper;
}
