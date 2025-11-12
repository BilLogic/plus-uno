/**
 * Input States Stories
 * State variants organized under "States" subcategory
 */

export default {
  title: 'Atoms/Input/States',
  tags: ['autodocs'],
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
    container.style.width = 'var(--size-card-pad-x-lg)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Default';
    container.appendChild(label);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Enter text...';
    container.appendChild(input);
    
    return container;
  },
};

/**
 * With Value
 */
export const WithValue = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'With Value';
    container.appendChild(label);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Enter text...';
    input.value = 'Sample text';
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
    container.style.width = 'var(--size-card-pad-x-lg)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Disabled';
    container.appendChild(label);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Enter text...';
    input.disabled = true;
    container.appendChild(input);
    
    return container;
  },
};

/**
 * Disabled with Value
 */
export const DisabledWithValue = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Disabled with Value';
    container.appendChild(label);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Enter text...';
    input.value = 'Disabled text';
    input.disabled = true;
    container.appendChild(input);
    
    return container;
  },
};

/**
 * All States Comparison
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    
    const states = [
      { label: 'Default', disabled: false, value: '' },
      { label: 'With Value', disabled: false, value: 'Sample text' },
      { label: 'Disabled', disabled: true, value: '' },
      { label: 'Disabled with Value', disabled: true, value: 'Disabled text' },
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
      input.placeholder = 'Enter text...';
      input.value = state.value;
      input.disabled = state.disabled;
      wrapper.appendChild(input);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

