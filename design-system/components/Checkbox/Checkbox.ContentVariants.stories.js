/**
 * Checkbox Content Variants Stories
 * Content-based variants organized under "Content Variants" subcategory
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Checkbox/Content Variants',
  tags: ['autodocs'],
};

/**
 * Checkbox Group
 */
export const CheckboxGroup = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    const options = [
      { label: 'Option 1', value: 'option1', id: 'opt1', checked: false },
      { label: 'Option 2', value: 'option2', id: 'opt2', checked: true },
      { label: 'Option 3', value: 'option3', id: 'opt3', checked: false },
    ];
    
    const checkboxes = PlusInterface.createCheckboxGroup(options, 'options');
    checkboxes.forEach((checkbox) => {
      container.appendChild(checkbox);
    });
    
    return container;
  },
};

/**
 * Multiple Checkbox Groups
 */
export const MultipleGroups = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-lg)';
    
    // Group 1
    const group1Container = document.createElement('div');
    const group1Label = document.createElement('div');
    group1Label.className = 'h6';
    group1Label.textContent = 'Category 1';
    group1Label.style.marginBottom = 'var(--size-element-gap-sm)';
    group1Container.appendChild(group1Label);
    
    const group1Options = [
      { label: 'Item A', value: 'a', id: 'grp1-a', checked: false },
      { label: 'Item B', value: 'b', id: 'grp1-b', checked: true },
      { label: 'Item C', value: 'c', id: 'grp1-c', checked: false },
    ];
    const group1Checkboxes = PlusInterface.createCheckboxGroup(group1Options, 'group1');
    group1Checkboxes.forEach((checkbox) => {
      group1Container.appendChild(checkbox);
    });
    container.appendChild(group1Container);
    
    // Group 2
    const group2Container = document.createElement('div');
    const group2Label = document.createElement('div');
    group2Label.className = 'h6';
    group2Label.textContent = 'Category 2';
    group2Label.style.marginBottom = 'var(--size-element-gap-sm)';
    group2Container.appendChild(group2Label);
    
    const group2Options = [
      { label: 'Item X', value: 'x', id: 'grp2-x', checked: true },
      { label: 'Item Y', value: 'y', id: 'grp2-y', checked: false },
    ];
    const group2Checkboxes = PlusInterface.createCheckboxGroup(group2Options, 'group2');
    group2Checkboxes.forEach((checkbox) => {
      group2Container.appendChild(checkbox);
    });
    container.appendChild(group2Container);
    
    return container;
  },
};

/**
 * Check Type: None (Unchecked)
 * Default unchecked state
 */
export const CheckTypeNone = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Text',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-type-none',
      checked: false,
    });
    container.appendChild(checkbox);
    return container;
  },
};

/**
 * Check Type: Check (Checked)
 * Checked state with checkmark
 */
export const CheckTypeCheck = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Text',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-type-check',
      checked: true,
    });
    container.appendChild(checkbox);
    return container;
  },
};

/**
 * Check Type: Indeterminate
 * Indeterminate state with dash/minus
 */
export const CheckTypeIndeterminate = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Text',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-type-indeterminate',
      checked: false,
      indeterminate: true,
    });
    container.appendChild(checkbox);
    return container;
  },
};

/**
 * Required Checkbox
 * Checkbox with required asterisk indicator
 */
export const Required = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    const requiredChecked = PlusInterface.createCheckbox({
      label: 'Text',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-required-checked',
      checked: true,
      required: true,
    });
    container.appendChild(requiredChecked);
    
    const requiredUnchecked = PlusInterface.createCheckbox({
      label: 'Text',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-required-unchecked',
      checked: false,
      required: true,
    });
    container.appendChild(requiredUnchecked);
    
    return container;
  },
};

