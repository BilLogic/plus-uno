/**
 * Popover Content Stories
 * Content type variants: title + content, content only
 * Uses exact text from Figma: "Popover title" and "And here's some amazing content. It's very engaging. Right?"
 */

import { createStaticPopover } from "./index.js";

export default {
  title: 'Components/Popover/Content',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Popover content variants: title + content (includes dark header with title and light body with content) and content only (light body section only). All examples shown statically as per Figma design.',
      },
    },
  },
};

/**
 * Title and Content
 * Popover with both title and content sections
 */
export const TitleAndContent = {
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
 * Content Only
 * Popover with content only (no title)
 */
export const ContentOnly = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.minHeight = '200px';
    container.style.position = 'relative';
    
    const popover = createStaticPopover({
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
 * All Content Variants
 * Shows all content type variants together statically
 */
export const AllContent = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.minHeight = '200px';
    container.style.position = 'relative';
    
    // Title + Content variant
    const titleAndContentCell = document.createElement('div');
    titleAndContentCell.style.position = 'relative';
    titleAndContentCell.style.display = 'flex';
    titleAndContentCell.style.justifyContent = 'center';
    titleAndContentCell.style.alignItems = 'center';
    titleAndContentCell.style.minHeight = '150px';
    titleAndContentCell.style.minWidth = '300px';
    
    const titleAndContentPopover = createStaticPopover({
      title: 'Popover title',
      content: "And here's some amazing content. It's very engaging. Right?",
      placement: 'bottom'
    });
    
    titleAndContentPopover.style.position = 'absolute';
    titleAndContentPopover.style.top = '50%';
    titleAndContentPopover.style.left = '50%';
    titleAndContentPopover.style.transform = 'translate(-50%, 0)';
    titleAndContentPopover.style.marginTop = '20px';
    
    titleAndContentCell.appendChild(titleAndContentPopover);
    container.appendChild(titleAndContentCell);
    
    // Content Only variant
    const contentOnlyCell = document.createElement('div');
    contentOnlyCell.style.position = 'relative';
    contentOnlyCell.style.display = 'flex';
    contentOnlyCell.style.justifyContent = 'center';
    contentOnlyCell.style.alignItems = 'center';
    contentOnlyCell.style.minHeight = '150px';
    contentOnlyCell.style.minWidth = '300px';
    
    const contentOnlyPopover = createStaticPopover({
      content: "And here's some amazing content. It's very engaging. Right?",
      placement: 'bottom'
    });
    
    contentOnlyPopover.style.position = 'absolute';
    contentOnlyPopover.style.top = '50%';
    contentOnlyPopover.style.left = '50%';
    contentOnlyPopover.style.transform = 'translate(-50%, 0)';
    contentOnlyPopover.style.marginTop = '20px';
    
    contentOnlyCell.appendChild(contentOnlyPopover);
    container.appendChild(contentOnlyCell);
    
    return container;
  },
};

