/**
 * Status Indicator Status Types Stories
 * Status type variants organized under "Status Types" subcategory
 */

import { PlusSmartComponents } from '@/js/components/index.js';

export default {
  title: 'Atoms/StatusIndicator/Status Types',
  tags: ['autodocs'],
};

/**
 * Assigned Status
 */
export const Assigned = {
  render: () => {
    return PlusSmartComponents.createStatusIcon('assigned');
  },
};

/**
 * Started Status
 */
export const Started = {
  render: () => {
    return PlusSmartComponents.createStatusIcon('started');
  },
};

/**
 * Not Started Status
 */
export const NotStarted = {
  render: () => {
    return PlusSmartComponents.createStatusIcon('not started');
  },
};

/**
 * Complete Status
 */
export const Complete = {
  render: () => {
    return PlusSmartComponents.createStatusIcon('complete');
  },
};

