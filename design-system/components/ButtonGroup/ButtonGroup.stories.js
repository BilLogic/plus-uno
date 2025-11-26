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
 * - **Component Dependencies**:
 *   - Uses the **Button component** (`createButton` from `button.js`) for each button in the group
 *   - Each button uses `element-` tokens for its own styling (padding, gap, radius, border)
 *   - Each button uses Material Design 3 color tokens (`--color-primary`, `--color-on-primary`, etc.)
 *   - See `Molecules/Button` documentation for complete Button token usage
 * - **ButtonGroup Container Token Usage**: 
 *   - Gap: `--size-element-gap-sm/md/lg` (between buttons in group)
 *   - Layout: Flexbox for horizontal/vertical arrangement
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
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 * See Molecules/Button for Button component documentation (used for individual buttons in group)
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/ButtonGroup',
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
 * Shows all button group combinations exactly as shown in Figma
 * Layout matches Figma: 3 styles (primary, secondary, tertiary) × 3 sizes (small, medium, large) × 2 alignments (horizontal, vertical) × 4 button counts (2, 3, 4, 5)
 * Text: "Left", "Middle", "Right" (with "Middle" repeated for groups with 4-5 buttons)
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-xl)';
    
    const styles = ['primary', 'secondary', 'tertiary'];
    const sizes = ['small', 'default', 'large'];
    const buttonCounts = [2, 3, 4, 5];
    
    // Organize by style (primary, secondary, tertiary) - each style gets its own section
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-section-gap-lg)';
      
      // For each style, show horizontal alignment first, then vertical
      ['horizontal', 'vertical'].forEach((alignment) => {
        const alignmentSection = document.createElement('div');
        alignmentSection.style.display = 'flex';
        alignmentSection.style.flexDirection = alignment === 'horizontal' ? 'row' : 'column';
        alignmentSection.style.flexWrap = 'wrap';
        alignmentSection.style.gap = 'var(--size-card-gap-lg)';
        alignmentSection.style.alignItems = 'flex-start';
        
        // Show all sizes (small, default, large) for this alignment
        sizes.forEach((size) => {
          const sizeColumn = document.createElement('div');
          sizeColumn.style.display = 'flex';
          sizeColumn.style.flexDirection = alignment === 'horizontal' ? 'column' : 'row';
          sizeColumn.style.gap = 'var(--size-element-gap-md)';
          sizeColumn.style.alignItems = 'flex-start';
          
          // Show all button counts (2, 3, 4, 5) for this size
          buttonCounts.forEach((count) => {
            const buttonTexts = [];
            if (count === 2) {
              buttonTexts.push('Left', 'Right');
            } else if (count === 3) {
              buttonTexts.push('Left', 'Middle', 'Right');
            } else if (count === 4) {
              buttonTexts.push('Left', 'Middle', 'Middle', 'Right');
            } else if (count === 5) {
              buttonTexts.push('Left', 'Middle', 'Middle', 'Middle', 'Right');
            }
            
            const group = PlusInterface.createButtonGroup({
              buttons: buttonTexts.map(text => ({ btnText: text })),
              size: size,
              style: style,
              alignment: alignment
            });
            
            sizeColumn.appendChild(group);
          });
          
          alignmentSection.appendChild(sizeColumn);
        });
        
        styleSection.appendChild(alignmentSection);
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
