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
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Divider',
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
 * Overview
 * Shows all divider variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    
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
    
    const sizesRow = document.createElement('div');
    sizesRow.style.display = 'flex';
    sizesRow.style.flexDirection = 'column';
    sizesRow.style.gap = 'var(--size-element-gap-sm)';
    sizesRow.style.width = '100%';
    sizesRow.style.maxWidth = '600px';
    
    ['sm', 'md', 'lg', 'xl'].forEach((size) => {
      const divider = PlusInterface.createDivider({
        size: size,
        style: 'light',
        width: '100%'
      });
      sizesRow.appendChild(divider);
    });
    sizesSection.appendChild(sizesRow);
    container.appendChild(sizesSection);
    
    // Colors Section
    const colorsSection = document.createElement('div');
    colorsSection.style.display = 'flex';
    colorsSection.style.flexDirection = 'column';
    colorsSection.style.gap = 'var(--size-card-gap-md)';
    
    const colorsHeading = document.createElement('div');
    colorsHeading.className = 'h5';
    colorsHeading.textContent = 'Colors';
    colorsHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    colorsSection.appendChild(colorsHeading);
    
    const colorsRow = document.createElement('div');
    colorsRow.style.display = 'flex';
    colorsRow.style.flexDirection = 'column';
    colorsRow.style.gap = 'var(--size-element-gap-sm)';
    colorsRow.style.width = '100%';
    colorsRow.style.maxWidth = '600px';
    
    // Light
    const lightDivider = PlusInterface.createDivider({
      size: 'md',
      style: 'light',
      width: '100%'
    });
    colorsRow.appendChild(lightDivider);
    
    // Dark (with background to show contrast)
    const darkWrapper = document.createElement('div');
    darkWrapper.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    darkWrapper.style.backgroundColor = 'var(--color-surface-container)';
    darkWrapper.style.borderRadius = 'var(--size-card-radius-sm)';
    darkWrapper.style.width = '100%';
    const darkDivider = PlusInterface.createDivider({
      size: 'md',
      style: 'dark',
      width: '100%'
    });
    darkWrapper.appendChild(darkDivider);
    colorsRow.appendChild(darkWrapper);
    
    colorsSection.appendChild(colorsRow);
    container.appendChild(colorsSection);
    
    // Styles Section (Opacity)
    const stylesSection = document.createElement('div');
    stylesSection.style.display = 'flex';
    stylesSection.style.flexDirection = 'column';
    stylesSection.style.gap = 'var(--size-card-gap-md)';
    
    const stylesHeading = document.createElement('div');
    stylesHeading.className = 'h5';
    stylesHeading.textContent = 'Styles';
    stylesHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    stylesSection.appendChild(stylesHeading);
    
    const stylesRow = document.createElement('div');
    stylesRow.style.display = 'flex';
    stylesRow.style.flexDirection = 'column';
    stylesRow.style.gap = 'var(--size-element-gap-sm)';
    stylesRow.style.width = '100%';
    stylesRow.style.maxWidth = '600px';
    stylesRow.style.padding = 'var(--size-section-pad-y-md) var(--size-section-pad-x-md)';
    stylesRow.style.backgroundColor = 'var(--color-surface-container)';
    stylesRow.style.borderRadius = 'var(--size-card-radius-sm)';
    
    // Normal opacity
    const normalDivider = PlusInterface.createDivider({
      size: 'sm',
      style: 'dark',
      width: '100%'
    });
    stylesRow.appendChild(normalDivider);
    
    // 10% opacity
    const opacityDivider = PlusInterface.createDivider({
      size: 'sm',
      style: 'dark',
      opacity10: true,
      width: '100%'
    });
    stylesRow.appendChild(opacityDivider);
    
    stylesSection.appendChild(stylesRow);
    container.appendChild(stylesSection);
    
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
      description: 'Divider size using semantic tokens (sm=1px, md=1.5px, lg=2px, xl=2.5px). Uses --size-element-stroke-* tokens.',
    },
    style: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Divider style (light uses outline-variant, dark uses outline)',
    },
    opacity10: {
      control: 'boolean',
      description: 'Apply 10% opacity (for accordion/collapse use cases)',
    },
  },
  args: {
    size: 'md',
    style: 'light',
    opacity10: false,
    width: '100%',
  },
};
