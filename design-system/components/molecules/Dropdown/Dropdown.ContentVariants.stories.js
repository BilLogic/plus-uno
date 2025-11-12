/**
 * Dropdown Content Variants Stories
 * Content-based variants organized under "Content Variants" subcategory
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Dropdown/Content Variants',
  tags: ['autodocs'],
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
 * Dropdown States
 */
export const States = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.alignItems = 'flex-start';
    
    const states = [
      { label: 'Default', items: [{ text: 'Option 1' }, { text: 'Option 2' }] },
      { label: 'With Selected', items: [{ text: 'Option 1', selected: true }, { text: 'Option 2' }] },
      { label: 'With Disabled', items: [{ text: 'Option 1' }, { text: 'Option 2', disabled: true }] },
    ];
    
    states.forEach((state) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      
      const label = document.createElement('p');
      label.textContent = state.label;
      label.className = 'body2-txt';
      wrapper.appendChild(label);
      
      const dropdown = PlusInterface.createDropdown({
        buttonText: 'Dropdown',
        size: 'default',
        style: 'primary',
        items: state.items,
      });
      wrapper.appendChild(dropdown);
      
      if (typeof $ !== 'undefined') {
        $(dropdown).find('.dropdown-toggle').dropdown();
      }
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

