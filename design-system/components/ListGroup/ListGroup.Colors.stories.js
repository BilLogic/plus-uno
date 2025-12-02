/**
 * List Group Color Variants Stories
 * Color variants for list group elements
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/ListGroup/Colors',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'List group color variants: primary, secondary, tertiary, success, danger, warning, and info.',
      },
    },
  },
};

/**
 * Primary
 */
export const Primary = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'Primary item 1', href: '#', style: 'primary' },
        { content: 'Primary item 2', href: '#', style: 'primary', active: true },
        { content: 'Primary item 3', href: '#', style: 'primary' },
      ],
    });
    listGroup.classList.add('body2-txt');
    return listGroup;
  },
};

/**
 * Secondary
 */
export const Secondary = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'Secondary item 1', href: '#', style: 'secondary' },
        { content: 'Secondary item 2', href: '#', style: 'secondary', active: true },
        { content: 'Secondary item 3', href: '#', style: 'secondary' },
      ],
    });
    listGroup.classList.add('body2-txt');
    return listGroup;
  },
};

/**
 * Tertiary
 */
export const Tertiary = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'Tertiary item 1', href: '#', style: 'tertiary' },
        { content: 'Tertiary item 2', href: '#', style: 'tertiary', active: true },
        { content: 'Tertiary item 3', href: '#', style: 'tertiary' },
      ],
    });
    listGroup.classList.add('body2-txt');
    return listGroup;
  },
};

/**
 * Success
 */
export const Success = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'Success item 1', href: '#', style: 'success' },
        { content: 'Success item 2', href: '#', style: 'success', active: true },
        { content: 'Success item 3', href: '#', style: 'success' },
      ],
    });
    listGroup.classList.add('body2-txt');
    return listGroup;
  },
};

/**
 * Danger
 */
export const Danger = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'Danger item 1', href: '#', style: 'danger' },
        { content: 'Danger item 2', href: '#', style: 'danger', active: true },
        { content: 'Danger item 3', href: '#', style: 'danger' },
      ],
    });
    listGroup.classList.add('body2-txt');
    return listGroup;
  },
};

/**
 * Warning
 */
export const Warning = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'Warning item 1', href: '#', style: 'warning' },
        { content: 'Warning item 2', href: '#', style: 'warning', active: true },
        { content: 'Warning item 3', href: '#', style: 'warning' },
      ],
    });
    listGroup.classList.add('body2-txt');
    return listGroup;
  },
};

/**
 * Info
 */
export const Info = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'Info item 1', href: '#', style: 'info' },
        { content: 'Info item 2', href: '#', style: 'info', active: true },
        { content: 'Info item 3', href: '#', style: 'info' },
      ],
    });
    listGroup.classList.add('body2-txt');
    return listGroup;
  },
};

/**
 * All Colors
 */
export const AllColors = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning', 'info'];
    const styleLabels = ['Primary', 'Secondary', 'Tertiary', 'Success', 'Danger', 'Warning', 'Info'];
    
    styles.forEach((style, index) => {
      const section = document.createElement('div');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = 'var(--size-element-gap-sm)';
      
      const label = document.createElement('div');
      label.className = 'h6';
      label.textContent = `${styleLabels[index]} Style`;
      label.style.marginBottom = 'var(--size-element-gap-sm)';
      section.appendChild(label);
      
      const listGroup = PlusInterface.createListGroup({
        items: [
          { content: `${styleLabels[index]} item 1`, href: '#', style: style },
          { content: `${styleLabels[index]} item 2`, href: '#', style: style, active: true },
          { content: `${styleLabels[index]} item 3`, href: '#', style: style },
        ],
      });
      listGroup.classList.add('body2-txt');
      section.appendChild(listGroup);
      container.appendChild(section);
    });
    
    return container;
  },
};


