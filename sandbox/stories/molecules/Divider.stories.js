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
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Divider size (uses element stroke tokens: sm=1px, md=1.5px, lg=2px, xl=2.5px)',
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
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.width = '300px';
    
    const sizes = [
      { value: 'sm', label: 'Small (1px)', token: '--size-element-stroke-sm' },
      { value: 'md', label: 'Medium (1.5px)', token: '--size-element-stroke-md' },
      { value: 'lg', label: 'Large (2px)', token: '--size-element-stroke-lg' },
      { value: 'xl', label: 'Extra Large (2.5px)', token: '--size-element-stroke-xl' },
    ];
    
    sizes.forEach((size) => {
      const divider = PlusInterface.createDivider({
        size: size.value === 'sm' ? '1px' : size.value === 'md' ? '1.5px' : size.value === 'lg' ? '2px' : '2.5px',
        style: 'light',
        width: '100%'
      });
      container.appendChild(divider);
      
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.textContent = `${size.label} - ${size.token}`;
      label.style.marginTop = 'var(--size-element-gap-sm)';
      label.style.marginBottom = 'var(--size-element-gap-md)';
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
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.width = '300px';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    
    const lightDivider = PlusInterface.createDivider({
      size: '1px',
      style: 'light',
      width: '100%'
    });
    container.appendChild(lightDivider);
    
    const lightLabel = document.createElement('div');
    lightLabel.className = 'body2-txt';
    lightLabel.textContent = 'Light divider';
    lightLabel.style.marginTop = 'var(--size-element-gap-sm)';
    lightLabel.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(lightLabel);
    
    const darkDivider = PlusInterface.createDivider({
      size: '1px', // Maps to --size-element-stroke-sm (1px)
      style: 'dark',
      width: '100%'
    });
    container.appendChild(darkDivider);
    
    const darkLabel = document.createElement('div');
    darkLabel.className = 'body2-txt';
    darkLabel.textContent = 'Dark divider';
    darkLabel.style.marginTop = 'var(--size-element-gap-sm)';
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
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.width = '300px';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    
    const normalDivider = PlusInterface.createDivider({
      size: '1px',
      style: 'dark',
      width: '100%'
    });
    container.appendChild(normalDivider);
    
    const normalLabel = document.createElement('div');
    normalLabel.className = 'body2-txt';
    normalLabel.textContent = 'Normal opacity';
    normalLabel.style.marginTop = 'var(--size-element-gap-sm)';
    normalLabel.style.marginBottom = 'var(--size-element-gap-md)';
    container.appendChild(normalLabel);
    
    const opacityDivider = PlusInterface.createDivider({
      size: '1px', // Maps to --size-element-stroke-sm (1px)
      style: 'dark',
      opacity10: true,
      width: '100%'
    });
    container.appendChild(opacityDivider);
    
    const opacityLabel = document.createElement('div');
    opacityLabel.className = 'body2-txt';
    opacityLabel.textContent = '10% opacity (for accordion/collapse)';
    opacityLabel.style.marginTop = 'var(--size-element-gap-sm)';
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
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    
    const divider = PlusInterface.createDivider(args);
    container.appendChild(divider);
    
    return container;
  },
  args: {
    size: '1px', // Maps to --size-element-stroke-sm (1px)
    style: 'light',
    opacity10: false,
    width: '100%',
  },
};

