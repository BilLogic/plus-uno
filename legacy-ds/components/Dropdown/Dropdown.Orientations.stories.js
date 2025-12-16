/**
 * Dropdown Orientation Variants Stories
 * 
 * Shows all orientation/direction variants for dropdowns (dropdown, dropup, dropleft, dropright).
 * All other properties are kept constant (size: default, style: primary, split: false).
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Dropdown/Orientations',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Dropdown orientations determine which direction the menu opens. All orientations support the same functionality.',
      },
    },
  },
};

/**
 * Dropdown (Down)
 * Menu opens downward (default)
 */
export const Dropdown = {
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
 * Dropup (Up)
 * Menu opens upward
 */
export const Dropup = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropup',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropup',
      items: [],
    });
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * Dropleft (Left)
 * Menu opens to the left
 */
export const Dropleft = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropleft',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropleft',
      items: [],
    });
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * Dropright (Right)
 * Menu opens to the right
 */
export const Dropright = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropright',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropright',
      items: [],
    });
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * All Orientations
 * Side-by-side comparison of all orientations
 */
export const AllOrientations = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'flex-start';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const directions = [
      { value: 'dropdown', label: 'Dropdown' },
      { value: 'dropup', label: 'Dropup' },
      { value: 'dropleft', label: 'Dropleft' },
      { value: 'dropright', label: 'Dropright' }
    ];
    
    directions.forEach((direction) => {
      const dropdown = PlusInterface.createDropdown({
        buttonText: direction.label,
        size: 'default',
        style: 'primary',
        split: false,
        direction: direction.value,
        items: [],
      });
      container.appendChild(dropdown);
    });
    
    return container;
  },
};

