/**
 * Session Admin Organism - Cards
 * 
 * Card components for Session Admin.
 * 
 * ## Components in this Category
 * 
 * Card components will be added here as needed for Session Admin.
 */

export default {
  title: 'Specs/Admin/Session Admin/Cards',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Card components for Session Admin. These cards display key metrics and statistics in a visual format.',
      },
    },
  },
};

/**
 * Overview
 * Shows all cards that will be available in this category
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    const title = document.createElement('h1');
    title.className = 'h1';
    title.textContent = 'Session Admin Cards';
    title.style.marginBottom = 'var(--size-section-pad-y-md)';
    container.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'body1-txt';
    description.textContent = 'Card components for Session Admin. These components will be implemented and documented here.';
    description.style.marginBottom = 'var(--size-card-gap-lg)';
    container.appendChild(description);
    
    const note = document.createElement('p');
    note.className = 'body2-txt';
    note.style.color = 'var(--color-on-surface-variant)';
    note.style.fontStyle = 'italic';
    note.textContent = 'Note: Data cards for session overview statistics are included in the Sections category (SessionOverviewSection).';
    container.appendChild(note);
    
    return container;
  },
};
