/**
 * Input Atom Stories
 * Text fields and textareas (bare input elements)
 */

export default {
  title: 'Atoms/Input',
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'textarea'],
      description: 'Input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    value: {
      control: 'text',
      description: 'Input value',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    size: {
      control: 'select',
      options: ['body1-txt', 'body2-txt', 'body3-txt'],
      description: 'Input size class',
    },
  },
};

/**
 * Text Input
 */
export const TextInput = {
  render: (args) => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = `plus-text-field ${args.size || 'body2-txt'}`;
    input.placeholder = args.placeholder || 'Enter text...';
    input.value = args.value || '';
    input.disabled = args.disabled || false;
    return input;
  },
  args: {
    type: 'text',
    placeholder: 'Enter text...',
    value: '',
    disabled: false,
    size: 'body2-txt',
  },
};

/**
 * Textarea
 */
export const Textarea = {
  render: (args) => {
    const textarea = document.createElement('textarea');
    textarea.className = `plus-textarea ${args.size || 'body2-txt'}`;
    textarea.placeholder = args.placeholder || 'Enter text...';
    textarea.value = args.value || '';
    textarea.disabled = args.disabled || false;
    textarea.rows = 4;
    return textarea;
  },
  args: {
    type: 'textarea',
    placeholder: 'Enter text...',
    value: '',
    disabled: false,
    size: 'body2-txt',
  },
};

/**
 * Input Sizes
 */
export const Sizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '1rem';
    container.style.width = '400px';
    
    const sizes = [
      { class: 'body1-txt', label: 'Body 1' },
      { class: 'body2-txt', label: 'Body 2 (Default)' },
      { class: 'body3-txt', label: 'Body 3' },
    ];
    
    sizes.forEach((size) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = '0.25rem';
      
      const label = document.createElement('label');
      label.className = 'body3-txt';
      label.textContent = size.label;
      wrapper.appendChild(label);
      
      const input = document.createElement('input');
      input.type = 'text';
      input.className = `plus-text-field ${size.class}`;
      input.placeholder = `Input with ${size.label} size`;
      wrapper.appendChild(input);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

/**
 * Input States
 */
export const States = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '1rem';
    container.style.width = '400px';
    
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
      wrapper.style.gap = '0.25rem';
      
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

/**
 * Textarea Sizes
 */
export const TextareaSizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '1rem';
    container.style.width = '400px';
    
    const sizes = [
      { class: 'body1-txt', label: 'Body 1' },
      { class: 'body2-txt', label: 'Body 2 (Default)' },
      { class: 'body3-txt', label: 'Body 3' },
    ];
    
    sizes.forEach((size) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = '0.25rem';
      
      const label = document.createElement('label');
      label.className = 'body3-txt';
      label.textContent = `Textarea ${size.label}`;
      wrapper.appendChild(label);
      
      const textarea = document.createElement('textarea');
      textarea.className = `plus-textarea ${size.class}`;
      textarea.placeholder = `Textarea with ${size.label} size`;
      textarea.rows = 4;
      wrapper.appendChild(textarea);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

