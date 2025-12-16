/**
 * Session Admin Organism - Elements
 * 
 * Individual form elements and UI components for Session Admin.
 * 
 * ## Components in this Category
 * 
 * Element components will be added here as needed for Session Admin.
 */

export default {
  title: 'Specs/Admin/Session Admin/Elements',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Individual form elements and UI components for Session Admin. These are reusable building blocks used throughout Session Admin pages.',
      },
    },
  },
};

/**
 * Overview
 * Shows all elements that will be available in this category
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Session Admin Elements';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Individual form elements and UI components for Session Admin. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    return container;
  },
};
