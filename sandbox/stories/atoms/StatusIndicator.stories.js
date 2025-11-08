/**
 * Status Indicator Atom Stories
 * Status icon only (no text container)
 */

import { PlusSmartComponents } from '@/js/components/index.js';

export default {
  title: 'Atoms/StatusIndicator',
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['assigned', 'started', 'not started', 'complete'],
      description: 'Status type',
    },
  },
};

/**
 * Status Indicator - Assigned
 */
export const Assigned = {
  render: () => {
    return PlusSmartComponents.createStatusIcon('assigned');
  },
};

/**
 * Status Indicator - Started
 */
export const Started = {
  render: () => {
    return PlusSmartComponents.createStatusIcon('started');
  },
};

/**
 * Status Indicator - Not Started
 */
export const NotStarted = {
  render: () => {
    return PlusSmartComponents.createStatusIcon('not started');
  },
};

/**
 * Status Indicator - Complete
 */
export const Complete = {
  render: () => {
    return PlusSmartComponents.createStatusIcon('complete');
  },
};

/**
 * All Status Indicators
 */
export const AllStatuses = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '2rem';
    container.style.alignItems = 'center';
    
    const statuses = ['assigned', 'started', 'not started', 'complete'];
    
    statuses.forEach((status) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '0.5rem';
      
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
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '1rem';
    container.style.alignItems = 'center';
    
    const indicator = PlusSmartComponents.createStatusIcon(args.status);
    container.appendChild(indicator);
    
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = `Status: ${args.status.charAt(0).toUpperCase() + args.status.slice(1)}`;
    container.appendChild(label);
    
    return container;
  },
  args: {
    status: 'complete',
  },
};

