/**
 * Button Group Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Button Groups are **Element** components that group related buttons together.
 * They provide visual cohesion and help organize multiple actions that are related or sequential.
 * 
 * ### When to Use
 * - **Related actions**: Group buttons that perform related functions
 * - **Sequential steps**: Show progression through steps or stages
 * - **Filtering/Sorting**: Group filter or sort options together
 * - **Toolbars**: Organize toolbar actions into logical groups
 * - **Form actions**: Group form submission and cancellation buttons
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens)
 * - **Token Usage**: 
 *   - Padding: `--size-element-pad-x-sm/md/lg`, `--size-element-pad-y-sm/md/lg` (for individual buttons)
 *   - Gap: `--size-element-gap-sm/md/lg` (between buttons in group)
 *   - Radius: `--size-element-radius-sm/md/lg` (for button corners)
 *   - Colors: `--color-primary`, `--color-secondary`, etc. (for button styles)
 * 
 * ### Layout Variants
 * - **Horizontal**: Buttons arranged side-by-side (default for most use cases)
 * - **Vertical**: Buttons stacked vertically (for narrow spaces or mobile)
 * 
 * ### Size Variants
 * - **Small**: Compact size for dense interfaces
 * - **Default**: Standard size for most use cases
 * - **Large**: Prominent size for important action groups
 * 
 * ### Style Variants
 * All button styles are supported (primary, secondary, tertiary, success, danger, warning)
 * 
 * ### Best Practices
 * - Group logically related actions together
 * - Use consistent sizing within a group
 * - Limit groups to 2-5 buttons for clarity
 * - Use horizontal layout for most cases, vertical for narrow spaces
 * - Ensure sufficient spacing between buttons
 * - Maintain visual hierarchy (primary action first)
 * 
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/ButtonGroup',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Button Group component for grouping related buttons together. Supports horizontal and vertical layouts with multiple sizes and styles. Uses element-level tokens.',
      },
    },
  },
};

/**
 * All Variants
 * Shows all button group combinations organized by style: each style shows all layouts × all sizes
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const styles = ['primary', 'secondary', 'tertiary', 'success', 'info', 'warning', 'error'];
    const sizes = ['small', 'default', 'large'];
    const alignments = ['horizontal', 'vertical'];
    
    // Organize by style - each style shows all layouts × all sizes
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-md)';
      
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h6';
      styleLabel.textContent = `${style.charAt(0).toUpperCase() + style.slice(1)} Style - All Layouts × All Sizes`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      
      // For each alignment, show all sizes
      alignments.forEach((alignment) => {
        const alignmentGroup = document.createElement('div');
        alignmentGroup.style.display = 'flex';
        alignmentGroup.style.flexDirection = 'column';
        alignmentGroup.style.gap = 'var(--size-element-gap-sm)';
        
        const alignmentLabel = document.createElement('div');
        alignmentLabel.className = 'body2-txt';
        alignmentLabel.textContent = `${alignment.charAt(0).toUpperCase() + alignment.slice(1)} Layout:`;
        alignmentLabel.style.marginBottom = 'var(--size-element-gap-xs)';
        alignmentGroup.appendChild(alignmentLabel);
        
        const sizesRow = document.createElement('div');
        sizesRow.style.display = 'flex';
        sizesRow.style.flexDirection = alignment === 'horizontal' ? 'row' : 'column';
        sizesRow.style.flexWrap = 'wrap';
        sizesRow.style.gap = 'var(--size-card-gap-md)';
        
        sizes.forEach((size) => {
          const group = PlusInterface.createButtonGroup({
            buttons: [
              { btnText: `${size} 1` },
              { btnText: `${size} 2` },
              { btnText: `${size} 3` }
            ],
            size: size,
            style: style,
            fill: 'filled',
            alignment: alignment
          });
          sizesRow.appendChild(group);
        });
        
        alignmentGroup.appendChild(sizesRow);
        styleSection.appendChild(alignmentGroup);
      });
      
      container.appendChild(styleSection);
    });
    
    return container;
  },
};

/**
 * Interactive Button Group
 * Interactive playground for testing button group variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const group = PlusInterface.createButtonGroup({
      buttons: [
        { btnText: 'Button 1', buttonOnClick: () => console.log('Button 1 clicked') },
        { btnText: 'Button 2', buttonOnClick: () => console.log('Button 2 clicked') },
        { btnText: 'Button 3', buttonOnClick: () => console.log('Button 3 clicked') }
      ],
      size: args.size || 'default',
      style: args.style || 'primary',
      fill: args.fill || 'filled',
      alignment: args.alignment || 'horizontal'
    });
    container.appendChild(group);
    return container;
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Button size',
    },
    style: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning'],
      description: 'Button style',
    },
    fill: {
      control: 'select',
      options: ['filled', 'outline', 'tonal', 'text'],
      description: 'Button fill',
    },
    alignment: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Button alignment',
    },
  },
  args: {
    size: 'default',
    style: 'primary',
    fill: 'filled',
    alignment: 'horizontal',
  },
};
