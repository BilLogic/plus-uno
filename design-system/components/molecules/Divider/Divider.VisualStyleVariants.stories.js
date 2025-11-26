/**
 * Divider Visual Style Variants Stories
 * Visual style variants organized under "Visual Style Variants" subcategory
 * Includes appearance variations (light, dark) with stroke size variants
 */

import { PlusInterface } from '../../index.js';

export default {
  title: 'Molecules/Divider/Visual Style Variants',
  tags: ['autodocs'],
};

/**
 * Light Style
 * Shows light style with default size (medium/1.5px) for style comparison
 */
export const Light = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) 0';
    
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = 'Light Style (Medium size)';
    label.style.marginBottom = 'var(--size-element-gap-md)';
    label.style.color = 'var(--color-on-surface-variant)';
    container.appendChild(label);
    
    const divider = PlusInterface.createDivider({
      size: 'md', // Uses semantic token (maps to 1.5px via --size-element-stroke-md)
      style: 'light',
      width: '100%'
    });
    container.appendChild(divider);
    return container;
  },
};

/**
 * Dark Style
 * Shows dark style with default size (medium/1.5px) for style comparison
 */
export const Dark = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.borderRadius = 'var(--size-card-radius-sm)';
    
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = 'Dark Style (Medium size)';
    label.style.marginBottom = 'var(--size-element-gap-md)';
    label.style.color = 'var(--color-on-surface)';
    container.appendChild(label);
    
    const divider = PlusInterface.createDivider({
      size: 'md', // Uses semantic token (maps to 1.5px via --size-element-stroke-md)
      style: 'dark',
      width: '100%'
    });
    container.appendChild(divider);
    return container;
  },
};

