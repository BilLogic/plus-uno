/**
 * Badge Visual Style Variants Stories
 * Visual style variants organized under "Visual Style Variants" subcategory
 * Includes color/style variations (primary, secondary, success, etc.)
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Badge/Visual Style Variants',
  tags: ['autodocs'],
};

/**
 * Primary Badge
 * Shows primary style with default size (b2) for style comparison
 */
export const Primary = {
  render: () => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge({
      text: 'Primary',
      style: 'primary',
      size: 'b2'
    });
    container.appendChild(badge);
    return container;
  },
};

/**
 * Secondary Badge
 * Shows secondary style with default size (b2) for style comparison
 */
export const Secondary = {
  render: () => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge({
      text: 'Secondary',
      style: 'secondary',
      size: 'b2'
    });
    container.appendChild(badge);
    return container;
  },
};

/**
 * Tertiary Badge
 * Shows tertiary style with default size (b2) for style comparison
 */
export const Tertiary = {
  render: () => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge({
      text: 'Tertiary',
      style: 'tertiary',
      size: 'b2'
    });
    container.appendChild(badge);
    return container;
  },
};

/**
 * Success Badge
 * Shows success style with default size (b2) for style comparison
 */
export const Success = {
  render: () => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge({
      text: 'Success',
      style: 'success',
      size: 'b2'
    });
    container.appendChild(badge);
    return container;
  },
};

/**
 * Danger Badge
 * Shows danger style with default size (b2) for style comparison
 */
export const Danger = {
  render: () => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge({
      text: 'Danger',
      style: 'danger',
      size: 'b2'
    });
    container.appendChild(badge);
    return container;
  },
};

/**
 * Warning Badge
 * Shows warning style with default size (b2) for style comparison
 */
export const Warning = {
  render: () => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge({
      text: 'Warning',
      style: 'warning',
      size: 'b2'
    });
    container.appendChild(badge);
    return container;
  },
};

