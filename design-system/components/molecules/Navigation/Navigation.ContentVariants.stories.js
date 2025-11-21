/**
 * Navigation Content Variants
 * Shows navigation with different content configurations
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Navigation/Content Variants',
  tags: ['autodocs'],
};

/**
 * With Dropdowns
 * Navigation items with dropdown menus
 */
export const WithDropdowns = () => {
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
          { text: 'Option 1', href: '#', onClick: () => console.log('Option 1') },
          { text: 'Option 2', href: '#', onClick: () => console.log('Option 2') },
          { text: 'Option 3', href: '#', onClick: () => console.log('Option 3') }
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
          { text: 'Option 1', href: '#', onClick: () => console.log('Option 1') },
          { text: 'Option 2', href: '#', onClick: () => console.log('Option 2') }
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
};

/**
 * With Links
 * Navigation items with href links
 */
export const WithLinks = () => {
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
};

/**
 * With Click Handlers
 * Navigation items with onClick handlers
 */
export const WithClickHandlers = () => {
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
};




