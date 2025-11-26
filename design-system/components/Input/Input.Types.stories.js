/**
 * Input Types Stories
 * Input type variants organized under "Types" subcategory
 */

export default {
  title: 'Components/Input/Types',
  tags: ['autodocs'],
};

/**
 * Text Input
 */
export const TextInput = {
  render: () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Enter text...';
    return input;
  },
};

/**
 * Textarea
 */
export const Textarea = {
  render: () => {
    const textarea = document.createElement('textarea');
    textarea.className = 'plus-textarea body2-txt';
    textarea.placeholder = 'Enter text...';
    textarea.rows = 4;
    return textarea;
  },
};

