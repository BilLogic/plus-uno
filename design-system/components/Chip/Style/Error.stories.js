/**
 * Chip - Error Style
 * Shows a chip with the error style
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Chip/Style/Error',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Error style chip - red for errors or critical states.',
      },
    },
  },
};

/**
 * Error Style
 * Shows a chip with the error style
 */
export const Error = {
  render: () => {
    const container = document.createElement('div');
    const chip = PlusInterface.createChip({
      text: 'Badge',
      style: 'error',
      size: 'b1',
      classes: [],
      onRemove: () => {
        console.log('Removed: error style');
      }
    });
    container.appendChild(chip);
    return container;
  },
};

