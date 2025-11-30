/**
 * Chip - Default Style
 * Shows a chip with the default style
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Chip/Style/Default',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Default style chip - black/neutral for general chips.',
      },
    },
  },
};

/**
 * Default Style
 * Shows a chip with the default style
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    const chip = PlusInterface.createChip({
      text: 'Badge',
      style: 'default',
      size: 'b1',
      classes: [],
      onRemove: () => {
        console.log('Removed: default style');
      }
    });
    container.appendChild(chip);
    return container;
  },
};

