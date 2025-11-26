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
 * All Variants
 * Shows all spinner size variants
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Sizes section
    const sizesSection = document.createElement('div');
    sizesSection.style.display = 'flex';
    sizesSection.style.flexDirection = 'column';
    sizesSection.style.gap = 'var(--size-element-gap-sm)';
    
    const sizesLabel = document.createElement('div');
    sizesLabel.className = 'h6';
    sizesLabel.textContent = 'Sizes';
    sizesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    sizesSection.appendChild(sizesLabel);
    
    const sizesContainer = document.createElement('div');
    sizesContainer.style.display = 'flex';
    sizesContainer.style.flexDirection = 'row';
    sizesContainer.style.alignItems = 'center';
    sizesContainer.style.gap = 'var(--size-card-gap-md)';
    sizesContainer.style.flexWrap = 'wrap';
    
    const sizes = ['small', 'default', 'large'];
    sizes.forEach((size) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      
      const spinner = PlusInterface.createSpinner({
        size: size,
        label: `Loading (${size})...`
      });
      wrapper.appendChild(spinner);
      
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.textContent = size.charAt(0).toUpperCase() + size.slice(1);
      wrapper.appendChild(label);
      
      sizesContainer.appendChild(wrapper);
    });
    
    sizesSection.appendChild(sizesContainer);
    container.appendChild(sizesSection);
    
    return container;
  },
};

/**
 * Interactive Spinner
 * Interactive playground for testing spinner variations
 */
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

/**
 * Inline Usage
 * Examples of spinner used inline with text
 */
export const InlineUsage = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    
    // Inline with text
    const inline1 = document.createElement('div');
    inline1.className = 'body1-txt';
    inline1.style.display = 'flex';
    inline1.style.alignItems = 'center';
    inline1.style.gap = 'var(--size-element-gap-sm)';
    inline1.appendChild(PlusInterface.createSpinner({ size: 'small', label: 'Loading...' }));
    inline1.appendChild(document.createTextNode('Loading data...'));
    container.appendChild(inline1);
    
    // In button
    const buttonWrapper = document.createElement('div');
    const button = document.createElement('button');
    button.className = 'btn btn-primary';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.gap = 'var(--size-element-gap-sm)';
    button.appendChild(PlusInterface.createSpinner({ size: 'small', label: 'Submitting...' }));
    button.appendChild(document.createTextNode('Submit'));
    buttonWrapper.appendChild(button);
    container.appendChild(buttonWrapper);
    
    // Center aligned
    const centerWrapper = document.createElement('div');
    centerWrapper.style.display = 'flex';
    centerWrapper.style.flexDirection = 'column';
    centerWrapper.style.alignItems = 'center';
    centerWrapper.style.gap = 'var(--size-element-gap-sm)';
    centerWrapper.appendChild(PlusInterface.createSpinner({ size: 'large', label: 'Loading page...' }));
    centerWrapper.appendChild(document.createTextNode('Loading page content...'));
    container.appendChild(centerWrapper);
    
    return container;
  },
};





