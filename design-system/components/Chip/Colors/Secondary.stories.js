/**
 * Chip - Secondary Style
 * Shows a chip with the secondary style
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Chip/Colors/Secondary',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Secondary style chip - secondary brand color.',
      },
    },
  },
};

/**
 * Secondary Style
 * Shows a chip with the secondary style
 */
export const Secondary = {
  render: () => {
    const container = document.createElement('div');
    const chip = PlusInterface.createChip({
      text: 'Badge',
      style: 'secondary',
      size: 'b1',
      classes: [],
      onRemove: () => {
        console.log('Removed: secondary style');
      }
    });
    container.appendChild(chip);
    return container;
  },
};

