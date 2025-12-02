/**
 * Navbar Item States Stories
 * 
 * Shows all 5 interactive states for navbar items: default, hover, pressed, focus, disabled
 * Includes selected variants for each state
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Navbar/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Navbar item states show how items respond to user interaction. Hover, focus, and pressed states are CSS-driven and appear on user interaction. Selected variants are also shown.',
      },
    },
  },
};

/**
 * All States
 * Shows all 5 states: default, hover, pressed, focus, disabled
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const states = [
      { name: 'Default', stateClass: '', enabled: true, selected: false },
      { name: 'Hover', stateClass: 'plus-navbar-state-hover', enabled: true, selected: false },
      { name: 'Pressed', stateClass: 'plus-navbar-state-pressed', enabled: true, selected: false },
      { name: 'Focus', stateClass: 'plus-navbar-state-focus', enabled: true, selected: false },
      { name: 'Disabled', stateClass: '', enabled: false, selected: false },
    ];
    
    states.forEach((state) => {
      const stateRow = document.createElement('div');
      stateRow.style.display = 'flex';
      stateRow.style.flexDirection = 'column';
      stateRow.style.gap = 'var(--size-element-gap-xs)';
      
      const stateLabel = document.createElement('div');
      stateLabel.className = 'h6';
      stateLabel.textContent = state.name;
      stateRow.appendChild(stateLabel);
      
      const navbar = PlusInterface.createNavbar({
        brand: 'Navbar',
        items: [
          { text: 'Nav Item', selected: state.selected, disabled: !state.enabled }
        ],
        type: 'nav',
        backgroundColor: 'light'
      });
      
      // Apply state class if provided
      if (state.stateClass) {
        const navbarItem = navbar.querySelector('.plus-navbar-item');
        if (navbarItem) {
          navbarItem.classList.add(state.stateClass);
          // Disable pointer events so the static state is always visible
          navbarItem.style.pointerEvents = 'none';
        }
      }
      
      stateRow.appendChild(navbar);
      container.appendChild(stateRow);
    });
    
    return container;
  },
};

/**
 * Default State
 * Shows navbar item in default state
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Nav Item', selected: false }
      ],
      type: 'nav',
      backgroundColor: 'light'
    });
    
    container.appendChild(navbar);
    return container;
  },
};

/**
 * Hover State
 * Shows navbar item in hover state
 */
export const Hover = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Nav Item', selected: false }
      ],
      type: 'nav',
      backgroundColor: 'light'
    });
    
    // Apply hover state class
    const navbarItem = navbar.querySelector('.plus-navbar-item');
    if (navbarItem) {
      navbarItem.classList.add('plus-navbar-state-hover');
      navbarItem.style.pointerEvents = 'none';
    }
    
    container.appendChild(navbar);
    return container;
  },
};

/**
 * Pressed State
 * Shows navbar item in pressed state
 */
export const Pressed = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Nav Item', selected: false }
      ],
      type: 'nav',
      backgroundColor: 'light'
    });
    
    // Apply pressed state class
    const navbarItem = navbar.querySelector('.plus-navbar-item');
    if (navbarItem) {
      navbarItem.classList.add('plus-navbar-state-pressed');
      navbarItem.style.pointerEvents = 'none';
    }
    
    container.appendChild(navbar);
    return container;
  },
};

/**
 * Focus State
 * Shows navbar item in focus state
 */
export const Focus = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Nav Item', selected: false }
      ],
      type: 'nav',
      backgroundColor: 'light'
    });
    
    // Apply focus state class
    const navbarItem = navbar.querySelector('.plus-navbar-item');
    if (navbarItem) {
      navbarItem.classList.add('plus-navbar-state-focus');
      navbarItem.style.pointerEvents = 'none';
    }
    
    container.appendChild(navbar);
    return container;
  },
};

/**
 * Disabled State
 * Shows navbar item in disabled state
 */
export const Disabled = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Nav Item', selected: false, disabled: true }
      ],
      type: 'nav',
      backgroundColor: 'light'
    });
    
    container.appendChild(navbar);
    return container;
  },
};

/**
 * Selected States
 * Shows all states with selected variant
 */
export const SelectedStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const states = [
      { name: 'Default (Selected)', stateClass: '', enabled: true, selected: true },
      { name: 'Hover (Selected)', stateClass: 'plus-navbar-state-hover', enabled: true, selected: true },
      { name: 'Pressed (Selected)', stateClass: 'plus-navbar-state-pressed', enabled: true, selected: true },
      { name: 'Focus (Selected)', stateClass: 'plus-navbar-state-focus', enabled: true, selected: true },
    ];
    
    states.forEach((state) => {
      const stateRow = document.createElement('div');
      stateRow.style.display = 'flex';
      stateRow.style.flexDirection = 'column';
      stateRow.style.gap = 'var(--size-element-gap-xs)';
      
      const stateLabel = document.createElement('div');
      stateLabel.className = 'h6';
      stateLabel.textContent = state.name;
      stateRow.appendChild(stateLabel);
      
      const navbar = PlusInterface.createNavbar({
        brand: 'Navbar',
        items: [
          { text: 'Nav Item', selected: state.selected, disabled: !state.enabled }
        ],
        type: 'nav',
        backgroundColor: 'light'
      });
      
      // Apply state class if provided
      if (state.stateClass) {
        const navbarItem = navbar.querySelector('.plus-navbar-item');
        if (navbarItem) {
          navbarItem.classList.add(state.stateClass);
          // Disable pointer events so the static state is always visible
          navbarItem.style.pointerEvents = 'none';
        }
      }
      
      stateRow.appendChild(navbar);
      container.appendChild(stateRow);
    });
    
    return container;
  },
};


