/**
 * @fileoverview Navbar component for PLUS design system.
 * Navbar container component with different types, background colors, and navbar items.
 * Matches Figma design system specifications.
 */

/**
 * Creates a navbar component
 * @param {Object} options - Navbar configuration
 * @param {string} [options.brand="Navbar"] - Brand text
 * @param {Array<Object>} [options.items=[]] - Array of navbar items
 * @param {string} options.items[].text - Item text
 * @param {string} [options.items[].href] - Item link URL
 * @param {Function} [options.items[].onClick] - Click handler for item
 * @param {boolean} [options.items[].selected=false] - Whether item is selected
 * @param {boolean} [options.items[].disabled=false] - Whether item is disabled
 * @param {Array<Object>} [options.items[].dropdownItems] - Dropdown menu items (if provided, item becomes dropdown)
 * @param {string} [options.type="all"] - Navbar type: "all", "buttons", "forms", "input group", "nav", "text", "type8"
 * @param {string} [options.backgroundColor="light"] - Background color: "primary", "light", "dark"
 * @param {Array<Object>} [options.components] - Additional components for "all" type (buttons, forms, input groups, etc.)
 * @param {string} [options.id] - Navbar ID
 * @param {Array<string>} [options.classes] - Additional CSS classes
 * @param {Object} [options.styles] - Additional inline styles
 * @returns {HTMLElement} Navbar element
 */
export function createNavbar({
    brand = "Navbar",
    items = [],
    type = "all",
    backgroundColor = "light",
    components = [],
    id = null,
    classes = [],
    styles = null
}) {
    const navbar = document.createElement("nav");
    navbar.classList.add("plus-navbar");
    // Normalize type for CSS class (replace spaces with hyphens)
    const normalizedType = type.replace(/\s+/g, '-');
    navbar.classList.add(`plus-navbar-${normalizedType}`);
    navbar.classList.add(`plus-navbar-bg-${backgroundColor}`);
    
    if (id) {
        navbar.id = id;
    }
    
    if (classes && classes.length > 0) {
        navbar.classList.add(...classes);
    }
    
    if (styles) {
        Object.assign(navbar.style, styles);
    }
    
    navbar.setAttribute("role", "navigation");
    navbar.setAttribute("aria-label", "Navbar");
    
    // Create brand element
    const brandEl = document.createElement("div");
    brandEl.classList.add("plus-navbar-brand");
    const brandText = document.createElement("p");
    brandText.classList.add("body-lead-txt");
    brandText.textContent = brand;
    brandEl.appendChild(brandText);
    navbar.appendChild(brandEl);
    
    // Create navbar content container
    const contentEl = document.createElement("div");
    contentEl.classList.add("plus-navbar-content");
    
    // Add items based on type
    if (type === "all" || type === "nav") {
        items.forEach((item, index) => {
            const navbarItem = createNavbarItem(item, index);
            contentEl.appendChild(navbarItem);
        });
    }
    
    // Add components for "all" type
    if (type === "all" && components && components.length > 0) {
        components.forEach((component) => {
            const componentEl = createNavbarComponent(component);
            if (componentEl) {
                contentEl.appendChild(componentEl);
            }
        });
    }
    
    // Add specific components based on type
    if (type === "buttons") {
        // Add buttons
        if (components && components.length > 0) {
            components.forEach((component) => {
                if (component.type === "button") {
                    const buttonEl = createNavbarComponent(component);
                    if (buttonEl) {
                        contentEl.appendChild(buttonEl);
                    }
                }
            });
        }
    } else if (type === "forms") {
        // Add forms
        if (components && components.length > 0) {
            components.forEach((component) => {
                if (component.type === "form") {
                    const formEl = createNavbarComponent(component);
                    if (formEl) {
                        contentEl.appendChild(formEl);
                    }
                }
            });
        }
    } else if (type === "input group") {
        // Add input groups
        if (components && components.length > 0) {
            components.forEach((component) => {
                if (component.type === "inputGroup") {
                    const inputGroupEl = createNavbarComponent(component);
                    if (inputGroupEl) {
                        contentEl.appendChild(inputGroupEl);
                    }
                }
            });
        }
    } else if (type === "text") {
        // Add text items
        items.forEach((item, index) => {
            const navbarItem = createNavbarItem(item, index);
            contentEl.appendChild(navbarItem);
        });
        // Add text component if provided
        if (components && components.length > 0) {
            components.forEach((component) => {
                if (component.type === "text") {
                    const textEl = document.createElement("div");
                    textEl.classList.add("plus-navbar-text");
                    textEl.textContent = component.text || "";
                    contentEl.appendChild(textEl);
                }
            });
        }
    }
    
    navbar.appendChild(contentEl);
    
    return navbar;
}

/**
 * Creates a single navbar item
 * @param {Object} item - Item configuration
 * @param {number} index - Item index
 * @returns {HTMLElement} Navbar item element
 */
function createNavbarItem(item, index) {
    const itemEl = document.createElement("div");
    itemEl.classList.add("plus-navbar-item");
    
    if (item.selected) {
        itemEl.classList.add("plus-navbar-item-selected");
    }
    
    if (item.disabled) {
        itemEl.classList.add("plus-navbar-item-disabled");
    }
    
    if (item.dropdownItems && item.dropdownItems.length > 0) {
        itemEl.classList.add("plus-navbar-item-dropdown");
    }
    
    // Create item content
    const itemContent = document.createElement("div");
    itemContent.classList.add("plus-navbar-item-content");
    
    // Create link or button
    let linkEl;
    if (item.href && !item.disabled) {
        linkEl = document.createElement("a");
        linkEl.href = item.href;
        linkEl.classList.add("plus-navbar-link");
    } else {
        linkEl = document.createElement("button");
        linkEl.type = "button";
        linkEl.classList.add("plus-navbar-link");
        if (item.disabled) {
            linkEl.disabled = true;
        }
    }
    
    // Set text
    const textEl = document.createElement("span");
    textEl.classList.add("plus-navbar-text", "body1-txt");
    textEl.textContent = item.text;
    linkEl.appendChild(textEl);
    
    // Add dropdown icon if dropdown items exist
    if (item.dropdownItems && item.dropdownItems.length > 0) {
        const iconEl = document.createElement("i");
        iconEl.classList.add("fas", "fa-caret-down", "plus-navbar-dropdown-icon");
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
        const dropdown = createDropdownMenu(item.dropdownItems);
        itemEl.appendChild(dropdown);
    }
    
    return itemEl;
}

/**
 * Creates a dropdown menu for navbar item
 * @param {Array<Object>} dropdownItems - Dropdown menu items
 * @returns {HTMLElement} Dropdown menu element
 */
function createDropdownMenu(dropdownItems) {
    const dropdown = document.createElement("div");
    dropdown.classList.add("plus-navbar-dropdown");
    dropdown.classList.add("dropdown-menu");
    dropdown.setAttribute("role", "menu");
    
    dropdownItems.forEach((dropdownItem) => {
        const menuItem = document.createElement("a");
        menuItem.classList.add("dropdown-item", "plus-navbar-dropdown-item");
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

/**
 * Creates a navbar component (button, form, input group, etc.)
 * @param {Object} component - Component configuration
 * @returns {HTMLElement|null} Component element or null
 */
function createNavbarComponent(component) {
    if (!component || !component.type) {
        return null;
    }
    
    const wrapper = document.createElement("div");
    wrapper.classList.add("plus-navbar-component");
    wrapper.classList.add(`plus-navbar-component-${component.type}`);
    
    // Import components dynamically based on type
    // For now, return a placeholder that can be replaced with actual components
    if (component.type === "button") {
        // Button component would be created here
        // For now, create a simple button element
        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("plus-navbar-button");
        button.textContent = component.text || "Button";
        wrapper.appendChild(button);
    } else if (component.type === "form") {
        // Form component would be created here
        // For now, create a simple input element
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = component.placeholder || "Search";
        input.classList.add("plus-navbar-form-input");
        wrapper.appendChild(input);
    } else if (component.type === "inputGroup") {
        // Input group component would be created here
        // For now, create a simple input group
        const inputGroup = document.createElement("div");
        inputGroup.classList.add("plus-navbar-input-group");
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = component.placeholder || "Placeholder";
        input.classList.add("plus-navbar-input-group-input");
        inputGroup.appendChild(input);
        wrapper.appendChild(inputGroup);
    } else if (component.type === "text") {
        const textEl = document.createElement("div");
        textEl.classList.add("plus-navbar-text-component");
        textEl.textContent = component.text || "";
        wrapper.appendChild(textEl);
    }
    
    return wrapper;
}

