/**
 * Home Organism - Tables
 * 
 * Table components used in home page contexts.
 * 
 * ## Components in this Category
 * 
 * Currently empty - table components will be added here as needed for home page flows.
 */

export default {
  title: 'Specs/Home/Tables',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Table components used in home page contexts. This category will be populated as needed.',
      },
    },
  },
};

/**
 * Overview
 * Placeholder for future table components
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Home Tables';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Table components used in home page contexts. This category is currently empty and will be populated as needed.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const placeholder = document.createElement('div');
    placeholder.style.padding = 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)';
    placeholder.style.border = '1px dashed var(--color-outline-variant)';
    placeholder.style.borderRadius = 'var(--size-card-radius-sm)';
    placeholder.style.backgroundColor = 'var(--color-surface-container)';
    placeholder.style.textAlign = 'center';
    placeholder.style.color = 'var(--color-on-surface-variant)';
    
    const placeholderText = document.createElement('p');
    placeholderText.className = 'body2-txt';
    placeholderText.textContent = 'No table components yet. Table components for home page will be added here as needed.';
    placeholder.appendChild(placeholderText);
    
    container.appendChild(placeholder);
    
    return container;
  },
};

