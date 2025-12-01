/**
 * Button Group Size Variants Stories
 * 
 * Shows all size variants (small, default, large) for button groups.
 * Demonstrates how sizing affects button groups in both horizontal and vertical orientations.
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/ButtonGroup/Sizes',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Button group sizes apply consistently across all orientations and styles. All sizes support multiple button counts (2-5 buttons).',
      },
    },
  },
};

/**
 * Small Button Groups
 * Compact size for dense interfaces
 */
export const Small = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const alignments = ['horizontal', 'vertical'];
    
    alignments.forEach((alignment) => {
      const alignmentSection = document.createElement('div');
      alignmentSection.style.display = 'flex';
      alignmentSection.style.flexDirection = 'column';
      alignmentSection.style.gap = 'var(--size-card-gap-md)';
      
      const label = document.createElement('div');
      label.className = 'h5';
      label.textContent = `Small - ${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`;
      label.style.marginBottom = 'var(--size-element-gap-sm)';
      alignmentSection.appendChild(label);
      
      const groupsRow = document.createElement('div');
      groupsRow.style.display = 'flex';
      groupsRow.style.flexDirection = alignment === 'horizontal' ? 'row' : 'column';
      groupsRow.style.flexWrap = 'wrap';
      groupsRow.style.gap = 'var(--size-card-gap-lg)';
      groupsRow.style.alignItems = 'flex-start';
      
      const buttonCounts = [2, 5];
      buttonCounts.forEach((count) => {
        const buttonTexts = [];
        if (count === 2) {
          buttonTexts.push('Left', 'Right');
        } else if (count === 5) {
          buttonTexts.push('Left', 'Middle', 'Middle', 'Middle', 'Right');
        }
        
        const group = PlusInterface.createButtonGroup({
          buttons: buttonTexts.map(text => ({ btnText: text })),
          size: 'small',
          style: 'primary',
          alignment: alignment
        });
        group.style.width = 'fit-content';
        
        groupsRow.appendChild(group);
      });
      
      alignmentSection.appendChild(groupsRow);
      container.appendChild(alignmentSection);
    });
    
    return container;
  },
};

/**
 * Default Button Groups
 * Standard size for most use cases
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const alignments = ['horizontal', 'vertical'];
    
    alignments.forEach((alignment) => {
      const alignmentSection = document.createElement('div');
      alignmentSection.style.display = 'flex';
      alignmentSection.style.flexDirection = 'column';
      alignmentSection.style.gap = 'var(--size-card-gap-md)';
      
      const label = document.createElement('div');
      label.className = 'h5';
      label.textContent = `Default - ${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`;
      label.style.marginBottom = 'var(--size-element-gap-sm)';
      alignmentSection.appendChild(label);
      
      const groupsRow = document.createElement('div');
      groupsRow.style.display = 'flex';
      groupsRow.style.flexDirection = alignment === 'horizontal' ? 'row' : 'column';
      groupsRow.style.flexWrap = 'wrap';
      groupsRow.style.gap = 'var(--size-card-gap-lg)';
      groupsRow.style.alignItems = 'flex-start';
      
      const buttonCounts = [2, 5];
      buttonCounts.forEach((count) => {
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
          alignment: alignment
        });
        group.style.width = 'fit-content';
        
        groupsRow.appendChild(group);
      });
      
      alignmentSection.appendChild(groupsRow);
      container.appendChild(alignmentSection);
    });
    
    return container;
  },
};

/**
 * Large Button Groups
 * Prominent size for important action groups
 */
export const Large = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const alignments = ['horizontal', 'vertical'];
    
    alignments.forEach((alignment) => {
      const alignmentSection = document.createElement('div');
      alignmentSection.style.display = 'flex';
      alignmentSection.style.flexDirection = 'column';
      alignmentSection.style.gap = 'var(--size-card-gap-md)';
      
      const label = document.createElement('div');
      label.className = 'h5';
      label.textContent = `Large - ${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`;
      label.style.marginBottom = 'var(--size-element-gap-sm)';
      alignmentSection.appendChild(label);
      
      const groupsRow = document.createElement('div');
      groupsRow.style.display = 'flex';
      groupsRow.style.flexDirection = alignment === 'horizontal' ? 'row' : 'column';
      groupsRow.style.flexWrap = 'wrap';
      groupsRow.style.gap = 'var(--size-card-gap-lg)';
      groupsRow.style.alignItems = 'flex-start';
      
      const buttonCounts = [2, 5];
      buttonCounts.forEach((count) => {
        const buttonTexts = [];
        if (count === 2) {
          buttonTexts.push('Left', 'Right');
        } else if (count === 5) {
          buttonTexts.push('Left', 'Middle', 'Middle', 'Middle', 'Right');
        }
        
        const group = PlusInterface.createButtonGroup({
          buttons: buttonTexts.map(text => ({ btnText: text })),
          size: 'large',
          style: 'primary',
          alignment: alignment
        });
        group.style.width = 'fit-content';
        
        groupsRow.appendChild(group);
      });
      
      alignmentSection.appendChild(groupsRow);
      container.appendChild(alignmentSection);
    });
    
    return container;
  },
};

/**
 * Size Comparison
 * Side-by-side comparison of all sizes
 */
export const SizeComparison = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-xl)';
    
    const sizes = ['small', 'default', 'large'];
    const buttonTexts = ['Left', 'Right'];
    
    sizes.forEach((size) => {
      const section = document.createElement('div');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = 'var(--size-card-gap-md)';
      
      const label = document.createElement('div');
      label.className = 'h5';
      label.textContent = `${size.charAt(0).toUpperCase() + size.slice(1)} Size`;
      label.style.marginBottom = 'var(--size-element-gap-sm)';
      section.appendChild(label);
      
      const groupsRow = document.createElement('div');
      groupsRow.style.display = 'flex';
      groupsRow.style.flexDirection = 'row';
      groupsRow.style.flexWrap = 'wrap';
      groupsRow.style.gap = 'var(--size-card-gap-lg)';
      groupsRow.style.alignItems = 'flex-start';
      
      ['horizontal', 'vertical'].forEach((alignment) => {
        const group = PlusInterface.createButtonGroup({
          buttons: buttonTexts.map(text => ({ btnText: text })),
          size: size,
          style: 'primary',
          alignment: alignment
        });
        group.style.width = 'fit-content';
        
        groupsRow.appendChild(group);
      });
      
      section.appendChild(groupsRow);
      container.appendChild(section);
    });
    
    return container;
  },
};

