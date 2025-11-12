/**
 * Dropdown Visual Style Variants Stories
 * Visual style variants organized under "Visual Style Variants" subcategory
 * Includes color/style variations (default, primary, secondary, etc.)
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Dropdown/Visual Style Variants',
  tags: ['autodocs'],
};

/**
 * Default Dropdown
 * Shows default style with default size for style comparison
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Default',
      size: 'default',
      style: 'default',
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
 * Primary Dropdown
 * Shows primary style with default size for style comparison
 */
export const Primary = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Primary',
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
 * Secondary Dropdown
 * Shows secondary style with default size for style comparison
 */
export const Secondary = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Secondary',
      size: 'default',
      style: 'secondary',
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
 * Success Dropdown
 * Shows success style with default size for style comparison
 */
export const Success = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Success',
      size: 'default',
      style: 'success',
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
 * Danger Dropdown
 * Shows danger style with default size for style comparison
 */
export const Danger = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Danger',
      size: 'default',
      style: 'danger',
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
 * Warning Dropdown
 * Shows warning style with default size for style comparison
 */
export const Warning = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Warning',
      size: 'default',
      style: 'warning',
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
 * Info Dropdown
 * Shows info style with default size for style comparison
 */
export const Info = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Info',
      size: 'default',
      style: 'info',
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

