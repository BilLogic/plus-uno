/**
 * Button Vertical Stories
 * 
 * Vertical outlined buttons with icon on top, text in middle, and trailing icon at bottom.
 * Based on Figma: Vertical Outlined buttons support all sizes and states.
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Button/Vertical',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Vertical outlined buttons display content vertically: leading icon on top, text in middle, trailing icon at bottom. Supports all sizes and states.',
      },
    },
  },
};

/**
 * Vertical Button Overview
 * Shows a basic vertical outlined button example
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    
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

