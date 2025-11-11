/**
 * Status Tag Molecule Stories
 * Content status tag (icon + text combination)
 */

import { PlusSmartComponents } from '@/js/components/index.js';

export default {
  title: 'Molecules/StatusTag',
  tags: ['autodocs'],
};

/**
 * Status Tag - Assigned
 */
export const Assigned = {
  render: () => {
    const container = document.createElement('div');
    const statusTag = PlusSmartComponents.createContentStatusTag('assigned');
    container.appendChild(statusTag);
    return container;
  },
};

/**
 * Status Tag - Started
 */
export const Started = {
  render: () => {
    const container = document.createElement('div');
    const statusTag = PlusSmartComponents.createContentStatusTag('started');
    container.appendChild(statusTag);
    return container;
  },
};

/**
 * Status Tag - Not Started
 */
export const NotStarted = {
  render: () => {
    const container = document.createElement('div');
    const statusTag = PlusSmartComponents.createContentStatusTag('not started');
    container.appendChild(statusTag);
    return container;
  },
};

/**
 * Status Tag - Complete
 */
export const Complete = {
  render: () => {
    const container = document.createElement('div');
    const statusTag = PlusSmartComponents.createContentStatusTag('complete');
    container.appendChild(statusTag);
    return container;
  },
};

/**
 * All Status Tags
 */
export const AllStatuses = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.alignItems = 'center';
    
    const statuses = ['assigned', 'started', 'not started', 'complete'];
    
    statuses.forEach((status) => {
      const statusTag = PlusSmartComponents.createContentStatusTag(status);
      container.appendChild(statusTag);
    });
    
    return container;
  },
};

/**
 * Interactive Status Tag
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const statusTag = PlusSmartComponents.createContentStatusTag(args.status);
    container.appendChild(statusTag);
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

