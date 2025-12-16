/**
 * Loading GIF Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Loading GIFs are **Element** components used to indicate that content is loading or a process is in progress.
 * They provide visual feedback using CSS-animated grid patterns matching the Figma design system.
 * 
 * ### When to Use
 * - **Growing Grid**: For "Generating Content" - when user creates new content from scratch using AI or editor
 * - **Rotating Grid**: For "Working with Existing Content" - when user edits or enhances previously created content
 * - **Stacking Grid**: For "Uploading/Importing Content" - when user brings in external content (files, text, media)
 * - **Indeterminate loading**: When the duration of a loading process is unknown
 * - **Data fetching**: While waiting for API responses or data to load
 * - **Form submission**: During form processing or submission
 * 
 * ### When NOT to Use
 * - **Determinate progress**: Use progress bars when you know the completion percentage
 * - **Known duration**: Use progress bars for operations with known duration
 * - **Quick operations**: Don't show loading indicator for operations under 200ms
 * - **Status indicators**: Use badges or status tags for status information
 * - **Error states**: Use alerts or error messages instead
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-*` tokens)
 * - **Token Usage**: 
 *   - Colors: Uses `--color-on-surface-variant` (matches Figma #3f484a)
 *   - Size: Custom sizes (small, default, large)
 *   - Border radius: 1px (matches Figma)
 * - **Animation Types**: Three distinct animations from Figma design system
 * - **Accessibility**: Includes ARIA attributes and screen reader support
 * 
 * ### Animation Types
 * - **Growing**: 3x3 grid (9 squares) that expands from center - use for generating new content
 * - **Rotating**: 2x2 grid (3 squares forming L-shape) that rotates - use for editing existing content
 * - **Stacking**: 4 squares that stack and rotate in sequence - use for uploading/importing content
 * 
 * ### Size Variants
 * - **Small**: Compact loading indicator for inline use or buttons
 * - **Default**: Standard size loading indicator (default)
 * - **Large**: Prominent loading indicator for full-page loading
 * 
 * ### Best Practices
 * - Always include ARIA attributes for accessibility (automatically set)
 * - Provide meaningful screen reader labels
 * - Choose the appropriate animation type based on use case (growing/rotating/stacking)
 * - Match loading indicator size to the context (small for buttons, default for inline, large for full-page)
 * - Don't show loading indicator for operations under 200ms to avoid flickering
 * - Use progress bars when you know the completion percentage
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/LoadingGif',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Loading GIF component for indicating loading states using CSS-animated grid patterns. Implements three animation types from Figma: Growing Grid, Rotating Grid, and Stacking Grid. No actual GIF file required - uses pure CSS animations.',
      },
    },
  },
};

/**
 * Overview
 * Shows all loading GIF variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Content Section (Animation Types)
    const contentSection = document.createElement('div');
    contentSection.style.display = 'flex';
    contentSection.style.flexDirection = 'column';
    contentSection.style.gap = 'var(--size-card-gap-md)';
    
    const contentHeading = document.createElement('div');
    contentHeading.className = 'h5';
    contentHeading.textContent = 'Content';
    contentHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    contentSection.appendChild(contentHeading);
    
    const typesRow = document.createElement('div');
    typesRow.style.display = 'flex';
    typesRow.style.flexWrap = 'wrap';
    typesRow.style.gap = 'var(--size-card-gap-md)';
    typesRow.style.alignItems = 'center';
    
    ['growing', 'rotating', 'stacking'].forEach((type) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      
      const loadingGif = PlusInterface.createLoadingGif({
        type: type,
        size: 'default',
        label: `${type} loading...`
      });
      wrapper.appendChild(loadingGif);
      typesRow.appendChild(wrapper);
    });
    contentSection.appendChild(typesRow);
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
    
    const sizesRow = document.createElement('div');
    sizesRow.style.display = 'flex';
    sizesRow.style.flexWrap = 'wrap';
    sizesRow.style.gap = 'var(--size-card-gap-md)';
    sizesRow.style.alignItems = 'center';
    
    ['small', 'default', 'large'].forEach((size) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      
      const loadingGif = PlusInterface.createLoadingGif({
        type: 'growing',
        size: size,
        label: `Loading (${size})...`
      });
      wrapper.appendChild(loadingGif);
      sizesRow.appendChild(wrapper);
    });
    sizesSection.appendChild(sizesRow);
    container.appendChild(sizesSection);
    
    return container;
  },
};

export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    const loadingGif = PlusInterface.createLoadingGif(args);
    container.appendChild(loadingGif);
    
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = args.label || 'Loading...';
    container.appendChild(label);
    
    return container;
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['growing', 'rotating', 'stacking'],
      description: 'Animation type',
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Loading GIF size',
    },
    label: {
      control: 'text',
      description: 'Screen reader label text',
    },
  },
  args: {
    type: 'growing',
    size: 'default',
    label: 'Loading...',
  },
};


