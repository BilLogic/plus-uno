/**
 * Dropdown Content Variants Stories
 * 
 * Shows content variants for dropdowns (standard vs split).
 * All other properties are kept constant (size: default, style: primary, direction: dropdown).
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Dropdown/Content',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Dropdown content variants show different button configurations. Standard dropdowns have a single button, while split dropdowns have separate text and arrow buttons.',
      },
    },
  },
};

/**
 * Standard Dropdown
 * Single button dropdown - users can toggle by clicking anywhere on the button
 */
export const Standard = {
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
 * Split Dropdown
 * Split button dropdown - users can toggle only by clicking the arrow icon
 */
export const Split = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Split Dropdown',
      size: 'default',
      style: 'primary',
      split: true,
      direction: 'dropdown',
      items: [],
    });
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * All Content Variants
 * Side-by-side comparison of standard and split dropdowns
 */
export const AllContent = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'flex-start';
    container.style.gap = 'var(--size-card-gap-md)';
    
    // Standard
    const standard = PlusInterface.createDropdown({
      buttonText: 'Standard',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    container.appendChild(standard);
    
    // Split
    const split = PlusInterface.createDropdown({
      buttonText: 'Split',
      size: 'default',
      style: 'primary',
      split: true,
      direction: 'dropdown',
      items: [],
    });
    container.appendChild(split);
    
    return container;
  },
};

