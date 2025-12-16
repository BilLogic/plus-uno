/**
 * @fileoverview Page Width Control Utility
 * 
 * Reusable utility for adding page width controls to Storybook Pages stories.
 * Provides a consistent pattern for previewing pages at different PLUS breakpoints.
 * 
 * Usage:
 * ```js
 * import { createPageWidthWrapper, pageWidthArgTypes, pageWidthArgs } from '../utils/pageWidthControl.js';
 * 
 * export const MyPage = {
 *   render: (args) => {
 *     const page = createMyPage();
 *     return createPageWidthWrapper(page, args.pageWidth);
 *   },
 *   argTypes: {
 *     ...pageWidthArgTypes,
 *   },
 *   args: {
 *     ...pageWidthArgs,
 *   },
 * };
 * ```
 */

/**
 * Breakpoint width mapping
 * Maps breakpoint names to their pixel values
 */
const BREAKPOINT_WIDTHS = {
  'auto': 768,  // Auto (Medium 768px)
  'md': 768,    // Medium (768px)
  'lg': 992,    // Large (992px)
  'xl': 1200,   // X-Large (1200px)
  'xxl': 1400,  // XX-Large (1400px)
};

/**
 * Creates a wrapper container that applies the selected page width
 * @param {HTMLElement} pageElement - The page element to wrap
 * @param {string} pageWidth - The selected breakpoint ('auto', 'md', 'lg', 'xl', 'xxl')
 * @returns {HTMLElement} Wrapped container with applied width
 */
export function createPageWidthWrapper(pageElement, pageWidth = 'md') {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.alignItems = 'flex-start';
  container.style.minHeight = '100vh';
  container.style.backgroundColor = 'var(--color-surface-container)';
  container.style.overflowX = 'auto';
  container.style.padding = 'var(--size-section-pad-y-lg)';
  
  // Get the width value for the selected breakpoint
  const width = BREAKPOINT_WIDTHS[pageWidth] || BREAKPOINT_WIDTHS['md'];
  
  // Create inner wrapper that constrains the page width
  const innerWrapper = document.createElement('div');
  innerWrapper.style.width = `${width}px`;
  innerWrapper.style.maxWidth = '100%';
  innerWrapper.style.margin = '0 auto';
  
  // Apply width constraints to the page element itself
  if (pageElement && pageElement.style) {
    // Override width-related properties to match the selected breakpoint
    pageElement.style.width = `${width}px`;
    pageElement.style.maxWidth = `${width}px`;
    // Set minWidth based on breakpoint
    if (pageWidth === 'md' || pageWidth === 'auto') {
      pageElement.style.minWidth = '768px';
    } else {
      pageElement.style.minWidth = 'auto';
    }
  }
  
  innerWrapper.appendChild(pageElement);
  container.appendChild(innerWrapper);
  
  return container;
}

/**
 * Standard argTypes for pageWidth control
 * Use this in your story's argTypes to add the page width control
 */
export const pageWidthArgTypes = {
  pageWidth: {
    control: {
      type: 'select',
    },
    options: {
      'Auto (Medium 768px)': 'auto',
      'Medium (768px)': 'md',
      'Large (992px)': 'lg',
      'X-Large (1200px)': 'xl',
      'XX-Large (1400px)': 'xxl',
    },
    description: 'Page width breakpoint for responsive preview',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'md' },
      category: 'Page Width',
    },
  },
};

/**
 * Standard args for pageWidth control
 * Use this in your story's args to set the default page width
 */
export const pageWidthArgs = {
  pageWidth: 'md', // Default to Medium (768px)
};

