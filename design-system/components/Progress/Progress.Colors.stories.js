/**
 * Progress Colors Stories
 * Color/style variants: primary, secondary, tertiary, success, danger, warning, info
 */

import { createProgress } from "../index.js";

export default {
  title: 'Components/Progress/Colors',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Progress bar color variants: primary, secondary, tertiary, success, danger, warning, and info. These styles apply different colors to the progress bar fill.',
      },
    },
  },
};

/**
 * Primary
 * Default blue progress bar
 */
export const Primary = {
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
 * Secondary
 * Secondary color progress bar
 */
export const Secondary = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    const progress = createProgress({ value: 50, size: 'medium', style: 'secondary' });
    container.appendChild(progress);
    return container;
  },
};

/**
 * Tertiary
 * Tertiary color progress bar
 */
export const Tertiary = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    const progress = createProgress({ value: 50, size: 'medium', style: 'tertiary' });
    container.appendChild(progress);
    return container;
  },
};

/**
 * Success
 * Green progress bar for successful operations
 */
export const Success = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    const progress = createProgress({ value: 50, size: 'medium', style: 'success' });
    container.appendChild(progress);
    return container;
  },
};

/**
 * Danger
 * Red progress bar for errors or warnings
 */
export const Danger = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    const progress = createProgress({ value: 50, size: 'medium', style: 'danger' });
    container.appendChild(progress);
    return container;
  },
};

/**
 * Warning
 * Yellow/orange progress bar for warnings
 */
export const Warning = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    const progress = createProgress({ value: 50, size: 'medium', style: 'warning' });
    container.appendChild(progress);
    return container;
  },
};

/**
 * Info
 * Info color progress bar
 */
export const Info = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    const progress = createProgress({ value: 50, size: 'medium', style: 'info' });
    container.appendChild(progress);
    return container;
  },
};

/**
 * All Colors
 * Shows all color variants together
 */
export const AllColors = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.width = '100%';
    container.style.maxWidth = '400px';
    
    ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning', 'info'].forEach((style) => {
      const progress = createProgress({ value: 60, size: 'medium', style: style });
      container.appendChild(progress);
    });
    
    return container;
  },
};


