/**
 * Dropdown States Stories
 * 
 * Shows all interactive states for dropdowns (closed, open).
 * All other properties are kept constant (size: default, style: primary, split: false, direction: dropdown).
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Dropdown/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Dropdown states show how dropdowns appear when closed or open. The open state displays the dropdown menu.',
      },
    },
  },
};

/**
 * Closed State
 * Dropdown in closed state (button only, menu hidden)
 */
export const Closed = {
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
    
    // Initialize Bootstrap dropdown
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.dropdown) {
        const $toggle = $(dropdown).find('.dropdown-toggle');
        if ($toggle.length && !$toggle.data('bs.dropdown')) {
          $toggle.dropdown();
        }
      }
    }, 0);
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * Open State
 * Dropdown in open state (button + visible menu)
 */
export const Open = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const menuItems = [
      { text: 'Form', leadingIcon: 'th', counter: 20, dropright: true },
      { text: 'Form', leadingIcon: 'th', counter: 20, dropright: true },
      { text: 'Form', leadingIcon: 'th', counter: 20, dropright: true, selected: true }
    ];
    
    const dropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: menuItems,
    });
    
    // Show the menu in open state
    const menu = dropdown.querySelector('.dropdown-menu');
    if (menu) {
      menu.style.display = 'block';
      menu.style.position = 'static';
      menu.style.transform = 'none';
      menu.style.opacity = '1';
      menu.style.marginTop = '0';
      menu.classList.add('show');
    }
    const toggle = dropdown.querySelector('.dropdown-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
    }
    
    container.appendChild(dropdown);
    return container;
  },
};

/**
 * All States
 * Side-by-side comparison of closed and open states
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'flex-start';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const menuItems = [
      { text: 'Form', leadingIcon: 'th', counter: 20, dropright: true },
      { text: 'Form', leadingIcon: 'th', counter: 20, dropright: true },
      { text: 'Form', leadingIcon: 'th', counter: 20, dropright: true, selected: true }
    ];
    
    // Closed state
    const closed = PlusInterface.createDropdown({
      buttonText: 'Closed',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: [],
    });
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.dropdown) {
        const $toggle = $(closed).find('.dropdown-toggle');
        if ($toggle.length && !$toggle.data('bs.dropdown')) {
          $toggle.dropdown();
        }
      }
    }, 0);
    container.appendChild(closed);
    
    // Open state
    const open = PlusInterface.createDropdown({
      buttonText: 'Open',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: menuItems,
    });
    const menu = open.querySelector('.dropdown-menu');
    if (menu) {
      menu.style.display = 'block';
      menu.style.position = 'static';
      menu.style.transform = 'none';
      menu.style.opacity = '1';
      menu.style.marginTop = '0';
      menu.classList.add('show');
    }
    const toggle = open.querySelector('.dropdown-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
    }
    container.appendChild(open);
    
    return container;
  },
};


