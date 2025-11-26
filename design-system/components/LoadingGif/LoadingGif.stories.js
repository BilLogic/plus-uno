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
 * All Animation Types
 * Shows all three loading animation types from Figma
 */
export const AllAnimationTypes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Animation types section
    const typesSection = document.createElement('div');
    typesSection.style.display = 'flex';
    typesSection.style.flexDirection = 'column';
    typesSection.style.gap = 'var(--size-element-gap-sm)';
    
    const typesLabel = document.createElement('div');
    typesLabel.className = 'h6';
    typesLabel.textContent = 'Animation Types';
    typesLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    typesSection.appendChild(typesLabel);
    
    const typesContainer = document.createElement('div');
    typesContainer.style.display = 'flex';
    typesContainer.style.flexDirection = 'row';
    typesContainer.style.alignItems = 'center';
    typesContainer.style.gap = 'var(--size-card-gap-lg)';
    typesContainer.style.flexWrap = 'wrap';
    
    const types = [
      { type: 'growing', label: 'Growing Grid', description: 'For Generating Content' },
      { type: 'rotating', label: 'Rotating Grid', description: 'For Working with Existing Content' },
      { type: 'stacking', label: 'Stacking Grid', description: 'For Uploading/Importing Content' }
    ];
    
    types.forEach((typeInfo) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = 'var(--size-element-gap-sm)';
      
      const loadingGif = PlusInterface.createLoadingGif({
        type: typeInfo.type,
        size: 'default',
        label: `${typeInfo.label}...`
      });
      wrapper.appendChild(loadingGif);
      
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.style.textAlign = 'center';
      label.innerHTML = `<strong>${typeInfo.label}</strong><br>${typeInfo.description}`;
      wrapper.appendChild(label);
      
      typesContainer.appendChild(wrapper);
    });
    
    typesSection.appendChild(typesContainer);
    container.appendChild(typesSection);
    
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
        type: 'growing',
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

/**
 * Use Cases
 * Examples showing when to use each animation type
 */
export const UseCases = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const useCases = [
      {
        type: 'growing',
        title: 'Generating Content',
        description: 'Use Growing Grid when user creates new content from scratch using AI or a built-in editor.',
        example: 'Creating a new document, generating AI content, starting a new project'
      },
      {
        type: 'rotating',
        title: 'Working with Existing Content',
        description: 'Use Rotating Grid when user edits or enhances content they previously created or saved.',
        example: 'Editing a saved document, updating existing content, modifying previous work'
      },
      {
        type: 'stacking',
        title: 'Uploading/Importing Content',
        description: 'Use Stacking Grid when user brings in external content (e.g., files, text, media) into the system.',
        example: 'Uploading files, importing documents, bringing in external media'
      }
    ];
    
    useCases.forEach((useCase) => {
      const section = document.createElement('div');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = 'var(--size-element-gap-sm)';
      section.style.padding = 'var(--size-card-pad-y-md)';
      section.style.backgroundColor = 'var(--color-surface-container)';
      section.style.borderRadius = 'var(--size-card-radius-sm)';
      
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.gap = 'var(--size-element-gap-md)';
      
      const loadingGif = PlusInterface.createLoadingGif({
        type: useCase.type,
        size: 'default',
        label: `${useCase.title}...`
      });
      header.appendChild(loadingGif);
      
      const title = document.createElement('div');
      title.className = 'h6';
      title.textContent = useCase.title;
      header.appendChild(title);
      
      section.appendChild(header);
      
      const description = document.createElement('div');
      description.className = 'body2-txt';
      description.textContent = useCase.description;
      section.appendChild(description);
      
      const example = document.createElement('div');
      example.className = 'body3-txt';
      example.style.color = 'var(--color-on-surface-variant)';
      example.style.fontStyle = 'italic';
      example.textContent = `Example: ${useCase.example}`;
      section.appendChild(example);
      
      container.appendChild(section);
    });
    
    return container;
  },
};

