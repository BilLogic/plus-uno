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
 * All Variants
 * Shows all rich text editor sizes and states
 */
export const AllVariants = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  
  // Small Size
  const smallSection = document.createElement('div');
  const smallLabel = document.createElement('h3');
  smallLabel.textContent = 'Small';
  smallLabel.style.marginBottom = '24px';
  smallSection.appendChild(smallLabel);
  
  const smallEditor = createRichTextEditor({
    id: 'editor-small',
    placeholder: 'Enter text...',
    size: 'small',
    minHeight: 100
  });
  smallSection.appendChild(smallEditor);
  container.appendChild(smallSection);
  
  // Medium Size
  const mediumSection = document.createElement('div');
  const mediumLabel = document.createElement('h3');
  mediumLabel.textContent = 'Medium (Default)';
  mediumLabel.style.marginBottom = '24px';
  mediumSection.appendChild(mediumLabel);
  
  const mediumEditor = createRichTextEditor({
    id: 'editor-medium',
    placeholder: 'Enter text...',
    size: 'medium',
    minHeight: 120
  });
  mediumSection.appendChild(mediumEditor);
  container.appendChild(mediumSection);
  
  // Large Size
  const largeSection = document.createElement('div');
  const largeLabel = document.createElement('h3');
  largeLabel.textContent = 'Large';
  largeLabel.style.marginBottom = '24px';
  largeSection.appendChild(largeLabel);
  
  const largeEditor = createRichTextEditor({
    id: 'editor-large',
    placeholder: 'Enter text...',
    size: 'large',
    minHeight: 150
  });
  largeSection.appendChild(largeEditor);
  container.appendChild(largeSection);
  
  return container;
};

/**
 * With Content
 * Shows rich text editor with pre-filled content
 */
export const WithContent = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '800px';
  
  const editor = createRichTextEditor({
    id: 'editor-with-content',
    placeholder: 'Enter text...',
    size: 'medium',
    value: '<p>This is <strong>bold</strong> text and this is <em>italic</em> text.</p><ul><li>First item</li><li>Second item</li></ul><p>You can edit this content.</p>',
    minHeight: 200
  });
  
  container.appendChild(editor);
  return container;
};

/**
 * States
 * Shows different states: default, read-only, disabled
 */
export const States = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '48px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '800px';
  
  // Default
  const defaultSection = document.createElement('div');
  const defaultLabel = document.createElement('h3');
  defaultLabel.textContent = 'Default';
  defaultLabel.style.marginBottom = '24px';
  defaultSection.appendChild(defaultLabel);
  
  const defaultEditor = createRichTextEditor({
    id: 'editor-default',
    placeholder: 'Enter text...',
    size: 'medium',
    minHeight: 120
  });
  defaultSection.appendChild(defaultEditor);
  container.appendChild(defaultSection);
  
  // Read-only
  const readonlySection = document.createElement('div');
  const readonlyLabel = document.createElement('h3');
  readonlyLabel.textContent = 'Read-only';
  readonlyLabel.style.marginBottom = '24px';
  readonlySection.appendChild(readonlyLabel);
  
  const readonlyEditor = createRichTextEditor({
    id: 'editor-readonly',
    placeholder: 'Enter text...',
    size: 'medium',
    readonly: true,
    value: '<p>This is <strong>read-only</strong> content. You cannot edit it.</p>',
    minHeight: 120
  });
  readonlySection.appendChild(readonlyEditor);
  container.appendChild(readonlySection);
  
  // Disabled
  const disabledSection = document.createElement('div');
  const disabledLabel = document.createElement('h3');
  disabledLabel.textContent = 'Disabled';
  disabledLabel.style.marginBottom = '24px';
  disabledSection.appendChild(disabledLabel);
  
  const disabledEditor = createRichTextEditor({
    id: 'editor-disabled',
    placeholder: 'Enter text...',
    size: 'medium',
    disabled: true,
    value: '<p>This editor is <strong>disabled</strong>.</p>',
    minHeight: 120
  });
  disabledSection.appendChild(disabledEditor);
  container.appendChild(disabledSection);
  
  return container;
};

/**
 * Custom Toolbar
 * Shows rich text editor with custom toolbar buttons
 */
export const CustomToolbar = () => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '24px';
  container.style.padding = '24px';
  container.style.backgroundColor = 'var(--color-surface)';
  container.style.maxWidth = '800px';
  
  const editor = createRichTextEditor({
    id: 'editor-custom',
    placeholder: 'Enter text...',
    size: 'medium',
    toolbarButtons: ['bold', 'italic', 'underline', 'list-ul', 'list-ol', 'link'],
    minHeight: 200
  });
  
  const label = document.createElement('div');
  label.className = 'body2-txt';
  label.textContent = 'Custom Toolbar (Bold, Italic, Underline, Lists, Link only)';
  label.style.marginBottom = '8px';
  container.appendChild(label);
  container.appendChild(editor);
  
  return container;
};

/**
 * Interactive
 * Interactive playground with Storybook controls
 */
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





