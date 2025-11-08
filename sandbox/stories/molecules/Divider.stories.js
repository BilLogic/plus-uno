/**
 * Divider Molecule Stories
 * Divider component for visual separation
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Divider',
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['1px', '2px', '3px', '4px'],
      description: 'Divider size',
    },
    style: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Divider style',
    },
    opacity10: {
      control: 'boolean',
      description: 'Apply 10% opacity',
    },
  },
};

/**
 * Divider Sizes
 */
export const Sizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '2rem';
    container.style.width = '300px';
    
    const sizes = ['1px', '2px', '3px', '4px'];
    
    sizes.forEach((size) => {
      const divider = PlusInterface.createDivider({
        size: size,
        style: 'light',
        width: '100%'
      });
      container.appendChild(divider);
      
      const label = document.createElement('div');
      label.textContent = `${size} divider`;
      label.style.marginTop = '0.5rem';
      label.style.marginBottom = '1rem';
      container.appendChild(label);
    });
    
    return container;
  },
};

/**
 * Divider Styles
 */
export const Styles = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '2rem';
    container.style.width = '300px';
    container.style.padding = '2rem';
    container.style.backgroundColor = '#f5f5f5';
    
    const lightDivider = PlusInterface.createDivider({
      size: '1px',
      style: 'light',
      width: '100%'
    });
    container.appendChild(lightDivider);
    
    const lightLabel = document.createElement('div');
    lightLabel.textContent = 'Light divider';
    lightLabel.style.marginTop = '0.5rem';
    lightLabel.style.marginBottom = '1rem';
    container.appendChild(lightLabel);
    
    const darkDivider = PlusInterface.createDivider({
      size: '1px',
      style: 'dark',
      width: '100%'
    });
    container.appendChild(darkDivider);
    
    const darkLabel = document.createElement('div');
    darkLabel.textContent = 'Dark divider';
    darkLabel.style.marginTop = '0.5rem';
    container.appendChild(darkLabel);
    
    return container;
  },
};

/**
 * Divider with Opacity
 */
export const WithOpacity = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '2rem';
    container.style.width = '300px';
    container.style.padding = '2rem';
    container.style.backgroundColor = '#f5f5f5';
    
    const normalDivider = PlusInterface.createDivider({
      size: '1px',
      style: 'dark',
      width: '100%'
    });
    container.appendChild(normalDivider);
    
    const normalLabel = document.createElement('div');
    normalLabel.textContent = 'Normal opacity';
    normalLabel.style.marginTop = '0.5rem';
    normalLabel.style.marginBottom = '1rem';
    container.appendChild(normalLabel);
    
    const opacityDivider = PlusInterface.createDivider({
      size: '1px',
      style: 'dark',
      opacity10: true,
      width: '100%'
    });
    container.appendChild(opacityDivider);
    
    const opacityLabel = document.createElement('div');
    opacityLabel.textContent = '10% opacity (for accordion/collapse)';
    opacityLabel.style.marginTop = '0.5rem';
    container.appendChild(opacityLabel);
    
    return container;
  },
};

/**
 * Interactive Divider
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.width = '300px';
    container.style.padding = '2rem';
    container.style.backgroundColor = '#f5f5f5';
    
    const divider = PlusInterface.createDivider(args);
    container.appendChild(divider);
    
    return container;
  },
  args: {
    size: '1px',
    style: 'light',
    opacity10: false,
    width: '100%',
  },
};

