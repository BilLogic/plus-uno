/**
 * Tooltip Orientations Stories
 * Placement/orientation variants: top, bottom, left, right
 * Shows static tooltips (always visible) matching Figma design exactly
 */

import { createStaticTooltip } from "./index.js";

export default {
  title: 'Components/Tooltip/Orientations',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Tooltip orientation variants: top (appears above trigger), bottom (appears below trigger), left (appears to left of trigger), right (appears to right of trigger). All examples shown statically as per Figma design.',
      },
    },
  },
};

/**
 * Top
 * Tooltip appears above the trigger, arrow points down
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
    
    const tooltip = createStaticTooltip({
      text: 'Tooltip on top',
      placement: 'top',
      size: 'default'
    });
    
    // Position tooltip statically
    tooltip.style.position = 'absolute';
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, -100%)';
    tooltip.style.marginTop = '-20px';
    
    container.appendChild(tooltip);
    return container;
  },
};

/**
 * Bottom
 * Tooltip appears below the trigger, arrow points up
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
    
    const tooltip = createStaticTooltip({
      text: 'Tooltip on bottom',
      placement: 'bottom',
      size: 'default'
    });
    
    // Position tooltip statically
    tooltip.style.position = 'absolute';
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, 0)';
    tooltip.style.marginTop = '20px';
    
    container.appendChild(tooltip);
    return container;
  },
};

/**
 * Left
 * Tooltip appears to the left of the trigger, arrow points right
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
    
    const tooltip = createStaticTooltip({
      text: 'Tooltip on left',
      placement: 'left',
      size: 'default'
    });
    
    // Position tooltip statically
    tooltip.style.position = 'absolute';
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-100%, -50%)';
    tooltip.style.marginLeft = '-20px';
    
    container.appendChild(tooltip);
    return container;
  },
};

/**
 * Right
 * Tooltip appears to the right of the trigger, arrow points left
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
    
    const tooltip = createStaticTooltip({
      text: 'Tooltip on right',
      placement: 'right',
      size: 'default'
    });
    
    // Position tooltip statically
    tooltip.style.position = 'absolute';
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(0, -50%)';
    tooltip.style.marginLeft = '20px';
    
    container.appendChild(tooltip);
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
      { placement: 'top', gridArea: '1 / 1 / 2 / 2', text: 'Tooltip on top' },
      { placement: 'bottom', gridArea: '2 / 1 / 3 / 2', text: 'Tooltip on bottom' },
      { placement: 'left', gridArea: '1 / 2 / 2 / 3', text: 'Tooltip on left' },
      { placement: 'right', gridArea: '2 / 2 / 3 / 3', text: 'Tooltip on right' }
    ];
    
    placements.forEach(({ placement, gridArea, text }) => {
      const cell = document.createElement('div');
      cell.style.position = 'relative';
      cell.style.display = 'flex';
      cell.style.justifyContent = 'center';
      cell.style.alignItems = 'center';
      cell.style.gridArea = gridArea;
      
      const tooltip = createStaticTooltip({
        text: text,
        placement: placement,
        size: 'default'
      });
      
      // Position tooltip in center of cell based on placement
      tooltip.style.position = 'absolute';
      
      if (placement === 'top') {
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -100%)';
        tooltip.style.marginTop = '-20px';
      } else if (placement === 'bottom') {
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, 0)';
        tooltip.style.marginTop = '20px';
      } else if (placement === 'left') {
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-100%, -50%)';
        tooltip.style.marginLeft = '-20px';
      } else if (placement === 'right') {
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(0, -50%)';
        tooltip.style.marginLeft = '20px';
      }
      
      cell.appendChild(tooltip);
      container.appendChild(cell);
    });
    
    return container;
  },
};


