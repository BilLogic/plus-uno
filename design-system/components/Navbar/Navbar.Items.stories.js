/**
 * Navbar Item Variants Stories
 * 
 * Shows NavbarItem and NavbarItemDropdown with all states
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Navbar/Items',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Navbar items are the individual navigation elements within a navbar. Shows NavbarItem and NavbarItemDropdown with all states and selected variants.',
      },
    },
  },
};

/**
 * All Items
 * Shows all item types together
 */
export const AllItems = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // NavbarItem
    const itemSection = document.createElement('div');
    itemSection.style.display = 'flex';
    itemSection.style.flexDirection = 'column';
    itemSection.style.gap = 'var(--size-element-gap-sm)';
    
    const itemLabel = document.createElement('div');
    itemLabel.className = 'h6';
    itemLabel.textContent = 'NavbarItem';
    itemSection.appendChild(itemLabel);
    
    const navbar1 = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Nav Item', selected: false }
      ],
      type: 'nav',
      backgroundColor: 'light'
    });
    itemSection.appendChild(navbar1);
    container.appendChild(itemSection);
    
    // NavbarItemDropdown
    const dropdownSection = document.createElement('div');
    dropdownSection.style.display = 'flex';
    dropdownSection.style.flexDirection = 'column';
    dropdownSection.style.gap = 'var(--size-element-gap-sm)';
    
    const dropdownLabel = document.createElement('div');
    dropdownLabel.className = 'h6';
    dropdownLabel.textContent = 'NavbarItemDropdown';
    dropdownSection.appendChild(dropdownLabel);
    
    const navbar2 = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { 
          text: 'Dropdown', 
          selected: false,
          dropdownItems: [
            { text: 'Option 1', href: '#' },
            { text: 'Option 2', href: '#' },
            { text: 'Option 3', href: '#' }
          ]
        }
      ],
      type: 'nav',
      backgroundColor: 'light'
    });
    dropdownSection.appendChild(navbar2);
    container.appendChild(dropdownSection);
    
    return container;
  },
};

/**
 * NavbarItem
 * Shows navbar item with all states
 */
export const NavbarItem = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const states = [
      { name: 'Default', selected: false, disabled: false },
      { name: 'Selected', selected: true, disabled: false },
      { name: 'Disabled', selected: false, disabled: true },
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
          { text: 'Nav Item', selected: state.selected, disabled: state.disabled }
        ],
        type: 'nav',
        backgroundColor: 'light'
      });
      
      stateRow.appendChild(navbar);
      container.appendChild(stateRow);
    });
    
    return container;
  },
};

/**
 * NavbarItemDropdown
 * Shows navbar item dropdown with all states
 */
export const NavbarItemDropdown = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const states = [
      { name: 'Default', selected: false, disabled: false },
      { name: 'Selected', selected: true, disabled: false },
      { name: 'Disabled', selected: false, disabled: true },
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
          { 
            text: 'Dropdown', 
            selected: state.selected,
            disabled: state.disabled,
            dropdownItems: [
              { text: 'Option 1', href: '#' },
              { text: 'Option 2', href: '#' },
              { text: 'Option 3', href: '#' }
            ]
          }
        ],
        type: 'nav',
        backgroundColor: 'light'
      });
      
      stateRow.appendChild(navbar);
      container.appendChild(stateRow);
    });
    
    return container;
  },
};

