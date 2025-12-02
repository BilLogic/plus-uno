/**
 * Divider Size Variants Stories
 * 
 * Shows all size variants (sm, md, lg, xl) for dividers.
 * All other properties are kept constant (style: light).
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Divider/Sizes',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Divider sizes use semantic stroke tokens. Small (1px), Medium (1.5px), Large (2px), Extra Large (2.5px).',
      },
    },
  },
};

/**
 * Small (1px)
 * Subtle separation for closely related content
 */
export const Small = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) 0';
    
    const divider = PlusInterface.createDivider({
      size: 'sm',
      style: 'light',
      width: '100%'
    });
    container.appendChild(divider);
    return container;
  },
};

/**
 * Medium (1.5px)
 * Standard separation for most use cases
 */
export const Medium = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) 0';
    
    const divider = PlusInterface.createDivider({
      size: 'md',
      style: 'light',
      width: '100%'
    });
    container.appendChild(divider);
    return container;
  },
};

/**
 * Large (2px)
 * Prominent separation for major sections
 */
export const Large = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) 0';
    
    const divider = PlusInterface.createDivider({
      size: 'lg',
      style: 'light',
      width: '100%'
    });
    container.appendChild(divider);
    return container;
  },
};

/**
 * Extra Large (2.5px)
 * Maximum emphasis for strong separation
 */
export const ExtraLarge = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) 0';
    
    const divider = PlusInterface.createDivider({
      size: 'xl',
      style: 'light',
      width: '100%'
    });
    container.appendChild(divider);
    return container;
  },
};

/**
 * All Sizes Comparison
 * Side-by-side comparison of all sizes
 */
export const AllSizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) 0';
    
    const sizes = [
      { value: 'sm', label: 'Small (1px)' },
      { value: 'md', label: 'Medium (1.5px)' },
      { value: 'lg', label: 'Large (2px)' },
      { value: 'xl', label: 'Extra Large (2.5px)' }
    ];
    
    sizes.forEach((size) => {
      const divider = PlusInterface.createDivider({
        size: size.value,
        style: 'light',
        width: '100%'
      });
      container.appendChild(divider);
    });
    
    return container;
  },
};


