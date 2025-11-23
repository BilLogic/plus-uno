/**
 * Dropdown Content Variants Stories
 * Content-based variants organized under "Content Variants" subcategory
 * 
 * Shows all item customization options:
 * - Leading Icon
 * - Counter
 * - Dropright Arrow
 * - Trailing Visual
 * - Divider
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Dropdown/Content Variants',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Dropdown content variants showing different combinations of leading icon, counter, dropright arrow, trailing visual, and dividers. These can be toggled on/off to customize dropdown items.',
      },
    },
  },
};

/**
 * Dropdown with Selected Item
 */
export const WithSelectedItem = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      items: [
        { text: 'Option 1', selected: false },
        { text: 'Option 2', selected: true },
        { text: 'Option 3', selected: false },
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
 * Dropdown with Icons
 */
export const WithIcons = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown with Icons',
      size: 'default',
      style: 'primary',
      items: [
        { text: 'Home', leadingIcon: 'home' },
        { text: 'Settings', leadingIcon: 'cog' },
        { text: 'User', leadingIcon: 'user' },
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
 * Dropdown with Counters
 */
export const WithCounters = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown with Counters',
      size: 'default',
      style: 'primary',
      items: [
        { text: 'Inbox', counter: 5 },
        { text: 'Sent', counter: 12 },
        { text: 'Drafts', counter: 3 },
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
 * Dropdown with Full Features
 */
export const FullFeatures = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Full Features Dropdown',
      size: 'default',
      style: 'primary',
      items: [
        { 
          text: 'Selected Item', 
          selected: true, 
          leadingIcon: 'check',
          counter: 20 
        },
        { 
          text: 'Item with Icon', 
          leadingIcon: 'star',
          counter: 5 
        },
        { 
          text: 'Item with Dropright', 
          dropright: true 
        },
        { 
          text: 'Disabled Item', 
          disabled: true 
        },
        { 
          text: 'Section Header', 
          header: true 
        },
        { 
          text: 'Another Item', 
          trailingIcon: 'arrow-right' 
        },
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
 * Default Item (All Features)
 * Shows the default dropdown item with all features enabled:
 * - Leading icon (icons)
 * - Text (Form)
 * - Counter (20)
 * - Dropright arrow
 * - Checkmark (always present, visible when selected)
 */
export const DefaultItem = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      items: [
        { 
          text: 'Form',
          leadingIcon: 'th',
          counter: 20,
          dropright: true
        },
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
 * With Leading Icon Only
 * Shows dropdown items with only leading icons (counter, dropright disabled)
 */
export const WithLeadingIconOnly = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      items: [
        { text: 'Home', leadingIcon: 'home', counter: null, dropright: false },
        { text: 'Settings', leadingIcon: 'cog', counter: null, dropright: false },
        { text: 'User', leadingIcon: 'user', counter: null, dropright: false },
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
 * With Counter Only
 * Shows dropdown items with only counters (leading icon, dropright disabled)
 */
export const WithCounterOnly = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      items: [
        { text: 'Inbox', counter: 5, leadingIcon: null, dropright: false },
        { text: 'Sent', counter: 12, leadingIcon: null, dropright: false },
        { text: 'Drafts', counter: 3, leadingIcon: null, dropright: false },
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
 * With Dropright Arrow Only
 * Shows dropdown items with only dropright arrows (submenu indicator)
 */
export const WithDroprightArrowOnly = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      items: [
        { text: 'Option 1', dropright: true },
        { text: 'Option 2', dropright: true },
        { text: 'Option 3', dropright: true },
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
 * With Trailing Visual Only
 * Shows dropdown items with only trailing icons (leading icon, counter, dropright disabled)
 * Note: Trailing visual appears BEFORE counter in the layout
 */
export const WithTrailingVisualOnly = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      items: [
        { text: 'Option 1', trailingIcon: 'arrow-right', leadingIcon: null, counter: null, dropright: false },
        { text: 'Option 2', trailingIcon: 'external-link', leadingIcon: null, counter: null, dropright: false },
        { text: 'Option 3', trailingIcon: 'chevron-right', leadingIcon: null, counter: null, dropright: false },
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
 * With All Features Combined
 * Shows dropdown items with all features: leading icon, text, trailing visual, counter, dropright
 * This demonstrates the correct order: leading icon → text → trailing visual → counter → dropright
 */
export const WithAllFeaturesCombined = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      items: [
        { 
          text: 'Form',
          leadingIcon: 'th',
          trailingIcon: 'star',
          counter: 20,
          dropright: true
        },
        { 
          text: 'Form',
          leadingIcon: 'th',
          trailingIcon: 'star',
          counter: 20,
          dropright: true,
          selected: true
        },
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
 * With Dividers
 * Shows dropdown items with dividers between items
 */
export const WithDividers = {
  render: () => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      items: [
        { text: 'Option 1', divider: true },
        { text: 'Option 2', divider: true },
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

