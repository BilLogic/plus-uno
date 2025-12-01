/**
 * Navbar Background Color Variants Stories
 * 
 * Shows all 3 background colors: primary, light, dark
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Navbar/Colors',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Navbar background colors determine the visual appearance of the navbar. Shows all 3 available background colors.',
      },
    },
  },
};

/**
 * All Colors
 * Shows all 3 background colors together
 */
export const AllColors = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const colors = ['primary', 'light', 'dark'];
    
    colors.forEach((color) => {
      const colorSection = document.createElement('div');
      colorSection.style.display = 'flex';
      colorSection.style.flexDirection = 'column';
      colorSection.style.gap = 'var(--size-element-gap-sm)';
      
      const colorLabel = document.createElement('div');
      colorLabel.className = 'h6';
      colorLabel.textContent = `Background Color: ${color}`;
      colorSection.appendChild(colorLabel);
      
      const navbar = PlusInterface.createNavbar({
        brand: 'Navbar',
        items: [
          { text: 'Home', selected: false },
          { text: 'Feature', selected: false },
          { text: 'Pricing', selected: false },
          { text: 'About', selected: false }
        ],
        type: 'nav',
        backgroundColor: color
      });
      
      colorSection.appendChild(navbar);
      container.appendChild(colorSection);
    });
    
    return container;
  },
};

/**
 * Primary
 * Navbar with primary background color
 */
export const Primary = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Home', selected: false },
        { text: 'Feature', selected: false },
        { text: 'Pricing', selected: false },
        { text: 'About', selected: false }
      ],
      type: 'nav',
      backgroundColor: 'primary'
    });
    
    container.appendChild(navbar);
    return container;
  },
};

/**
 * Light
 * Navbar with light background color (default)
 */
export const Light = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Home', selected: false },
        { text: 'Feature', selected: false },
        { text: 'Pricing', selected: false },
        { text: 'About', selected: false }
      ],
      type: 'nav',
      backgroundColor: 'light'
    });
    
    container.appendChild(navbar);
    return container;
  },
};

/**
 * Dark
 * Navbar with dark background color
 */
export const Dark = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const navbar = PlusInterface.createNavbar({
      brand: 'Navbar',
      items: [
        { text: 'Home', selected: false },
        { text: 'Feature', selected: false },
        { text: 'Pricing', selected: false },
        { text: 'About', selected: false }
      ],
      type: 'nav',
      backgroundColor: 'dark'
    });
    
    container.appendChild(navbar);
    return container;
  },
};

