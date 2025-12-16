/**
 * Modal Content Variants Stories
 * Shows different content configurations for modals
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Modal/Content',
  tags: ['autodocs'],
};

/**
 * Default Type with Buttons
 * Standard modal with default type and action buttons
 */
export const DefaultWithButtons = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const modal = PlusInterface.createModal({
    title: 'Modal title',
    body: 'Modal body text goes here.',
    type: 'default',
    showBottomButtons: true,
    primaryButton: {
      text: 'Primary',
      style: 'primary',
      fill: 'filled',
      size: 'default',
      onClick: () => console.log('Primary clicked')
    },
    secondaryButton: {
      text: 'Secondary',
      style: 'secondary',
      fill: 'tonal',
      size: 'default',
      onClick: () => console.log('Secondary clicked')
    }
  });
  
  container.appendChild(modal);
  return container;
};

/**
 * Default Type without Buttons
 * Standard modal with default type and no action buttons
 */
export const DefaultWithoutButtons = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const modal = PlusInterface.createModal({
    title: 'Modal title',
    body: 'Modal body text goes here.',
    type: 'default',
    showBottomButtons: false
  });
  
  container.appendChild(modal);
  return container;
};

/**
 * Scrollable Type with Buttons
 * Modal with scrollable body and action buttons
 */
export const ScrollableWithButtons = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const modal = PlusInterface.createModal({
    title: 'Modal title',
    body: 'Modal body text goes here.',
    type: 'scrollable',
    showBottomButtons: true,
    primaryButton: {
      text: 'Primary',
      style: 'primary',
      fill: 'filled',
      size: 'default',
      onClick: () => console.log('Primary clicked')
    },
    secondaryButton: {
      text: 'Secondary',
      style: 'secondary',
      fill: 'tonal',
      size: 'default',
      onClick: () => console.log('Secondary clicked')
    }
  });
  
  container.appendChild(modal);
  return container;
};

/**
 * Scrollable Type without Buttons
 * Modal with scrollable body and no action buttons
 */
export const ScrollableWithoutButtons = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const modal = PlusInterface.createModal({
    title: 'Modal title',
    body: 'Modal body text goes here.',
    type: 'scrollable',
    showBottomButtons: false
  });
  
  container.appendChild(modal);
  return container;
};

/**
 * With Long Content
 * Modal with scrollable body containing long content
 */
export const WithLongContent = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  const longContent = document.createElement('div');
  longContent.classList.add('body1-txt');
  longContent.innerHTML = `
    <p>This is a longer modal body text that demonstrates how the scrollable modal type handles content that exceeds the available space.</p>
    <p>When content is longer than the modal body height, a scrollbar appears on the right side to allow users to scroll through all the content.</p>
    <p>The scrollbar includes up and down arrow icons to help users navigate through the content.</p>
    <p>This is useful for displaying terms and conditions, detailed information, or any content that requires more space than a standard modal.</p>
  `;
  
  const modal = PlusInterface.createModal({
    title: 'Modal title',
    body: longContent,
    type: 'scrollable',
    showBottomButtons: true,
    primaryButton: {
      text: 'Accept',
      style: 'primary',
      fill: 'filled',
      size: 'default',
      onClick: () => console.log('Accepted')
    },
    secondaryButton: {
      text: 'Cancel',
      style: 'secondary',
      fill: 'tonal',
      size: 'default',
      onClick: () => console.log('Cancelled')
    }
  });
  
  container.appendChild(modal);
  return container;
};

