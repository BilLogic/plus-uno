/**
 * Pagination Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Pagination components are **Element** components that provide navigation through paginated content.
 * They help users navigate through multiple pages of results, data tables, or content lists.
 * 
 * ### When to Use
 * - **Data tables**: Navigate through multiple pages of table data
 * - **Search results**: Browse through paginated search results
 * - **Content lists**: Navigate through paginated lists of items
 * - **Data grids**: Move through pages of grid-based content
 * - **Any paginated content**: When content is split across multiple pages
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-*` tokens)
 * - **Component Dependencies**:
 *   - Built on Bootstrap 4.6.2 pagination structure
 *   - Uses `element-*` tokens for styling (padding, gap, radius, border)
 *   - Uses Material Design 3 color tokens
 * - **Token Usage**: 
 *   - Padding: `--size-element-pad-x-md`, `--size-element-pad-y-md`
 *   - Border: `--size-element-border` (1px)
 *   - Radius: Varies by size (4px/6px/8px for container, 100px/999px for ends)
 *   - Colors: `--color-secondary-text`, `--color-secondary`, `--color-outline-variant`, `--color-secondary-state-08`
 * 
 * ### Type Variants
 * - **Icon**: Uses Font Awesome caret-left/caret-right icons
 * - **Text**: Uses "Previous"/"Next" text labels
 * 
 * ### Size Variants
 * - **Small**: Compact size for dense interfaces
 * - **Default**: Standard size for most use cases
 * - **Large**: Prominent size for important navigation
 * 
 * ### Features
 * - Previous/Next navigation buttons (icon or text)
 * - Ellipsis for large page ranges
 * - Active page highlighting
 * - Disabled state for boundary pages
 * - Keyboard navigation support
 * - ARIA accessibility attributes
 * 
 * ### Best Practices
 * - Use when content exceeds a reasonable single-page limit
 * - Show page numbers when total pages are manageable (< 20)
 * - Use ellipsis for large page ranges
 * - Always show current page clearly
 * - Provide Previous/Next buttons for easy navigation
 * - Ensure sufficient spacing between page items
 * - Test with various page counts (1, 5, 10, 50+ pages)
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=53-19822
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Pagination',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Pagination component for navigating through paginated content. Built on Bootstrap 4.6.2 with PLUS design token customizations. Supports icon and text types, multiple sizes, and various configurations.',
      },
    },
  },
};


/**
 * Overview
 * Shows all pagination variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    // Content Section
    const contentSection = document.createElement('div');
    contentSection.style.display = 'flex';
    contentSection.style.flexDirection = 'column';
    contentSection.style.gap = 'var(--size-card-gap-md)';
    
    const contentHeading = document.createElement('div');
    contentHeading.className = 'h5';
    contentHeading.textContent = 'Content';
    contentHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    contentSection.appendChild(contentHeading);
    
    const iconPagination = PlusInterface.createPagination({
      currentPage: 5,
      totalPages: 10,
      type: 'icon',
      size: 'default',
      onPageChange: () => {},
    });
    contentSection.appendChild(iconPagination);
    container.appendChild(contentSection);
    
    // Sizes Section
    const sizesSection = document.createElement('div');
    sizesSection.style.display = 'flex';
    sizesSection.style.flexDirection = 'column';
    sizesSection.style.gap = 'var(--size-card-gap-md)';
    
    const sizesHeading = document.createElement('div');
    sizesHeading.className = 'h5';
    sizesHeading.textContent = 'Sizes';
    sizesHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    sizesSection.appendChild(sizesHeading);
    
    const smallPagination = PlusInterface.createPagination({
      currentPage: 3,
      totalPages: 5,
      type: 'icon',
      size: 'small',
      onPageChange: () => {},
    });
    sizesSection.appendChild(smallPagination);
    container.appendChild(sizesSection);
    
    // States Section
    const statesSection = document.createElement('div');
    statesSection.style.display = 'flex';
    statesSection.style.flexDirection = 'column';
    statesSection.style.gap = 'var(--size-card-gap-md)';
    
    const statesHeading = document.createElement('div');
    statesHeading.className = 'h5';
    statesHeading.textContent = 'States';
    statesHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    statesSection.appendChild(statesHeading);
    
    const firstPagePagination = PlusInterface.createPagination({
      currentPage: 1,
      totalPages: 10,
      type: 'icon',
      size: 'default',
      onPageChange: () => {},
    });
    statesSection.appendChild(firstPagePagination);
    container.appendChild(statesSection);
    
    return container;
  },
};

export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: args.currentPage || 5,
      totalPages: args.totalPages || 10,
      type: args.type || 'icon',
      size: args.size || 'default',
      maxVisible: args.maxVisible || 5,
      prevText: args.prevText || 'Previous',
      nextText: args.nextText || 'Next',
      onPageChange: (page) => {
        console.log('Page changed to:', page);
      }
    });
    
    container.appendChild(pagination);
    return container;
  },
  argTypes: {
    currentPage: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
      description: 'Current active page (1-indexed)',
    },
    totalPages: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
      description: 'Total number of pages',
    },
    type: {
      control: 'select',
      options: ['icon', 'text'],
      description: 'Pagination type',
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Pagination size',
    },
    maxVisible: {
      control: { type: 'number', min: 3, max: 9, step: 1 },
      description: 'Maximum number of visible page numbers',
    },
    prevText: {
      control: 'text',
      description: 'Previous button text (for text type)',
    },
    nextText: {
      control: 'text',
      description: 'Next button text (for text type)',
    },
  },
  args: {
    currentPage: 5,
    totalPages: 10,
    type: 'icon',
    size: 'default',
    maxVisible: 5,
    prevText: 'Previous',
    nextText: 'Next',
  },
};
