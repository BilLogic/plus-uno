/**
 * Chip - Info Style
 * Shows a chip with the info style
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Chip/Colors/Info',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Info style chip - teal for informational content.',
      },
    },
  },
};

/**
 * Info Style
 * Shows a chip with the info style
 */
export const Info = {
  render: () => {
    const container = document.createElement('div');
    const chip = PlusInterface.createChip({
      text: 'Badge',
      style: 'info',
      size: 'b1',
      classes: [],
      onRemove: () => {
        console.log('Removed: info style');
      }
    });
    container.appendChild(chip);
    return container;
  },
};

