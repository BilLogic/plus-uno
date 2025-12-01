/**
 * Tooltip Sizes Stories
 * Size variants: small, default, large
 */

import { createTooltipButton } from "../index.js";

export default {
  title: 'Components/Tooltip/Sizes',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Tooltip size variants: small (compact, 150px max width), default (standard, 200px max width), and large (spacious, 300px max width). Uses element padding tokens for spacing.',
      },
    },
  },
};

/**
 * Small
 * Compact size tooltip for brief information
 */
export const Small = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    
    const button = createTooltipButton({
      buttonText: 'Small Tooltip',
      text: 'This is a small tooltip',
      placement: 'bottom',
      size: 'small',
    });
    
    container.appendChild(button);
    return container;
  },
};

/**
 * Default
 * Standard size tooltip for most use cases
 */
export const Default = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    
    const button = createTooltipButton({
      buttonText: 'Default Tooltip',
      text: 'This is a default size tooltip',
      placement: 'bottom',
      size: 'default',
    });
    
    container.appendChild(button);
    return container;
  },
};

/**
 * Large
 * Spacious size tooltip for more detailed information
 */
export const Large = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'inline-block';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    
    const button = createTooltipButton({
      buttonText: 'Large Tooltip',
      text: 'This is a large tooltip with more space for detailed information',
      placement: 'bottom',
      size: 'large',
    });
    
    container.appendChild(button);
    return container;
  },
};

/**
 * All Sizes
 * Shows all size variants together
 */
export const AllSizes = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    
    ['small', 'default', 'large'].forEach((size) => {
      const button = createTooltipButton({
        buttonText: size,
        text: size === 'small' ? 'Small tooltip' : size === 'default' ? 'Default tooltip' : 'Large tooltip with more space',
        placement: 'bottom',
        size: size,
      });
      container.appendChild(button);
    });
    
    return container;
  },
};

