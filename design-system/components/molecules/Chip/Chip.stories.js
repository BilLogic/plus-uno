/**
 * Chip Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Chips are **Element** components used to display removable tags, filters, and selections.
 * They are similar to badges but are always removable - this is what differentiates them from badges.
 * Chips provide visual context and allow users to remove selected items, active filters, or entered values.
 * 
 * ### When to Use
 * - **Removable tags**: Tags that can be removed by the user (e.g., filter tags, selected items)
 * - **User selections**: Display selected items that can be deselected
 * - **Input chips**: Show entered values that can be removed (e.g., email addresses, tags)
 * - **Filter chips**: Active filters that users can clear
 * - **Choice chips**: Selectable options that can be toggled on/off
 * 
 * ### When NOT to Use
 * - **Static labels**: Use badges for labels that don't need removal functionality
 * - **Status indicators**: Use badges for status information that shouldn't be removed
 * - **Counts**: Use badges for numeric counts or quantities
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens)
 * - **Token Usage**: 
 *   - Padding: `--size-element-pad-x-sm/md/lg`, `--size-element-pad-y-sm/md/lg`
 *   - Radius: `--size-border-radius-radius-1000` (pill shape)
 *   - Colors: `--color-primary`, `--color-secondary`, `--color-success`, `--color-danger`, etc.
 *   - Typography: Uses headline (h1-h6) or body (b1-b3) typography scales
 * 
 * ### Visual Style Variants
 * Chips come in 7 colors:
 * - **Default**: Black/neutral for general chips
 * - **Primary**: Primary brand color
 * - **Secondary**: Secondary brand color
 * - **Info**: Teal for informational content
 * - **Warning**: Yellow for cautionary states
 * - **Error**: Red for errors or critical states
 * - **Success**: Green for positive states or confirmations
 * 
 * ### Size Variants
 * Chips use typography scales for sizing:
 * - **Headline sizes** (h1-h6): For prominent chips or when matching headline text
 * - **Body sizes** (b1-b3): For standard chips, with b2 as the default
 * 
 * ### Key Feature: Always Removable
 * **All chips are removable by default.** This is the defining characteristic that separates chips from badges.
 * The remove button (X icon) appears on all chips, allowing users to dismiss them.
 * 
 * ### Best Practices
 * - Use semantic color styles (success for positive, danger for negative)
 * - Match chip size to surrounding text hierarchy
 * - Keep chip text concise (1-3 words typically)
 * - Use pill shape (border-radius-1000) for rounded appearance
 * - Ensure sufficient contrast for accessibility
 * - Always provide an `onRemove` callback for handling removal logic
 * - Use chips for user-controlled removable content, badges for static labels
 * 
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/Chip',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Chip component for removable tags, filters, and selections. All chips are removable by default - this differentiates them from badges. Supports multiple styles and typography-based sizes. Uses element-level tokens and pill-shaped border radius.',
      },
    },
  },
};

/**
 * Style Variants
 * Shows all 7 chip style variants exactly as shown in Figma
 * Styles: default, primary, secondary, info, warning, error, success
 */
export const StyleVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-element-gap-sm)';
    container.style.alignItems = 'center';
    
    const styles = [
      { name: 'default', style: 'default' },
      { name: 'primary', style: 'primary' },
      { name: 'secondary', style: 'secondary' },
      { name: 'info', style: 'info' },
      { name: 'warning', style: 'warning' },
      { name: 'error', style: 'error' },
      { name: 'success', style: 'success' }
    ];
    
    styles.forEach(({ name, style }) => {
      const chip = PlusInterface.createChip({
        text: 'Badge',
        style: style,
        size: 'b1',
        onRemove: () => {
          console.log(`Removed: ${name}`);
        }
      });
      container.appendChild(chip);
    });
    
    return container;
  },
};

/**
 * Interactive Chip
 * Interactive playground for testing chip variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    const chip = PlusInterface.createChip(args);
    container.appendChild(chip);
    return container;
  },
  argTypes: {
    text: {
      control: 'text',
      description: 'Chip text',
    },
    style: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'info', 'warning', 'error', 'success'],
      description: 'Chip style',
    },
    size: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3'],
      description: 'Chip size',
    },
  },
  args: {
    text: 'Badge',
    style: 'default',
    size: 'b1',
  },
};

/**
 * States
 * Shows chip states: default, hover, focus, pressed, disabled
 */
export const States = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-section-gap-md)';
    container.style.alignItems = 'flex-start';
    
    const states = [
      { name: 'default', classes: [] },
      { name: 'hover', classes: ['plus-chip-hover'] },
      { name: 'focus', classes: ['plus-chip-focus'] },
      { name: 'pressed', classes: ['plus-chip-pressed'] },
      { name: 'disabled', classes: ['plus-chip-disabled'] }
    ];
    
    states.forEach(({ name, classes }) => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.gap = 'var(--size-element-gap-xs)';
      wrapper.style.alignItems = 'flex-start';
      
      const label = document.createElement('div');
      label.className = 'body3-txt';
      label.style.color = 'var(--color-outline)';
      label.style.fontSize = '12px';
      label.textContent = name;
      wrapper.appendChild(label);
      
      const chip = PlusInterface.createChip({
        text: 'Badge',
        style: 'default',
        size: 'b1',
        classes: classes,
        onRemove: () => {
          console.log(`Removed: ${name}`);
        }
      });
      wrapper.appendChild(chip);
      
      container.appendChild(wrapper);
    });
    
    return container;
  },
};

/**
 * Usage Examples
 * Real-world examples showing chips in different contexts
 */
export const UsageExamples = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-md)';
    
    // Example 1: Filter chips
    const filterSection = document.createElement('div');
    filterSection.style.display = 'flex';
    filterSection.style.flexDirection = 'column';
    filterSection.style.gap = 'var(--size-element-gap-sm)';
    
    const filterLabel = document.createElement('div');
    filterLabel.className = 'h6';
    filterLabel.textContent = 'Filter Chips';
    filterLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    filterSection.appendChild(filterLabel);
    
    const filterChipsContainer = document.createElement('div');
    filterChipsContainer.style.display = 'flex';
    filterChipsContainer.style.flexWrap = 'wrap';
    filterChipsContainer.style.gap = 'var(--size-element-gap-sm)';
    
    const filterChips = [
      { text: 'Active', style: 'success' },
      { text: 'Pending', style: 'warning' },
      { text: 'Completed', style: 'primary' },
      { text: 'Archived', style: 'secondary' }
    ];
    
    filterChips.forEach((chipData) => {
      const chip = PlusInterface.createChip({
        text: chipData.text,
        style: chipData.style,
        size: 'b2',
        onRemove: () => {
          console.log(`Removed filter: ${chipData.text}`);
        }
      });
      filterChipsContainer.appendChild(chip);
    });
    
    filterSection.appendChild(filterChipsContainer);
    container.appendChild(filterSection);
    
    // Example 2: Selected items
    const selectedSection = document.createElement('div');
    selectedSection.style.display = 'flex';
    selectedSection.style.flexDirection = 'column';
    selectedSection.style.gap = 'var(--size-element-gap-sm)';
    
    const selectedLabel = document.createElement('div');
    selectedLabel.className = 'h6';
    selectedLabel.textContent = 'Selected Items';
    selectedLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    selectedSection.appendChild(selectedLabel);
    
    const selectedChipsContainer = document.createElement('div');
    selectedChipsContainer.style.display = 'flex';
    selectedChipsContainer.style.flexWrap = 'wrap';
    selectedChipsContainer.style.gap = 'var(--size-element-gap-sm)';
    
    const selectedItems = [
      { text: 'Item 1', style: 'primary' },
      { text: 'Item 2', style: 'primary' },
      { text: 'Item 3', style: 'primary' }
    ];
    
    selectedItems.forEach((item) => {
      const chip = PlusInterface.createChip({
        text: item.text,
        style: item.style,
        size: 'b2',
        onRemove: () => {
          console.log(`Deselected: ${item.text}`);
        }
      });
      selectedChipsContainer.appendChild(chip);
    });
    
    selectedSection.appendChild(selectedChipsContainer);
    container.appendChild(selectedSection);
    
    // Example 3: Input chips (e.g., email addresses)
    const inputSection = document.createElement('div');
    inputSection.style.display = 'flex';
    inputSection.style.flexDirection = 'column';
    inputSection.style.gap = 'var(--size-element-gap-sm)';
    
    const inputLabel = document.createElement('div');
    inputLabel.className = 'h6';
    inputLabel.textContent = 'Input Chips (e.g., Email Addresses)';
    inputLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    inputSection.appendChild(inputLabel);
    
    const inputChipsContainer = document.createElement('div');
    inputChipsContainer.style.display = 'flex';
    inputChipsContainer.style.flexWrap = 'wrap';
    inputChipsContainer.style.gap = 'var(--size-element-gap-sm)';
    
    const inputChips = [
      { text: 'user@example.com', style: 'primary' },
      { text: 'admin@example.com', style: 'primary' },
      { text: 'support@example.com', style: 'primary' }
    ];
    
    inputChips.forEach((chipData) => {
      const chip = PlusInterface.createChip({
        text: chipData.text,
        style: chipData.style,
        size: 'b2',
        onRemove: () => {
          console.log(`Removed: ${chipData.text}`);
        }
      });
      inputChipsContainer.appendChild(chip);
    });
    
    inputSection.appendChild(inputChipsContainer);
    container.appendChild(inputSection);
    
    // Example 4: Different sizes
    const sizesSection = document.createElement('div');
    sizesSection.style.display = 'flex';
    sizesSection.style.flexDirection = 'column';
    sizesSection.style.gap = 'var(--size-element-gap-sm)';
    
    const sizesLabel = document.createElement('div');
    sizesLabel.className = 'h6';
    sizesLabel.textContent = 'Size Variants';
    sizesLabel.style.marginBottom = 'var(--size-element-gap-xs)';
    sizesSection.appendChild(sizesLabel);
    
    const sizesChipsContainer = document.createElement('div');
    sizesChipsContainer.style.display = 'flex';
    sizesChipsContainer.style.flexDirection = 'column';
    sizesChipsContainer.style.gap = 'var(--size-element-gap-sm)';
    
    const sizeVariants = ['h4', 'h5', 'h6', 'b1', 'b2', 'b3'];
    
    sizeVariants.forEach((size) => {
      const chip = PlusInterface.createChip({
        text: `Size ${size.toUpperCase()}`,
        style: 'primary',
        size: size,
        onRemove: () => {
          console.log(`Removed size ${size} chip`);
        }
      });
      sizesChipsContainer.appendChild(chip);
    });
    
    sizesSection.appendChild(sizesChipsContainer);
    container.appendChild(sizesSection);
    
    return container;
  },
};

