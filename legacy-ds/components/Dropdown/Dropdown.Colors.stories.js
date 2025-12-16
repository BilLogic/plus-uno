/**
 * Dropdown Color Variants Stories
 * 
 * Shows all color/style variants for dropdowns.
 * All other properties are kept constant (size: default, split: false, direction: dropdown).
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Dropdown/Colors',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Dropdown color variants show different visual styles. All colors support the same functionality.',
      },
    },
  },
};

/**
 * Primary Color
 * Primary brand color dropdown
 */
export const Primary = {
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
 * Secondary Color
 * Secondary brand color dropdown
 */
export const Secondary = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'secondary',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * Success Color
 * Success color dropdown
 */
export const Success = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'success',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * Danger Color
 * Danger color dropdown
 */
export const Danger = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'danger',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * Warning Color
 * Warning color dropdown
 */
export const Warning = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'warning',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * Info Color
 * Info color dropdown
 */
export const Info = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'info',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * Default Color
 * Default color dropdown
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'default',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * All Colors Comparison
 * Side-by-side comparison of all colors
 */
export const AllColors = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'flex-start';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const styles = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'default'];
    
    styles.forEach((style) => {
      const dropdown = PlusInterface.createDropdown({
        buttonText: style,
        size: 'default',
        style: style,
        split: false,
        direction: 'dropdown',
        items: [],
      });
      container.appendChild(dropdown);
    });
    
    return container;
  },
};

