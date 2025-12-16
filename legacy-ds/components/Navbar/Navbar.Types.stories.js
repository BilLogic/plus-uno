/**
 * Navbar Type Variants Stories
 * 
 * Shows all 7 navbar types: all, buttons, forms, input group, nav, text, type8
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Navbar/Types',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Navbar types determine what components are included in the navbar. Shows all 7 available types.',
      },
    },
  },
};

/**
 * All Types
 * Shows all 7 navbar types together
 */
export const AllTypes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const types = ['all', 'buttons', 'forms', 'input group', 'nav', 'text', 'type8'];
    
    types.forEach((type) => {
      const typeSection = document.createElement('div');
      typeSection.style.display = 'flex';
      typeSection.style.flexDirection = 'column';
      typeSection.style.gap = 'var(--size-element-gap-sm)';
      
      const typeLabel = document.createElement('div');
      typeLabel.className = 'h6';
      typeLabel.textContent = `Type: ${type}`;
      typeSection.appendChild(typeLabel);
      
      const navbar = PlusInterface.createNavbar({
        brand: 'Navbar',
        items: type === 'nav' || type === 'all' || type === 'text' ? [
          { text: 'Home', selected: type === 'nav' || type === 'all' },
          { text: 'Feature', selected: false },
          { text: 'Pricing', selected: false }
        ] : [],
        type: type,
        backgroundColor: 'light'
      });
      
      typeSection.appendChild(navbar);
      container.appendChild(typeSection);
    });
    
    return container;
  },
};

/**
 * All
 * Navbar with all component types
 */
export const All = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Nav Item', selected: true },
        { text: 'Link', selected: false },
        { 
          text: 'Dropdowns', 
          selected: false,
          dropdownItems: [
            { text: 'Option 1', href: '#' },
            { text: 'Option 2', href: '#' }
          ]
        },
        { text: 'Disabled', selected: false, disabled: true }
      ],
      type: 'all',
      backgroundColor: 'light'
    });
    
    container.appendChild(navbar);
    return container;
  },
};

/**
 * Buttons
 * Navbar with buttons only
 */
export const Buttons = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [],
      type: 'buttons',
      backgroundColor: 'light',
      components: [
        { type: 'button', text: 'Main Button' },
        { type: 'button', text: 'Smaller Button' }
      ]
    });
    
    container.appendChild(navbar);
    return container;
  },
};

/**
 * Forms
 * Navbar with forms only
 */
export const Forms = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [],
      type: 'forms',
      backgroundColor: 'light',
      components: [
        { type: 'form', placeholder: 'Search' }
      ]
    });
    
    container.appendChild(navbar);
    return container;
  },
};

/**
 * Input Group
 * Navbar with input group only
 */
export const InputGroup = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [],
      type: 'input group',
      backgroundColor: 'light',
      components: [
        { type: 'inputGroup', placeholder: 'Placeholder' }
      ]
    });
    
    container.appendChild(navbar);
    return container;
  },
};

/**
 * Nav
 * Navbar with navigation items only
 */
export const Nav = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Home', selected: true },
        { text: 'Feature', selected: false },
        { text: 'Pricing', selected: false }
      ],
      type: 'nav',
      backgroundColor: 'light'
    });
    
    container.appendChild(navbar);
    return container;
  },
};

/**
 * Text
 * Navbar with navigation items and text
 */
export const Text = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Home', selected: false },
        { text: 'Feature', selected: false },
        { text: 'Pricing', selected: false }
      ],
      type: 'text',
      backgroundColor: 'light',
      components: [
        { type: 'text', text: 'Navbar text with an inline element' }
      ]
    });
    
    container.appendChild(navbar);
    return container;
  },
};

/**
 * Type8
 * Navbar with type8 configuration
 */
export const Type8 = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Home', selected: false },
        { text: 'Feature', selected: false },
        { text: 'Pricing', selected: false },
        { 
          text: 'Dropdown', 
          selected: false,
          dropdownItems: [
            { text: 'Option 1', href: '#' },
            { text: 'Option 2', href: '#' }
          ]
        }
      ],
      type: 'type8',
      backgroundColor: 'light'
    });
    
    container.appendChild(navbar);
    return container;
  },
};

