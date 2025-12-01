/**
 * Dropdown Size Variants Stories
 * 
 * Shows all size variants (small, default, large) for dropdowns.
 * All other properties are kept constant (style: primary, split: false, direction: dropdown).
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Dropdown/Sizes',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Dropdown sizes apply consistently. All sizes support the same functionality.',
      },
    },
  },
};

/**
 * Small Dropdown
 * Compact size for dense interfaces
 */
export const Small = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'small',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * Default Dropdown
 * Standard size for most use cases
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * Large Dropdown
 * Prominent size for important actions
 */
export const Large = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'large',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * All Sizes Comparison
 * Side-by-side comparison of all sizes
 */
export const AllSizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'flex-start';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const sizes = ['small', 'default', 'large'];
    
    sizes.forEach((size) => {
      const dropdown = PlusInterface.createDropdown({
        buttonText: size,
        size: size,
        style: 'primary',
        split: false,
        direction: 'dropdown',
        items: [],
      });
      container.appendChild(dropdown);
    });
    
    return container;
  },
};

