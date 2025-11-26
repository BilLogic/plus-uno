/**
 * Admin Organism - Cards
 * Card-level components for admin organisms.
 */

export default {
  title: 'Specs/Admin/Cards',
  tags: ['autodocs'],
};

/**
 * Placeholder
 */
export const Placeholder = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.innerHTML = '<p class="body2-txt">Admin Cards - To be implemented</p>';
    return container;
  },
};
