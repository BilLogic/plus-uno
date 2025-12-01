/**
 * Select Size Variants Stories
 * Size variants for select elements
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Form/Select/Sizes',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Select size variants: small, medium (default), and large. Sizes affect typography and padding.',
      },
    },
  },
};

/**
 * Small Size
 */
export const Small = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Small';
    container.appendChild(label);
    
    const select = PlusInterface.createSelect({
      placeholder: 'Select Form',
      size: 'small',
      options: []
    });
    container.appendChild(select);
    
    return container;
  },
};

/**
 * Default Size
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Medium (Default)';
    container.appendChild(label);
    
    const select = PlusInterface.createSelect({
      placeholder: 'Select Form',
      size: 'medium',
      options: []
    });
    container.appendChild(select);
    
    return container;
  },
};

/**
 * Large Size
 */
export const Large = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '400px';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Large';
    container.appendChild(label);
    
    const select = PlusInterface.createSelect({
      placeholder: 'Select Form',
      size: 'large',
      options: []
    });
    container.appendChild(select);
    
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
    container.style.gap = '24px';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '400px';
    
    const sizes = ['small', 'medium', 'large'];
    const sizeLabels = ['Small', 'Medium (Default)', 'Large'];
    
    sizes.forEach((size, index) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const label = document.createElement('label');
      label.className = 'body3-txt';
      label.textContent = sizeLabels[index];
      wrapper.appendChild(label);
      
      const select = PlusInterface.createSelect({
        placeholder: 'Select Form',
        size: size,
        options: []
      });
      wrapper.appendChild(select);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

