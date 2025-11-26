/**
 * Alert Content Variants Stories
 * Content-based variants organized under "Content Variants" subcategory
 */

import { PlusInterface } from '../../index.js';

export default {
  title: 'Molecules/Alert/Content Variants',
  tags: ['autodocs'],
};

/**
 * Alert with Title
 */
export const WithTitle = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const alert = PlusInterface.createAlert({
      style: 'info',
      title: 'Information',
      text: 'This alert has a title and body text.',
      dismissable: true,
    });
    container.appendChild(alert);
    
    return container;
  },
};

/**
 * Alert without Title
 */
export const WithoutTitle = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const alert = PlusInterface.createAlert({
      style: 'info',
      text: 'This alert does not have a title.',
      dismissable: true,
    });
    container.appendChild(alert);
    
    return container;
  },
};

/**
 * Dismissable Alert
 */
export const Dismissable = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const alert = PlusInterface.createAlert({
      style: 'warning',
      title: 'Dismissable Alert',
      text: 'You can dismiss this alert by clicking the X button.',
      dismissable: true,
    });
    container.appendChild(alert);
    
    return container;
  },
};

/**
 * Non-Dismissable Alert
 */
export const NonDismissable = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const alert = PlusInterface.createAlert({
      style: 'danger',
      title: 'Non-Dismissable Alert',
      text: 'This alert cannot be dismissed.',
      dismissable: false,
    });
    container.appendChild(alert);
    
    return container;
  },
};

