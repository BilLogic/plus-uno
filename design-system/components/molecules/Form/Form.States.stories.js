/**
 * Form States Stories
 * State variants organized under "States" subcategory
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Form/States',
  tags: ['autodocs'],
};

/**
 * Textarea - Default State
 */
export const TextareaDefault = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const small = PlusInterface.createTextarea({
    placeholder: 'Placeholder',
    size: 'small'
  });
  const smallLabel = document.createElement('div');
  smallLabel.className = 'body2-txt';
  smallLabel.textContent = 'Small - Placeholder';
  smallLabel.style.marginBottom = '8px';
  container.appendChild(smallLabel);
  container.appendChild(small);
  
  const medium = PlusInterface.createTextarea({
    placeholder: 'Placeholder',
    size: 'medium'
  });
  const mediumLabel = document.createElement('div');
  mediumLabel.className = 'body2-txt';
  mediumLabel.textContent = 'Medium - Placeholder';
  mediumLabel.style.marginBottom = '8px';
  container.appendChild(mediumLabel);
  container.appendChild(medium);
  
  const large = PlusInterface.createTextarea({
    placeholder: 'Placeholder',
    size: 'large'
  });
  const largeLabel = document.createElement('div');
  largeLabel.className = 'body2-txt';
  largeLabel.textContent = 'Large - Placeholder';
  largeLabel.style.marginBottom = '8px';
  container.appendChild(largeLabel);
  container.appendChild(large);
  
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
  
  const small = PlusInterface.createTextarea({
    value: 'Value',
    size: 'small'
  });
  const smallLabel = document.createElement('div');
  smallLabel.className = 'body2-txt';
  smallLabel.textContent = 'Small - With Value';
  smallLabel.style.marginBottom = '8px';
  container.appendChild(smallLabel);
  container.appendChild(small);
  
  const medium = PlusInterface.createTextarea({
    value: 'Value',
    size: 'medium'
  });
  const mediumLabel = document.createElement('div');
  mediumLabel.className = 'body2-txt';
  mediumLabel.textContent = 'Medium - With Value';
  mediumLabel.style.marginBottom = '8px';
  container.appendChild(mediumLabel);
  container.appendChild(medium);
  
  const large = PlusInterface.createTextarea({
    value: 'Value',
    size: 'large'
  });
  const largeLabel = document.createElement('div');
  largeLabel.className = 'body2-txt';
  largeLabel.textContent = 'Large - With Value';
  largeLabel.style.marginBottom = '8px';
  container.appendChild(largeLabel);
  container.appendChild(large);
  
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
  
  const small = PlusInterface.createTextarea({
    placeholder: 'Placeholder',
    size: 'small',
    readonly: true
  });
  const smallLabel = document.createElement('div');
  smallLabel.className = 'body2-txt';
  smallLabel.textContent = 'Small - Read-only';
  smallLabel.style.marginBottom = '8px';
  container.appendChild(smallLabel);
  container.appendChild(small);
  
  const medium = PlusInterface.createTextarea({
    value: 'Value',
    size: 'medium',
    readonly: true
  });
  const mediumLabel = document.createElement('div');
  mediumLabel.className = 'body2-txt';
  mediumLabel.textContent = 'Medium - Read-only (with value)';
  mediumLabel.style.marginBottom = '8px';
  container.appendChild(mediumLabel);
  container.appendChild(medium);
  
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
  
  const small = PlusInterface.createTextarea({
    placeholder: 'Placeholder',
    size: 'small',
    disabled: true
  });
  const smallLabel = document.createElement('div');
  smallLabel.className = 'body2-txt';
  smallLabel.textContent = 'Small - Disabled';
  smallLabel.style.marginBottom = '8px';
  container.appendChild(smallLabel);
  container.appendChild(small);
  
  const medium = PlusInterface.createTextarea({
    value: 'Value',
    size: 'medium',
    disabled: true
  });
  const mediumLabel = document.createElement('div');
  mediumLabel.className = 'body2-txt';
  mediumLabel.textContent = 'Medium - Disabled (with value)';
  mediumLabel.style.marginBottom = '8px';
  container.appendChild(mediumLabel);
  container.appendChild(medium);
  
  return container;
};

/**
 * Select - Default State
 */
export const SelectDefault = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const small = PlusInterface.createSelect({
    placeholder: 'Select Form',
    size: 'small',
    options: []
  });
  const smallLabel = document.createElement('div');
  smallLabel.className = 'body2-txt';
  smallLabel.textContent = 'Small - Placeholder';
  smallLabel.style.marginBottom = '8px';
  container.appendChild(smallLabel);
  container.appendChild(small);
  
  const medium = PlusInterface.createSelect({
    placeholder: 'Select Form',
    size: 'medium',
    options: []
  });
  const mediumLabel = document.createElement('div');
  mediumLabel.className = 'body2-txt';
  mediumLabel.textContent = 'Medium - Placeholder';
  mediumLabel.style.marginBottom = '8px';
  container.appendChild(mediumLabel);
  container.appendChild(medium);
  
  const large = PlusInterface.createSelect({
    placeholder: 'Select Form',
    size: 'large',
    options: []
  });
  const largeLabel = document.createElement('div');
  largeLabel.className = 'body2-txt';
  largeLabel.textContent = 'Large - Placeholder';
  largeLabel.style.marginBottom = '8px';
  container.appendChild(largeLabel);
  container.appendChild(large);
  
  return container;
};

/**
 * Select - With Value
 */
export const SelectWithValue = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const small = PlusInterface.createSelect({
    size: 'small',
    options: [
      { value: 'option1', text: 'Select Form', selected: true }
    ]
  });
  const smallLabel = document.createElement('div');
  smallLabel.className = 'body2-txt';
  smallLabel.textContent = 'Small - With Value';
  smallLabel.style.marginBottom = '8px';
  container.appendChild(smallLabel);
  container.appendChild(small);
  
  const medium = PlusInterface.createSelect({
    size: 'medium',
    options: [
      { value: 'option1', text: 'Select Form', selected: true }
    ]
  });
  const mediumLabel = document.createElement('div');
  mediumLabel.className = 'body2-txt';
  mediumLabel.textContent = 'Medium - With Value';
  mediumLabel.style.marginBottom = '8px';
  container.appendChild(mediumLabel);
  container.appendChild(medium);
  
  const large = PlusInterface.createSelect({
    size: 'large',
    options: [
      { value: 'option1', text: 'Select Form', selected: true }
    ]
  });
  const largeLabel = document.createElement('div');
  largeLabel.className = 'body2-txt';
  largeLabel.textContent = 'Large - With Value';
  largeLabel.style.marginBottom = '8px';
  container.appendChild(largeLabel);
  container.appendChild(large);
  
  return container;
};

/**
 * Select - Read-only State
 */
export const SelectReadOnly = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const small = PlusInterface.createSelect({
    placeholder: 'Select Form',
    size: 'small',
    readonly: true,
    options: []
  });
  const smallLabel = document.createElement('div');
  smallLabel.className = 'body2-txt';
  smallLabel.textContent = 'Small - Read-only';
  smallLabel.style.marginBottom = '8px';
  container.appendChild(smallLabel);
  container.appendChild(small);
  
  const medium = PlusInterface.createSelect({
    size: 'medium',
    readonly: true,
    options: [
      { value: 'option1', text: 'Select Form', selected: true }
    ]
  });
  const mediumLabel = document.createElement('div');
  mediumLabel.className = 'body2-txt';
  mediumLabel.textContent = 'Medium - Read-only (with value)';
  mediumLabel.style.marginBottom = '8px';
  container.appendChild(mediumLabel);
  container.appendChild(medium);
  
  return container;
};

/**
 * Select - Disabled State
 */
export const SelectDisabled = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const small = PlusInterface.createSelect({
    placeholder: 'Select Form',
    size: 'small',
    disabled: true,
    options: []
  });
  const smallLabel = document.createElement('div');
  smallLabel.className = 'body2-txt';
  smallLabel.textContent = 'Small - Disabled';
  smallLabel.style.marginBottom = '8px';
  container.appendChild(smallLabel);
  container.appendChild(small);
  
  const medium = PlusInterface.createSelect({
    size: 'medium',
    disabled: true,
    options: [
      { value: 'option1', text: 'Select Form', selected: true }
    ]
  });
  const mediumLabel = document.createElement('div');
  mediumLabel.className = 'body2-txt';
  mediumLabel.textContent = 'Medium - Disabled (with value)';
  mediumLabel.style.marginBottom = '8px';
  container.appendChild(mediumLabel);
  container.appendChild(medium);
  
  return container;
};

/**
 * Range Input - All Sizes
 */
export const RangeInputAllSizes = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const small = PlusInterface.createRangeInput({
    size: 'small',
    value: 50
  });
  const smallLabel = document.createElement('div');
  smallLabel.className = 'body2-txt';
  smallLabel.textContent = 'Small';
  smallLabel.style.marginBottom = '8px';
  container.appendChild(smallLabel);
  container.appendChild(small);
  
  const medium = PlusInterface.createRangeInput({
    size: 'medium',
    value: 50
  });
  const mediumLabel = document.createElement('div');
  mediumLabel.className = 'body2-txt';
  mediumLabel.textContent = 'Medium';
  mediumLabel.style.marginBottom = '8px';
  container.appendChild(mediumLabel);
  container.appendChild(medium);
  
  const large = PlusInterface.createRangeInput({
    size: 'large',
    value: 50
  });
  const largeLabel = document.createElement('div');
  largeLabel.className = 'body2-txt';
  largeLabel.textContent = 'Large';
  largeLabel.style.marginBottom = '8px';
  container.appendChild(largeLabel);
  container.appendChild(large);
  
  return container;
};

/**
 * Range Input - Disabled State
 */
export const RangeInputDisabled = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const small = PlusInterface.createRangeInput({
    size: 'small',
    value: 50,
    disabled: true
  });
  const smallLabel = document.createElement('div');
  smallLabel.className = 'body2-txt';
  smallLabel.textContent = 'Small - Disabled';
  smallLabel.style.marginBottom = '8px';
  container.appendChild(smallLabel);
  container.appendChild(small);
  
  const medium = PlusInterface.createRangeInput({
    size: 'medium',
    value: 50,
    disabled: true
  });
  const mediumLabel = document.createElement('div');
  mediumLabel.className = 'body2-txt';
  mediumLabel.textContent = 'Medium - Disabled';
  mediumLabel.style.marginBottom = '8px';
  container.appendChild(mediumLabel);
  container.appendChild(medium);
  
  return container;
};


