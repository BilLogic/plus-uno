/**
 * Form Select Variants Stories
 * Select variants organized under "Select Variants" subcategory
 * Shows all select variations: sizes, states, and content variants
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Form/Select Variants',
  tags: ['autodocs'],
};

/**
 * Select - Small Size
 */
export const SelectSmall = () => {
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
 * Select - Medium Size (Default)
 */
export const SelectMedium = () => {
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
 * Select - Large Size
 */
export const SelectLarge = () => {
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
 * Select - Default State (Placeholder)
 */
export const SelectDefault = () => {
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
    
    const select = PlusInterface.createSelect({
      placeholder: 'Select Form',
      size: size,
      options: []
    });
    wrapper.appendChild(select);
    
    container.appendChild(wrapper);
  });
  
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
    
    const select = PlusInterface.createSelect({
      size: size,
      options: [
        { value: 'option1', text: 'Select Form', selected: true }
      ]
    });
    wrapper.appendChild(select);
    
    container.appendChild(wrapper);
  });
  
  return container;
};

/**
 * Select - Focus State
 */
export const SelectFocus = () => {
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
    
    const select = PlusInterface.createSelect({
      placeholder: 'Select Form',
      size: size,
      options: []
    });
    // Auto-focus the first one for demonstration
    if (index === 0) {
      setTimeout(() => {
        const selectElement = select.querySelector('select');
        if (selectElement) {
          selectElement.focus();
        }
      }, 100);
    }
    wrapper.appendChild(select);
    
    container.appendChild(wrapper);
  });
  
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
    
    const select = PlusInterface.createSelect({
      placeholder: index === 0 ? 'Select Form' : '',
      size: size,
      readonly: true,
      options: index === 0 ? [] : [
        { value: 'option1', text: 'Select Form', selected: true }
      ]
    });
    wrapper.appendChild(select);
    
    container.appendChild(wrapper);
  });
  
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
    
    const select = PlusInterface.createSelect({
      placeholder: index === 0 ? 'Select Form' : '',
      size: size,
      disabled: true,
      options: index === 0 ? [] : [
        { value: 'option1', text: 'Select Form', selected: true }
      ]
    });
    wrapper.appendChild(select);
    
    container.appendChild(wrapper);
  });
  
  return container;
};

/**
 * Select - With Options
 */
export const SelectWithOptions = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const select = PlusInterface.createSelect({
    placeholder: 'Select an option',
    size: 'medium',
    options: [
      { value: 'option1', text: 'Option 1', selected: false },
      { value: 'option2', text: 'Option 2', selected: true },
      { value: 'option3', text: 'Option 3', selected: false },
      { value: 'option4', text: 'Option 4', selected: false }
    ]
  });
  
  const label = document.createElement('label');
  label.className = 'body3-txt';
  label.textContent = 'With Multiple Options';
  label.style.marginBottom = 'var(--size-element-gap-xs)';
  container.appendChild(label);
  container.appendChild(select);
  
  return container;
};

/**
 * All Select Variants Comparison
 */
export const AllSelectVariants = () => {
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
    
    const select = PlusInterface.createSelect({
      placeholder: 'Select Form',
      size: size,
      options: []
    });
    wrapper.appendChild(select);
    
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
    { label: 'Default (Placeholder)', placeholder: 'Select Form', value: null, readonly: false, disabled: false },
    { label: 'With Value', placeholder: '', value: 'Select Form', readonly: false, disabled: false },
    { label: 'Read-only (with value)', placeholder: '', value: 'Select Form', readonly: true, disabled: false },
    { label: 'Disabled (Placeholder)', placeholder: 'Select Form', value: null, readonly: false, disabled: true },
    { label: 'Disabled (with value)', placeholder: '', value: 'Select Form', readonly: false, disabled: true }
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
    
    const select = PlusInterface.createSelect({
      placeholder: state.placeholder,
      size: 'medium',
      readonly: state.readonly,
      disabled: state.disabled,
      options: state.value ? [
        { value: 'option1', text: state.value, selected: true }
      ] : []
    });
    wrapper.appendChild(select);
    
    statesContainer.appendChild(wrapper);
  });
  
  statesSection.appendChild(statesContainer);
  container.appendChild(statesSection);
  
  return container;
};



