/**
 * Toast Color Variants Stories
 * 
 * Shows all color/style variants for toast notifications.
 * Color variants determine the visual style and semantic meaning of the toast.
 */

import { createStaticToast } from './index.js';

export default {
  title: 'Components/Toast/Colors',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Color variants are color tokens applied to toasts. Shows all available color styles: default, success, danger, warning, and info.',
      },
    },
    layout: 'padded',
  },
};

/**
 * All Colors
 * Shows all available color styles together for comparison
 */
export const AllColors = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    const styles = ['default', 'success', 'danger', 'warning', 'info'];
    
    styles.forEach((style) => {
      const toast = createStaticToast({
        title: `${style.charAt(0).toUpperCase() + style.slice(1)} Toast`,
        text: `${style.charAt(0).toUpperCase() + style.slice(1)} toast message`,
        style: style,
        dismissable: true,
      });
      container.appendChild(toast);
    });
    
    return container;
  },
};

/**
 * Default Style
 * Shows default toast (default brand color for general information)
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const toast = createStaticToast({
      title: 'Default Toast',
      text: 'Default toast message',
      style: 'default',
      dismissable: true,
    });
    
    container.appendChild(toast);
    return container;
  },
};

/**
 * Success Style
 * Shows success toast (green for positive confirmations or successful actions)
 */
export const Success = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const toast = createStaticToast({
      title: 'Success Toast',
      text: 'Success toast message',
      style: 'success',
      dismissable: true,
    });
    
    container.appendChild(toast);
    return container;
  },
};

/**
 * Danger Style
 * Shows danger toast (red for errors or failed actions)
 */
export const Danger = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const toast = createStaticToast({
      title: 'Danger Toast',
      text: 'Danger toast message',
      style: 'danger',
      dismissable: true,
    });
    
    container.appendChild(toast);
    return container;
  },
};

/**
 * Warning Style
 * Shows warning toast (yellow/orange for cautionary information)
 */
export const Warning = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const toast = createStaticToast({
      title: 'Warning Toast',
      text: 'Warning toast message',
      style: 'warning',
      dismissable: true,
    });
    
    container.appendChild(toast);
    return container;
  },
};

/**
 * Info Style
 * Shows info toast (blue for informational messages)
 */
export const Info = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const toast = createStaticToast({
      title: 'Info Toast',
      text: 'Info toast message',
      style: 'info',
      dismissable: true,
    });
    
    container.appendChild(toast);
    return container;
  },
};

