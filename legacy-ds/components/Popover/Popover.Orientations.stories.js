/**
 * Popover Orientations Stories
 * Direction/orientation variants: top, bottom, left, right
 * Shows static popovers (always visible) matching Figma design exactly
 */

import { createStaticPopover } from "./index.js";

export default {
  title: 'Components/Popover/Orientations',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Popover orientation variants: top (appears above trigger), bottom (appears below trigger), left (appears to left of trigger), right (appears to right of trigger). All examples shown statically as per Figma design.',
      },
    },
  },
};

/**
 * Top
 * Popover appears above the trigger, arrow points down
 */
export const Top = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.minHeight = '200px';
    container.style.position = 'relative';
    
    const popover = createStaticPopover({
      title: 'Popover title',
      content: "And here's some amazing content. It's very engaging. Right?",
      placement: 'top'
    });
    
    // Position popover statically
    popover.style.position = 'absolute';
    popover.style.top = '50%';
    popover.style.left = '50%';
    popover.style.transform = 'translate(-50%, -100%)';
    popover.style.marginTop = '-20px';
    
    container.appendChild(popover);
    return container;
  },
};

/**
 * Bottom
 * Popover appears below the trigger, arrow points up
 */
export const Bottom = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.minHeight = '200px';
    container.style.position = 'relative';
    
    const popover = createStaticPopover({
      title: 'Popover title',
      content: "And here's some amazing content. It's very engaging. Right?",
      placement: 'bottom'
    });
    
    // Position popover statically
    popover.style.position = 'absolute';
    popover.style.top = '50%';
    popover.style.left = '50%';
    popover.style.transform = 'translate(-50%, 0)';
    popover.style.marginTop = '20px';
    
    container.appendChild(popover);
    return container;
  },
};

/**
 * Left
 * Popover appears to the left of the trigger, arrow points right
 */
export const Left = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.minHeight = '200px';
    container.style.position = 'relative';
    
    const popover = createStaticPopover({
      title: 'Popover title',
      content: "And here's some amazing content. It's very engaging. Right?",
      placement: 'left'
    });
    
    // Position popover statically
    popover.style.position = 'absolute';
    popover.style.top = '50%';
    popover.style.left = '50%';
    popover.style.transform = 'translate(-100%, -50%)';
    popover.style.marginLeft = '-20px';
    
    container.appendChild(popover);
    return container;
  },
};

/**
 * Right
 * Popover appears to the right of the trigger, arrow points left
 */
export const Right = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.minHeight = '200px';
    container.style.position = 'relative';
    
    const popover = createStaticPopover({
      title: 'Popover title',
      content: "And here's some amazing content. It's very engaging. Right?",
      placement: 'right'
    });
    
    // Position popover statically
    popover.style.position = 'absolute';
    popover.style.top = '50%';
    popover.style.left = '50%';
    popover.style.transform = 'translate(0, -50%)';
    popover.style.marginLeft = '20px';
    
    container.appendChild(popover);
    return container;
  },
};

/**
 * All Orientations
 * Shows all orientation variants together statically
 */
export const AllOrientations = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(2, 1fr)';
    container.style.gridTemplateRows = 'repeat(2, 1fr)';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.minHeight = '400px';
    container.style.position = 'relative';
    
    const placements = [
      { placement: 'top', gridArea: '1 / 1 / 2 / 2' },
      { placement: 'bottom', gridArea: '2 / 1 / 3 / 2' },
      { placement: 'left', gridArea: '1 / 2 / 2 / 3' },
      { placement: 'right', gridArea: '2 / 2 / 3 / 3' }
    ];
    
    placements.forEach(({ placement, gridArea }) => {
      const cell = document.createElement('div');
      cell.style.position = 'relative';
      cell.style.display = 'flex';
      cell.style.justifyContent = 'center';
      cell.style.alignItems = 'center';
      cell.style.gridArea = gridArea;
      
      const popover = createStaticPopover({
        title: 'Popover title',
        content: "And here's some amazing content. It's very engaging. Right?",
        placement: placement
      });
      
      // Position popover in center of cell based on placement
      popover.style.position = 'absolute';
      
      if (placement === 'top') {
        popover.style.top = '50%';
        popover.style.left = '50%';
        popover.style.transform = 'translate(-50%, -100%)';
        popover.style.marginTop = '-20px';
      } else if (placement === 'bottom') {
        popover.style.top = '50%';
        popover.style.left = '50%';
        popover.style.transform = 'translate(-50%, 0)';
        popover.style.marginTop = '20px';
      } else if (placement === 'left') {
        popover.style.top = '50%';
        popover.style.left = '50%';
        popover.style.transform = 'translate(-100%, -50%)';
        popover.style.marginLeft = '-20px';
      } else if (placement === 'right') {
        popover.style.top = '50%';
        popover.style.left = '50%';
        popover.style.transform = 'translate(0, -50%)';
        popover.style.marginLeft = '20px';
      }
      
      cell.appendChild(popover);
      container.appendChild(cell);
    });
    
    return container;
  },
};

