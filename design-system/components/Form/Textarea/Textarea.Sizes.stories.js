/**
 * Textarea Size Variants Stories
 * Size variants for textarea elements
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Form/Textarea/Sizes',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Textarea size variants: small, medium (default), and large. Sizes affect typography and padding.',
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
    
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: 'small'
    });
    container.appendChild(textarea);
    
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
    
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: 'medium'
    });
    container.appendChild(textarea);
    
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
    
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: 'large'
    });
    container.appendChild(textarea);
    
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
      
      const textarea = PlusInterface.createTextarea({
        placeholder: 'Placeholder',
        size: size
      });
      wrapper.appendChild(textarea);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

