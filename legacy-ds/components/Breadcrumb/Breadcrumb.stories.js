/**
 * Breadcrumb Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Breadcrumbs are **Element** components used for navigation hierarchy and wayfinding.
 * They show users their current location within a site structure and provide quick navigation to parent pages.
 * 
 * ### When to Use
 * - **Deep navigation**: When users navigate 3+ levels deep in a site hierarchy
 * - **Wayfinding**: Help users understand their location in complex site structures
 * - **Quick navigation**: Provide shortcuts to parent pages or sections
 * - **E-commerce**: Show product category paths
 * - **Documentation**: Navigate documentation sections
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens)
 * - **Token Usage**: 
 *   - Gap: `--size-element-gap-md` (between breadcrumb items)
 *   - Typography: Uses body typography scales (typically body2)
 *   - Colors: `--color-on-surface-variant` for links, `--color-on-surface` for current page
 * 
 * ### Content Variants
 * - **Single item**: Current page only (no navigation needed)
 * - **Multiple items**: 2-6 items showing navigation path
 * - **With separators**: Visual separators (/, >, etc.) between items
 * 
 * ### Best Practices
 * - Show full path from home to current page
 * - Make all items except the last one clickable links
 * - Use clear, concise labels for each level
 * - Include home/root as the first item
 * - Use appropriate separators (/, >, or custom)
 * - Keep breadcrumbs visible and accessible
 * - Limit to 6-7 items maximum for readability
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Breadcrumb',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Breadcrumb component for navigation hierarchy and wayfinding. Shows current location and provides navigation to parent pages. Uses element-level tokens for spacing.',
      },
    },
  },
};

/**
 * Overview
 * Shows all breadcrumb variants: different item counts
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const itemCounts = [1, 2, 3, 4, 5, 6];
    
    itemCounts.forEach((count) => {
      const items = [];
      // Add link items (all but last)
      for (let i = 1; i < count; i++) {
        items.push({ text: `Page ${i}`, href: '#' });
      }
      // Add current page (last item, no link)
      items.push({ text: `Page ${count}` });
      
      const breadcrumb = PlusInterface.createBreadcrumb({
        items: items
      });
      container.appendChild(breadcrumb);
    });
    
    return container;
  },
};

/**
 * Interactive Breadcrumb
 * Interactive playground for testing breadcrumb variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const breadcrumb = PlusInterface.createBreadcrumb({
      items: args.items || [
        { text: 'Home', href: '#', onClick: () => console.log('Home clicked') },
        { text: 'Category', href: '#', onClick: () => console.log('Category clicked') },
        { text: 'Current Page' }
      ],
      separator: args.separator || '/'
    });
    container.appendChild(breadcrumb);
    return container;
  },
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of breadcrumb items',
    },
    separator: {
      control: 'text',
      description: 'Separator character',
    },
  },
  args: {
    items: [
      { text: 'Home', href: '#' },
      { text: 'Category', href: '#' },
      { text: 'Current Page' }
    ],
    separator: '/',
  },
};
