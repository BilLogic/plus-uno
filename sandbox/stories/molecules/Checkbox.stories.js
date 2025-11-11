/**
 * Checkbox Molecule Stories
 * Checkbox component (input + label combination)
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Checkbox',
  tags: ['autodocs'],
};

/**
 * Default Checkbox
 */
export const Default = {
  render: (args) => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox(args);
    container.appendChild(checkbox);
    return container;
  },
  args: {
    label: 'Checkbox label',
    name: 'checkbox',
    value: 'value',
    id: 'checkbox-1',
    checked: false,
  },
};

/**
 * Checked Checkbox
 */
export const Checked = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Checked checkbox',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-2',
      checked: true,
    });
    container.appendChild(checkbox);
    return container;
  },
};

/**
 * Unchecked Checkbox
 */
export const Unchecked = {
  render: () => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox({
      label: 'Unchecked checkbox',
      name: 'checkbox',
      value: 'value',
      id: 'checkbox-3',
      checked: false,
    });
    container.appendChild(checkbox);
    return container;
  },
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
 * Interactive Checkbox
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const checkbox = PlusInterface.createCheckbox(args);
    container.appendChild(checkbox);
    return container;
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Checkbox label',
    },
    name: {
      control: 'text',
      description: 'Input name attribute',
    },
    value: {
      control: 'text',
      description: 'Input value attribute',
    },
    checked: {
      control: 'boolean',
      description: 'Checked state',
    },
  },
  args: {
    label: 'Interactive checkbox',
    name: 'interactive',
    value: 'value',
    id: 'checkbox-interactive',
    checked: false,
  },
};

