/**
 * Pagination State Variants Stories
 * State variants for pagination elements
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Pagination/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Pagination state variants: first page, last page, middle page, and ellipsis.',
      },
    },
  },
};

/**
 * First Page
 */
export const FirstPage = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 1,
      totalPages: 10,
      type: 'icon',
      onPageChange: (page) => console.log('Page:', page)
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * Last Page
 */
export const LastPage = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 10,
      totalPages: 10,
      type: 'icon',
      onPageChange: (page) => console.log('Page:', page)
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * Middle Page
 */
export const MiddlePage = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 5,
      totalPages: 10,
      type: 'icon',
      onPageChange: (page) => console.log('Page:', page)
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * Ellipsis
 */
export const Ellipsis = {
  render: () => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const pagination = PlusInterface.createPagination({
      currentPage: 25,
      totalPages: 50,
      type: 'icon',
      maxVisible: 5,
      onPageChange: (page) => console.log('Page:', page)
    });
    
    container.appendChild(pagination);
    return container;
  },
};

/**
 * All States
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-md)';
    
    const states = [
      { label: 'First Page', currentPage: 1, totalPages: 10 },
      { label: 'Last Page', currentPage: 10, totalPages: 10 },
      { label: 'Middle Page', currentPage: 5, totalPages: 10 },
      { label: 'Many Pages with Ellipsis', currentPage: 25, totalPages: 50, maxVisible: 5 }
    ];
    
    states.forEach((state) => {
      const stateContainer = document.createElement('div');
      stateContainer.style.display = 'flex';
      stateContainer.style.flexDirection = 'column';
      stateContainer.style.gap = 'var(--size-element-gap-sm)';
      
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.textContent = `${state.label}:`;
      label.style.marginBottom = 'var(--size-element-gap-xs)';
      stateContainer.appendChild(label);
      
      const pagination = PlusInterface.createPagination({
        currentPage: state.currentPage,
        totalPages: state.totalPages,
        type: 'icon',
        size: 'default',
        maxVisible: state.maxVisible || 5,
        onPageChange: (page) => console.log('Page:', page)
      });
      
      stateContainer.appendChild(pagination);
      container.appendChild(stateContainer);
    });
    
    return container;
  },
};


