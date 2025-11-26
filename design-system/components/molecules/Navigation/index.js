/**
 * @fileoverview Navigation component for PLUS design system.
 * Universal navigation component supporting horizontal/vertical layouts, tabs/pills, and dropdowns.
 * Matches Figma design system specifications.
 */

/**
 * Creates a navigation component
 * @param {Object} options - Navigation configuration
 * @param {Array<Object>} options.items - Array of navigation items
 * @param {string} options.items[].text - Item text
 * @param {string} [options.items[].href] - Item link URL
 * @param {Function} [options.items[].onClick] - Click handler for item
 * @param {boolean} [options.items[].selected=false] - Whether item is selected
 * @param {boolean} [options.items[].disabled=false] - Whether item is disabled
 * @param {Array<Object>} [options.items[].dropdownItems] - Dropdown menu items (if provided, item becomes dropdown)
 * @param {string} [options.type="horizontal"] - Navigation type: "horizontal", "vertical", "tabs", "pills"
 * @param {string} [options.alignment="left"] - Alignment: "left", "center", "right"
 * @param {string} [options.id] - Navigation ID
 * @param {Array<string>} [options.classes] - Additional CSS classes
 * @param {Object} [options.styles] - Additional inline styles
 * @returns {HTMLElement} Navigation element
 */
export function createNavigation({
    items = [],
    type = "horizontal",
    alignment = "left",
    id = null,
    classes = [],
    styles = null
}) {
    const nav = document.createElement("nav");
    nav.classList.add("plus-nav");
    nav.classList.add(`plus-nav-${type}`);
    nav.classList.add(`plus-nav-align-${alignment}`);
    
    if (id) {
        nav.id = id;
    }
    
    if (classes && classes.length > 0) {
        nav.classList.add(...classes);
    }
    
    if (styles) {
        Object.assign(nav.style, styles);
    }
    
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Navigation");
    
    // Create nav list container
    const navList = document.createElement("div");
    navList.classList.add("plus-nav-list");
    
    items.forEach((item, index) => {
        const navItem = createNavItem(item, type, index);
        navList.appendChild(navItem);
    });
    
    nav.appendChild(navList);
    
    // Add divider for horizontal/tabs navigation (grows to fill space)
    if (type === "horizontal" || type === "tabs") {
        const divider = document.createElement("div");
        divider.classList.add("plus-nav-divider");
        nav.appendChild(divider);
    }
    
    return nav;
}

/**
 * Creates a single navigation item
 * @param {Object} item - Item configuration
 * @param {string} type - Navigation type
 * @param {number} index - Item index
 * @returns {HTMLElement} Navigation item element
 */
function createNavItem(item, type, index) {
    const itemEl = document.createElement("div");
    itemEl.classList.add("plus-nav-item");
    
    if (item.selected) {
        itemEl.classList.add("plus-nav-item-selected");
    }
    
    if (item.disabled) {
        itemEl.classList.add("plus-nav-item-disabled");
    }
    
    if (item.dropdownItems && item.dropdownItems.length > 0) {
        itemEl.classList.add("plus-nav-item-dropdown");
    }
    
    // Create item content
    const itemContent = document.createElement("div");
    itemContent.classList.add("plus-nav-item-content");
    
    // Create link or button
    let linkEl;
    if (item.href && !item.disabled) {
        linkEl = document.createElement("a");
        linkEl.href = item.href;
        linkEl.classList.add("plus-nav-link");
    } else {
        linkEl = document.createElement("button");
        linkEl.type = "button";
        linkEl.classList.add("plus-nav-link");
        if (item.disabled) {
            linkEl.disabled = true;
        }
    }
    
    // Set text
    const textEl = document.createElement("span");
    textEl.classList.add("plus-nav-text", "body1-txt");
    textEl.textContent = item.text;
    linkEl.appendChild(textEl);
    
    // Add dropdown icon if dropdown items exist
    if (item.dropdownItems && item.dropdownItems.length > 0) {
        const iconEl = document.createElement("i");
        iconEl.classList.add("fas", "fa-caret-down", "plus-nav-dropdown-icon");
        linkEl.appendChild(iconEl);
    }
    
    // Add click handler
    if (item.onClick && !item.disabled) {
        linkEl.addEventListener("click", (e) => {
            if (item.href) {
                // Allow default navigation if href provided
            } else {
                e.preventDefault();
            }
            item.onClick(e, item, index);
        });
    }
    
    itemContent.appendChild(linkEl);
    itemEl.appendChild(itemContent);
    
    // Add dropdown menu if dropdown items exist
    if (item.dropdownItems && item.dropdownItems.length > 0) {
        const dropdown = createDropdownMenu(item.dropdownItems, type);
        itemEl.appendChild(dropdown);
    }
    
    return itemEl;
}

/**
 * Creates a dropdown menu for navigation item
 * @param {Array<Object>} dropdownItems - Dropdown menu items
 * @param {string} type - Navigation type
 * @returns {HTMLElement} Dropdown menu element
 */
function createDropdownMenu(dropdownItems, type) {
    const dropdown = document.createElement("div");
    dropdown.classList.add("plus-nav-dropdown");
    dropdown.classList.add("dropdown-menu");
    dropdown.setAttribute("role", "menu");
    
    dropdownItems.forEach((dropdownItem) => {
        const menuItem = document.createElement("a");
        menuItem.classList.add("dropdown-item", "plus-nav-dropdown-item");
        menuItem.href = dropdownItem.href || "#";
        menuItem.textContent = dropdownItem.text;
        menuItem.setAttribute("role", "menuitem");
        
        if (dropdownItem.onClick) {
            menuItem.addEventListener("click", (e) => {
                if (!dropdownItem.href || dropdownItem.href === "#") {
                    e.preventDefault();
                }
                dropdownItem.onClick(e, dropdownItem);
            });
        }
        
        dropdown.appendChild(menuItem);
    });
    
    return dropdown;
}

