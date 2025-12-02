/**
 * Select Content Variants Stories
 * Content variants for select elements (including SelectMultiple)
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Form/Select/Content',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Select content variants: single select with options and multiple select.',
      },
    },
  },
};

/**
 * With Options
 */
export const WithOptions = {
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
    label.textContent = 'With Multiple Options';
    container.appendChild(label);
    
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
    container.appendChild(select);
    
    return container;
  },
};

/**
 * Select Multiple
 */
export const SelectMultiple = {
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
    label.textContent = 'Select Multiple';
    container.appendChild(label);
    
    const selectMultiple = PlusInterface.createSelectMultiple({
      size: 'medium',
      options: [
        { value: 'form1', text: 'Form 1', selected: true },
        { value: 'form2', text: 'Form 2', selected: false },
        { value: 'form3', text: 'Form 3', selected: true },
        { value: 'form4', text: 'Form 4', selected: false },
        { value: 'form5', text: 'Form 5', selected: false }
      ]
    });
    container.appendChild(selectMultiple);
    
    return container;
  },
};

/**
 * All Content Variants
 */
export const AllContent = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '24px';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '400px';
    
    // Single Select with Options
    const singleWrapper = document.createElement('div');
    singleWrapper.style.display = 'flex';
    singleWrapper.style.flexDirection = 'column';
    singleWrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const singleLabel = document.createElement('label');
    singleLabel.className = 'body3-txt';
    singleLabel.textContent = 'Single Select with Options';
    singleWrapper.appendChild(singleLabel);
    
    const select = PlusInterface.createSelect({
      placeholder: 'Select an option',
      size: 'medium',
      options: [
        { value: 'option1', text: 'Option 1', selected: false },
        { value: 'option2', text: 'Option 2', selected: true },
        { value: 'option3', text: 'Option 3', selected: false }
      ]
    });
    singleWrapper.appendChild(select);
    container.appendChild(singleWrapper);
    
    // Select Multiple
    const multipleWrapper = document.createElement('div');
    multipleWrapper.style.display = 'flex';
    multipleWrapper.style.flexDirection = 'column';
    multipleWrapper.style.gap = 'var(--size-element-gap-xs)';
    
    const multipleLabel = document.createElement('label');
    multipleLabel.className = 'body3-txt';
    multipleLabel.textContent = 'Select Multiple';
    multipleWrapper.appendChild(multipleLabel);
    
    const selectMultiple = PlusInterface.createSelectMultiple({
      size: 'medium',
      options: [
        { value: 'form1', text: 'Form 1', selected: true },
        { value: 'form2', text: 'Form 2', selected: false },
        { value: 'form3', text: 'Form 3', selected: true }
      ]
    });
    multipleWrapper.appendChild(selectMultiple);
    container.appendChild(multipleWrapper);
    
    return container;
  },
};


