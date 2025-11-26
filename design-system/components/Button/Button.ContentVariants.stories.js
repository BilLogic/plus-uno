/**
 * Button Content Variants Stories
 * Content-based variants organized under "Content Variants" subcategory
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Button/Content Variants',
  tags: ['autodocs'],
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

