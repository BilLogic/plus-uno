/**
 * Textarea State Variants Stories
 * State variants for textarea elements
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Form/Textarea/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Textarea state variants: default, focus, read-only, and disabled.',
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
    
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: 'medium'
    });
    container.appendChild(textarea);
    
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
    
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: 'medium'
    });
    // Auto-focus for demonstration
    setTimeout(() => textarea.focus(), 100);
    container.appendChild(textarea);
    
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
    
    const textarea = PlusInterface.createTextarea({
      value: 'Read-only value',
      size: 'medium',
      readonly: true
    });
    container.appendChild(textarea);
    
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
    
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: 'medium',
      disabled: true
    });
    container.appendChild(textarea);
    
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
      
      const textarea = PlusInterface.createTextarea({
        placeholder: state.placeholder,
        value: state.value,
        size: 'medium',
        readonly: state.readonly,
        disabled: state.disabled
      });
      wrapper.appendChild(textarea);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};


