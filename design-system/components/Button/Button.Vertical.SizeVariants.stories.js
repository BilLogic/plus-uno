/**
 * Button Vertical Size Variants Stories
 * 
 * Shows all size variants (small, default, large) for vertical outlined buttons.
 * Includes examples with and without icons to show how sizing affects content.
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Button/Vertical/Size Variants',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Vertical button sizes apply consistently. All sizes support icons and text combinations.',
      },
    },
  },
};

/**
 * Small Vertical Buttons
 * Compact size for dense interfaces
 */
export const Small = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'flex-start';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'small',
      verticalLayout: true,
      icon: 'icons',
      trailingIcon: 'square-plus',
    });
    container.appendChild(button);
    
    return container;
  },
};

/**
 * Default Vertical Buttons
 * Standard size for most use cases
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'flex-start';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'default',
      verticalLayout: true,
      icon: 'icons',
      trailingIcon: 'square-plus',
    });
    container.appendChild(button);
    
    return container;
  },
};

/**
 * Large Vertical Buttons
 * Prominent size for primary CTAs
 */
export const Large = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.alignItems = 'flex-start';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'outline',
      btnSize: 'large',
      verticalLayout: true,
      icon: 'icons',
      trailingIcon: 'square-plus',
    });
    container.appendChild(button);
    
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
    container.style.alignItems = 'flex-start';
    container.style.gap = 'var(--size-card-gap-md)';
    
    const sizes = ['small', 'default', 'large'];
    
    sizes.forEach((size) => {
      const buttonWrapper = document.createElement('div');
      buttonWrapper.style.display = 'inline-block';
      
      const button = PlusInterface.createButton({
        btnText: size,
        btnStyle: 'primary',
        btnFill: 'outline',
        btnSize: size,
        verticalLayout: true,
        icon: 'icons',
        trailingIcon: 'square-plus',
      });
      
      buttonWrapper.appendChild(button);
      container.appendChild(buttonWrapper);
    });
    
    return container;
  },
};

