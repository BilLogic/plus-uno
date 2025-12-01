/**
 * Radio Content Stories
 * Content variants: single radio, radio group
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Radio/Content',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Radio button content variants: single radio (standalone radio with label) and radio group (multiple related radios grouped together with same name attribute).',
      },
    },
  },
};

/**
 * Single Radio
 * Standalone radio with label
 */
export const SingleRadio = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const radio = PlusInterface.createRadio({
      label: 'Single radio option',
      name: 'radio-single',
      value: 'option1',
      id: 'radio-single',
      checked: false,
    });
    
    container.appendChild(radio);
    return container;
  },
};

/**
 * Radio Group
 * Multiple related radios grouped together (same name attribute)
 */
export const RadioGroup = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-sm)';
    
    const options = [
      { label: 'Option 1', value: 'option1', id: 'radio-group-1', checked: true },
      { label: 'Option 2', value: 'option2', id: 'radio-group-2', checked: false },
      { label: 'Option 3', value: 'option3', id: 'radio-group-3', checked: false },
    ];
    
    const radios = PlusInterface.createRadioGroup(options, 'radio-group');
    radios.forEach((radio) => {
      container.appendChild(radio);
    });
    
    return container;
  },
};

/**
 * All Content Variants
 * Shows all content variants together
 */
export const AllContent = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    // Single Radio Section
    const singleSection = document.createElement('div');
    singleSection.style.display = 'flex';
    singleSection.style.flexDirection = 'column';
    singleSection.style.gap = 'var(--size-element-gap-sm)';
    
    const singleHeading = document.createElement('div');
    singleHeading.className = 'h6';
    singleHeading.textContent = 'Single Radio';
    singleSection.appendChild(singleHeading);
    
    const singleRadio = PlusInterface.createRadio({
      label: 'Single radio option',
      name: 'radio-all-content-single',
      value: 'option1',
      id: 'radio-all-content-single',
      checked: false,
    });
    singleSection.appendChild(singleRadio);
    container.appendChild(singleSection);
    
    // Radio Group Section
    const groupSection = document.createElement('div');
    groupSection.style.display = 'flex';
    groupSection.style.flexDirection = 'column';
    groupSection.style.gap = 'var(--size-element-gap-sm)';
    
    const groupHeading = document.createElement('div');
    groupHeading.className = 'h6';
    groupHeading.textContent = 'Radio Group';
    groupSection.appendChild(groupHeading);
    
    const groupOptions = [
      { label: 'Option 1', value: 'option1', id: 'radio-all-content-group-1', checked: true },
      { label: 'Option 2', value: 'option2', id: 'radio-all-content-group-2', checked: false },
      { label: 'Option 3', value: 'option3', id: 'radio-all-content-group-3', checked: false },
    ];
    
    const groupRadios = PlusInterface.createRadioGroup(groupOptions, 'radio-all-content-group');
    groupRadios.forEach((radio) => {
      groupSection.appendChild(radio);
    });
    container.appendChild(groupSection);
    
    return container;
  },
};

