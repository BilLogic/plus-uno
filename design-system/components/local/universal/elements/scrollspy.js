/**
 * @fileoverview Scrollspy component for PLUS design system.
 * Universal scrollspy component for automatically updating navigation based on scroll position.
 * Built on Bootstrap 4.6.2 scrollspy with PLUS design token customizations.
 * 
 * Bootstrap 4.6.2 Reference: https://getbootstrap.com/docs/4.6/components/scrollspy/
 */

/**
 * Initializes scrollspy functionality on a scrollable container
 * @param {Object} options - Scrollspy configuration options
 * @param {string|HTMLElement} options.target - Navigation element selector or element to target (e.g., "#nav", ".nav")
 * @param {string|HTMLElement} [options.spy] - Scrollable container selector or element to spy on (default: "body")
 * @param {number} [options.offset=10] - Offset in pixels from top when calculating position
 * @param {string} [options.method="auto"] - Method to use: "auto", "position", "offset"
 * @param {Function} [options.onActivate] - Callback when a nav item is activated: (target) => {}
 * @returns {Object} Scrollspy instance with refresh() and dispose() methods
 */
export function initScrollspy({
    target,
    spy = "body",
    offset = 10,
    method = "auto",
    onActivate = null
} = {}) {
    if (!target) {
        throw new Error("Scrollspy requires a target navigation element");
    }
    
    // Convert target to jQuery selector if it's an element
    const targetSelector = typeof target === 'string' ? target : `#${target.id}` || `.${target.className.split(' ')[0]}`;
    const spySelector = typeof spy === 'string' ? spy : `#${spy.id}` || `.${spy.className.split(' ')[0]}`;
    
    // Initialize Bootstrap scrollspy after DOM is ready
    // Use setTimeout to ensure jQuery and Bootstrap are loaded
    let scrollspyInstance = null;
    
    setTimeout(() => {
        if (typeof $ !== 'undefined' && $.fn.scrollspy) {
            const $spy = $(spySelector);
            
            // Initialize scrollspy
            $spy.scrollspy({
                target: targetSelector,
                offset: offset,
                method: method
            });
            
            scrollspyInstance = $spy.data('bs.scrollspy');
            
            // Attach event listener for activate event
            if (onActivate) {
                $(targetSelector).on('activate.bs.scrollspy', function(event) {
                    onActivate(event.relatedTarget);
                });
            }
            
            // Sync .active class on nav links to .plus-nav-item-selected on parent items
            // This ensures consistency with Navigation component styling
            $(targetSelector).on('activate.bs.scrollspy', function(event) {
                // Remove selected class from all items
                $(targetSelector).find('.plus-nav-item').removeClass('plus-nav-item-selected');
                // Add selected class to active item's parent
                $(event.relatedTarget).closest('.plus-nav-item').addClass('plus-nav-item-selected');
            });
            
            // Initial sync on page load
            setTimeout(() => {
                const activeLink = $(targetSelector).find('.plus-nav-link.active');
                if (activeLink.length) {
                    $(targetSelector).find('.plus-nav-item').removeClass('plus-nav-item-selected');
                    activeLink.closest('.plus-nav-item').addClass('plus-nav-item-selected');
                }
            }, 100);
        }
    }, 0);
    
    // Return instance with utility methods
    return {
        /**
         * Refreshes the scrollspy instance
         */
        refresh: () => {
            if (typeof $ !== 'undefined' && $.fn.scrollspy && scrollspyInstance) {
                $(spySelector).scrollspy('refresh');
            }
        },
        
        /**
         * Disposes the scrollspy instance
         */
        dispose: () => {
            if (typeof $ !== 'undefined' && $.fn.scrollspy && scrollspyInstance) {
                $(spySelector).scrollspy('dispose');
                scrollspyInstance = null;
            }
        }
    };
}

/**
 * Creates a scrollspy-enabled navigation and content structure
 * This is a convenience function that sets up both navigation and scrollable content
 * @param {Object} options - Scrollspy setup configuration
 * @param {string} options.navId - ID for the navigation element
 * @param {Array<Object>} options.navItems - Array of navigation items: [{text: string, href: string, sectionId: string}]
 * @param {string} [options.navType="horizontal"] - Navigation type: "horizontal", "vertical", "tabs", "pills"
 * @param {string} [options.navAlignment="left"] - Navigation alignment: "left", "center", "right"
 * @param {string} options.contentId - ID for the scrollable content container
 * @param {Array<Object>} options.sections - Array of section objects: [{id: string, title: string, content: HTMLElement|string}]
 * @param {number} [options.offset=10] - Scroll offset in pixels
 * @param {Function} [options.onActivate] - Callback when nav item is activated
 * @returns {Object} Object with {nav: HTMLElement, content: HTMLElement, scrollspy: Object}
 */
export function createScrollspy({
    navId,
    navItems = [],
    navType = "horizontal",
    navAlignment = "left",
    contentId,
    sections = [],
    offset = 10,
    onActivate = null
} = {}) {
    if (!navId || !contentId) {
        throw new Error("Scrollspy requires navId and contentId");
    }
    
    // Import navigation component dynamically
    // In a real implementation, this would be imported at the top
    // For now, we'll create a basic nav structure that works with scrollspy
    const nav = document.createElement("nav");
    nav.id = navId;
    nav.classList.add("plus-nav", `plus-nav-${navType}`, `plus-nav-align-${navAlignment}`);
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Scrollspy navigation");
    
    const navList = document.createElement("div");
    navList.classList.add("plus-nav-list");
    
    navItems.forEach((item) => {
        const navItem = document.createElement("div");
        navItem.classList.add("plus-nav-item");
        
        const navLink = document.createElement("a");
        navLink.href = item.href || `#${item.sectionId}`;
        navLink.classList.add("plus-nav-link");
        navLink.setAttribute("data-target", item.sectionId || item.href?.substring(1));
        
        const navText = document.createElement("span");
        navText.classList.add("plus-nav-text", "body1-txt");
        navText.textContent = item.text;
        navLink.appendChild(navText);
        
        navItem.appendChild(navLink);
        navList.appendChild(navItem);
    });
    
    nav.appendChild(navList);
    
    // Add divider for horizontal/tabs navigation
    if (navType === "horizontal" || navType === "tabs") {
        const divider = document.createElement("div");
        divider.classList.add("plus-nav-divider");
        nav.appendChild(divider);
    }
    
    // Create scrollable content container
    const content = document.createElement("div");
    content.id = contentId;
    content.classList.add("plus-scrollspy-content");
    content.setAttribute("data-spy", "scroll");
    content.setAttribute("data-target", `#${navId}`);
    content.setAttribute("data-offset", offset.toString());
    
    // Add sections to content
    sections.forEach((section) => {
        const sectionEl = document.createElement("section");
        sectionEl.id = section.id;
        sectionEl.classList.add("plus-scrollspy-section");
        
        if (section.title) {
            const titleEl = document.createElement("h2");
            titleEl.classList.add("h2", "plus-scrollspy-section-title");
            titleEl.textContent = section.title;
            sectionEl.appendChild(titleEl);
        }
        
        if (section.content) {
            if (typeof section.content === 'string') {
                const contentEl = document.createElement("div");
                contentEl.innerHTML = section.content;
                sectionEl.appendChild(contentEl);
            } else if (section.content instanceof HTMLElement) {
                sectionEl.appendChild(section.content);
            }
        }
        
        content.appendChild(sectionEl);
    });
    
    // Initialize scrollspy
    const scrollspy = initScrollspy({
        target: `#${navId}`,
        spy: `#${contentId}`,
        offset: offset,
        onActivate: onActivate
    });
    
    return {
        nav: nav,
        content: content,
        scrollspy: scrollspy
    };
}

