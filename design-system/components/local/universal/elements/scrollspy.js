/**
 * @fileoverview Scrollspy component for PLUS design system.
 * Creates a navbar with pills navigation that automatically updates based on scroll position.
 * Matches Figma design system specifications exactly.
 * 
 * Bootstrap 4.6.2 Reference: https://getbootstrap.com/docs/4.6/components/scrollspy/
 */

/**
 * Creates a scrollspy navbar component
 * @param {Object} options - Scrollspy configuration
 * @param {string} options.id - ID for the scrollspy navbar (required)
 * @param {string} [options.brand="Navbar"] - Brand text for navbar
 * @param {Array<Object>} options.items - Array of navigation items
 * @param {string} options.items[].text - Item text (e.g., "@fat", "@mdo", "Dropdown")
 * @param {string} options.items[].href - Item link URL (e.g., "#fat", "#mdo")
 * @param {boolean} [options.items[].isDropdown=false] - Whether item is a dropdown
 * @param {number} [options.activeIndex=0] - Index of initially active item (0, 1, or 2)
 * @param {string} [options.contentId] - ID for scrollable content container
 * @param {number} [options.offset=10] - Scroll offset in pixels
 * @param {Function} [options.onActivate] - Callback when nav item is activated
 * @returns {HTMLElement} Scrollspy navbar element
 */
export function createScrollspy({
    id,
    brand = "Navbar",
    items = [],
    activeIndex = 0,
    contentId = null,
    offset = 10,
    onActivate = null
} = {}) {
    if (!id) {
        throw new Error("Scrollspy requires an id attribute");
    }
    
    if (!items || items.length === 0) {
        throw new Error("Scrollspy requires at least one navigation item");
    }
    
    // Create navbar container
    const navbar = document.createElement("nav");
    navbar.id = id;
    navbar.classList.add("plus-scrollspy-navbar");
    navbar.setAttribute("role", "navigation");
    navbar.setAttribute("aria-label", "Scrollspy navigation");
    
    // Create brand element
    const brandEl = document.createElement("div");
    brandEl.classList.add("plus-scrollspy-brand");
    const brandText = document.createElement("p");
    brandText.classList.add("body-lead-txt");
    brandText.textContent = brand;
    brandEl.appendChild(brandText);
    navbar.appendChild(brandEl);
    
    // Create spacer (grows to fill space)
    const spacer = document.createElement("div");
    spacer.classList.add("plus-scrollspy-spacer");
    navbar.appendChild(spacer);
    
    // Create pills navigation list
    const navList = document.createElement("div");
    navList.classList.add("plus-nav-list", "plus-nav-pills");
    
    items.forEach((item, index) => {
        const navItem = document.createElement("div");
        navItem.classList.add("plus-nav-item");
        
        // Add selected class if this is the active index
        if (index === activeIndex) {
            navItem.classList.add("plus-nav-item-selected");
        }
        
        // Add dropdown class if item is dropdown
        if (item.isDropdown) {
            navItem.classList.add("plus-nav-item-dropdown");
        }
        
        const navLink = document.createElement("a");
        navLink.href = item.href || `#${item.text.toLowerCase().replace('@', '')}`;
        navLink.classList.add("plus-nav-link");
        
        const navText = document.createElement("span");
        navText.classList.add("plus-nav-text", "body1-txt");
        navText.textContent = item.text;
        navLink.appendChild(navText);
        
        // Add dropdown icon if dropdown
        if (item.isDropdown) {
            const iconEl = document.createElement("i");
            iconEl.classList.add("fas", "fa-caret-down", "plus-nav-dropdown-icon");
            navLink.appendChild(iconEl);
        }
        
        navItem.appendChild(navLink);
        navList.appendChild(navItem);
    });
    
    navbar.appendChild(navList);
    
    // Initialize Bootstrap scrollspy after DOM is ready
    // Use a longer timeout to ensure content container exists and is rendered
    setTimeout(() => {
        if (typeof $ !== 'undefined' && $.fn.scrollspy && contentId) {
            const $content = $(`#${contentId}`);
            const $navbar = $(`#${id}`);
            
            if ($content.length && $navbar.length) {
                // Initialize scrollspy on content container
                // Bootstrap scrollspy watches the scrollable element and updates nav links
                $content.scrollspy({
                    target: `#${id}`,
                    offset: offset
                });
                
                // Function to update active state based on scroll position
                const updateActiveState = () => {
                    const scrollTop = $content.scrollTop() + offset;
                    const $sections = $content.find('section[id]');
                    let activeId = null;
                    let activeSection = null;
                    
                    // Find which section is currently in view
                    // Check sections in reverse order to get the last one that's passed
                    const sectionsArray = $sections.toArray().reverse();
                    
                    for (let i = 0; i < sectionsArray.length; i++) {
                        const section = sectionsArray[i];
                        const $section = $(section);
                        // Get the offset relative to the scrollable container
                        const sectionOffset = $section.position().top;
                        const sectionTop = sectionOffset;
                        
                        // If we've scrolled past this section's top, it's the active one
                        if (scrollTop >= sectionTop) {
                            activeId = $section.attr('id');
                            activeSection = $section;
                            break;
                        }
                    }
                    
                    // If no section found or at the very top, use the first section
                    if (!activeId) {
                        activeId = $sections.first().attr('id');
                    }
                    
                    // Update active link based on section ID
                    if (activeId) {
                        $navbar.find('.plus-nav-link').each(function() {
                            const $link = $(this);
                            const href = $link.attr('href');
                            // Check if href matches the active section ID
                            if (href && (href === `#${activeId}` || href.endsWith(`#${activeId}`))) {
                                // Only update if it's not already active
                                if (!$link.hasClass('active')) {
                                    // Remove active from all links
                                    $navbar.find('.plus-nav-link').removeClass('active');
                                    // Add active to this link
                                    $link.addClass('active');
                                    // Update selected state
                                    $navbar.find('.plus-nav-item').removeClass('plus-nav-item-selected');
                                    $link.closest('.plus-nav-item').addClass('plus-nav-item-selected');
                                    
                                    if (onActivate) {
                                        onActivate($link[0]);
                                    }
                                }
                                return false; // break
                            }
                        });
                    }
                };
                
                // Listen for scroll events on the content container
                $content.on('scroll', updateActiveState);
                
                // Sync .active class on nav links to .plus-nav-item-selected on parent items
                $navbar.on('activate.bs.scrollspy', function(event) {
                    // Remove selected class from all items
                    $navbar.find('.plus-nav-item').removeClass('plus-nav-item-selected');
                    // Add selected class to active item's parent
                    if (event.relatedTarget) {
                        $(event.relatedTarget).closest('.plus-nav-item').addClass('plus-nav-item-selected');
                    }
                    
                    if (onActivate) {
                        onActivate(event.relatedTarget);
                    }
                });
                
                // Initial sync on page load - check which section is in view
                setTimeout(() => {
                    // Refresh scrollspy to detect initial active section
                    $content.scrollspy('refresh');
                    
                    // Manually check initial state
                    updateActiveState();
                    
                    // If still no active, set the first one
                    const activeLink = $navbar.find('.plus-nav-link.active');
                    if (!activeLink.length) {
                        const firstLink = $navbar.find('.plus-nav-link').first();
                        if (firstLink.length) {
                            firstLink.addClass('active');
                            firstLink.closest('.plus-nav-item').addClass('plus-nav-item-selected');
                        }
                    }
                }, 300);
            }
        }
    }, 100);
    
    return navbar;
}

/**
 * Creates scrollspy content sections
 * @param {Object} options - Content configuration
 * @param {string} options.id - ID for the content container (required)
 * @param {Array<Object>} options.sections - Array of section objects
 * @param {string} options.sections[].id - Section ID (must match nav hrefs)
 * @param {string} options.sections[].title - Section title/heading
 * @param {string|HTMLElement} options.sections[].content - Section content
 * @param {string} [options.navbarId] - ID of navbar to target for scrollspy
 * @param {number} [options.offset=10] - Scroll offset
 * @returns {HTMLElement} Content container element
 */
export function createScrollspyContent({
    id,
    sections = [],
    navbarId = null,
    offset = 10
} = {}) {
    if (!id) {
        throw new Error("Scrollspy content requires an id attribute");
    }
    
    // Create content container
    const content = document.createElement("div");
    content.id = id;
    content.classList.add("plus-scrollspy-content");
    content.setAttribute("data-spy", "scroll");
    if (navbarId) {
        content.setAttribute("data-target", `#${navbarId}`);
    }
    content.setAttribute("data-offset", offset.toString());
    
    // Add sections
    sections.forEach((section) => {
        const sectionEl = document.createElement("section");
        sectionEl.id = section.id;
        sectionEl.classList.add("plus-scrollspy-section");
        
        if (section.title) {
            const titleEl = document.createElement("h4");
            titleEl.classList.add("h4");
            titleEl.textContent = section.title;
            sectionEl.appendChild(titleEl);
        }
        
        if (section.content) {
            const contentEl = document.createElement("div");
            contentEl.classList.add("body1-txt");
            if (typeof section.content === 'string') {
                contentEl.textContent = section.content;
            } else if (section.content instanceof HTMLElement) {
                contentEl.appendChild(section.content);
            }
            sectionEl.appendChild(contentEl);
        }
        
        content.appendChild(sectionEl);
    });
    
    return content;
}

