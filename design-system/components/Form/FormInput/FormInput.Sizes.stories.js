/**
 * Form Input Size Variants Stories
 * Size variants for text input elements
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Form/FormInput/Sizes',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Form input size variants: small, medium (default), and large. Sizes affect typography and padding.',
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
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body3-txt';
    input.placeholder = 'Placeholder';
    container.appendChild(input);
    
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
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Placeholder';
    container.appendChild(input);
    
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
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body1-txt';
    input.placeholder = 'Placeholder';
    container.appendChild(input);
    
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
    
    const sizes = [
      { class: 'body3-txt', label: 'Small', size: 'small' },
      { class: 'body2-txt', label: 'Medium (Default)', size: 'medium' },
      { class: 'body1-txt', label: 'Large', size: 'large' }
    ];
    
    sizes.forEach((size) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const label = document.createElement('label');
      label.className = 'body3-txt';
      label.textContent = size.label;
      wrapper.appendChild(label);
      
      const input = document.createElement('input');
      input.type = 'text';
      input.className = `plus-text-field ${size.class}`;
      input.placeholder = 'Placeholder';
      wrapper.appendChild(input);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

