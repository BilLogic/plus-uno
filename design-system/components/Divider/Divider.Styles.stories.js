/**
 * Divider Styles Variants Stories
 * 
 * Shows style variants for dividers (normal opacity, 10% opacity).
 * All other properties are kept constant (size: sm, style: dark).
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Divider/Styles',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Divider style variants show different opacity options. 10% opacity is used for accordion/collapse use cases.',
      },
    },
  },
};

/**
 * Normal Opacity
 * Standard divider with full opacity
 */
export const NormalOpacity = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.borderRadius = 'var(--size-card-radius-sm)';
    
    const divider = PlusInterface.createDivider({
      size: 'sm',
      style: 'dark',
      width: '100%'
    });
    container.appendChild(divider);
    return container;
  },
};

/**
 * 10% Opacity
 * Divider with 10% opacity for subtle separation (accordion/collapse use cases)
 */
export const Opacity10 = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.borderRadius = 'var(--size-card-radius-sm)';
    
    const divider = PlusInterface.createDivider({
      size: 'sm',
      style: 'dark',
      opacity10: true,
      width: '100%'
    });
    container.appendChild(divider);
    return container;
  },
};

/**
 * All Styles
 * Side-by-side comparison of normal and 10% opacity
 */
export const AllStyles = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.borderRadius = 'var(--size-card-radius-sm)';
    
    // Normal opacity
    const normalDivider = PlusInterface.createDivider({
      size: 'sm',
      style: 'dark',
      width: '100%'
    });
    container.appendChild(normalDivider);
    
    // 10% opacity
    const opacityDivider = PlusInterface.createDivider({
      size: 'sm',
      style: 'dark',
      opacity10: true,
      width: '100%'
    });
    container.appendChild(opacityDivider);
    
    return container;
  },
};

/**
 * Divider with Opacity
 * @deprecated Use NormalOpacity or Opacity10 instead
 */
export const WithOpacity = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.borderRadius = 'var(--size-card-radius-sm)';
    
    // Normal opacity example
    const normalWrapper = document.createElement('div');
    normalWrapper.style.display = 'flex';
    normalWrapper.style.flexDirection = 'column';
    normalWrapper.style.gap = 'var(--size-element-gap-sm)';
    normalWrapper.style.padding = 'var(--size-section-pad-y-sm) 0';
    
    const normalLabel = document.createElement('div');
    normalLabel.className = 'body2-txt';
    normalLabel.textContent = 'Normal opacity';
    normalLabel.style.color = 'var(--color-on-surface)';
    normalWrapper.appendChild(normalLabel);
    
    const normalDivider = PlusInterface.createDivider({
      size: 'sm', // Uses semantic token (maps to 1px via --size-element-stroke-sm)
      style: 'dark',
      width: '100%'
    });
    normalWrapper.appendChild(normalDivider);
    container.appendChild(normalWrapper);
    
    // 10% opacity example
    const opacityWrapper = document.createElement('div');
    opacityWrapper.style.display = 'flex';
    opacityWrapper.style.flexDirection = 'column';
    opacityWrapper.style.gap = 'var(--size-element-gap-sm)';
    opacityWrapper.style.padding = 'var(--size-section-pad-y-sm) 0';
    
    const opacityLabel = document.createElement('div');
    opacityLabel.className = 'body2-txt';
    opacityLabel.textContent = '10% opacity (for accordion/collapse)';
    opacityLabel.style.color = 'var(--color-on-surface)';
    opacityWrapper.appendChild(opacityLabel);
    
    const opacityDivider = PlusInterface.createDivider({
      size: 'sm', // Uses semantic token (maps to 1px via --size-element-stroke-sm)
      style: 'dark',
      opacity10: true,
      width: '100%'
    });
    opacityWrapper.appendChild(opacityDivider);
    container.appendChild(opacityWrapper);
    
    return container;
  },
};

