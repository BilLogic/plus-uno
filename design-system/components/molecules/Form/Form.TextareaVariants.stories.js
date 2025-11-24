/**
 * Form Textarea Variants Stories
 * Textarea variants organized under "Textarea Variants" subcategory
 * Shows all textarea variations: sizes, states, and content variants
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Form/Textarea Variants',
  tags: ['autodocs'],
};

/**
 * Textarea - Small Size
 */
export const TextareaSmall = () => {
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
};

/**
 * Textarea - Medium Size (Default)
 */
export const TextareaMedium = () => {
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
};

/**
 * Textarea - Large Size
 */
export const TextareaLarge = () => {
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
};

/**
 * Textarea - Default State (Placeholder)
 */
export const TextareaDefault = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const sizes = ['small', 'medium', 'large'];
  const sizeLabels = ['Small', 'Medium', 'Large'];
  
  sizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = `${sizeLabels[index]} - Placeholder`;
    wrapper.appendChild(label);
    
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: size
    });
    wrapper.appendChild(textarea);
    
    container.appendChild(wrapper);
  });
  
  return container;
};

/**
 * Textarea - With Value
 */
export const TextareaWithValue = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const sizes = ['small', 'medium', 'large'];
  const sizeLabels = ['Small', 'Medium', 'Large'];
  
  sizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = `${sizeLabels[index]} - With Value`;
    wrapper.appendChild(label);
    
    const textarea = PlusInterface.createTextarea({
      value: 'Value',
      size: size
    });
    wrapper.appendChild(textarea);
    
    container.appendChild(wrapper);
  });
  
  return container;
};

/**
 * Textarea - Focus State
 */
export const TextareaFocus = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const sizes = ['small', 'medium', 'large'];
  const sizeLabels = ['Small', 'Medium', 'Large'];
  
  sizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = `${sizeLabels[index]} - Focus`;
    wrapper.appendChild(label);
    
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: size
    });
    // Auto-focus the first one for demonstration
    if (index === 0) {
      setTimeout(() => textarea.focus(), 100);
    }
    wrapper.appendChild(textarea);
    
    container.appendChild(wrapper);
  });
  
  return container;
};

/**
 * Textarea - Read-only State
 */
export const TextareaReadOnly = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const sizes = ['small', 'medium', 'large'];
  const sizeLabels = ['Small', 'Medium', 'Large'];
  
  sizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = `${sizeLabels[index]} - Read-only`;
    wrapper.appendChild(label);
    
    const textarea = PlusInterface.createTextarea({
      value: index === 0 ? 'Placeholder' : 'Value',
      size: size,
      readonly: true
    });
    wrapper.appendChild(textarea);
    
    container.appendChild(wrapper);
  });
  
  return container;
};

/**
 * Textarea - Disabled State
 */
export const TextareaDisabled = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const sizes = ['small', 'medium', 'large'];
  const sizeLabels = ['Small', 'Medium', 'Large'];
  
  sizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = `${sizeLabels[index]} - Disabled`;
    wrapper.appendChild(label);
    
    const textarea = PlusInterface.createTextarea({
      value: index === 0 ? '' : 'Value',
      placeholder: index === 0 ? 'Placeholder' : '',
      size: size,
      disabled: true
    });
    wrapper.appendChild(textarea);
    
    container.appendChild(wrapper);
  });
  
  return container;
};

/**
 * Textarea - With Multiple Rows
 */
export const TextareaWithRows = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const sizes = ['small', 'medium', 'large'];
  const sizeLabels = ['Small', 'Medium', 'Large'];
  
  sizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = `${sizeLabels[index]} - Multiple Rows`;
    wrapper.appendChild(label);
    
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Enter multiple lines of text...',
      size: size,
      rows: 5
    });
    wrapper.appendChild(textarea);
    
    container.appendChild(wrapper);
  });
  
  return container;
};

/**
 * Textarea - All Variants Comparison
 */
export const AllTextareaVariants = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  // Sizes Section
  const sizesSection = document.createElement('div');
  const sizesLabel = document.createElement('h3');
  sizesLabel.textContent = 'Sizes';
  sizesLabel.style.marginBottom = '24px';
  sizesSection.appendChild(sizesLabel);
  
  const sizesContainer = document.createElement('div');
  sizesContainer.style.display = 'flex';
  sizesContainer.style.flexDirection = 'column';
  sizesContainer.style.gap = '24px';
  sizesContainer.style.maxWidth = '400px';
  
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
    
    sizesContainer.appendChild(wrapper);
  });
  
  sizesSection.appendChild(sizesContainer);
  container.appendChild(sizesSection);
  
  // States Section
  const statesSection = document.createElement('div');
  const statesLabel = document.createElement('h3');
  statesLabel.textContent = 'States';
  statesLabel.style.marginBottom = '24px';
  statesSection.appendChild(statesLabel);
  
  const statesContainer = document.createElement('div');
  statesContainer.style.display = 'flex';
  statesContainer.style.flexDirection = 'column';
  statesContainer.style.gap = '24px';
  statesContainer.style.maxWidth = '400px';
  
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
    
    statesContainer.appendChild(wrapper);
  });
  
  statesSection.appendChild(statesContainer);
  container.appendChild(statesSection);
  
  return container;
};



