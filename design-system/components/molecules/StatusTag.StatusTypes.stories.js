/**
 * Status Tag Status Types Stories
 * Status type variants organized under "Status Types" subcategory
 */

import { PlusSmartComponents } from '@/js/components/index.js';

export default {
  title: 'Molecules/StatusTag/Status Types',
  tags: ['autodocs'],
};

/**
 * Assigned Status
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
 * Started Status
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
 * Not Started Status
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
 * Complete Status
 */
export const Complete = {
  render: () => {
    const container = document.createElement('div');
    const statusTag = PlusSmartComponents.createContentStatusTag('complete');
    container.appendChild(statusTag);
    return container;
  },
};

