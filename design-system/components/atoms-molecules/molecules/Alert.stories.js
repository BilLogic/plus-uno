/**
 * Alert Molecule Stories
 * Alert component (title + text + dismiss button)
 * Matches Figma design system specifications
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Alert',
  tags: ['autodocs'],
};

/**
 * Primary Alert
 * Matches Figma: style=primary
 */
export const Primary = {
  render: (args) => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert(args);
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
 * All Alert Styles
 * Shows all alert style variants matching Figma designs
 */
export const AllStyles = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const styles = ['primary', 'secondary', 'success', 'danger', 'warning'];
    
    styles.forEach((style) => {
      const alert = PlusInterface.createAlert({
        style: style,
        title: 'Title',
        text: 'You have a message here — come check it out!',
        dismissable: true,
      });
      container.appendChild(alert);
    });
    
    return container;
  },
};

/**
 * Secondary Alert
 */
export const Secondary = {
  render: (args) => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert(args);
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
    const alert = PlusInterface.createAlert(args);
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
    const alert = PlusInterface.createAlert(args);
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
    const alert = PlusInterface.createAlert(args);
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

/**
 * Alert with Title
 */
export const WithTitle = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const alert = PlusInterface.createAlert({
      style: 'info',
      title: 'Information',
      text: 'This alert has a title and body text.',
      dismissable: true,
    });
    container.appendChild(alert);
    
    return container;
  },
};

/**
 * Alert without Title
 */
export const WithoutTitle = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const alert = PlusInterface.createAlert({
      style: 'info',
      text: 'This alert does not have a title.',
      dismissable: true,
    });
    container.appendChild(alert);
    
    return container;
  },
};

/**
 * Dismissable Alert
 */
export const Dismissable = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const alert = PlusInterface.createAlert({
      style: 'warning',
      title: 'Dismissable Alert',
      text: 'You can dismiss this alert by clicking the X button.',
      dismissable: true,
    });
    container.appendChild(alert);
    
    return container;
  },
};

/**
 * Non-Dismissable Alert
 */
export const NonDismissable = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const alert = PlusInterface.createAlert({
      style: 'danger',
      title: 'Non-Dismissable Alert',
      text: 'This alert cannot be dismissed.',
      dismissable: false,
    });
    container.appendChild(alert);
    
    return container;
  },
};

/**
 * Interactive Alert
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const alert = PlusInterface.createAlert({
      ...args,
      onDismiss: () => {
        console.log('Alert dismissed!');
      },
    });
    container.appendChild(alert);
    return container;
  },
  argTypes: {
    style: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
      description: 'Alert style',
    },
    title: {
      control: 'text',
      description: 'Alert title',
    },
    text: {
      control: 'text',
      description: 'Alert text',
    },
    dismissable: {
      control: 'boolean',
      description: 'Dismissable state',
    },
  },
  args: {
    style: 'info',
    title: 'Interactive Alert',
    text: 'This is an interactive alert. Check the console when dismissing.',
    dismissable: true,
  },
};

