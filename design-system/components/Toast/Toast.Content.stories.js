/**
 * Toast Content Variants Stories
 * 
 * Shows all content variations for toast notifications:
 * - All toasts include a title/header above the message text (required)
 * - Dismissable: Includes a close button for manual dismissal
 * - Non-dismissable: Auto-dismiss only (no close button)
 */

import { createStaticToast } from './index.js';

export default {
  title: 'Components/Toast/Content',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Content variants show different combinations of dismissable options. All toasts include a title header with icon and timestamp. They can be dismissable with a close button or non-dismissable.',
      },
    },
    layout: 'padded',
  },
};

/**
 * All Content Variants
 * Shows all content variants together for comparison
 */
export const AllContent = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    // Dismissable
    const dismissable = createStaticToast({
      title: 'Toast Title',
      text: 'This is a toast with a title header and close button',
      style: 'info',
      dismissable: true,
    });
    container.appendChild(dismissable);
    
    // Non-dismissable
    const nonDismissable = createStaticToast({
      title: 'Toast Title',
      text: 'This is a toast with a title header but no close button',
      style: 'info',
      dismissable: false,
    });
    container.appendChild(nonDismissable);
    
    return container;
  },
};

/**
 * With Title
 * Shows toast with title header (includes icon, title, timestamp, and close button)
 */
export const WithTitle = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const toast = createStaticToast({
      text: 'This is a toast with a title header',
      style: 'info',
      title: 'Toast Title',
      dismissable: true,
    });
    
    container.appendChild(toast);
    return container;
  },
};

/**
 * With Short Title
 * Shows toast with a shorter, minimal title
 */
export const WithShortTitle = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const toast = createStaticToast({
      title: 'Info',
      text: 'This is a toast with a shorter title',
      style: 'info',
      dismissable: true,
    });
    
    container.appendChild(toast);
    return container;
  },
};

/**
 * Dismissable
 * Shows toast with close button for manual dismissal
 */
export const Dismissable = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const toast = createStaticToast({
      title: 'Dismissable Toast',
      text: 'This toast can be manually dismissed with the close button',
      style: 'info',
      dismissable: true,
    });
    
    container.appendChild(toast);
    return container;
  },
};

/**
 * Non-dismissable
 * Shows toast without close button (auto-dismiss only)
 */
export const NonDismissable = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const toast = createStaticToast({
      title: 'Non-dismissable Toast',
      text: 'This toast cannot be manually dismissed',
      style: 'info',
      dismissable: false,
    });
    
    container.appendChild(toast);
    return container;
  },
};

