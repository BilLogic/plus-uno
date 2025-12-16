/**
 * Chip - Primary Style
 * Shows a chip with the primary style
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Chip/Colors/Primary',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Primary style chip - primary brand color.',
      },
    },
  },
};

/**
 * Primary Style
 * Shows a chip with the primary style
 */
export const Primary = {
  render: () => {
    const container = document.createElement('div');
    const chip = PlusInterface.createChip({
      text: 'Badge',
      style: 'primary',
      size: 'b1',
      classes: [],
      onRemove: () => {
        console.log('Removed: primary style');
      }
    });
    container.appendChild(chip);
    return container;
  },
};

