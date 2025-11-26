/**
 * Button Size Variants Stories
 * Size variants organized under "Size Variants" subcategory
 */

import { PlusInterface } from '../../index.js';

export default {
  title: 'Molecules/Button/Size Variants',
  tags: ['autodocs'],
};

/**
 * Small Button
 */
export const Small = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const fills = ['filled', 'outline', 'tonal', 'text'];
    
    fills.forEach((fill) => {
      const button = PlusInterface.createButton({
        btnText: `Small ${fill}`,
        btnStyle: 'primary',
        btnFill: fill,
        btnSize: 'small',
      });
      container.appendChild(button);
    });
    
    return container;
  },
};

/**
 * Default Button
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const fills = ['filled', 'outline', 'tonal', 'text'];
    
    fills.forEach((fill) => {
      const button = PlusInterface.createButton({
        btnText: `Default ${fill}`,
        btnStyle: 'primary',
        btnFill: fill,
        btnSize: 'default',
      });
      container.appendChild(button);
    });
    
    return container;
  },
};

/**
 * Large Button
 */
export const Large = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const fills = ['filled', 'outline', 'tonal', 'text'];
    
    fills.forEach((fill) => {
      const button = PlusInterface.createButton({
        btnText: `Large ${fill}`,
        btnStyle: 'primary',
        btnFill: fill,
        btnSize: 'large',
      });
      container.appendChild(button);
    });
    
    return container;
  },
};

