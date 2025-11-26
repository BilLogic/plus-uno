/**
 * Form Size Variants Stories
 * Size variants organized under "Size Variants" subcategory
 * Shows all form components (input, textarea, select) in different sizes
 */

import { PlusInterface } from '../../index.js';

export default {
  title: 'Molecules/Form/Size Variants',
  tags: ['autodocs'],
};

/**
 * Form Input - Small Size
 */
export const FormInputSmall = () => {
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
};

/**
 * Form Input - Medium Size (Default)
 */
export const FormInputMedium = () => {
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
};

/**
 * Form Input - Large Size
 */
export const FormInputLarge = () => {
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
};

/**
 * Form Textarea - Small Size
 */
export const FormTextareaSmall = () => {
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
 * Form Textarea - Medium Size (Default)
 */
export const FormTextareaMedium = () => {
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
 * Form Textarea - Large Size
 */
export const FormTextareaLarge = () => {
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
 * Form Select - Small Size
 */
export const FormSelectSmall = () => {
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
};

/**
 * Form Select - Medium Size (Default)
 */
export const FormSelectMedium = () => {
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
};

/**
 * Form Select - Large Size
 */
export const FormSelectLarge = () => {
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
};

/**
 * All Form Sizes Comparison
 */
export const AllFormSizes = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  // Form Input Section
  const inputSection = document.createElement('div');
  const inputLabel = document.createElement('h3');
  inputLabel.textContent = 'Form Input';
  inputLabel.style.marginBottom = '24px';
  inputSection.appendChild(inputLabel);
  
  const inputContainer = document.createElement('div');
  inputContainer.style.display = 'flex';
  inputContainer.style.flexDirection = 'column';
  inputContainer.style.gap = '24px';
  inputContainer.style.maxWidth = '400px';
  
  const inputSizes = [
    { class: 'body3-txt', label: 'Small', size: 'small' },
    { class: 'body2-txt', label: 'Medium (Default)', size: 'medium' },
    { class: 'body1-txt', label: 'Large', size: 'large' }
  ];
  
  inputSizes.forEach((size) => {
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
    
    inputContainer.appendChild(wrapper);
  });
  
  inputSection.appendChild(inputContainer);
  container.appendChild(inputSection);
  
  // Form Textarea Section
  const textareaSection = document.createElement('div');
  const textareaLabel = document.createElement('h3');
  textareaLabel.textContent = 'Form Textarea';
  textareaLabel.style.marginBottom = '24px';
  textareaSection.appendChild(textareaLabel);
  
  const textareaContainer = document.createElement('div');
  textareaContainer.style.display = 'flex';
  textareaContainer.style.flexDirection = 'column';
  textareaContainer.style.gap = '24px';
  textareaContainer.style.maxWidth = '400px';
  
  const textareaSizes = ['small', 'medium', 'large'];
  const textareaSizeLabels = ['Small', 'Medium (Default)', 'Large'];
  
  textareaSizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = textareaSizeLabels[index];
    wrapper.appendChild(label);
    
    const textarea = PlusInterface.createTextarea({
      placeholder: 'Placeholder',
      size: size
    });
    wrapper.appendChild(textarea);
    
    textareaContainer.appendChild(wrapper);
  });
  
  textareaSection.appendChild(textareaContainer);
  container.appendChild(textareaSection);
  
  // Form Select Section
  const selectSection = document.createElement('div');
  const selectLabel = document.createElement('h3');
  selectLabel.textContent = 'Form Select';
  selectLabel.style.marginBottom = '24px';
  selectSection.appendChild(selectLabel);
  
  const selectContainer = document.createElement('div');
  selectContainer.style.display = 'flex';
  selectContainer.style.flexDirection = 'column';
  selectContainer.style.gap = '24px';
  selectContainer.style.maxWidth = '400px';
  
  textareaSizes.forEach((size, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = textareaSizeLabels[index];
    wrapper.appendChild(label);
    
    const select = PlusInterface.createSelect({
      placeholder: 'Select Form',
      size: size,
      options: []
    });
    wrapper.appendChild(select);
    
    selectContainer.appendChild(wrapper);
  });
  
  selectSection.appendChild(selectContainer);
  container.appendChild(selectSection);
  
  return container;
};



