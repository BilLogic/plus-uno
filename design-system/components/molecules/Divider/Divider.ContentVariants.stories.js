/**
 * Divider Content Variants Stories
 * Content-based variants organized under "Content Variants" subcategory
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Divider/Content Variants',
  tags: ['autodocs'],
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
    container.style.width = 'var(--size-card-pad-x-lg)';
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
      size: '1px',
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

