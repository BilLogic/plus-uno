/**
 * Pagination Size Variants Stories
 * Size variants for pagination elements
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Pagination/Sizes',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Pagination size variants: small, default, and large.',
      },
    },
  },
};

/**
 * Small
 */
export const Small = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 5,
      totalPages: 10,
      type: 'icon',
      size: 'small',
      onPageChange: (page) => console.log('Page:', page)
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * Default
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 5,
      totalPages: 10,
      type: 'icon',
      size: 'default',
      onPageChange: (page) => {
        console.log('Page changed to:', page);
      }
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * Large
 */
export const Large = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 5,
      totalPages: 10,
      type: 'icon',
      size: 'large',
      onPageChange: (page) => console.log('Page:', page)
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * All Sizes
 */
export const AllSizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const sizes = ['small', 'default', 'large'];
    
    sizes.forEach(size => {
      const sizeContainer = document.createElement('div');
      sizeContainer.style.display = 'flex';
      sizeContainer.style.flexDirection = 'column';
      sizeContainer.style.gap = 'var(--size-element-gap-sm)';
      
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.textContent = `${size.charAt(0).toUpperCase() + size.slice(1)} Size (Icon Type):`;
      label.style.marginBottom = 'var(--size-element-gap-xs)';
      sizeContainer.appendChild(label);
      
      const pagination = PlusInterface.createPagination({
        currentPage: 5,
        totalPages: 10,
        type: 'icon',
        size: size,
        onPageChange: (page) => console.log(`${size} pagination - Page:`, page)
      });
      
      sizeContainer.appendChild(pagination);
      container.appendChild(sizeContainer);
    });
    
    return container;
  },
};


