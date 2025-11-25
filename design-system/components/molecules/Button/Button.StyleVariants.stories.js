/**
 * Button Visual Style Variants Stories
 * Visual style variants organized under "Visual Style Variants" subcategory
 * Includes color/style variations (primary, secondary, etc.) with fill variants (filled, outline, tonal, text)
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Button/Visual Style Variants',
  tags: ['autodocs'],
};

/**
 * Primary Button
 * Shows primary style with default size and filled variant for style comparison
 */
export const Primary = {
  render: () => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton({
      btnText: 'Primary',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
    });
    container.appendChild(button);
    return container;
  },
};

/**
 * Secondary Button
 * Shows secondary style with default size and filled variant for style comparison
 */
export const Secondary = {
  render: () => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton({
      btnText: 'Secondary',
      btnStyle: 'secondary',
      btnFill: 'filled',
      btnSize: 'default',
    });
    container.appendChild(button);
    return container;
  },
};

/**
 * Tertiary Button
 * Shows tertiary style with default size and filled variant for style comparison
 */
export const Tertiary = {
  render: () => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton({
      btnText: 'Tertiary',
      btnStyle: 'tertiary',
      btnFill: 'filled',
      btnSize: 'default',
    });
    container.appendChild(button);
    return container;
  },
};

/**
 * Success Button
 * Shows success style with default size and filled variant for style comparison
 */
export const Success = {
  render: () => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton({
      btnText: 'Success',
      btnStyle: 'success',
      btnFill: 'filled',
      btnSize: 'default',
    });
    container.appendChild(button);
    return container;
  },
};

/**
 * Info Button
 * Shows info style with default size and filled variant for style comparison
 */
export const Info = {
  render: () => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton({
      btnText: 'Info',
      btnStyle: 'info',
      btnFill: 'filled',
      btnSize: 'default',
    });
    container.appendChild(button);
    return container;
  },
};

/**
 * Warning Button
 * Shows warning style with default size and filled variant for style comparison
 */
export const Warning = {
  render: () => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton({
      btnText: 'Warning',
      btnStyle: 'warning',
      btnFill: 'filled',
      btnSize: 'default',
    });
    container.appendChild(button);
    return container;
  },
};

/**
 * Error Button
 * Shows error style with default size and filled variant for style comparison
 */
export const Error = {
  render: () => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton({
      btnText: 'Error',
      btnStyle: 'error',
      btnFill: 'filled',
      btnSize: 'default',
    });
    container.appendChild(button);
    return container;
  },
};

