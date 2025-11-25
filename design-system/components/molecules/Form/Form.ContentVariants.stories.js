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






