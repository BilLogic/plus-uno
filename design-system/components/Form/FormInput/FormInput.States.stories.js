/**
 * Form Input State Variants Stories
 * State variants for text input elements
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Form/FormInput/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Form input state variants: default, focus, read-only, and disabled.',
      },
    },
  },
};

/**
 * Default State
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
    label.textContent = 'Default';
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
 * Focus State
 */
export const Focus = {
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
    label.textContent = 'Focus';
    container.appendChild(label);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Placeholder';
    container.appendChild(input);
    
    // Auto-focus for demonstration
    setTimeout(() => input.focus(), 100);
    
    return container;
  },
};

/**
 * Read-only State
 */
export const ReadOnly = {
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
    label.textContent = 'Read-only';
    container.appendChild(label);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.value = 'Read-only value';
    input.readOnly = true;
    container.appendChild(input);
    
    return container;
  },
};

/**
 * Disabled State
 */
export const Disabled = {
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
    label.textContent = 'Disabled';
    container.appendChild(label);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Placeholder';
    input.disabled = true;
    container.appendChild(input);
    
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
    container.style.gap = '24px';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '400px';
    
    const states = [
      { label: 'Default (Placeholder)', placeholder: 'Placeholder', value: '', readonly: false, disabled: false },
      { label: 'With Value', placeholder: '', value: 'Value', readonly: false, disabled: false },
      { label: 'Read-only (with value)', placeholder: '', value: 'Value', readonly: true, disabled: false },
      { label: 'Disabled (Placeholder)', placeholder: 'Placeholder', value: '', readonly: false, disabled: true },
      { label: 'Disabled (with value)', placeholder: '', value: 'Value', readonly: false, disabled: true }
    ];
    
    states.forEach((state) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      
      const label = document.createElement('label');
      label.className = 'body3-txt';
      label.textContent = state.label;
      wrapper.appendChild(label);
      
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'plus-text-field body2-txt';
      input.placeholder = state.placeholder;
      input.value = state.value;
      input.readOnly = state.readonly;
      input.disabled = state.disabled;
      wrapper.appendChild(input);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};


