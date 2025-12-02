/**
 * Pagination Content Variants Stories
 * Content variants for pagination elements
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Pagination/Content',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Pagination content variants: icon type and text type.',
      },
    },
  },
};

/**
 * Icon Type
 */
export const IconType = {
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
 * Text Type
 */
export const TextType = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 5,
      totalPages: 10,
      type: 'text',
      size: 'default',
      onPageChange: (page) => console.log('Page:', page)
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * All Content Variants
 */
export const AllContent = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const types = [
      { type: 'icon', label: 'Icon Type' },
      { type: 'text', label: 'Text Type' }
    ];
    
    types.forEach(({ type, label }) => {
      const typeContainer = document.createElement('div');
      typeContainer.style.display = 'flex';
      typeContainer.style.flexDirection = 'column';
      typeContainer.style.gap = 'var(--size-element-gap-sm)';
      
      const typeLabel = document.createElement('div');
      typeLabel.className = 'body2-txt';
      typeLabel.textContent = `${label}:`;
      typeLabel.style.marginBottom = 'var(--size-element-gap-xs)';
      typeContainer.appendChild(typeLabel);
      
      const pagination = PlusInterface.createPagination({
        currentPage: 5,
        totalPages: 10,
        type: type,
        size: 'default',
        onPageChange: (page) => console.log(`${type} pagination - Page:`, page)
      });
      
      typeContainer.appendChild(pagination);
      container.appendChild(typeContainer);
    });
    
    return container;
  },
};


