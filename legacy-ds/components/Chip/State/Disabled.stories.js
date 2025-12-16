/**
 * Chip - Disabled State
 * Shows a chip in the disabled state
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Chip/State/Disabled',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Disabled state chip - shows with 38% opacity and disabled cursor.',
      },
    },
  },
};

/**
 * Disabled State
 * Shows a chip in the disabled state
 */
export const Disabled = {
  render: () => {
    const container = document.createElement('div');
    const chip = PlusInterface.createChip({
      text: 'Badge',
      style: 'default',
      size: 'b1',
      classes: ['plus-chip-disabled'],
      onRemove: () => {
        console.log('Removed: disabled state');
      }
    });
    container.appendChild(chip);
    return container;
  },
};

