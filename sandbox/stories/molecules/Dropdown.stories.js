/**
 * Dropdown Molecule Stories
 * Dropdown component with all variations: styles, sizes, states, and item configurations
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Dropdown',
  tags: ['autodocs'],
  argTypes: {
    buttonText: {
      control: 'text',
      description: 'Dropdown button text',
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Dropdown size',
    },
    style: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'danger', 'warning', 'info'],
      description: 'Dropdown style (color)',
    },
    split: {
      control: 'boolean',
      description: 'Split button dropdown',
    },
  },
};

/**
 * Default Dropdown
 */
export const Default = {
  render: (args) => {
    const container = document.createElement('div');
    const dropdown = PlusInterface.createDropdown({
      ...args,
      items: [
        { text: 'Option 1', onClick: () => console.log('Option 1 clicked') },
        { text: 'Option 2', onClick: () => console.log('Option 2 clicked') },
        { text: 'Option 3', onClick: () => console.log('Option 3 clicked') },
      ],
    });
    container.appendChild(dropdown);
    
    // Initialize Bootstrap dropdown
    if (typeof $ !== 'undefined') {
      $(dropdown).find('.dropdown-toggle').dropdown();
    }
    
    return container;
  },
  args: {
    buttonText: 'Dropdown',
    size: 'default',
    style: 'default',
    split: false,
  },
};

/**
 * Dropdown Styles
 */
export const Styles = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '1rem';
    container.style.alignItems = 'flex-start';
    
    const styles = ['default', 'primary', 'secondary', 'success', 'danger', 'warning', 'info'];
    
    styles.forEach((style) => {
      const dropdown = PlusInterface.createDropdown({
        buttonText: style.charAt(0).toUpperCase() + style.slice(1),
        size: 'default',
        style: style,
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
    });
    
    return container;
  },
};

/**
 * Dropdown Sizes
 */
export const Sizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '1rem';
    container.style.alignItems = 'flex-start';
    
    const sizes = ['small', 'default', 'large'];
    
    sizes.forEach((size) => {
      const dropdown = PlusInterface.createDropdown({
        buttonText: size.charAt(0).toUpperCase() + size.slice(1) + ' Dropdown',
        size: size,
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
    });
    
    return container;
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
 * Dropdown States
 */
export const States = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '1rem';
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
      wrapper.style.gap = '0.5rem';
      
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

