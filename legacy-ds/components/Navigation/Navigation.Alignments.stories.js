/**
 * Navigation Alignment Variants Stories
 * 
 * Shows left, center, and right alignments
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Navigation/Alignments',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Navigation alignments determine how items are positioned. Shows left, center, and right alignments.',
      },
    },
  },
};

/**
 * All Alignments
 * Shows all three alignments together
 */
export const AllAlignments = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const baseItems = [
      { text: 'Tab', selected: true },
      { text: 'Tab', selected: false },
      { text: 'Tab', selected: false },
    ];
    
    const alignments = ['left', 'center', 'right'];
    
    alignments.forEach((alignment) => {
      const alignmentSection = document.createElement('div');
      alignmentSection.style.display = 'flex';
      alignmentSection.style.flexDirection = 'column';
      alignmentSection.style.gap = 'var(--size-element-gap-sm)';
      
      const alignmentLabel = document.createElement('div');
      alignmentLabel.className = 'h6';
      alignmentLabel.textContent = `Alignment: ${alignment}`;
      alignmentSection.appendChild(alignmentLabel);
      
      const nav = PlusInterface.createNavigation({
        items: baseItems,
        type: 'horizontal',
        alignment: alignment
      });
      
      alignmentSection.appendChild(nav);
      container.appendChild(alignmentSection);
    });
    
    return container;
  },
};

/**
 * Left
 * Shows left-aligned navigation
 */
export const Left = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const nav = PlusInterface.createNavigation({
      items: [
        { text: 'Tab', selected: true },
        { text: 'Tab', selected: false },
        { text: 'Tab', selected: false },
      ],
      type: 'horizontal',
      alignment: 'left'
    });
    
    container.appendChild(nav);
    return container;
  },
};

/**
 * Center
 * Shows center-aligned navigation
 */
export const Center = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const nav = PlusInterface.createNavigation({
      items: [
        { text: 'Tab', selected: true },
        { text: 'Tab', selected: false },
        { text: 'Tab', selected: false },
      ],
      type: 'horizontal',
      alignment: 'center'
    });
    
    container.appendChild(nav);
    return container;
  },
};

/**
 * Right
 * Shows right-aligned navigation
 */
export const Right = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    const nav = PlusInterface.createNavigation({
      items: [
        { text: 'Tab', selected: true },
        { text: 'Tab', selected: false },
        { text: 'Tab', selected: false },
      ],
      type: 'horizontal',
      alignment: 'right'
    });
    
    container.appendChild(nav);
    return container;
  },
};

