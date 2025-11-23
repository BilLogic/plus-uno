/**
 * Dropdown States Stories
 * 
 * Shows dropdown item states: default, selected, disabled
 * Organized under "States" subcategory
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Dropdown/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Dropdown item states showing default, selected, and disabled states.',
      },
    },
  },
};

/**
 * Default State
 * Shows dropdown items in default state
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      items: [
        { text: 'Option 1' },
        { text: 'Option 2' },
        { text: 'Option 3' },
      ],
    });
    
    // Show menu in open state
    const menu = dropdown.querySelector('.dropdown-menu');
    if (menu) {
      menu.style.display = 'block';
      menu.style.position = 'static';
      menu.style.transform = 'none';
      menu.style.opacity = '1';
      menu.style.marginTop = '0';
    }
    const toggle = dropdown.querySelector('.dropdown-toggle');
    if (toggle) {
      toggle.style.display = 'none';
    }
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * Selected State
 * Shows dropdown items with one item selected
 */
export const Selected = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      items: [
        { text: 'Option 1' },
        { text: 'Option 2', selected: true },
        { text: 'Option 3' },
      ],
    });
    
    // Show menu in open state
    const menu = dropdown.querySelector('.dropdown-menu');
    if (menu) {
      menu.style.display = 'block';
      menu.style.position = 'static';
      menu.style.transform = 'none';
      menu.style.opacity = '1';
      menu.style.marginTop = '0';
    }
    const toggle = dropdown.querySelector('.dropdown-toggle');
    if (toggle) {
      toggle.style.display = 'none';
    }
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * Disabled State
 * Shows dropdown items with one item disabled
 */
export const Disabled = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      items: [
        { text: 'Option 1' },
        { text: 'Option 2', disabled: true },
        { text: 'Option 3' },
      ],
    });
    
    // Show menu in open state
    const menu = dropdown.querySelector('.dropdown-menu');
    if (menu) {
      menu.style.display = 'block';
      menu.style.position = 'static';
      menu.style.transform = 'none';
      menu.style.opacity = '1';
      menu.style.marginTop = '0';
    }
    const toggle = dropdown.querySelector('.dropdown-toggle');
    if (toggle) {
      toggle.style.display = 'none';
    }
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * All States
 * Shows all item states together for comparison
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-lg)';
    
    const states = [
      {
        label: 'Default',
        items: [
          { text: 'Option 1' },
          { text: 'Option 2' },
          { text: 'Option 3' },
        ],
      },
      {
        label: 'With Selected Item',
        items: [
          { text: 'Option 1' },
          { text: 'Option 2', selected: true },
          { text: 'Option 3' },
        ],
      },
      {
        label: 'With Disabled Item',
        items: [
          { text: 'Option 1' },
          { text: 'Option 2', disabled: true },
          { text: 'Option 3' },
        ],
      },
      {
        label: 'Mixed States',
        items: [
          { text: 'Option 1' },
          { text: 'Option 2', selected: true },
          { text: 'Option 3', disabled: true },
        ],
      },
    ];
    
    states.forEach((state) => {
      const stateGroup = document.createElement('div');
      stateGroup.style.display = 'flex';
      stateGroup.style.flexDirection = 'column';
      stateGroup.style.gap = 'var(--size-element-gap-sm)';
      
      const label = document.createElement('div');
      label.className = 'body1-txt';
      label.textContent = state.label;
      stateGroup.appendChild(label);
      
      const dropdown = PlusInterface.createDropdown({
        buttonText: 'Dropdown',
        size: 'default',
        style: 'primary',
        items: state.items,
      });
      
      // Show menu in open state
      const menu = dropdown.querySelector('.dropdown-menu');
      if (menu) {
        menu.style.display = 'block';
        menu.style.position = 'static';
        menu.style.transform = 'none';
        menu.style.opacity = '1';
        menu.style.marginTop = '0';
      }
      const toggle = dropdown.querySelector('.dropdown-toggle');
      if (toggle) {
        toggle.style.display = 'none';
      }
      
      stateGroup.appendChild(dropdown);
      container.appendChild(stateGroup);
    });
    
    return container;
  },
};


