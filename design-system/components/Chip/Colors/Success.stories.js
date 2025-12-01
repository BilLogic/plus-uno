/**
 * Chip - Success Style
 * Shows a chip with the success style
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Chip/Colors/Success',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Success style chip - green for positive states or confirmations.',
      },
    },
  },
};

/**
 * Success Style
 * Shows a chip with the success style
 */
export const Success = {
  render: () => {
    const container = document.createElement('div');
    const chip = PlusInterface.createChip({
      text: 'Badge',
      style: 'success',
      size: 'b1',
      classes: [],
      onRemove: () => {
        console.log('Removed: success style');
      }
    });
    container.appendChild(chip);
    return container;
  },
};

