/**
 * Dropdown Button Stories
 * 
 * Shows all button variants: sizes × styles × directions × split
 * Organized exactly as shown in Figma design system
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Dropdown/Dropdown Button',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Dropdown button variants showing all combinations of sizes, styles, directions, and split options.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all button combinations: sizes × styles × directions × split
 * Organized exactly as shown in Figma design system
 * Layout: Each style shows all sizes in rows, with directions as columns
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-xl)';
    
    const styles = ['primary', 'secondary', 'info', 'success', 'danger', 'warning'];
    const sizes = ['small', 'default', 'large'];
    const directions = ['dropdown', 'dropup', 'dropright', 'dropleft'];
    const splitOptions = [false, true];
    
    // Organize by style - each style shows all sizes × directions × split
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-lg)';
      
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h5';
      styleLabel.textContent = `${style.charAt(0).toUpperCase() + style.slice(1)} Style`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-md)';
      styleSection.appendChild(styleLabel);
      
      // Show non-split first, then split
      splitOptions.forEach((split) => {
        const splitGroup = document.createElement('div');
        splitGroup.style.display = 'flex';
        splitGroup.style.flexDirection = 'column';
        splitGroup.style.gap = 'var(--size-card-gap-md)';
        
        const splitLabel = document.createElement('div');
        splitLabel.className = 'body1-txt';
        splitLabel.textContent = split ? 'Split Dropdown' : 'Standard Dropdown';
        splitLabel.style.marginBottom = 'var(--size-element-gap-sm)';
        splitGroup.appendChild(splitLabel);
        
        // Show all sizes in rows
        sizes.forEach((size) => {
          const sizeRow = document.createElement('div');
          sizeRow.style.display = 'flex';
          sizeRow.style.flexDirection = 'row';
          sizeRow.style.flexWrap = 'wrap';
          sizeRow.style.gap = 'var(--size-element-gap-md)';
          sizeRow.style.alignItems = 'flex-start';
          sizeRow.style.marginBottom = 'var(--size-card-gap-sm)';
          
          // Show all directions for this size
          directions.forEach((direction) => {
            const dropdown = PlusInterface.createDropdown({
              buttonText: split ? 'Split Dropdown' : 'Dropdown',
              size: size,
              style: style,
              split: split,
              direction: direction,
              items: [], // No items for button-only display
            });
            
            sizeRow.appendChild(dropdown);
          });
          
          splitGroup.appendChild(sizeRow);
        });
        
        styleSection.appendChild(splitGroup);
      });
      
      container.appendChild(styleSection);
    });
    
    return container;
  },
};

