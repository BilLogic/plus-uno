import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Badge/Colors',
  tags: ['autodocs'],
};

export const Primary = {
  render: () => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge({
      text: 'Primary',
      style: 'primary',
      size: 'b2'
    });
    container.appendChild(badge);
    return container;
  },
};

export const Secondary = {
  render: () => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge({
      text: 'Secondary',
      style: 'secondary',
      size: 'b2'
    });
    container.appendChild(badge);
    return container;
  },
};

export const Tertiary = {
  render: () => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge({
      text: 'Tertiary',
      style: 'tertiary',
      size: 'b2'
    });
    container.appendChild(badge);
    return container;
  },
};

export const Success = {
  render: () => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge({
      text: 'Success',
      style: 'success',
      size: 'b2'
    });
    container.appendChild(badge);
    return container;
  },
};

export const Danger = {
  render: () => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge({
      text: 'Danger',
      style: 'danger',
      size: 'b2'
    });
    container.appendChild(badge);
    return container;
  },
};

export const Warning = {
  render: () => {
    const container = document.createElement('div');
    const badge = PlusInterface.createBadge({
      text: 'Warning',
      style: 'warning',
      size: 'b2'
    });
    container.appendChild(badge);
    return container;
  },
};

