/**
 * Rich Text Editor Component Stories
 * 
 * ## Usage and Implementation
 * 
 * Rich text editor component provides a WYSIWYG editor with formatting toolbar.
 * Supports various text formatting options including bold, italic, lists, links, and more.
 * 
 * ### When to Use
 * - **Rich Text Input**: For content that requires formatting (articles, descriptions, comments)
 * - **HTML Content**: When users need to create formatted content
 * - **Long-form Content**: For multi-paragraph content with formatting needs
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-*` tokens)
 * - **Token Usage**: 
 *   - Spacing: Uses `element-*` tokens for padding and gaps
 *   - Colors: Uses semantic color tokens
 *   - Typography: Uses Body/B1/B2/B3 based on size
 * 
 * ### Sizes
 * - **small**: 12px text (B3), smaller padding and toolbar buttons
 * - **medium**: 14px text (B2), default padding
 * - **large**: 16px text (B1), larger padding and toolbar buttons
 * 
 * ### States
 * - **default**: Normal state with placeholder or content
 * - **focus**: Focused state with primary border
 * - **read-only**: Read-only state with surface-variant background, toolbar disabled
 * - **disabled**: Disabled state with reduced opacity
 * 
 * See design-system/components/overview.md for Component Guidelines
 * See design-system/styles/ for Token Reference (colors.md, layout.md, typography.md, icons.md, elevation.md)
 */

import { createRichTextEditor } from './index.js';

export default {
  title: 'Components/RichTextEditor',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Rich text editor component with formatting toolbar. Supports various text formatting options including bold, italic, lists, links, and more.',
      },
    },
  },
};

/**
 * Overview
 * Shows all rich text editor variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    
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
    
    const defaultEditor = createRichTextEditor({
      id: 'overview-editor',
      placeholder: 'Enter text...',
      size: 'medium',
      minHeight: 100
    });
    sizesSection.appendChild(defaultEditor);
    container.appendChild(sizesSection);
    
    return container;
  },
};

export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.maxWidth = '800px';
    
    const editor = createRichTextEditor({
      id: args.id || 'editor-interactive',
      name: args.name,
      placeholder: args.placeholder || 'Enter text...',
      value: args.value,
      size: args.size || 'medium',
      readonly: args.readonly || false,
      disabled: args.disabled || false,
      minHeight: args.minHeight || 200,
      onChange: args.onChange || ((html) => console.log('Content changed:', html))
    });
    
    container.appendChild(editor);
    return container;
  },
  args: {
    id: 'editor-interactive',
    placeholder: 'Enter text...',
    value: '',
    size: 'medium',
    readonly: false,
    disabled: false,
    minHeight: 200
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Editor size'
    },
    readonly: {
      control: { type: 'boolean' },
      description: 'Read-only state'
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disabled state'
    },
    minHeight: {
      control: { type: 'number' },
      description: 'Minimum height in pixels'
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text'
    },
    value: {
      control: { type: 'text' },
      description: 'Initial HTML content'
    }
  }
};





