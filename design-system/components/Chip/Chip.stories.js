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
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Chip',
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
 * Overview
 * Shows all chip combinations: all styles × all sizes
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const styles = ['default', 'primary', 'secondary', 'info', 'warning', 'error', 'success'];
    const sizes = ['h4', 'h5', 'h6', 'b1', 'b2', 'b3'];
    
    // Organize by style - each style shows all sizes
    styles.forEach((style) => {
      const styleSection = document.createElement('div');
      styleSection.style.display = 'flex';
      styleSection.style.flexDirection = 'column';
      styleSection.style.gap = 'var(--size-card-gap-md)';
      
      const styleLabel = document.createElement('div');
      styleLabel.className = 'h6';
      styleLabel.textContent = `${style.charAt(0).toUpperCase() + style.slice(1)} Style - All Sizes`;
      styleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
      styleSection.appendChild(styleLabel);
      
      const sizesRow = document.createElement('div');
      sizesRow.style.display = 'flex';
      sizesRow.style.flexWrap = 'wrap';
      sizesRow.style.alignItems = 'center';
      sizesRow.style.gap = 'var(--size-card-gap-md)';
      
      sizes.forEach((size) => {
        const chip = PlusInterface.createChip({
          text: 'Badge',
          style: style,
          size: size,
          onRemove: () => {
            console.log(`Removed: ${style} ${size}`);
          }
        });
        sizesRow.appendChild(chip);
      });
      
      styleSection.appendChild(sizesRow);
      container.appendChild(styleSection);
    });
    
    return container;
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

