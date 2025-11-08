/**
 * Button Group Molecule Stories
 * Button group component for grouping buttons together
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/ButtonGroup',
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Button size',
    },
    style: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning'],
      description: 'Button style',
    },
    fill: {
      control: 'select',
      options: ['filled', 'outline', 'tonal', 'text'],
      description: 'Button fill',
    },
    alignment: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Button alignment',
    },
  },
};

/**
 * Horizontal Button Group (2 buttons)
 */
export const Horizontal2Buttons = {
  render: () => {
    const container = document.createElement('div');
    const group = PlusInterface.createButtonGroup({
      buttons: [
        { btnText: 'Button 1' },
        { btnText: 'Button 2' }
      ],
      size: 'default',
      style: 'primary',
      fill: 'filled',
      alignment: 'horizontal'
    });
    container.appendChild(group);
    return container;
  },
};

/**
 * Horizontal Button Group (3 buttons)
 */
export const Horizontal3Buttons = {
  render: () => {
    const container = document.createElement('div');
    const group = PlusInterface.createButtonGroup({
      buttons: [
        { btnText: 'Button 1' },
        { btnText: 'Button 2' },
        { btnText: 'Button 3' }
      ],
      size: 'default',
      style: 'primary',
      fill: 'filled',
      alignment: 'horizontal'
    });
    container.appendChild(group);
    return container;
  },
};

/**
 * Horizontal Button Group (4 buttons)
 */
export const Horizontal4Buttons = {
  render: () => {
    const container = document.createElement('div');
    const group = PlusInterface.createButtonGroup({
      buttons: [
        { btnText: 'Button 1' },
        { btnText: 'Button 2' },
        { btnText: 'Button 3' },
        { btnText: 'Button 4' }
      ],
      size: 'default',
      style: 'primary',
      fill: 'filled',
      alignment: 'horizontal'
    });
    container.appendChild(group);
    return container;
  },
};

/**
 * Horizontal Button Group (5 buttons)
 */
export const Horizontal5Buttons = {
  render: () => {
    const container = document.createElement('div');
    const group = PlusInterface.createButtonGroup({
      buttons: [
        { btnText: 'Button 1' },
        { btnText: 'Button 2' },
        { btnText: 'Button 3' },
        { btnText: 'Button 4' },
        { btnText: 'Button 5' }
      ],
      size: 'default',
      style: 'primary',
      fill: 'filled',
      alignment: 'horizontal'
    });
    container.appendChild(group);
    return container;
  },
};

/**
 * Vertical Button Group (2 buttons)
 */
export const Vertical2Buttons = {
  render: () => {
    const container = document.createElement('div');
    const group = PlusInterface.createButtonGroup({
      buttons: [
        { btnText: 'Button 1' },
        { btnText: 'Button 2' }
      ],
      size: 'default',
      style: 'primary',
      fill: 'filled',
      alignment: 'vertical'
    });
    container.appendChild(group);
    return container;
  },
};

/**
 * Small Button Group
 */
export const Small = {
  render: () => {
    const container = document.createElement('div');
    const group = PlusInterface.createButtonGroup({
      buttons: [
        { btnText: 'Small 1' },
        { btnText: 'Small 2' },
        { btnText: 'Small 3' }
      ],
      size: 'small',
      style: 'primary',
      fill: 'filled',
      alignment: 'horizontal'
    });
    container.appendChild(group);
    return container;
  },
};

/**
 * Large Button Group
 */
export const Large = {
  render: () => {
    const container = document.createElement('div');
    const group = PlusInterface.createButtonGroup({
      buttons: [
        { btnText: 'Large 1' },
        { btnText: 'Large 2' },
        { btnText: 'Large 3' }
      ],
      size: 'large',
      style: 'primary',
      fill: 'filled',
      alignment: 'horizontal'
    });
    container.appendChild(group);
    return container;
  },
};

/**
 * Different Styles
 */
export const DifferentStyles = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '2rem';
    
    const styles = ['primary', 'secondary', 'tertiary'];
    
    styles.forEach((style) => {
      const group = PlusInterface.createButtonGroup({
        buttons: [
          { btnText: `${style} 1` },
          { btnText: `${style} 2` }
        ],
        size: 'default',
        style: style,
        fill: 'filled',
        alignment: 'horizontal'
      });
      container.appendChild(group);
    });
    
    return container;
  },
};

/**
 * Interactive Button Group
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const group = PlusInterface.createButtonGroup({
      buttons: [
        { btnText: 'Button 1', buttonOnClick: () => console.log('Button 1 clicked') },
        { btnText: 'Button 2', buttonOnClick: () => console.log('Button 2 clicked') },
        { btnText: 'Button 3', buttonOnClick: () => console.log('Button 3 clicked') }
      ],
      size: args.size || 'default',
      style: args.style || 'primary',
      fill: args.fill || 'filled',
      alignment: args.alignment || 'horizontal'
    });
    container.appendChild(group);
    return container;
  },
  args: {
    size: 'default',
    style: 'primary',
    fill: 'filled',
    alignment: 'horizontal',
  },
};

