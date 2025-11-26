/**
 * Alert Visual Style Variants Stories
 * Visual style variants organized under "Visual Style Variants" subcategory
 * Includes color/style variations (primary, secondary, success, etc.)
 */

import { PlusInterface } from '../../index.js';

export default {
  title: 'Molecules/Alert/Visual Style Variants',
  tags: ['autodocs'],
};

/**
 * Primary Alert
 */
export const Primary = {
  render: (args) => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert({
      ...args,
      style: 'primary',
    });
    container.appendChild(alert);
    return container;
  },
  args: {
    style: 'primary',
    title: 'Title',
    text: 'You have a message here — come check it out!',
    dismissable: true,
  },
};

/**
 * Secondary Alert
 */
export const Secondary = {
  render: (args) => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert({
      ...args,
      style: 'secondary',
    });
    container.appendChild(alert);
    return container;
  },
  args: {
    style: 'secondary',
    title: 'Title',
    text: 'You have a message here — come check it out!',
    dismissable: true,
  },
};

/**
 * Success Alert
 */
export const Success = {
  render: (args) => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert({
      ...args,
      style: 'success',
    });
    container.appendChild(alert);
    return container;
  },
  args: {
    style: 'success',
    title: 'Title',
    text: 'You have a message here — come check it out!',
    dismissable: true,
  },
};

/**
 * Danger Alert
 */
export const Danger = {
  render: (args) => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert({
      ...args,
      style: 'danger',
    });
    container.appendChild(alert);
    return container;
  },
  args: {
    style: 'danger',
    title: 'Title',
    text: 'You have a message here — come check it out!',
    dismissable: true,
  },
};

/**
 * Warning Alert
 */
export const Warning = {
  render: (args) => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert({
      ...args,
      style: 'warning',
    });
    container.appendChild(alert);
    return container;
  },
  args: {
    style: 'warning',
    title: 'Title',
    text: 'You have a message here — come check it out!',
    dismissable: true,
  },
};

