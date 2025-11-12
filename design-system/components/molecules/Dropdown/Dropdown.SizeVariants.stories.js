/**
 * Dropdown Size Variants Stories
 * Size variants organized under "Size Variants" subcategory
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Dropdown/Size Variants',
  tags: ['autodocs'],
};

/**
 * Small Dropdown
 */
export const Small = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Small Dropdown',
      size: 'small',
      style: 'primary',
      items: [
        { text: 'Option 1' },
        { text: 'Option 2' },
        { text: 'Option 3' },
      ],
    });
    container.appendChild(dropdown);
    
    if (typeof $ !== 'undefined') {
      $(dropdown).find('.dropdown-toggle').dropdown();
    }
    
    return container;
  },
};

/**
 * Default Dropdown
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Default Dropdown',
      size: 'default',
      style: 'primary',
      items: [
        { text: 'Option 1' },
        { text: 'Option 2' },
        { text: 'Option 3' },
      ],
    });
    container.appendChild(dropdown);
    
    if (typeof $ !== 'undefined') {
      $(dropdown).find('.dropdown-toggle').dropdown();
    }
    
    return container;
  },
};

/**
 * Large Dropdown
 */
export const Large = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Large Dropdown',
      size: 'large',
      style: 'primary',
      items: [
        { text: 'Option 1' },
        { text: 'Option 2' },
        { text: 'Option 3' },
      ],
    });
    container.appendChild(dropdown);
    
    if (typeof $ !== 'undefined') {
      $(dropdown).find('.dropdown-toggle').dropdown();
    }
    
    return container;
  },
};

