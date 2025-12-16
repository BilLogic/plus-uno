/**
 * Navigation Content Variants Stories
 * 
 * Shows navigation with different content configurations: dropdowns, links, click handlers
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Navigation/Content',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Navigation content variants show different ways to configure navigation items. Shows dropdowns, links, and click handlers.',
      },
    },
  },
};

/**
 * All Content
 * Shows all content variants together
 */
export const AllContent = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // With Dropdowns
    const dropdownSection = document.createElement('div');
    dropdownSection.style.display = 'flex';
    dropdownSection.style.flexDirection = 'column';
    dropdownSection.style.gap = 'var(--size-element-gap-sm)';
    
    const dropdownLabel = document.createElement('div');
    dropdownLabel.className = 'h6';
    dropdownLabel.textContent = 'With Dropdowns';
    dropdownSection.appendChild(dropdownLabel);
    
    const nav1 = PlusInterface.createNavigation({
      items: [
        { text: 'Tab', selected: true },
        { 
          text: 'Dropdown', 
          selected: false,
          dropdownItems: [
            { text: 'Option 1', href: '#' },
            { text: 'Option 2', href: '#' },
            { text: 'Option 3', href: '#' }
          ]
        },
        { text: 'Tab', selected: false }
      ],
      type: 'horizontal',
      alignment: 'left'
    });
    dropdownSection.appendChild(nav1);
    container.appendChild(dropdownSection);
    
    // With Links
    const linksSection = document.createElement('div');
    linksSection.style.display = 'flex';
    linksSection.style.flexDirection = 'column';
    linksSection.style.gap = 'var(--size-element-gap-sm)';
    
    const linksLabel = document.createElement('div');
    linksLabel.className = 'h6';
    linksLabel.textContent = 'With Links';
    linksSection.appendChild(linksLabel);
    
    const nav2 = PlusInterface.createNavigation({
      items: [
        { text: 'Home', href: '#home', selected: true },
        { text: 'About', href: '#about', selected: false },
        { text: 'Services', href: '#services', selected: false },
        { text: 'Contact', href: '#contact', selected: false }
      ],
      type: 'horizontal',
      alignment: 'left'
    });
    linksSection.appendChild(nav2);
    container.appendChild(linksSection);
    
    // With Click Handlers
    const handlersSection = document.createElement('div');
    handlersSection.style.display = 'flex';
    handlersSection.style.flexDirection = 'column';
    handlersSection.style.gap = 'var(--size-element-gap-sm)';
    
    const handlersLabel = document.createElement('div');
    handlersLabel.className = 'h6';
    handlersLabel.textContent = 'With Click Handlers';
    handlersSection.appendChild(handlersLabel);
    
    const nav3 = PlusInterface.createNavigation({
      items: [
        { 
          text: 'Tab 1', 
          selected: true,
          onClick: (e) => { 
            e.preventDefault(); 
            console.log('Tab 1 clicked'); 
          }
        },
        { 
          text: 'Tab 2', 
          selected: false,
          onClick: (e) => { 
            e.preventDefault(); 
            console.log('Tab 2 clicked'); 
          }
        },
        { 
          text: 'Tab 3', 
          selected: false,
          onClick: (e) => { 
            e.preventDefault(); 
            console.log('Tab 3 clicked'); 
          }
        }
      ],
      type: 'tabs',
      alignment: 'left'
    });
    handlersSection.appendChild(nav3);
    container.appendChild(handlersSection);
    
    return container;
  },
};

/**
 * With Dropdowns
 * Navigation items with dropdown menus
 */
export const WithDropdowns = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '48px';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Horizontal with dropdown
    const nav1 = PlusInterface.createNavigation({
      items: [
        { text: 'Tab', selected: true },
        { 
          text: 'Dropdown', 
          selected: false,
          dropdownItems: [
            { text: 'Option 1', href: '#' },
            { text: 'Option 2', href: '#' },
            { text: 'Option 3', href: '#' }
          ]
        },
        { text: 'Tab', selected: false },
        { text: 'Tab', selected: false }
      ],
      type: 'horizontal',
      alignment: 'left'
    });
    
    const section1 = document.createElement('div');
    section1.style.marginBottom = '24px';
    const label1 = document.createElement('h3');
    label1.textContent = 'Horizontal with Dropdown';
    label1.style.marginBottom = '12px';
    section1.appendChild(label1);
    section1.appendChild(nav1);
    container.appendChild(section1);
    
    // Pills with dropdown
    const nav2 = PlusInterface.createNavigation({
      items: [
        { text: 'Pill', selected: true },
        { 
          text: 'Dropdown', 
          selected: false,
          dropdownItems: [
            { text: 'Option 1', href: '#' },
            { text: 'Option 2', href: '#' }
          ]
        },
        { text: 'Pill', selected: false }
      ],
      type: 'pills',
      alignment: 'left'
    });
    
    const section2 = document.createElement('div');
    section2.style.marginBottom = '24px';
    const label2 = document.createElement('h3');
    label2.textContent = 'Pills with Dropdown';
    label2.style.marginBottom = '12px';
    section2.appendChild(label2);
    section2.appendChild(nav2);
    container.appendChild(section2);
    
    return container;
  },
};

/**
 * With Links
 * Navigation items with href links
 */
export const WithLinks = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '48px';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const nav = PlusInterface.createNavigation({
      items: [
        { text: 'Home', href: '#home', selected: true },
        { text: 'About', href: '#about', selected: false },
        { text: 'Services', href: '#services', selected: false },
        { text: 'Contact', href: '#contact', selected: false }
      ],
      type: 'horizontal',
      alignment: 'left'
    });
    
    container.appendChild(nav);
    return container;
  },
};

/**
 * With Click Handlers
 * Navigation items with onClick handlers
 */
export const WithClickHandlers = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '48px';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const nav = PlusInterface.createNavigation({
      items: [
        { 
          text: 'Tab 1', 
          selected: true,
          onClick: (e) => { 
            e.preventDefault(); 
            console.log('Tab 1 clicked'); 
          }
        },
        { 
          text: 'Tab 2', 
          selected: false,
          onClick: (e) => { 
            e.preventDefault(); 
            console.log('Tab 2 clicked'); 
          }
        },
        { 
          text: 'Tab 3', 
          selected: false,
          onClick: (e) => { 
            e.preventDefault(); 
            console.log('Tab 3 clicked'); 
          }
        }
      ],
      type: 'tabs',
      alignment: 'left'
    });
    
    container.appendChild(nav);
    return container;
  },
};



