/**
 * Divider Color Variants Stories
 * 
 * Shows all color/style variants for dividers (light, dark).
 * All other properties are kept constant (size: md).
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Divider/Colors',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Divider color variants show different visual styles. Light dividers use outline-variant color, dark dividers use outline color.',
      },
    },
  },
};

/**
 * Light Color
 * Light style divider using outline-variant color (default for light backgrounds)
 */
export const Light = {
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
 * Dark Color
 * Dark style divider using outline color (for dark backgrounds or emphasis)
 */
export const Dark = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    container.style.borderRadius = 'var(--size-card-radius-sm)';
    
    const divider = PlusInterface.createDivider({
      size: 'md',
      style: 'dark',
      width: '100%'
    });
    container.appendChild(divider);
    return container;
  },
};

/**
 * All Colors Comparison
 * Side-by-side comparison of light and dark styles
 */
export const AllColors = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    
    // Light
    const lightWrapper = document.createElement('div');
    lightWrapper.style.padding = 'var(--size-section-pad-y-md) 0';
    const lightDivider = PlusInterface.createDivider({
      size: 'md',
      style: 'light',
      width: '100%'
    });
    lightWrapper.appendChild(lightDivider);
    container.appendChild(lightWrapper);
    
    // Dark
    const darkWrapper = document.createElement('div');
    darkWrapper.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    darkWrapper.style.backgroundColor = 'var(--color-surface-container)';
    darkWrapper.style.borderRadius = 'var(--size-card-radius-sm)';
    const darkDivider = PlusInterface.createDivider({
      size: 'md',
      style: 'dark',
      width: '100%'
    });
    darkWrapper.appendChild(darkDivider);
    container.appendChild(darkWrapper);
    
    return container;
  },
};

