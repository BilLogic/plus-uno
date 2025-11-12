/**
 * Divider Visual Style Variants Stories
 * Visual style variants organized under "Visual Style Variants" subcategory
 * Includes appearance variations (light, dark) with stroke size variants
 */

import { PlusInterface } from '@/js/components/index.js';

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
    container.style.width = 'var(--size-card-pad-x-lg)';
    const divider = PlusInterface.createDivider({
      size: '1.5px',
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
    container.style.width = 'var(--size-card-pad-x-lg)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    const divider = PlusInterface.createDivider({
      size: '1.5px',
      style: 'dark',
      width: '100%'
    });
    container.appendChild(divider);
    return container;
  },
};

