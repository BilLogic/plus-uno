/**
 * Status Tag Molecule Stories
 * Content status tag (icon + text combination)
 * 
 * ## Usage and Implementation
 * 
 * Status Tags are **Element** components used to display content status information.
 * They combine an icon with text to show the current state of content items.
 * 
 * ### When to Use
 * - **Content status**: Show the status of content items (assigned, started, not started, complete)
 * - **SMART content**: Display SMART-related content status
 * - **Status indicators**: Provide visual and textual status information
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens)
 * - **Token Usage**: Uses SMART color tokens and status-specific styling
 * 
 * ### Status Types
 * - **Assigned**: Content has been assigned but not started
 * - **Started**: Content work has begun
 * - **Not Started**: Content has not been started yet
 * - **Complete**: Content work has been completed
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusSmartComponents } from './index.js';

export default {
  title: 'Components/StatusTag',
  tags: ['autodocs'],
};

/**
 * All Variants
 * Shows all status tag variants
 */
export const AllVariants = {
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
 * Interactive playground for testing status tag variations
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
