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
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=53-19822
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Pagination',
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
 * Default Pagination (Icon Type, Medium Size)
 * Standard pagination with icon Previous/Next buttons
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 5,
      totalPages: 10,
      type: 'icon',
      size: 'default',
      onPageChange: (page) => {
        console.log('Page changed to:', page);
      }
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * Text Type Pagination
 * Pagination with text Previous/Next buttons
 */
export const TextType = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 5,
      totalPages: 10,
      type: 'text',
      size: 'default',
      onPageChange: (page) => console.log('Page:', page)
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * First Page
 * Pagination showing the first page
 */
export const FirstPage = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 1,
      totalPages: 10,
      type: 'icon',
      onPageChange: (page) => console.log('Page:', page)
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * Last Page
 * Pagination showing the last page
 */
export const LastPage = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 10,
      totalPages: 10,
      type: 'icon',
      onPageChange: (page) => console.log('Page:', page)
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * Many Pages with Ellipsis
 * Pagination with many pages showing ellipsis for page ranges
 */
export const ManyPages = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 25,
      totalPages: 50,
      type: 'icon',
      maxVisible: 5,
      onPageChange: (page) => console.log('Page:', page)
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * Size Variants
 * All size variants: small, default, and large
 */
export const SizeVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const sizes = ['small', 'default', 'large'];
    
    sizes.forEach(size => {
      const sizeContainer = document.createElement('div');
      sizeContainer.style.display = 'flex';
      sizeContainer.style.flexDirection = 'column';
      sizeContainer.style.gap = 'var(--size-element-gap-sm)';
      
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.textContent = `${size.charAt(0).toUpperCase() + size.slice(1)} Size (Icon Type):`;
      label.style.marginBottom = 'var(--size-element-gap-xs)';
      sizeContainer.appendChild(label);
      
      const pagination = PlusInterface.createPagination({
        currentPage: 5,
        totalPages: 10,
        type: 'icon',
        size: size,
        onPageChange: (page) => console.log(`${size} pagination - Page:`, page)
      });
      
      sizeContainer.appendChild(pagination);
      container.appendChild(sizeContainer);
    });
    
    return container;
  },
};

/**
 * Type Variants
 * Icon and text type variants
 */
export const TypeVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const types = [
      { type: 'icon', label: 'Icon Type' },
      { type: 'text', label: 'Text Type' }
    ];
    
    types.forEach(({ type, label }) => {
      const typeContainer = document.createElement('div');
      typeContainer.style.display = 'flex';
      typeContainer.style.flexDirection = 'column';
      typeContainer.style.gap = 'var(--size-element-gap-sm)';
      
      const typeLabel = document.createElement('div');
      typeLabel.className = 'body2-txt';
      typeLabel.textContent = `${label}:`;
      typeLabel.style.marginBottom = 'var(--size-element-gap-xs)';
      typeContainer.appendChild(typeLabel);
      
      const pagination = PlusInterface.createPagination({
        currentPage: 5,
        totalPages: 10,
        type: type,
        size: 'default',
        onPageChange: (page) => console.log(`${type} pagination - Page:`, page)
      });
      
      typeContainer.appendChild(pagination);
      container.appendChild(typeContainer);
    });
    
    return container;
  },
};

/**
 * All Variants
 * Comprehensive showcase of all pagination variants
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const variants = [
      { type: 'icon', size: 'small', label: 'Small Icon Type' },
      { type: 'icon', size: 'default', label: 'Default Icon Type' },
      { type: 'icon', size: 'large', label: 'Large Icon Type' },
      { type: 'text', size: 'small', label: 'Small Text Type' },
      { type: 'text', size: 'default', label: 'Default Text Type' },
      { type: 'text', size: 'large', label: 'Large Text Type' }
    ];
    
    variants.forEach(({ type, size, label }) => {
      const variantContainer = document.createElement('div');
      variantContainer.style.display = 'flex';
      variantContainer.style.flexDirection = 'column';
      variantContainer.style.gap = 'var(--size-element-gap-sm)';
      
      const variantLabel = document.createElement('div');
      variantLabel.className = 'h6';
      variantLabel.textContent = `${label}:`;
      variantContainer.appendChild(variantLabel);
      
      const pagination = PlusInterface.createPagination({
        currentPage: 5,
        totalPages: 10,
        type: type,
        size: size,
        onPageChange: () => {}
      });
      
      variantContainer.appendChild(pagination);
      container.appendChild(variantContainer);
    });
    
    return container;
  },
};
