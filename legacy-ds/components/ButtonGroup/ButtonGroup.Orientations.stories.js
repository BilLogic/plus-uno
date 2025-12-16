/**
 * Button Group Orientation Variants Stories
 * 
 * Shows horizontal and vertical orientations for button groups.
 * Demonstrates how button groups can be arranged in different layouts.
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/ButtonGroup/Orientations',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Button groups can be arranged horizontally (side-by-side) or vertically (stacked). Horizontal is the default for most use cases, while vertical is useful for narrow spaces or mobile layouts.',
      },
    },
  },
};

/**
 * Horizontal Orientation
 * Buttons arranged side-by-side (default layout)
 */
export const Horizontal = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const buttonCounts = [2, 5];
    
    buttonCounts.forEach((count) => {
      const section = document.createElement('div');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = 'var(--size-card-gap-md)';
      
      const label = document.createElement('div');
      label.className = 'h6';
      label.textContent = `Horizontal - ${count} Buttons`;
      label.style.marginBottom = 'var(--size-element-gap-sm)';
      section.appendChild(label);
      
      const buttonTexts = [];
      if (count === 2) {
        buttonTexts.push('Left', 'Right');
      } else if (count === 5) {
        buttonTexts.push('Left', 'Middle', 'Middle', 'Middle', 'Right');
      }
      
      const group = PlusInterface.createButtonGroup({
        buttons: buttonTexts.map(text => ({ btnText: text })),
        size: 'default',
        style: 'primary',
        alignment: 'horizontal'
      });
      group.style.width = 'fit-content';
      
      section.appendChild(group);
      container.appendChild(section);
    });
    
    return container;
  },
};

/**
 * Vertical Orientation
 * Buttons stacked vertically (for narrow spaces or mobile)
 */
export const Vertical = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const buttonCounts = [2, 5];
    
    buttonCounts.forEach((count) => {
      const section = document.createElement('div');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = 'var(--size-card-gap-md)';
      
      const label = document.createElement('div');
      label.className = 'h6';
      label.textContent = `Vertical - ${count} Buttons`;
      label.style.marginBottom = 'var(--size-element-gap-sm)';
      section.appendChild(label);
      
      const buttonTexts = [];
      if (count === 2) {
        buttonTexts.push('Left', 'Right');
      } else if (count === 5) {
        buttonTexts.push('Left', 'Middle', 'Middle', 'Middle', 'Right');
      }
      
      const group = PlusInterface.createButtonGroup({
        buttons: buttonTexts.map(text => ({ btnText: text })),
        size: 'default',
        style: 'primary',
        alignment: 'vertical'
      });
      group.style.width = 'fit-content';
      
      section.appendChild(group);
      container.appendChild(section);
    });
    
    return container;
  },
};

/**
 * Orientation Comparison
 * Side-by-side comparison of horizontal vs vertical orientations
 */
export const OrientationComparison = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-xl)';
    
    const buttonTexts = ['Left', 'Right'];
    
    ['horizontal', 'vertical'].forEach((alignment) => {
      const section = document.createElement('div');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = 'var(--size-card-gap-md)';
      
      const label = document.createElement('div');
      label.className = 'h5';
      label.textContent = `${alignment.charAt(0).toUpperCase() + alignment.slice(1)} Orientation`;
      label.style.marginBottom = 'var(--size-element-gap-sm)';
      section.appendChild(label);
      
      const group = PlusInterface.createButtonGroup({
        buttons: buttonTexts.map(text => ({ btnText: text })),
        size: 'default',
        style: 'primary',
        alignment: alignment
      });
      group.style.width = 'fit-content';
      
      section.appendChild(group);
      container.appendChild(section);
    });
    
    return container;
  },
};

