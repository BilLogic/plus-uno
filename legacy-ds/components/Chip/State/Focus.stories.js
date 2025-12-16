/**
 * Chip - Focus State
 * Shows a chip in the focus state
 */

import { PlusInterface } from "../../index.js";

export default {
  title: 'Components/Chip/State/Focus',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Focus state chip - shows state layer with 12% opacity.',
      },
    },
  },
};

/**
 * Focus State
 * Shows a chip in the focus state
 */
export const Focus = {
  render: () => {
    const container = document.createElement('div');
    const chip = PlusInterface.createChip({
      text: 'Badge',
      style: 'default',
      size: 'b1',
      classes: ['plus-chip-focus'],
      onRemove: () => {
        console.log('Removed: focus state');
      }
    });
    container.appendChild(chip);
    return container;
  },
};

