/**
 * Form Content Variants Stories
 * Content variants organized under "Content Variants" subcategory
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Form/Content Variants',
  tags: ['autodocs'],
};

/**
 * Select with Options
 * Select dropdown with multiple options
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
  
  container.appendChild(select);
  return container;
};

/**
 * Select Multiple with Many Options
 * Multiple select with scrollable list
 */
export const SelectMultipleWithManyOptions = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
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
};

/**
 * Textarea with Multiple Rows
 * Textarea with specified rows
 */
export const TextareaWithRows = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const textarea = PlusInterface.createTextarea({
    placeholder: 'Enter multiple lines of text...',
    size: 'medium',
    rows: 5
  });
  
  container.appendChild(textarea);
  return container;
};

/**
 * Range Input with Custom Range
 * Range input with custom min/max values
 */
export const RangeInputWithCustomRange = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '400px';
  
  const range1 = PlusInterface.createRangeInput({
    size: 'medium',
    min: 0,
    max: 100,
    value: 25
  });
  const range1Label = document.createElement('div');
  range1Label.className = 'body2-txt';
  range1Label.textContent = 'Range 0-100, Value: 25';
  range1Label.style.marginBottom = '8px';
  container.appendChild(range1Label);
  container.appendChild(range1);
  
  const range2 = PlusInterface.createRangeInput({
    size: 'medium',
    min: 0,
    max: 50,
    value: 30
  });
  const range2Label = document.createElement('div');
  range2Label.className = 'body2-txt';
  range2Label.textContent = 'Range 0-50, Value: 30';
  range2Label.style.marginBottom = '8px';
  container.appendChild(range2Label);
  container.appendChild(range2);
  
  return container;
};






