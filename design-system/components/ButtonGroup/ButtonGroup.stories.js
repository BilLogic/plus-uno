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
 * 
 * ### Variant Stories
 * - **Orientations**: See `ButtonGroup.Orientations.stories.js` for horizontal/vertical layout examples
 * - **Size Variants**: See `ButtonGroup.SizeVariants.stories.js` for small/default/large size examples
 * - **Style Variants**: See `ButtonGroup.StyleVariants.stories.js` for color style examples
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
 * Overview
 * Shows all button group variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
    // Orientations Section
    const orientationsSection = document.createElement('div');
    orientationsSection.style.display = 'flex';
    orientationsSection.style.flexDirection = 'column';
    orientationsSection.style.gap = 'var(--size-card-gap-md)';
    
    const orientationsHeading = document.createElement('div');
    orientationsHeading.className = 'h5';
    orientationsHeading.textContent = 'Orientations';
    orientationsHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    orientationsSection.appendChild(orientationsHeading);
    
    const orientationsRow = document.createElement('div');
    orientationsRow.style.display = 'flex';
    orientationsRow.style.flexWrap = 'wrap';
    orientationsRow.style.gap = 'var(--size-card-gap-md)';
    orientationsRow.style.alignItems = 'flex-start';
    
    // Horizontal
    const horizontalGroup = PlusInterface.createButtonGroup({
      buttons: [{ btnText: 'Left' }, { btnText: 'Right' }],
      size: 'default',
      style: 'primary',
      alignment: 'horizontal'
    });
    horizontalGroup.style.width = 'fit-content';
    orientationsRow.appendChild(horizontalGroup);
    
    // Vertical
    const verticalGroup = PlusInterface.createButtonGroup({
      buttons: [{ btnText: 'Top' }, { btnText: 'Bottom' }],
      size: 'default',
      style: 'primary',
      alignment: 'vertical'
    });
    verticalGroup.style.width = 'fit-content';
    orientationsRow.appendChild(verticalGroup);
    
    orientationsSection.appendChild(orientationsRow);
    container.appendChild(orientationsSection);
    
    // Sizes Section
    const sizesSection = document.createElement('div');
    sizesSection.style.display = 'flex';
    sizesSection.style.flexDirection = 'column';
    sizesSection.style.gap = 'var(--size-card-gap-md)';
    
    const sizesHeading = document.createElement('div');
    sizesHeading.className = 'h5';
    sizesHeading.textContent = 'Sizes';
    sizesHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    sizesSection.appendChild(sizesHeading);
    
    const sizesRow = document.createElement('div');
    sizesRow.style.display = 'flex';
    sizesRow.style.flexWrap = 'wrap';
    sizesRow.style.gap = 'var(--size-card-gap-md)';
    sizesRow.style.alignItems = 'flex-start';
    
    ['small', 'default', 'large'].forEach((size) => {
      const group = PlusInterface.createButtonGroup({
        buttons: [{ btnText: 'Button' }, { btnText: 'Button' }],
        size: size,
        style: 'primary',
        alignment: 'horizontal'
      });
      group.style.width = 'fit-content';
      sizesRow.appendChild(group);
    });
    
    sizesSection.appendChild(sizesRow);
    container.appendChild(sizesSection);
    
    // Colors Section
    const colorsSection = document.createElement('div');
    colorsSection.style.display = 'flex';
    colorsSection.style.flexDirection = 'column';
    colorsSection.style.gap = 'var(--size-card-gap-md)';
    
    const colorsHeading = document.createElement('div');
    colorsHeading.className = 'h5';
    colorsHeading.textContent = 'Colors';
    colorsHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    colorsSection.appendChild(colorsHeading);
    
    const colorsRow = document.createElement('div');
    colorsRow.style.display = 'flex';
    colorsRow.style.flexWrap = 'wrap';
    colorsRow.style.gap = 'var(--size-card-gap-md)';
    colorsRow.style.alignItems = 'flex-start';
    
    ['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning'].forEach((style) => {
      const group = PlusInterface.createButtonGroup({
        buttons: [{ btnText: 'Button' }, { btnText: 'Button' }],
        size: 'default',
        style: style,
        alignment: 'horizontal'
      });
      group.style.width = 'fit-content';
      colorsRow.appendChild(group);
    });
    
    colorsSection.appendChild(colorsRow);
    container.appendChild(colorsSection);
    
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
    
    // Generate button texts based on buttonCount
    const buttonTexts = [];
    const count = args.buttonCount || 3;
    
    if (count === 2) {
      buttonTexts.push('Button 1', 'Button 2');
    } else if (count === 3) {
      buttonTexts.push('Button 1', 'Button 2', 'Button 3');
    } else if (count === 4) {
      buttonTexts.push('Button 1', 'Button 2', 'Button 3', 'Button 4');
    } else if (count === 5) {
      buttonTexts.push('Button 1', 'Button 2', 'Button 3', 'Button 4', 'Button 5');
    }
    
    const buttons = buttonTexts.map((text, index) => ({
      btnText: text,
      buttonOnClick: () => console.log(`${text} clicked`)
    }));
    
    const group = PlusInterface.createButtonGroup({
      buttons: buttons,
      size: args.size || 'default',
      style: args.style || 'primary',
      fill: args.fill || 'filled',
      alignment: args.alignment || 'horizontal'
    });
    group.style.width = 'fit-content';
    container.appendChild(group);
    return container;
  },
  argTypes: {
    buttonCount: {
      control: { type: 'number', min: 2, max: 5, step: 1 },
      description: 'Number of buttons in the group',
    },
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
    buttonCount: 3,
    size: 'default',
    style: 'primary',
    fill: 'filled',
    alignment: 'horizontal',
  },
};
