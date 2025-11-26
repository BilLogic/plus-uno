/**
 * Input Size Variants Stories
 * Size variants organized under "Size Variants" subcategory
 */

export default {
  title: 'Components/Input/Size Variants',
  tags: ['autodocs'],
};

/**
 * Body 1 Size
 */
export const Body1 = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Body 1';
    container.appendChild(label);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body1-txt';
    input.placeholder = 'Input with Body 1 size';
    container.appendChild(input);
    
    return container;
  },
};

/**
 * Body 2 Size (Default)
 */
export const Body2 = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Body 2 (Default)';
    container.appendChild(label);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Input with Body 2 size';
    container.appendChild(input);
    
    return container;
  },
};

/**
 * Body 3 Size
 */
export const Body3 = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-xs)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    
    const label = document.createElement('label');
    label.className = 'body3-txt';
    label.textContent = 'Body 3';
    container.appendChild(label);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body3-txt';
    input.placeholder = 'Input with Body 3 size';
    container.appendChild(input);
    
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
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.width = 'var(--size-card-pad-x-lg)';
    
    const sizes = [
      { class: 'body1-txt', label: 'Body 1' },
      { class: 'body2-txt', label: 'Body 2 (Default)' },
      { class: 'body3-txt', label: 'Body 3' },
    ];
    
    sizes.forEach((size) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      
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

