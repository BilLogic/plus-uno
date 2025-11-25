/**
 * Icon Size Variants Stories
 * Size variants organized under "Size Variants" subcategory
 */

export default {
  title: 'Atoms/Icon/Size Variants',
  tags: ['autodocs'],
};

/**
 * Body 1 Size
 */
export const Body1 = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-star body1-txt';
    container.appendChild(icon);
    
    const label = document.createElement('div');
    label.className = 'body3-txt';
    label.textContent = 'Body 1';
    container.appendChild(label);
    
    return container;
  },
};

/**
 * Body 2 Size
 */
export const Body2 = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-star body2-txt';
    container.appendChild(icon);
    
    const label = document.createElement('div');
    label.className = 'body3-txt';
    label.textContent = 'Body 2';
    container.appendChild(label);
    
    return container;
  },
};

/**
 * Body 3 Size
 */
export const Body3 = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-star body3-txt';
    container.appendChild(icon);
    
    const label = document.createElement('div');
    label.className = 'body3-txt';
    label.textContent = 'Body 3';
    container.appendChild(label);
    
    return container;
  },
};

