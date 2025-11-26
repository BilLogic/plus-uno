/**
 * Training Organism - Modals
 */

export default {
  title: 'Specs/Training/Modals',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Modal dialogs used in training flows.',
      },
    },
  },
};

export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Training Modals';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Modal dialogs used in training flows. This category is currently empty and will be populated as needed.';
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
    placeholderText.textContent = 'No modal components yet. Modal components for training will be added here as needed.';
    placeholder.appendChild(placeholderText);
    
    container.appendChild(placeholder);
    return container;
  },
};

