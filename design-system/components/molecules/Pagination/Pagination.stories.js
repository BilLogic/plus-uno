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
 *   - Uses Material Design 3 color tokens (`--color-primary`, `--color-on-primary`, etc.)
 * - **Token Usage**: 
 *   - Padding: `--size-element-pad-x-md`, `--size-element-pad-y-md`
 *   - Gap: `--size-element-gap-sm` (between page items)
 *   - Border: `--size-element-stroke-md` (1.5px)
 *   - Radius: `--size-element-radius-sm` (4px)
 *   - Colors: `--color-primary` for active, `--color-outline-variant` for borders
 * 
 * ### Size Variants
 * - **Small**: Compact size for dense interfaces
 * - **Default**: Standard size for most use cases
 * - **Large**: Prominent size for important navigation
 * 
 * ### Features
 * - Previous/Next navigation buttons
 * - First/Last page buttons (optional)
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
 * - Consider showing First/Last for very large datasets
 * - Ensure sufficient spacing between page items
 * - Test with various page counts (1, 5, 10, 50+ pages)
 * 
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=53-19822
 * Documentation: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=3548-38197
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Pagination',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Pagination component for navigating through paginated content. Built on Bootstrap 4.6.2 with PLUS design token customizations. Supports multiple sizes and configurations.',
      },
    },
  },
};

/**
 * Default Pagination
 * Standard pagination with Previous/Next buttons and page numbers
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 3,
      totalPages: 10,
      onPageChange: (page) => {
        console.log('Page changed to:', page);
      }
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
      maxVisible: 5,
      onPageChange: (page) => console.log('Page:', page)
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * With First/Last Buttons
 * Pagination including First and Last page buttons
 */
export const WithFirstLast = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 5,
      totalPages: 20,
      showFirstLast: true,
      onPageChange: (page) => console.log('Page:', page)
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * Single Page
 * Pagination with only one page (edge case)
 */
export const SinglePage = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 1,
      totalPages: 1,
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
      label.textContent = `${size.charAt(0).toUpperCase() + size.slice(1)} Size:`;
      label.style.marginBottom = 'var(--size-element-gap-xs)';
      sizeContainer.appendChild(label);
      
      const pagination = PlusInterface.createPagination({
        currentPage: 3,
        totalPages: 10,
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
 * Interactive Pagination
 * Interactive playground for testing pagination variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    let currentPage = args.currentPage || 1;
    
    const updatePagination = () => {
      // Clear container
      container.innerHTML = '';
      
      const pagination = PlusInterface.createPagination({
        currentPage: currentPage,
        totalPages: args.totalPages || 10,
        showFirstLast: args.showFirstLast !== false,
        showPrevNext: args.showPrevNext !== false,
        maxVisible: args.maxVisible || 5,
        size: args.size || 'default',
        onPageChange: (page) => {
          currentPage = page;
          console.log('Page changed to:', page);
          updatePagination();
        }
      });
      
      container.appendChild(pagination);
    };
    
    updatePagination();
    return container;
  },
  argTypes: {
    currentPage: {
      control: { type: 'number', min: 1, max: 50 },
      description: 'Current active page',
    },
    totalPages: {
      control: { type: 'number', min: 1, max: 100 },
      description: 'Total number of pages',
    },
    showFirstLast: {
      control: 'boolean',
      description: 'Show First/Last buttons',
    },
    showPrevNext: {
      control: 'boolean',
      description: 'Show Previous/Next buttons',
    },
    maxVisible: {
      control: { type: 'number', min: 3, max: 10 },
      description: 'Maximum visible page numbers',
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Pagination size',
    },
  },
  args: {
    currentPage: 3,
    totalPages: 10,
    showFirstLast: true,
    showPrevNext: true,
    maxVisible: 5,
    size: 'default',
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
    
    // First page
    const firstSection = document.createElement('div');
    firstSection.style.display = 'flex';
    firstSection.style.flexDirection = 'column';
    firstSection.style.gap = 'var(--size-element-gap-sm)';
    
    const firstLabel = document.createElement('div');
    firstLabel.className = 'h6';
    firstLabel.textContent = 'First Page:';
    firstSection.appendChild(firstLabel);
    
    const firstPagination = Universal.createPagination({
      currentPage: 1,
      totalPages: 10,
      onPageChange: () => {}
    });
    firstSection.appendChild(firstPagination);
    container.appendChild(firstSection);
    
    // Middle page
    const middleSection = document.createElement('div');
    middleSection.style.display = 'flex';
    middleSection.style.flexDirection = 'column';
    middleSection.style.gap = 'var(--size-element-gap-sm)';
    
    const middleLabel = document.createElement('div');
    middleLabel.className = 'h6';
    middleLabel.textContent = 'Middle Page:';
    middleSection.appendChild(middleLabel);
    
    const middlePagination = Universal.createPagination({
      currentPage: 5,
      totalPages: 10,
      onPageChange: () => {}
    });
    middleSection.appendChild(middlePagination);
    container.appendChild(middleSection);
    
    // Last page
    const lastSection = document.createElement('div');
    lastSection.style.display = 'flex';
    lastSection.style.flexDirection = 'column';
    lastSection.style.gap = 'var(--size-element-gap-sm)';
    
    const lastLabel = document.createElement('div');
    lastLabel.className = 'h6';
    lastLabel.textContent = 'Last Page:';
    lastSection.appendChild(lastLabel);
    
    const lastPagination = Universal.createPagination({
      currentPage: 10,
      totalPages: 10,
      onPageChange: () => {}
    });
    lastSection.appendChild(lastPagination);
    container.appendChild(lastSection);
    
    // Many pages with ellipsis
    const manySection = document.createElement('div');
    manySection.style.display = 'flex';
    manySection.style.flexDirection = 'column';
    manySection.style.gap = 'var(--size-element-gap-sm)';
    
    const manyLabel = document.createElement('div');
    manyLabel.className = 'h6';
    manyLabel.textContent = 'Many Pages (with Ellipsis):';
    manySection.appendChild(manyLabel);
    
    const manyPagination = Universal.createPagination({
      currentPage: 25,
      totalPages: 50,
      maxVisible: 5,
      onPageChange: () => {}
    });
    manySection.appendChild(manyPagination);
    container.appendChild(manySection);
    
    // With first/last
    const firstLastSection = document.createElement('div');
    firstLastSection.style.display = 'flex';
    firstLastSection.style.flexDirection = 'column';
    firstLastSection.style.gap = 'var(--size-element-gap-sm)';
    
    const firstLastLabel = document.createElement('div');
    firstLastLabel.className = 'h6';
    firstLastLabel.textContent = 'With First/Last Buttons:';
    firstLastSection.appendChild(firstLastLabel);
    
    const firstLastPagination = Universal.createPagination({
      currentPage: 5,
      totalPages: 20,
      showFirstLast: true,
      onPageChange: () => {}
    });
    firstLastSection.appendChild(firstLastPagination);
    container.appendChild(firstLastSection);
    
    return container;
  },
};

