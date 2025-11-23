/**
 * Dropdown List Stories
 * 
 * Shows dropdown list variants with different numbers of items (1-9)
 * Organized exactly as shown in Figma design system
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Dropdown/Dropdown List',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Dropdown list variants showing different numbers of items (1-9). Each item includes icon, text, counter, and dropright arrow.',
      },
    },
  },
};

/**
 * All Variants
 * Shows dropdown lists with 1-9 items
 * Organized exactly as shown in Figma design system
 * 
 * Note: According to Figma documentation, the number of items can be from 1-9.
 * Each item includes: leading icon, text, counter, and dropright arrow.
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Create items array - each item has icon, text, counter, and dropright arrow (matching Figma)
    const baseItem = {
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true
    };
    
    // Show lists with 1-9 items
    for (let itemCount = 1; itemCount <= 9; itemCount++) {
      const itemGroup = document.createElement('div');
      itemGroup.style.display = 'flex';
      itemGroup.style.flexDirection = 'column';
      itemGroup.style.gap = 'var(--size-card-gap-sm)';
      
      const itemLabel = document.createElement('div');
      itemLabel.className = 'body1-txt';
      itemLabel.textContent = `# of items=${itemCount}`;
      itemLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      itemGroup.appendChild(itemLabel);
      
      // Create items array
      const items = Array(itemCount).fill(null).map(() => ({ ...baseItem }));
      
      // Create dropdown with menu shown (open state)
      const dropdown = PlusInterface.createDropdown({
        buttonText: 'Dropdown',
        size: 'default',
        style: 'primary',
        split: false,
        direction: 'dropdown',
        items: items,
      });
      
      // Show the menu in open state
      const menu = dropdown.querySelector('.dropdown-menu');
      if (menu) {
        menu.style.display = 'block';
        menu.style.position = 'static';
        menu.style.transform = 'none';
        menu.style.opacity = '1';
        menu.style.marginTop = '0';
      }
      
      // Hide the button, only show the menu
      const toggle = dropdown.querySelector('.dropdown-toggle');
      if (toggle) {
        toggle.style.display = 'none';
      }
      
      itemGroup.appendChild(dropdown);
      container.appendChild(itemGroup);
    }
    
    return container;
  },
};

