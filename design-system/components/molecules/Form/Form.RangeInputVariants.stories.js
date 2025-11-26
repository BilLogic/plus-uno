/**
 * Form Range Input Variants Stories
 * Range Input variants organized under "Range Input Variants" subcategory
 * Shows all range input variations: sizes, states, and value ranges
 */

import { PlusInterface } from '../../index.js';

export default {
  title: 'Molecules/Form/Range Input Variants',
  tags: ['autodocs'],
};

/**
 * Range Input - Small Size
 */
export const RangeInputSmall = () => {
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
  
  const rangeInput = PlusInterface.createRangeInput({
    size: 'small',
    value: 50
  });
  container.appendChild(rangeInput);
  
  return container;
};

/**
 * Range Input - Medium Size (Default)
 */
export const RangeInputMedium = () => {
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
  
  const rangeInput = PlusInterface.createRangeInput({
    size: 'medium',
    value: 50
  });
  container.appendChild(rangeInput);
  
  return container;
};

/**
 * Range Input - Large Size
 */
export const RangeInputLarge = () => {
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
  
  const rangeInput = PlusInterface.createRangeInput({
    size: 'large',
    value: 50
  });
  container.appendChild(rangeInput);
  
  return container;
};

/**
 * Range Input - Default State
 */
export const RangeInputDefault = () => {
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
    label.textContent = sizeLabels[index];
    wrapper.appendChild(label);
    
    const rangeInput = PlusInterface.createRangeInput({
      size: size,
      value: 50
    });
    wrapper.appendChild(rangeInput);
    
    container.appendChild(wrapper);
  });
  
  return container;
};

/**
 * Range Input - With Different Values
 */
export const RangeInputWithValues = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const values = [
    { label: 'Value: 0', value: 0 },
    { label: 'Value: 25', value: 25 },
    { label: 'Value: 50', value: 50 },
    { label: 'Value: 75', value: 75 },
    { label: 'Value: 100', value: 100 }
  ];
  
  values.forEach((item) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = item.label;
    wrapper.appendChild(label);
    
    const rangeInput = PlusInterface.createRangeInput({
      size: 'medium',
      value: item.value
    });
    wrapper.appendChild(rangeInput);
    
    container.appendChild(wrapper);
  });
  
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
    
    const rangeInput = PlusInterface.createRangeInput({
      size: size,
      value: 50,
      disabled: true
    });
    wrapper.appendChild(rangeInput);
    
    container.appendChild(wrapper);
  });
  
  return container;
};

/**
 * Range Input - Custom Range (0-100)
 */
export const RangeInputCustomRange100 = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const rangeInput = PlusInterface.createRangeInput({
    size: 'medium',
    min: 0,
    max: 100,
    value: 25
  });
  
  const label = document.createElement('label');
  label.className = 'body3-txt';
  label.textContent = 'Range 0-100, Value: 25';
  label.style.marginBottom = 'var(--size-element-gap-xs)';
  container.appendChild(label);
  container.appendChild(rangeInput);
  
  return container;
};

/**
 * Range Input - Custom Range (0-50)
 */
export const RangeInputCustomRange50 = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const rangeInput = PlusInterface.createRangeInput({
    size: 'medium',
    min: 0,
    max: 50,
    value: 30
  });
  
  const label = document.createElement('label');
  label.className = 'body3-txt';
  label.textContent = 'Range 0-50, Value: 30';
  label.style.marginBottom = 'var(--size-element-gap-xs)';
  container.appendChild(label);
  container.appendChild(rangeInput);
  
  return container;
};

/**
 * Range Input - With Step
 */
export const RangeInputWithStep = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const steps = [
    { label: 'Step: 1 (default)', step: 1, value: 50 },
    { label: 'Step: 5', step: 5, value: 50 },
    { label: 'Step: 10', step: 10, value: 50 },
    { label: 'Step: 25', step: 25, value: 50 }
  ];
  
  steps.forEach((item) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = item.label;
    wrapper.appendChild(label);
    
    const rangeInput = PlusInterface.createRangeInput({
      size: 'medium',
      value: item.value,
      step: item.step
    });
    wrapper.appendChild(rangeInput);
    
    container.appendChild(wrapper);
  });
  
  return container;
};

/**
 * All Range Input Variants Comparison
 */
export const AllRangeInputVariants = () => {
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
    
    const rangeInput = PlusInterface.createRangeInput({
      size: size,
      value: 50
    });
    wrapper.appendChild(rangeInput);
    
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
    { label: 'Default (Value: 50)', value: 50, disabled: false },
    { label: 'Value: 0', value: 0, disabled: false },
    { label: 'Value: 100', value: 100, disabled: false },
    { label: 'Disabled (Value: 50)', value: 50, disabled: true }
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
    
    const rangeInput = PlusInterface.createRangeInput({
      size: 'medium',
      value: state.value,
      disabled: state.disabled
    });
    wrapper.appendChild(rangeInput);
    
    statesContainer.appendChild(wrapper);
  });
  
  statesSection.appendChild(statesContainer);
  container.appendChild(statesSection);
  
  // Custom Ranges Section
  const rangesSection = document.createElement('div');
  const rangesLabel = document.createElement('h3');
  rangesLabel.textContent = 'Custom Ranges';
  rangesLabel.style.marginBottom = '24px';
  rangesSection.appendChild(rangesLabel);
  
  const rangesContainer = document.createElement('div');
  rangesContainer.style.display = 'flex';
  rangesContainer.style.flexDirection = 'column';
  rangesContainer.style.gap = '24px';
  rangesContainer.style.maxWidth = '400px';
  
  const ranges = [
    { label: 'Range 0-100, Value: 25', min: 0, max: 100, value: 25 },
    { label: 'Range 0-50, Value: 30', min: 0, max: 50, value: 30 },
    { label: 'Range 10-90, Value: 50', min: 10, max: 90, value: 50 }
  ];
  
  ranges.forEach((range) => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = range.label;
    wrapper.appendChild(label);
    
    const rangeInput = PlusInterface.createRangeInput({
      size: 'medium',
      min: range.min,
      max: range.max,
      value: range.value
    });
    wrapper.appendChild(rangeInput);
    
    rangesContainer.appendChild(wrapper);
  });
  
  rangesSection.appendChild(rangesContainer);
  container.appendChild(rangesSection);
  
  return container;
};



