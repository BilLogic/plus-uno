/**
 * Scrollspy Component Stories
 * 
 * ## Usage and Implementation
 * 
 * Scrollspy is a **Section** component utility that automatically updates navigation based on scroll position.
 * It highlights the active navigation item as users scroll through content sections.
 * 
 * ### When to Use
 * - **Long-form content**: When you have multiple sections of content that users scroll through
 * - **Table of contents**: For automatically updating table of contents navigation
 * - **Single-page applications**: For navigation that tracks scroll position on a single page
 * - **Documentation pages**: For documentation with multiple sections
 * - **Landing pages**: For landing pages with multiple content sections
 * - **Product pages**: For product pages with features, specifications, etc.
 * 
 * ### When NOT to Use
 * - **Short content**: Don't use for pages with minimal scrolling
 * - **Multi-page navigation**: Use regular navigation for pages that navigate to different URLs
 * - **Dynamic content**: May not work well with dynamically loaded content
 * - **Mobile-only experiences**: Scrollspy can be less useful on mobile where navigation is often hidden
 * 
 * ### Implementation Context
 * - **Component Type**: Section (uses `section-*` tokens for content, `element-*` tokens for navigation)
 * - **Bootstrap Framework**: Uses Bootstrap 4.6.2's `scrollspy` component
 * - **Token Usage**: 
 *   - Colors: Uses Navigation component colors (primary for vertical/pills, secondary for horizontal/tabs)
 *   - Spacing: `--size-section-*` tokens for content sections
 *   - Typography: Body typography scales for navigation text
 *   - Navigation: Inherits styling from Navigation component
 * - **Reference**: https://getbootstrap.com/docs/4.6/components/scrollspy/
 * 
 * ### Configuration Options
 * - **target**: Navigation element selector or element to target
 * - **spy**: Scrollable container selector or element to spy on (default: "body")
 * - **offset**: Offset in pixels from top when calculating position (default: 10)
 * - **method**: Method to use: "auto", "position", "offset" (default: "auto")
 * 
 * ### Best Practices
 * - Ensure sections have sufficient height for scrollspy to work effectively
 * - Use descriptive section IDs that match navigation hrefs
 * - Test scrollspy behavior on different screen sizes
 * - Consider using fixed navigation for better UX
 * - Provide smooth scrolling for better user experience
 * - Ensure all sections are accessible and keyboard navigable
 * 
 * See docs/guidelines/terminology.md for Section Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Scrollspy',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Scrollspy component for automatically updating navigation based on scroll position. Built on Bootstrap 4.6.2 scrollspy with PLUS design token customizations.',
      },
    },
    layout: 'fullscreen', // Fullscreen layout for scrollspy examples
  },
};

/**
 * Basic Scrollspy
 * Simple scrollspy with horizontal navigation
 */
export const Basic = {
  render: () => {
    const container = document.createElement('div');
    container.style.height = '100vh';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Create navigation
    const nav = PlusInterface.createNavigation({
      id: 'scrollspy-nav-basic',
      items: [
        { text: 'Section 1', href: '#section1' },
        { text: 'Section 2', href: '#section2' },
        { text: 'Section 3', href: '#section3' },
        { text: 'Section 4', href: '#section4' }
      ],
      type: 'horizontal',
      alignment: 'left'
    });
    
    // Add scrollspy attributes to nav links
    nav.querySelectorAll('.plus-nav-link').forEach(link => {
      link.setAttribute('data-target', link.getAttribute('href')?.substring(1));
    });
    
    container.appendChild(nav);
    
    // Create scrollable content
    const content = document.createElement('div');
    content.id = 'scrollspy-content-basic';
    content.className = 'plus-scrollspy-content';
    content.style.flex = '1';
    content.style.overflowY = 'auto';
    content.style.overflowX = 'hidden';
    content.setAttribute('data-spy', 'scroll');
    content.setAttribute('data-target', '#scrollspy-nav-basic');
    content.setAttribute('data-offset', '10');
    
    const sections = [
      { id: 'section1', title: 'Section 1', content: 'Content for section 1. Scroll down to see scrollspy in action.' },
      { id: 'section2', title: 'Section 2', content: 'Content for section 2. The navigation will highlight as you scroll.' },
      { id: 'section3', title: 'Section 3', content: 'Content for section 3. Notice how the active nav item changes.' },
      { id: 'section4', title: 'Section 4', content: 'Content for section 4. This is the last section.' }
    ];
    
    sections.forEach((section, index) => {
      const sectionEl = document.createElement('section');
      sectionEl.id = section.id;
      sectionEl.className = 'plus-scrollspy-section';
      
      const title = document.createElement('h2');
      title.className = 'h2 plus-scrollspy-section-title';
      title.textContent = section.title;
      sectionEl.appendChild(title);
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'body1-txt';
      contentDiv.style.marginBottom = 'var(--size-section-gap-md)';
      contentDiv.textContent = section.content;
      sectionEl.appendChild(contentDiv);
      
      // Add more content to make scrolling meaningful
      for (let i = 0; i < 10; i++) {
        const p = document.createElement('p');
        p.className = 'body1-txt';
        p.textContent = `This is paragraph ${i + 1} in ${section.title}. Scroll to see the navigation update automatically.`;
        sectionEl.appendChild(p);
      }
      
      content.appendChild(sectionEl);
    });
    
    container.appendChild(content);
    
    // Initialize scrollspy
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.scrollspy) {
        $('#scrollspy-content-basic').scrollspy({
          target: '#scrollspy-nav-basic',
          offset: 10
        });
      }
    }, 0);
    
    return container;
  },
};

/**
 * Vertical Navigation
 * Scrollspy with vertical navigation
 */
export const VerticalNavigation = {
  render: () => {
    const container = document.createElement('div');
    container.style.height = '100vh';
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Create vertical navigation
    const nav = PlusInterface.createNavigation({
      id: 'scrollspy-nav-vertical',
      items: [
        { text: 'Overview', href: '#overview' },
        { text: 'Features', href: '#features' },
        { text: 'Pricing', href: '#pricing' },
        { text: 'Contact', href: '#contact' }
      ],
      type: 'vertical',
      alignment: 'left'
    });
    
    nav.style.width = '200px';
    nav.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    nav.style.backgroundColor = 'var(--color-surface-container)';
    nav.style.borderRight = '1px solid var(--color-outline-variant)';
    
    // Add scrollspy attributes
    nav.querySelectorAll('.plus-nav-link').forEach(link => {
      link.setAttribute('data-target', link.getAttribute('href')?.substring(1));
    });
    
    container.appendChild(nav);
    
    // Create scrollable content
    const content = document.createElement('div');
    content.id = 'scrollspy-content-vertical';
    content.className = 'plus-scrollspy-content';
    content.style.flex = '1';
    content.style.overflowY = 'auto';
    content.style.overflowX = 'hidden';
    content.setAttribute('data-spy', 'scroll');
    content.setAttribute('data-target', '#scrollspy-nav-vertical');
    content.setAttribute('data-offset', '10');
    
    const sections = [
      { id: 'overview', title: 'Overview', content: 'Overview content goes here.' },
      { id: 'features', title: 'Features', content: 'Features content goes here.' },
      { id: 'pricing', title: 'Pricing', content: 'Pricing content goes here.' },
      { id: 'contact', title: 'Contact', content: 'Contact content goes here.' }
    ];
    
    sections.forEach((section) => {
      const sectionEl = document.createElement('section');
      sectionEl.id = section.id;
      sectionEl.className = 'plus-scrollspy-section';
      
      const title = document.createElement('h2');
      title.className = 'h2 plus-scrollspy-section-title';
      title.textContent = section.title;
      sectionEl.appendChild(title);
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'body1-txt';
      contentDiv.textContent = section.content;
      sectionEl.appendChild(contentDiv);
      
      // Add more content
      for (let i = 0; i < 15; i++) {
        const p = document.createElement('p');
        p.className = 'body1-txt';
        p.textContent = `Content paragraph ${i + 1} in ${section.title}.`;
        sectionEl.appendChild(p);
      }
      
      content.appendChild(sectionEl);
    });
    
    container.appendChild(content);
    
    // Initialize scrollspy
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.scrollspy) {
        $('#scrollspy-content-vertical').scrollspy({
          target: '#scrollspy-nav-vertical',
          offset: 10
        });
      }
    }, 0);
    
    return container;
  },
};

/**
 * Tabs Navigation
 * Scrollspy with tabs-style navigation
 */
export const TabsNavigation = {
  render: () => {
    const container = document.createElement('div');
    container.style.height = '100vh';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Create tabs navigation
    const nav = PlusInterface.createNavigation({
      id: 'scrollspy-nav-tabs',
      items: [
        { text: 'Introduction', href: '#intro' },
        { text: 'Getting Started', href: '#getting-started' },
        { text: 'Advanced', href: '#advanced' },
        { text: 'Examples', href: '#examples' }
      ],
      type: 'tabs',
      alignment: 'left'
    });
    
    // Add scrollspy attributes
    nav.querySelectorAll('.plus-nav-link').forEach(link => {
      link.setAttribute('data-target', link.getAttribute('href')?.substring(1));
    });
    
    container.appendChild(nav);
    
    // Create scrollable content
    const content = document.createElement('div');
    content.id = 'scrollspy-content-tabs';
    content.className = 'plus-scrollspy-content';
    content.style.flex = '1';
    content.style.overflowY = 'auto';
    content.style.overflowX = 'hidden';
    content.setAttribute('data-spy', 'scroll');
    content.setAttribute('data-target', '#scrollspy-nav-tabs');
    content.setAttribute('data-offset', '10');
    
    const sections = [
      { id: 'intro', title: 'Introduction', content: 'Introduction to the topic.' },
      { id: 'getting-started', title: 'Getting Started', content: 'How to get started.' },
      { id: 'advanced', title: 'Advanced Topics', content: 'Advanced concepts and techniques.' },
      { id: 'examples', title: 'Examples', content: 'Real-world examples and use cases.' }
    ];
    
    sections.forEach((section) => {
      const sectionEl = document.createElement('section');
      sectionEl.id = section.id;
      sectionEl.className = 'plus-scrollspy-section';
      
      const title = document.createElement('h2');
      title.className = 'h2 plus-scrollspy-section-title';
      title.textContent = section.title;
      sectionEl.appendChild(title);
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'body1-txt';
      contentDiv.textContent = section.content;
      sectionEl.appendChild(contentDiv);
      
      // Add more content
      for (let i = 0; i < 12; i++) {
        const p = document.createElement('p');
        p.className = 'body1-txt';
        p.textContent = `Content paragraph ${i + 1} in ${section.title}.`;
        sectionEl.appendChild(p);
      }
      
      content.appendChild(sectionEl);
    });
    
    container.appendChild(content);
    
    // Initialize scrollspy
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.scrollspy) {
        $('#scrollspy-content-tabs').scrollspy({
          target: '#scrollspy-nav-tabs',
          offset: 10
        });
      }
    }, 0);
    
    return container;
  },
};

/**
 * Pills Navigation
 * Scrollspy with pills-style navigation
 */
export const PillsNavigation = {
  render: () => {
    const container = document.createElement('div');
    container.style.height = '100vh';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Create pills navigation
    const nav = PlusInterface.createNavigation({
      id: 'scrollspy-nav-pills',
      items: [
        { text: 'Home', href: '#home' },
        { text: 'About', href: '#about' },
        { text: 'Services', href: '#services' },
        { text: 'Portfolio', href: '#portfolio' },
        { text: 'Contact', href: '#contact' }
      ],
      type: 'pills',
      alignment: 'center'
    });
    
    // Add scrollspy attributes
    nav.querySelectorAll('.plus-nav-link').forEach(link => {
      link.setAttribute('data-target', link.getAttribute('href')?.substring(1));
    });
    
    container.appendChild(nav);
    
    // Create scrollable content
    const content = document.createElement('div');
    content.id = 'scrollspy-content-pills';
    content.className = 'plus-scrollspy-content';
    content.style.flex = '1';
    content.style.overflowY = 'auto';
    content.style.overflowX = 'hidden';
    content.setAttribute('data-spy', 'scroll');
    content.setAttribute('data-target', '#scrollspy-nav-pills');
    content.setAttribute('data-offset', '10');
    
    const sections = [
      { id: 'home', title: 'Home', content: 'Welcome to our website.' },
      { id: 'about', title: 'About Us', content: 'Learn more about our company.' },
      { id: 'services', title: 'Our Services', content: 'Discover what we offer.' },
      { id: 'portfolio', title: 'Portfolio', content: 'View our work and projects.' },
      { id: 'contact', title: 'Contact', content: 'Get in touch with us.' }
    ];
    
    sections.forEach((section) => {
      const sectionEl = document.createElement('section');
      sectionEl.id = section.id;
      sectionEl.className = 'plus-scrollspy-section';
      
      const title = document.createElement('h2');
      title.className = 'h2 plus-scrollspy-section-title';
      title.textContent = section.title;
      sectionEl.appendChild(title);
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'body1-txt';
      contentDiv.textContent = section.content;
      sectionEl.appendChild(contentDiv);
      
      // Add more content
      for (let i = 0; i < 10; i++) {
        const p = document.createElement('p');
        p.className = 'body1-txt';
        p.textContent = `Content paragraph ${i + 1} in ${section.title}.`;
        sectionEl.appendChild(p);
      }
      
      content.appendChild(sectionEl);
    });
    
    container.appendChild(content);
    
    // Initialize scrollspy
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.scrollspy) {
        $('#scrollspy-content-pills').scrollspy({
          target: '#scrollspy-nav-pills',
          offset: 10
        });
      }
    }, 0);
    
    return container;
  },
};



