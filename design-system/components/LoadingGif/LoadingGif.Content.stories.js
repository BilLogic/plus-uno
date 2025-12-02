/**
 * Loading GIF Content Stories
 * 
 * Content category showing different animation types (use cases) for loading indicators.
 * Each animation type is designed for specific use cases based on the Figma design system.
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/LoadingGif/Content',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Content variants showing different animation types for loading indicators. Each type is designed for specific use cases: Growing Grid for generating content, Spinning Grid for working with existing content, and Stacking Grid for uploading/importing content.',
      },
    },
  },
};

/**
 * Growing Grid
 * Use when user creates new content from scratch using AI or a built-in editor.
 */
export const GrowingGrid = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Explanation section
    const explanation = document.createElement('div');
    explanation.style.display = 'flex';
    explanation.style.flexDirection = 'column';
    explanation.style.gap = 'var(--size-element-gap-sm)';
    explanation.style.padding = 'var(--size-card-pad-y-md)';
    explanation.style.backgroundColor = 'var(--color-surface-container)';
    explanation.style.borderRadius = 'var(--size-card-radius-sm)';
    
    const title = document.createElement('div');
    title.className = 'h6';
    title.textContent = 'Generating Content';
    explanation.appendChild(title);
    
    const description = document.createElement('div');
    description.className = 'body2-txt';
    description.textContent = 'Use Growing Grid when user creates new content from scratch using AI or a built-in editor.';
    explanation.appendChild(description);
    
    const example = document.createElement('div');
    example.className = 'body3-txt';
    example.style.color = 'var(--color-on-surface-variant)';
    example.style.fontStyle = 'italic';
    example.textContent = 'Example: Creating a new document, generating AI content, starting a new project';
    explanation.appendChild(example);
    
    container.appendChild(explanation);
    
    // Component display
    const display = document.createElement('div');
    display.style.display = 'flex';
    display.style.flexDirection = 'column';
    display.style.alignItems = 'center';
    display.style.gap = 'var(--size-element-gap-sm)';
    
    const loadingGif = PlusInterface.createLoadingGif({
      type: 'growing',
      size: 'default',
      label: 'Generating content...'
    });
    display.appendChild(loadingGif);
    
    container.appendChild(display);
    
    return container;
  },
};

/**
 * Spinning Grid
 * Use when user edits or enhances content they previously created or saved.
 */
export const SpinningGrid = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Explanation section
    const explanation = document.createElement('div');
    explanation.style.display = 'flex';
    explanation.style.flexDirection = 'column';
    explanation.style.gap = 'var(--size-element-gap-sm)';
    explanation.style.padding = 'var(--size-card-pad-y-md)';
    explanation.style.backgroundColor = 'var(--color-surface-container)';
    explanation.style.borderRadius = 'var(--size-card-radius-sm)';
    
    const title = document.createElement('div');
    title.className = 'h6';
    title.textContent = 'Working with Existing Content';
    explanation.appendChild(title);
    
    const description = document.createElement('div');
    description.className = 'body2-txt';
    description.textContent = 'Use Spinning Grid when user edits or enhances content they previously created or saved.';
    explanation.appendChild(description);
    
    const example = document.createElement('div');
    example.className = 'body3-txt';
    example.style.color = 'var(--color-on-surface-variant)';
    example.style.fontStyle = 'italic';
    example.textContent = 'Example: Editing a saved document, updating existing content, modifying previous work';
    explanation.appendChild(example);
    
    container.appendChild(explanation);
    
    // Component display
    const display = document.createElement('div');
    display.style.display = 'flex';
    display.style.flexDirection = 'column';
    display.style.alignItems = 'center';
    display.style.gap = 'var(--size-element-gap-sm)';
    
    const loadingGif = PlusInterface.createLoadingGif({
      type: 'rotating',
      size: 'default',
      label: 'Working with existing content...'
    });
    display.appendChild(loadingGif);
    
    container.appendChild(display);
    
    return container;
  },
};

/**
 * Stacking Grid
 * Use when user brings in external content (e.g., files, text, media) into the system.
 */
export const StackingGrid = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Explanation section
    const explanation = document.createElement('div');
    explanation.style.display = 'flex';
    explanation.style.flexDirection = 'column';
    explanation.style.gap = 'var(--size-element-gap-sm)';
    explanation.style.padding = 'var(--size-card-pad-y-md)';
    explanation.style.backgroundColor = 'var(--color-surface-container)';
    explanation.style.borderRadius = 'var(--size-card-radius-sm)';
    
    const title = document.createElement('div');
    title.className = 'h6';
    title.textContent = 'Uploading/Importing Content';
    explanation.appendChild(title);
    
    const description = document.createElement('div');
    description.className = 'body2-txt';
    description.textContent = 'Use Stacking Grid when user brings in external content (e.g., files, text, media) into the system.';
    explanation.appendChild(description);
    
    const example = document.createElement('div');
    example.className = 'body3-txt';
    example.style.color = 'var(--color-on-surface-variant)';
    example.style.fontStyle = 'italic';
    example.textContent = 'Example: Uploading files, importing documents, bringing in external media';
    explanation.appendChild(example);
    
    container.appendChild(explanation);
    
    // Component display
    const display = document.createElement('div');
    display.style.display = 'flex';
    display.style.flexDirection = 'column';
    display.style.alignItems = 'center';
    display.style.gap = 'var(--size-element-gap-sm)';
    
    const loadingGif = PlusInterface.createLoadingGif({
      type: 'stacking',
      size: 'default',
      label: 'Uploading/importing content...'
    });
    display.appendChild(loadingGif);
    
    container.appendChild(display);
    
    return container;
  },
};

/**
 * All Content
 * Shows all three animation types together for comparison.
 */
export const AllContent = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const contentTypes = [
      {
        type: 'growing',
        title: 'Growing Grid',
        useCase: 'Generating Content',
        description: 'Use when user creates new content from scratch using AI or a built-in editor.'
      },
      {
        type: 'rotating',
        title: 'Spinning Grid',
        useCase: 'Working with Existing Content',
        description: 'Use when user edits or enhances content they previously created or saved.'
      },
      {
        type: 'stacking',
        title: 'Stacking Grid',
        useCase: 'Uploading/Importing Content',
        description: 'Use when user brings in external content (e.g., files, text, media) into the system.'
      }
    ];
    
    contentTypes.forEach((contentType) => {
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
        type: contentType.type,
        size: 'default',
        label: `${contentType.useCase}...`
      });
      header.appendChild(loadingGif);
      
      const title = document.createElement('div');
      title.className = 'h6';
      title.textContent = contentType.title;
      header.appendChild(title);
      
      section.appendChild(header);
      
      const useCaseTitle = document.createElement('div');
      useCaseTitle.className = 'body1-txt';
      useCaseTitle.style.fontWeight = '600';
      useCaseTitle.textContent = contentType.useCase;
      section.appendChild(useCaseTitle);
      
      const description = document.createElement('div');
      description.className = 'body2-txt';
      description.textContent = contentType.description;
      section.appendChild(description);
      
      container.appendChild(section);
    });
    
    return container;
  },
};


