/**
 * Icon Visual Style Variants Stories
 * Visual style variants organized under "Visual Style Variants" subcategory
 * Includes appearance variations (solid, regular)
 */

export default {
  title: 'Atoms/Icon/Visual Style Variants',
  tags: ['autodocs'],
};

/**
 * Solid Icons
 * Shows solid style with default size (body2) for style comparison
 */
export const Solid = {
  render: () => {
    const container = document.createElement('div');
    const icon = document.createElement('i');
    icon.className = 'fas fa-star body2-txt';
    container.appendChild(icon);
    return container;
  },
};

/**
 * Regular Icons
 * Shows regular style with default size (body2) for style comparison
 */
export const Regular = {
  render: () => {
    const container = document.createElement('div');
    const icon = document.createElement('i');
    icon.className = 'far fa-star body2-txt';
    container.appendChild(icon);
    return container;
  },
};

