/**
 * Button Content Variants Stories
 * 
 * Shows all 4 content variations:
 * 1. Text only
 * 2. Leading icon (icon on left)
 * 3. Trailing icon (icon on right)
 * 4. Both icons (leading and trailing)
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Button/Content',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Button content variants show different combinations of text and icons. Icons use Font Awesome.',
      },
    },
  },
};

/**
 * All Content Variants
 * Shows all 4 content variants: text only, leading icon, trailing icon, both icons
 */
export const AllContentVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const variants = [
      { 
        name: 'Text Only', 
        description: 'Button with text only, no icons',
        icon: null,
        trailingIcon: null,
      },
      { 
        name: 'Leading Icon', 
        description: 'Button with icon on the left side',
        icon: 'square-plus',
        trailingIcon: null,
      },
      { 
        name: 'Trailing Icon', 
        description: 'Button with icon on the right side',
        icon: null,
        trailingIcon: 'square-plus',
      },
      { 
        name: 'Both Icons', 
        description: 'Button with icons on both left and right sides',
        icon: 'square-plus',
        trailingIcon: 'square-plus',
      },
    ];
    
    variants.forEach((variant) => {
      const variantRow = document.createElement('div');
      variantRow.style.display = 'flex';
      variantRow.style.flexDirection = 'column';
      variantRow.style.gap = 'var(--size-element-gap-xs)';
      
      const labelRow = document.createElement('div');
      labelRow.style.display = 'flex';
      labelRow.style.alignItems = 'center';
      labelRow.style.gap = 'var(--size-element-gap-sm)';
      
      const variantLabel = document.createElement('div');
      variantLabel.className = 'h6';
      variantLabel.textContent = variant.name;
      labelRow.appendChild(variantLabel);
      
      const variantDescription = document.createElement('div');
      variantDescription.className = 'body3-txt';
      variantDescription.style.color = 'var(--color-on-surface-variant)';
      variantDescription.textContent = variant.description;
      labelRow.appendChild(variantDescription);
      
      variantRow.appendChild(labelRow);
      
      const buttonWrapper = document.createElement('div');
      buttonWrapper.style.display = 'inline-block';
      
      const button = PlusInterface.createButton({
        btnText: 'Button',
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: 'default',
        icon: variant.icon,
        trailingIcon: variant.trailingIcon,
      });
      
      buttonWrapper.appendChild(button);
      variantRow.appendChild(buttonWrapper);
      container.appendChild(variantRow);
    });
    
    return container;
  },
};

/**
 * Text Only
 * Button with text only, no icons
 */
export const TextOnly = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
    });
    
    container.appendChild(button);
    return container;
  },
};

/**
 * Leading Icon
 * Button with icon on the left side
 */
export const LeadingIcon = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      icon: 'square-plus',
    });
    
    container.appendChild(button);
    return container;
  },
};

/**
 * Trailing Icon
 * Button with icon on the right side
 */
export const TrailingIcon = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      trailingIcon: 'square-plus',
    });
    
    container.appendChild(button);
    return container;
  },
};

/**
 * Both Icons
 * Button with icons on both left and right sides
 */
export const BothIcons = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
    const button = PlusInterface.createButton({
      btnText: 'Button',
      btnStyle: 'primary',
      btnFill: 'filled',
      btnSize: 'default',
      icon: 'square-plus',
      trailingIcon: 'square-plus',
    });
    
    container.appendChild(button);
    return container;
  },
};

