/**
 * Spinner Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Spinners are **Element** components used to indicate that content is loading or a process is in progress.
 * They provide visual feedback for indeterminate loading states where the duration is unknown.
 * 
 * ### When to Use
 * - **Indeterminate loading**: When the duration of a loading process is unknown
 * - **Data fetching**: While waiting for API responses or data to load
 * - **Form submission**: During form processing or submission
 * - **Content loading**: While waiting for content to appear
 * - **Background processes**: For long-running operations that don't block the UI
 * - **Button loading states**: Inside buttons to show action is processing
 * 
 * ### When NOT to Use
 * - **Determinate progress**: Use progress bars when you know the completion percentage
 * - **Known duration**: Use progress bars for operations with known duration
 * - **Quick operations**: Don't show spinner for operations under 200ms
 * - **Status indicators**: Use badges or status tags for status information
 * - **Error states**: Use alerts or error messages instead
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-*` tokens)
 * - **Bootstrap Framework**: Uses Bootstrap 4.6.2's `spinner-border` component pattern
 * - **Styling**: Customized with PLUS design tokens for colors and sizing
 * - **Reference**: https://getbootstrap.com/docs/4.6/components/spinners/
 * 
 * ### State Variants
 * - **Default**: Standard spinner animation
 * - **Small**: Compact spinner for inline use or buttons
 * - **Default**: Standard size spinner (default)
 * - **Large**: Prominent spinner for full-page loading
 * 
 * ### Best Practices
 * - Always include ARIA attributes for accessibility (automatically set)
 * - Provide meaningful screen reader labels
 * - Match spinner size to the context (small for buttons, default for inline, large for full-page)
 * - Don't show spinner for operations under 200ms to avoid flickering
 * - Consider using skeleton loaders for content placeholders
 * - Use progress bars when you know the completion percentage
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Spinner',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Spinner component for indicating loading states. Built on Bootstrap 4.6.2 spinner-border pattern. Uses fixed black color (--color-on-surface-variant) and supports multiple sizes.',
      },
    },
  },
};

/**
 * Overview
 * Shows all spinner variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
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
      const spinner = PlusInterface.createSpinner({ size: size });
      sizesRow.appendChild(spinner);
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
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    const spinner = PlusInterface.createSpinner(args);
    container.appendChild(spinner);
    
    const label = document.createElement('div');
    label.className = 'body2-txt';
    label.textContent = args.label || 'Loading...';
    container.appendChild(label);
    
    return container;
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Spinner size',
    },
    label: {
      control: 'text',
      description: 'Screen reader label text',
    },
  },
  args: {
    size: 'default',
    label: 'Loading...',
  },
};





