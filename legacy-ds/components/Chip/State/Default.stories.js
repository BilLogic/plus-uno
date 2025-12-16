/**
 * Chip - Default State
 * Shows a chip in the default state
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Chip/State/Default',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Default state chip - normal, non-interactive state.',
      },
    },
  },
};

/**
 * Default State
 * Shows a chip in the default state
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
        console.log('Removed: default state');
      }
    });
    container.appendChild(chip);
    return container;
  },
};

