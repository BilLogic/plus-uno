/**
 * Progress Sizes Stories
 * Size variants: small, medium, large
 */

import { createProgress } from "../index.js";

export default {
  title: 'Components/Progress/Sizes',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Progress bar size variants: small (4px height), medium (6px height, default), and large (8px height).',
      },
    },
  },
};

/**
 * Small
 * 4px height progress bar
 */
export const Small = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    const progress = createProgress({ value: 50, size: 'small', style: 'primary' });
    container.appendChild(progress);
    return container;
  },
};

/**
 * Default
 * 6px height progress bar (medium)
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    const progress = createProgress({ value: 50, size: 'medium', style: 'primary' });
    container.appendChild(progress);
    return container;
  },
};

/**
 * Large
 * 8px height progress bar
 */
export const Large = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    const progress = createProgress({ value: 50, size: 'large', style: 'primary' });
    container.appendChild(progress);
    return container;
  },
};

/**
 * All Sizes
 * Shows all size variants together
 */
export const AllSizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    ['small', 'medium', 'large'].forEach((size) => {
      const progress = createProgress({ value: 50, size: size, style: 'primary' });
      container.appendChild(progress);
    });
    
    return container;
  },
};


