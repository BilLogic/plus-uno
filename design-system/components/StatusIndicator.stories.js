/**
 * Status Indicator Atom Stories
 * Status icon only (no text container)
 */

import { PlusSmartComponents } from './index.js';

export default {
  title: 'Components/StatusIndicator',
  tags: ['autodocs'],
};

/**
 * All Variants
 * Shows all status indicator variants
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-lg)';
    container.style.alignItems = 'center';
    
    const statuses = ['assigned', 'started', 'not started', 'complete'];
    
    statuses.forEach((status) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      
      const indicator = PlusSmartComponents.createStatusIcon(status);
      wrapper.appendChild(indicator);
      
      const label = document.createElement('div');
      label.className = 'body3-txt';
      label.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      wrapper.appendChild(label);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

/**
 * Interactive Status Indicator
 * Interactive playground for testing status indicator variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.alignItems = 'center';
    
    const indicator = PlusSmartComponents.createStatusIcon(args.status);
    container.appendChild(indicator);
    
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = `Status: ${args.status.charAt(0).toUpperCase() + args.status.slice(1)}`;
    container.appendChild(label);
    
    return container;
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['assigned', 'started', 'not started', 'complete'],
      description: 'Status type',
    },
  },
  args: {
    status: 'complete',
  },
};
