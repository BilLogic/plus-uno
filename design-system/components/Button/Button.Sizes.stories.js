/**
 * Button Size Variants Stories
 * 
 * Shows all size variants (small, default, large) for filled buttons.
 * Includes examples with and without icons to show how sizing affects content.
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Button/Sizes',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Button sizes apply consistently. All sizes support icons and text combinations.',
      },
    },
  },
};

/**
 * Small Buttons
 * Compact size for dense interfaces
 */
export const Small = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-card-gap-md)';
    
    // Text only
    const textOnly = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'small',
    });
    container.appendChild(textOnly);
    
    // With both leading and trailing icons
    const withIcons = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'small',
      icon: 'square-plus',
      trailingIcon: 'square-plus',
    });
    container.appendChild(withIcons);
    
    return container;
  },
};

/**
 * Default Buttons
 * Standard size for most use cases
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-card-gap-md)';
    
    // Text only
    const textOnly = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
    });
    container.appendChild(textOnly);
    
    // With both leading and trailing icons
    const withIcons = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      icon: 'square-plus',
      trailingIcon: 'square-plus',
    });
    container.appendChild(withIcons);
    
    return container;
  },
};

/**
 * Large Buttons
 * Prominent size for primary CTAs
 */
export const Large = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-card-gap-md)';
    
    // Text only
    const textOnly = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'large',
    });
    container.appendChild(textOnly);
    
    // With both leading and trailing icons
    const withIcons = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'large',
      icon: 'square-plus',
      trailingIcon: 'square-plus',
    });
    container.appendChild(withIcons);
    
    return container;
  },
};

/**
 * All Sizes Comparison
 * Side-by-side comparison of all sizes
 */
export const AllSizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'center';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const sizes = ['small', 'default', 'large'];
    
    sizes.forEach((size) => {
      const button = PlusInterface.createButton({
        btnText: size,
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: size,
        icon: 'square-plus',
        trailingIcon: 'square-plus',
      });
      container.appendChild(button);
    });
    
    return container;
  },
};

