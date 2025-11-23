/**
 * Loading GIF Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Loading GIFs are **Element** components used to indicate that content is loading or a process is in progress.
 * They provide visual feedback using CSS-animated pulsing dots for loading states where the duration is unknown.
 * 
 * ### When to Use
 * - **Indeterminate loading**: When the duration of a loading process is unknown
 * - **Data fetching**: While waiting for API responses or data to load
 * - **Form submission**: During form processing or submission
 * - **Content loading**: While waiting for content to appear
 * - **Background processes**: For long-running operations that don't block the UI
 * - **Button loading states**: Inside buttons to show action is processing
 * - **Alternative to spinner**: When you want a different visual style (pulsing dots vs rotating border)
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
 *   - Size: Custom sizes (small, default, large)
 *   - Colors: Uses Material Design 3 color tokens
 *   - Gap: Uses `element-gap-xs` for dot spacing
 * - **Animation**: CSS-based pulsing dot animation (no GIF file required)
 * - **Accessibility**: Includes ARIA attributes and screen reader support
 * 
 * ### State Variants
 * - **Default**: Standard loading animation
 * - **Small**: Compact loading indicator for inline use or buttons
 * - **Default**: Standard size loading indicator (default)
 * - **Large**: Prominent loading indicator for full-page loading
 * 
 * ### Style Variants
 * - **Primary**: Default blue loading indicator (most common)
 * - **Secondary**: Secondary color loading indicator
 * - **Tertiary**: Tertiary color loading indicator
 * - **Success**: Green loading indicator for successful operations
 * - **Danger**: Red loading indicator for errors or critical operations
 * - **Warning**: Yellow/orange loading indicator for warnings
 * - **Info**: Info color loading indicator
 * 
 * ### Best Practices
 * - Always include ARIA attributes for accessibility (automatically set)
 * - Provide meaningful screen reader labels
 * - Use appropriate colors for context (primary for general loading, success for positive operations)
 * - Match loading indicator size to the context (small for buttons, default for inline, large for full-page)
 * - Don't show loading indicator for operations under 200ms to avoid flickering
 * - Consider using spinner component for rotating border animation style
 * - Use progress bars when you know the completion percentage
 * 
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/LoadingGif',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Loading GIF component for indicating loading states using CSS-animated pulsing dots. No actual GIF file required - uses pure CSS animations. Supports multiple sizes and color styles.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all loading GIF combinations: sizes and styles
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
      
      const loadingGif = PlusInterface.createLoadingGif({
        style: 'primary',
        size: size,
        label: `Loading (${size})...`
      });
      wrapper.appendChild(loadingGif);
      
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.textContent = size.charAt(0).toUpperCase() + size.slice(1);
      wrapper.appendChild(label);
      
      sizesContainer.appendChild(wrapper);
    });
    
    sizesSection.appendChild(sizesContainer);
    container.appendChild(sizesSection);
    
    // Styles section
    const stylesSection = document.createElement('div');
    stylesSection.style.display = 'flex';
    stylesSection.style.flexDirection = 'column';
    stylesSection.style.gap = 'var(--size-element-gap-sm)';
    
    const stylesLabel = document.createElement('div');
    stylesLabel.className = 'h6';
    stylesLabel.textContent = 'Styles';
    stylesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    stylesSection.appendChild(stylesLabel);
    
    const stylesContainer = document.createElement('div');
    stylesContainer.style.display = 'flex';
    stylesContainer.style.flexDirection = 'row';
    stylesContainer.style.alignItems = 'center';
    stylesContainer.style.gap = 'var(--size-card-gap-md)';
    stylesContainer.style.flexWrap = 'wrap';
    
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning', 'info'];
    styles.forEach((style) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      
      const loadingGif = PlusInterface.createLoadingGif({
        style: style,
        size: 'default',
        label: `Loading (${style})...`
      });
      wrapper.appendChild(loadingGif);
      
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.textContent = style.charAt(0).toUpperCase() + style.slice(1);
      wrapper.appendChild(label);
      
      stylesContainer.appendChild(wrapper);
    });
    
    stylesSection.appendChild(stylesContainer);
    container.appendChild(stylesSection);
    
    return container;
  },
};

/**
 * Interactive Loading GIF
 * Interactive playground for testing loading GIF variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
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
    style: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning', 'info'],
      description: 'Loading GIF style/color',
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
    style: 'primary',
    size: 'default',
    label: 'Loading...',
  },
};

/**
 * Inline Usage
 * Examples of loading GIF used inline with text
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
    inline1.appendChild(PlusInterface.createLoadingGif({ 
      style: 'primary', 
      size: 'small', 
      label: 'Loading...' 
    }));
    inline1.appendChild(document.createTextNode('Loading data...'));
    container.appendChild(inline1);
    
    // In button
    const buttonWrapper = document.createElement('div');
    const button = document.createElement('button');
    button.className = 'btn btn-primary';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.gap = 'var(--size-element-gap-sm)';
    button.appendChild(PlusInterface.createLoadingGif({ 
      style: 'primary', 
      size: 'small', 
      label: 'Submitting...' 
    }));
    button.appendChild(document.createTextNode('Submit'));
    buttonWrapper.appendChild(button);
    container.appendChild(buttonWrapper);
    
    // Center aligned
    const centerWrapper = document.createElement('div');
    centerWrapper.style.display = 'flex';
    centerWrapper.style.flexDirection = 'column';
    centerWrapper.style.alignItems = 'center';
    centerWrapper.style.gap = 'var(--size-element-gap-sm)';
    centerWrapper.appendChild(PlusInterface.createLoadingGif({ 
      style: 'primary', 
      size: 'large', 
      label: 'Loading page...' 
    }));
    centerWrapper.appendChild(document.createTextNode('Loading page content...'));
    container.appendChild(centerWrapper);
    
    return container;
  },
};

