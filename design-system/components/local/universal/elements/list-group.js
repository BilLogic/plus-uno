/**
 * @fileoverview List Group component for PLUS design system.
 * Universal element component for creating list groups with items.
 * Uses Bootstrap 4.6.2's list-group pattern.
 * 
 * Reference: https://getbootstrap.com/docs/4.6/components/list-group/
 */

/**
 * Creates a list group item
 * @param {Object} options - List item configuration
 * @param {string|HTMLElement} options.content - Item content (text or HTML element)
 * @param {boolean} [options.active=false] - Whether item is active/selected
 * @param {boolean} [options.disabled=false] - Whether item is disabled
 * @param {string} [options.href=null] - If provided, item becomes a link
 * @param {string} [options.id=null] - Item ID
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @param {HTMLElement|string} [options.badge=null] - Badge element or text to display
 * @param {Function} [options.onClick=null] - Click event handler
 * @param {string} [options.action=null] - Action type: "button" or "link" (default: "link" if href provided, otherwise "div")
 * @param {string} [options.style=null] - Color style variant: "primary", "secondary", "tertiary", "success", "danger", "warning", "info", "default"
 * @returns {HTMLElement} List item element
 */
export function createListGroupItem({
    content,
    active = false,
    disabled = false,
    href = null,
    id = null,
    classes = [],
    badge = null,
    onClick = null,
    action = null,
    style = null
} = {}) {
    // Determine the element type based on action and href
    let item;
    const isLink = href !== null && href !== undefined;
    const isButton = action === "button" || (!isLink && action === "button");
    
    if (isLink) {
        item = document.createElement("a");
        item.href = href;
        item.classList.add("list-group-item", "list-group-item-action", "plus-list-group-item");
    } else if (isButton) {
        item = document.createElement("button");
        item.type = "button";
        item.classList.add("list-group-item", "list-group-item-action", "plus-list-group-item");
    } else {
        item = document.createElement("div");
        item.classList.add("list-group-item", "plus-list-group-item");
    }
    
    if (id) {
        item.id = id;
    }
    
    if (active) {
        item.classList.add("active");
    }
    
    if (disabled) {
        item.classList.add("disabled");
        if (isLink || isButton) {
            item.setAttribute("tabindex", "-1");
            item.setAttribute("aria-disabled", "true");
        }
    }
    
    if (classes && classes.length > 0) {
        item.classList.add(...classes);
    }
    
    // Add style variant class if provided
    if (style && style !== 'default') {
        item.classList.add(`plus-list-group-item-${style}`);
    }
    
    // Add content
    const contentWrapper = document.createElement("div");
    contentWrapper.classList.add("plus-list-group-item-content");
    // Add body2-txt class for typography (matches Figma design)
    contentWrapper.classList.add("body2-txt");
    
    if (typeof content === "string") {
        contentWrapper.textContent = content;
    } else if (content instanceof HTMLElement) {
        contentWrapper.appendChild(content);
    } else {
        contentWrapper.textContent = "";
    }
    
    item.appendChild(contentWrapper);
    
    // Add badge if provided
    if (badge) {
        const badgeWrapper = document.createElement("div");
        badgeWrapper.classList.add("plus-list-group-item-badge");
        
        if (typeof badge === "string") {
            badgeWrapper.textContent = badge;
        } else if (badge instanceof HTMLElement) {
            badgeWrapper.appendChild(badge);
        }
        
        item.appendChild(badgeWrapper);
    }
    
    if (onClick && !disabled) {
        item.addEventListener("click", (e) => {
            if (!disabled) {
                onClick(e);
            }
        });
    }
    
    return item;
}

/**
 * Creates a list group container
 * @param {Object} options - List group configuration
 * @param {Array<Object>} options.items - Array of item configuration objects
 * @param {boolean} [options.flush=false] - Whether to use flush variant (no borders/rounded corners)
 * @param {string} [options.id=null] - List group ID
 * @param {Array} [options.classes=[]] - Additional CSS classes
 * @param {boolean} [options.useListElement=true] - Whether to use <ul> (true) or <div> (false)
 * @returns {HTMLElement} List group element
 */
export function createListGroup({
    items = [],
    flush = false,
    id = null,
    classes = [],
    useListElement = true
} = {}) {
    // Create container - use <ul> by default for semantic HTML, or <div> if specified
    const container = useListElement 
        ? document.createElement("ul")
        : document.createElement("div");
    
    container.classList.add("list-group", "plus-list-group");
    
    if (flush) {
        container.classList.add("list-group-flush");
    }
    
    if (id) {
        container.id = id;
    }
    
    if (classes && classes.length > 0) {
        container.classList.add(...classes);
    }
    
    // Add items
    items.forEach((itemConfig) => {
        const item = createListGroupItem(itemConfig);
        
        // If using <ul>, Bootstrap 4.6.2 pattern:
        // - Action items (links/buttons) go directly in <ul>
        // - Non-action items (divs) are wrapped in <li>
        if (useListElement) {
            if (item.classList.contains("list-group-item-action")) {
                // Action items (links/buttons) go directly in <ul>
                container.appendChild(item);
            } else {
                // Non-action items (divs) are wrapped in <li>
                const listItem = document.createElement("li");
                listItem.classList.add("plus-list-group-list-item");
                // Move classes from item to listItem
                Array.from(item.classList).forEach(cls => listItem.classList.add(cls));
                // Move child nodes from item to listItem
                Array.from(item.childNodes).forEach(child => listItem.appendChild(child));
                container.appendChild(listItem);
            }
        } else {
            // Using <div> - append item directly
            container.appendChild(item);
        }
    });
    
    return container;
}

