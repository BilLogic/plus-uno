/**
 * Chip - Hover State
 * Shows a chip in the hover state
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Chip/State/Hover',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Hover state chip - shows state layer with 8% opacity.',
      },
    },
  },
};

/**
 * Hover State
 * Shows a chip in the hover state
 */
export const Hover = {
  render: () => {
    const container = document.createElement('div');
    const chip = PlusInterface.createChip({
      text: 'Badge',
      style: 'default',
      size: 'b1',
      classes: ['plus-chip-hover'],
      onRemove: () => {
        console.log('Removed: hover state');
      }
    });
    container.appendChild(chip);
    return container;
  },
};

