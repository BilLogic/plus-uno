/**
 * Admin Organism - Modals
 * Modal-level components for admin organisms.
 */

export default {
  title: 'Specs/Admin/Modals',
  tags: ['autodocs'],
};

/**
 * Placeholder
 */
export const Placeholder = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg)';
    container.innerHTML = '<p class="body2-txt">Admin Modals - To be implemented</p>';
    return container;
  },
};
