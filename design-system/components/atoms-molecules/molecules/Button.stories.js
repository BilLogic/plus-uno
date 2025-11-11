/**
 * Button Molecule Stories
 * Button component with all variations: styles, fills, sizes, states
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Button',
  tags: ['autodocs'],
};

/**
 * Default Button
 */
export const Default = {
  render: (args) => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton(args);
    container.appendChild(button);
    return container;
  },
  args: {
    btnText: 'Button',
    btnStyle: 'primary',
    btnFill: 'filled',
    btnSize: 'default',
    enabled: true,
  },
};

/**
 * Button Styles
 */
export const Styles = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'];
    
    styles.forEach((style) => {
      const button = PlusInterface.createButton({
        btnText: style.charAt(0).toUpperCase() + style.slice(1),
        btnStyle: style,
        btnFill: 'filled',
        btnSize: 'default',
      });
      container.appendChild(button);
    });
    
    return container;
  },
};

/**
 * Button Fills
 */
export const Fills = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const fills = ['filled', 'outline', 'tonal', 'text'];
    
    fills.forEach((fill) => {
      const button = PlusInterface.createButton({
        btnText: fill.charAt(0).toUpperCase() + fill.slice(1),
        btnStyle: 'primary',
        btnFill: fill,
        btnSize: 'default',
      });
      container.appendChild(button);
    });
    
    return container;
  },
};

/**
 * Button Sizes
 */
export const Sizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const sizes = ['small', 'default', 'large'];
    
    sizes.forEach((size) => {
      const button = PlusInterface.createButton({
        btnText: size.charAt(0).toUpperCase() + size.slice(1),
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: size,
      });
      container.appendChild(button);
    });
    
    return container;
  },
};

/**
 * Buttons with Icons
 */
export const WithIcons = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.flexDirection = 'column';
    
    const examples = [
      { icon: 'check', position: 'left', text: 'Left Icon' },
      { icon: 'arrow-right', position: 'right', text: 'Right Icon' },
      { icon: 'save', position: 'left', text: 'Save' },
      { icon: 'download', position: 'left', text: 'Download' },
    ];
    
    examples.forEach((example) => {
      const button = PlusInterface.createButton({
        btnText: example.text,
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: 'default',
        icon: example.icon,
        iconPosition: example.position,
      });
      container.appendChild(button);
    });
    
    return container;
  },
};

/**
 * Button States
 */
export const States = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.flexDirection = 'column';
    
    const enabledButton = PlusInterface.createButton({
      btnText: 'Enabled',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: true,
    });
    container.appendChild(enabledButton);
    
    const disabledButton = PlusInterface.createButton({
      btnText: 'Disabled',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      enabled: false,
    });
    container.appendChild(disabledButton);
    
    return container;
  },
};

/**
 * All Style and Fill Combinations
 */
export const AllCombinations = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-lg)';
    
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error'];
    const fills = ['filled', 'outline', 'tonal', 'text'];
    
    styles.forEach((style) => {
      const styleGroup = document.createElement('div');
      styleGroup.style.display = 'flex';
      styleGroup.style.flexWrap = 'wrap';
      styleGroup.style.gap = 'var(--size-card-gap-md)';
      styleGroup.style.alignItems = 'center';
      
      const label = document.createElement('div');
      label.className = 'body2-txt';
      label.style.minWidth = 'var(--size-card-pad-x-lg)';
      label.textContent = style.charAt(0).toUpperCase() + style.slice(1);
      styleGroup.appendChild(label);
      
      fills.forEach((fill) => {
        const button = PlusInterface.createButton({
          btnText: fill,
          btnStyle: style,
          btnFill: fill,
          btnSize: 'default',
        });
        styleGroup.appendChild(button);
      });
      
      container.appendChild(styleGroup);
    });
    
    return container;
  },
};

/**
 * Interactive Button
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const button = PlusInterface.createButton({
      ...args,
      buttonOnClick: () => {
        console.log('Button clicked!', args);
      },
    });
    container.appendChild(button);
    return container;
  },
  argTypes: {
    btnText: {
      control: 'text',
      description: 'Button text',
    },
    btnStyle: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error', 'default'],
      description: 'Button style (uses color tokens: --color-primary, --color-secondary, etc.)',
    },
    btnFill: {
      control: 'select',
      options: ['filled', 'outline', 'tonal', 'text'],
      description: 'Button fill variant (uses color and state layer tokens)',
    },
    btnSize: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Button size (uses element padding tokens: --size-element-pad-x-sm/md/lg, --size-element-pad-y-sm/md/lg)',
    },
    icon: {
      control: 'text',
      description: 'Icon name (without fa- prefix)',
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Icon position',
    },
    enabled: {
      control: 'boolean',
      description: 'Enabled state',
    },
    tooltip: {
      control: 'text',
      description: 'Tooltip text',
    },
  },
  args: {
    btnText: 'Click Me',
    btnStyle: 'primary',
    btnFill: 'filled',
    btnSize: 'default',
    icon: '',
    iconPosition: 'left',
    enabled: true,
    tooltip: '',
  },
};

