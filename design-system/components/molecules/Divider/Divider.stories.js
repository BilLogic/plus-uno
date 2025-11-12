/**
 * Divider Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Dividers are **Element** components used to visually separate content sections, list items, or groups.
 * They provide clear visual boundaries and improve content organization.
 * 
 * ### When to Use
 * - **Section separation**: Separate major content sections
 * - **List items**: Separate items in lists or menus
 * - **Card boundaries**: Separate content within cards
 * - **Form sections**: Separate form fields or groups
 * - **Navigation**: Separate navigation items or groups
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens)
 * - **Token Usage**: 
 *   - Stroke width: `--size-element-stroke-sm/md/lg/xl` (1px, 1.5px, 2px, 2.5px)
 *   - Colors: `--color-outline-variant` for light dividers, `--color-outline` for dark dividers
 *   - Opacity: Can use 10% opacity variant for subtle separation
 * 
 * ### Visual Style Variants
 * - **Light**: Subtle divider using outline-variant color (default for light backgrounds)
 * - **Dark**: More prominent divider using outline color (for dark backgrounds or emphasis)
 * 
 * ### Size Variants (Stroke Width)
 * - **Small (1px)**: Subtle separation for closely related content
 * - **Medium (1.5px)**: Standard separation for most use cases
 * - **Large (2px)**: Prominent separation for major sections
 * - **Extra Large (2.5px)**: Maximum emphasis for strong separation
 * 
 * ### Best Practices
 * - Use light dividers on light backgrounds, dark dividers on dark backgrounds
 * - Match stroke width to separation importance (larger = more important)
 * - Use opacity variants for subtle separation when needed
 * - Don't overuse dividers - use spacing when possible
 * - Ensure sufficient contrast for accessibility
 * - Consider using dividers in lists, menus, or between form sections
 * 
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Divider',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Divider component for visually separating content. Supports light and dark styles with multiple stroke widths. Uses element-level stroke tokens.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all divider combinations organized by visual style: each style shows all sizes
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const styles = [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
    ];
    
    const sizes = [
      { value: 'sm', label: 'Small (1px)', token: '--size-element-stroke-sm', px: '1px' },
      { value: 'md', label: 'Medium (1.5px)', token: '--size-element-stroke-md', px: '1.5px' },
      { value: 'lg', label: 'Large (2px)', token: '--size-element-stroke-lg', px: '2px' },
      { value: 'xl', label: 'Extra Large (2.5px)', token: '--size-element-stroke-xl', px: '2.5px' },
    ];
    
    // Organize by visual style - each style shows all sizes
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-section-gap-md)';
      styleSection.style.width = 'var(--size-card-pad-x-lg)';
      
      // Add background for dark style to show contrast
      if (style.value === 'dark') {
        styleSection.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
        styleSection.style.backgroundColor = 'var(--color-surface-container)';
      }
      
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h6';
      styleLabel.textContent = `${style.label} Style - All Sizes`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      
      sizes.forEach((size) => {
        const divider = PlusInterface.createDivider({
          size: size.px,
          style: style.value,
          width: '100%'
        });
        styleSection.appendChild(divider);
        
        const label = document.createElement('div');
        label.className = 'body2-txt';
        label.textContent = `${size.label} - ${size.token}`;
        label.style.marginTop = 'var(--size-element-gap-sm)';
        label.style.marginBottom = 'var(--size-element-gap-md)';
        styleSection.appendChild(label);
      });
      
      container.appendChild(styleSection);
    });
    
    return container;
  },
};


/**
 * Interactive Divider
 * Interactive playground for testing divider variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.width = 'var(--size-card-pad-x-lg)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface-container)';
    
    const divider = PlusInterface.createDivider(args);
    container.appendChild(divider);
    
    return container;
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Divider size (uses element stroke tokens: sm=1px, md=1.5px, lg=2px, xl=2.5px)',
    },
    style: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Divider style',
    },
    opacity10: {
      control: 'boolean',
      description: 'Apply 10% opacity',
    },
  },
  args: {
    size: '1px',
    style: 'light',
    opacity10: false,
    width: '100%',
  },
};
