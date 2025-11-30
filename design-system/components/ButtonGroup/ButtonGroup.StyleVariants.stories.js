/**
 * Button Group Style Variants Stories
 * 
 * Shows all style (color) variants for button groups.
 * Demonstrates how different color styles can be applied to button groups.
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/ButtonGroup/Style Variants',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Style variants are color tokens applied to button groups. All button groups use tonal fill style with state-layer backgrounds.',
      },
    },
  },
};

/**
 * Primary Style
 * Primary color style for main actions
 */
export const Primary = {
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
      label.textContent = `Primary - ${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`;
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
 * Secondary Style
 * Secondary color style for secondary actions
 */
export const Secondary = {
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
      label.textContent = `Secondary - ${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`;
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
          style: 'secondary',
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
 * Tertiary Style
 * Tertiary color style for tertiary actions
 */
export const Tertiary = {
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
      label.textContent = `Tertiary - ${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`;
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
          style: 'tertiary',
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
 * Success Style
 * Success color style for positive actions
 */
export const Success = {
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
      label.textContent = `Success - ${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`;
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
          style: 'success',
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
 * Danger Style
 * Danger color style for destructive actions
 */
export const Danger = {
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
      label.textContent = `Danger - ${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`;
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
          style: 'danger',
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
 * Warning Style
 * Warning color style for cautionary actions
 */
export const Warning = {
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
      label.textContent = `Warning - ${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`;
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
          style: 'warning',
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
 * Style Comparison
 * Side-by-side comparison of all style variants
 */
export const StyleComparison = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-xl)';
    
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning'];
    const buttonTexts = ['Left', 'Right'];
    
    styles.forEach((style) => {
      const section = document.createElement('div');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = 'var(--size-card-gap-md)';
      
      const label = document.createElement('div');
      label.className = 'h5';
      label.textContent = `${style.charAt(0).toUpperCase() + style.slice(1)} Style`;
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
          size: 'default',
          style: style,
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

