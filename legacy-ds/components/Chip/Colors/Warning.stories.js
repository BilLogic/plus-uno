/**
 * Chip - Warning Style
 * Shows a chip with the warning style
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Chip/Colors/Warning',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Warning style chip - yellow for cautionary states.',
      },
    },
  },
};

/**
 * Warning Style
 * Shows a chip with the warning style
 */
export const Warning = {
  render: () => {
    const container = document.createElement('div');
    const chip = PlusInterface.createChip({
      text: 'Badge',
      style: 'warning',
      size: 'b1',
      classes: [],
      onRemove: () => {
        console.log('Removed: warning style');
      }
    });
    container.appendChild(chip);
    return container;
  },
};

