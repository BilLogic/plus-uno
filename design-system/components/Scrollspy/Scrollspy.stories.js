/**
 * Scrollspy Component Stories
 * 
 * ## Usage and Implementation
 * 
 * Scrollspy is a **Section** component that automatically updates navigation based on scroll position.
 * It features a navbar with pills navigation that highlights the active item as users scroll through content sections.
 * 
 * ### When to Use
 * - **Long-form content**: When you have multiple sections of content that users scroll through
 * - **Table of contents**: For automatically updating table of contents navigation
 * - **Single-page applications**: For navigation that tracks scroll position on a single page
 * - **Documentation pages**: For documentation with multiple sections
 * - **Landing pages**: For landing pages with multiple content sections
 * 
 * ### When NOT to Use
 * - **Short content**: Don't use for pages with minimal scrolling
 * - **Multi-page navigation**: Use regular navigation for pages that navigate to different URLs
 * - **Dynamic content**: May not work well with dynamically loaded content
 * 
 * ### Implementation Context
 * - **Component Type**: Section (uses `section-*` tokens for content, `element-*` tokens for navigation)
 * - **Bootstrap Framework**: Uses Bootstrap 4.6.2's `scrollspy` component
 * - **Token Usage**: 
 *   - Colors: Primary for regular pills, tertiary for dropdown when active
 *   - Spacing: `--size-spacing-*` tokens for navbar and sections
 *   - Typography: Body Special Lead for brand, H4 for section titles, Body1 for content
 * - **Reference**: https://getbootstrap.com/docs/4.6/components/scrollspy/
 * 
 * ### Properties
 * - **item**: Choose "1", "2", or "3" to determine the current scroll position within the scrollspy
 * 
 * See design-system/components/overview.md for Section Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Scrollspy',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Scrollspy component for automatically updating navigation based on scroll position. Features a navbar with pills navigation that highlights active items as users scroll.',
      },
    },
  },
};

/**
 * Basic
 * Interactive scrollspy - scroll through the content to see the active nav item change
 */
export const Basic = {
  render: () => {
    const container = document.createElement('div');
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.width = '648px';
    container.style.maxHeight = '600px';
    
    // Create scrollspy navbar
    const navbar = PlusInterface.createScrollspy({
      id: 'scrollspy-nav-basic',
      brand: 'Navbar',
      items: [
        { text: '@fat', href: '#fat', isDropdown: false },
        { text: '@mdo', href: '#mdo', isDropdown: false },
        { text: 'Dropdown', href: '#one', isDropdown: true }
      ],
      activeIndex: 0,
      contentId: 'scrollspy-content-basic',
      offset: 10
    });
    
    container.appendChild(navbar);
    
    // Create scrollable content with enough height for scrolling
    const content = PlusInterface.createScrollspyContent({
      id: 'scrollspy-content-basic',
      navbarId: 'scrollspy-nav-basic',
      sections: [
        {
          id: 'fat',
          title: '@fat',
          content: "Placeholder content for the scrollspy example. You got the finest architecture. Passport stamps, she's cosmopolitan. Fine, fresh, fierce, we got it on lock. Never planned that one day I'd be losing you. She eats your heart out. Your kiss is cosmic, every move is magic. I mean the ones, I mean like she's the one. Greetings loved ones let's take a journey. Just own the night like the 4th of July! But you'd rather get wasted."
        },
        {
          id: 'mdo',
          title: '@mdo',
          content: "Placeholder content for the scrollspy example. 'Cause she's the muse and the artist. (This is how we do) So you wanna play with magic. So just be sure before you give it all to me. I'm walking, I'm walking on air (tonight). Skip the talk, heard it all, time to walk the walk."
        },
        {
          id: 'one',
          title: 'one',
          content: "Placeholder content for the scrollspy example. Takes you miles high, so high, 'cause she's got that one international smile. There's a stranger in my bed, there's a pounding in my head. Oh, no. In another life I would make you stay. 'Cause I, I'm capable of anything. Suiting up for my crowning battle. Used to steal your parents' liquor and climb to the roof. Tone, tan fit and ready, turn it up cause its gettin' heavy. Her love is like a drug. I guess that I forgot I had a choice."
        }
      ],
      offset: 10
    });
    
    // Make content scrollable with fixed height
    content.style.height = '500px';
    content.style.overflowY = 'auto';
    content.style.overflowX = 'hidden';
    
    // Add more content to each section to ensure scrolling works
    const sections = content.querySelectorAll('.plus-scrollspy-section');
    sections.forEach((section, index) => {
      // Add multiple paragraphs to make sections tall enough
      for (let i = 0; i < 8; i++) {
        const p = document.createElement('p');
        p.className = 'body1-txt';
        p.style.marginTop = '16px';
        p.textContent = `Additional content paragraph ${i + 1} in section ${index + 1}. This content ensures the section is tall enough for scrollspy to detect scroll position changes. Keep scrolling to see the active nav item update automatically.`;
        section.appendChild(p);
      }
    });
    
    container.appendChild(content);
    
    return container;
  },
};

/**
 * All Variants
 * Shows scrollspy with different configurations
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Basic scrollspy
    const basicWrapper = document.createElement('div');
    basicWrapper.style.display = 'flex';
    basicWrapper.style.flexDirection = 'column';
    basicWrapper.style.width = '648px';
    basicWrapper.style.maxHeight = '600px';
    
    const basicLabel = document.createElement('div');
    basicLabel.className = 'h6';
    basicLabel.textContent = 'Basic Scrollspy';
    basicLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    basicWrapper.appendChild(basicLabel);
    
    const navbar1 = PlusInterface.createScrollspy({
      id: 'scrollspy-nav-1',
      brand: 'Navbar',
      items: [
        { text: '@fat', href: '#fat', isDropdown: false },
        { text: '@mdo', href: '#mdo', isDropdown: false }
      ],
      activeIndex: 0,
      contentId: 'scrollspy-content-1',
      offset: 10
    });
    basicWrapper.appendChild(navbar1);
    
    const content1 = PlusInterface.createScrollspyContent({
      id: 'scrollspy-content-1',
      navbarId: 'scrollspy-nav-1',
      sections: [
        {
          id: 'fat',
          title: '@fat',
          content: "Placeholder content for the scrollspy example. You got the finest architecture."
        },
        {
          id: 'mdo',
          title: '@mdo',
          content: "Placeholder content for the scrollspy example. 'Cause she's the muse and the artist."
        }
      ],
      offset: 10
    });
    content1.style.height = '300px';
    content1.style.overflowY = 'auto';
    basicWrapper.appendChild(content1);
    container.appendChild(basicWrapper);
    
    return container;
  },
};

/**
 * Interactive Scrollspy
 * Interactive playground for testing scrollspy variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.width = args.width || '648px';
    container.style.maxHeight = args.maxHeight || '600px';
    
    const items = args.items || [
      { text: '@fat', href: '#fat', isDropdown: false },
      { text: '@mdo', href: '#mdo', isDropdown: false },
      { text: 'Dropdown', href: '#one', isDropdown: true }
    ];
    
    const navbar = PlusInterface.createScrollspy({
      id: args.id || 'interactive-scrollspy-nav',
      brand: args.brand || 'Navbar',
      items: items,
      activeIndex: args.activeIndex || 0,
      contentId: args.contentId || 'interactive-scrollspy-content',
      offset: args.offset || 10,
      onActivate: (index) => {
        console.log('Nav item activated:', index);
      }
    });
    
    container.appendChild(navbar);
    
    const sections = args.sections || [
      {
        id: 'fat',
        title: '@fat',
        content: "Placeholder content for the scrollspy example. You got the finest architecture. Passport stamps, she's cosmopolitan."
      },
      {
        id: 'mdo',
        title: '@mdo',
        content: "Placeholder content for the scrollspy example. 'Cause she's the muse and the artist. So you wanna play with magic."
      },
      {
        id: 'one',
        title: 'one',
        content: "Placeholder content for the scrollspy example. Takes you miles high, so high, 'cause she's got that one international smile."
      }
    ];
    
    const content = PlusInterface.createScrollspyContent({
      id: args.contentId || 'interactive-scrollspy-content',
      navbarId: args.id || 'interactive-scrollspy-nav',
      sections: sections,
      offset: args.offset || 10
    });
    
    content.style.height = args.contentHeight || '500px';
    content.style.overflowY = 'auto';
    content.style.overflowX = 'hidden';
    
    // Add more content to each section
    const sectionElements = content.querySelectorAll('.plus-scrollspy-section');
    sectionElements.forEach((section, index) => {
      for (let i = 0; i < 8; i++) {
        const p = document.createElement('p');
        p.className = 'body1-txt';
        p.style.marginTop = '16px';
        p.textContent = `Additional content paragraph ${i + 1} in section ${index + 1}.`;
        section.appendChild(p);
      }
    });
    
    container.appendChild(content);
    return container;
  },
  argTypes: {
    id: {
      control: 'text',
      description: 'Scrollspy navbar ID',
    },
    brand: {
      control: 'text',
      description: 'Navbar brand text',
    },
    activeIndex: {
      control: { type: 'number', min: 0, max: 2, step: 1 },
      description: 'Initially active item index',
    },
    contentId: {
      control: 'text',
      description: 'Scrollable content container ID',
    },
    offset: {
      control: { type: 'number', min: 0, max: 100, step: 10 },
      description: 'Scroll offset in pixels',
    },
    width: {
      control: 'text',
      description: 'Container width',
    },
    maxHeight: {
      control: 'text',
      description: 'Container max height',
    },
    contentHeight: {
      control: 'text',
      description: 'Content scrollable height',
    },
  },
  args: {
    id: 'interactive-scrollspy-nav',
    brand: 'Navbar',
    activeIndex: 0,
    contentId: 'interactive-scrollspy-content',
    offset: 10,
    width: '648px',
    maxHeight: '600px',
    contentHeight: '500px',
  },
};


