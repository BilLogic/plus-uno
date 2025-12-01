/**
 * Chip - Pressed State
 * Shows a chip in the pressed state
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Chip/State/Pressed',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Pressed state chip - shows state layer with 16% opacity using linear gradient.',
      },
    },
  },
};

/**
 * Pressed State
 * Shows a chip in the pressed state
 */
export const Pressed = {
  render: () => {
    const container = document.createElement('div');
    const chip = PlusInterface.createChip({
      text: 'Badge',
      style: 'default',
      size: 'b1',
      classes: ['plus-chip-pressed'],
      onRemove: () => {
        console.log('Removed: pressed state');
      }
    });
    container.appendChild(chip);
    return container;
  },
};

