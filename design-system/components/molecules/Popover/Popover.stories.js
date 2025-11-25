/**
 * Popover Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Popovers are **Element** components that display additional information when triggered.
 * They appear as small overlays positioned relative to a trigger element (button, link, icon, etc.).
 * 
 * ### When to Use
 * - **Additional Information**: Display supplementary details without cluttering the interface
 * - **Contextual Help**: Provide help text or explanations for form fields or actions
 * - **Tooltips with Content**: When you need more than a simple tooltip (titles, formatted content)
 * - **Interactive Hints**: Show tips or guidance for complex interactions
 * - **Data Details**: Display additional data or metadata on hover/click
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens for trigger, `modal-` tokens for popover container)
 * - **Token Usage**: 
 *   - Title: `--size-element-pad-x-lg` (16px), `--size-element-gap-sm` (8px)
 *   - Body: `--size-modal-pad-x-md` (16px) or `--size-modal-pad-x-sm` (10px for top), `--size-modal-pad-y-sm` (8px)
 *   - Colors: `--color-inverse-surface` for title, `--color-surface-container` for body
 *   - Typography: 14px, line-height 1.571 (Merriweather Sans Regular for title, Light for body)
 * - **Bootstrap Integration**: Uses Bootstrap 4.6.2 popover component (requires Popper.js)
 * 
 * ### Type Variants
 * - **title + content**: Includes a dark header section with title and light body section with content
 * - **content**: Only the light body section with content (no title)
 * 
 * ### Direction Variants
 * - **top**: Popover appears above the trigger, arrow points down
 * - **bottom**: Popover appears below the trigger, arrow points up
 * - **left**: Popover appears to the left of the trigger, arrow points right
 * - **right**: Popover appears to the right of the trigger, arrow points left
 * 
 * ### Properties (from Figma documentation)
 * - **Type**: You can select the popover to only show content, or both title and content
 * - **Direction**: There are 4 directions for a popover: bottom, left, right, top
 * 
 * ### Best Practices
 * - Keep popover content concise and scannable
 * - Use titles to provide context for the information
 * - Choose appropriate trigger type based on interaction pattern
 * - Position popovers to avoid covering important content
 * - Test popover positioning on different screen sizes
 * - Ensure popover content is accessible (keyboard navigation, screen readers)
 * 
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { createPopover, createPopoverButton } from '@/js/components/index.js';

export default {
  title: 'Molecules/Popover',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Popover component for displaying additional information. Matches Figma design system specifications exactly. Supports two types (title + content, content only) and four directions (top, bottom, left, right).',
      },
    },
  },
};

/**
 * All Variants
 * Shows all popover combinations from Figma: types and directions
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    
    // Type Variants Section
    const typeSection = document.createElement('div');
    typeSection.style.display = 'flex';
    typeSection.style.flexDirection = 'column';
    typeSection.style.gap = 'var(--size-card-gap-md)';
    
    const typeLabel = document.createElement('div');
    typeLabel.className = 'h4';
    typeLabel.textContent = 'Type Variants';
    typeLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    typeSection.appendChild(typeLabel);
    
    const typeContainer = document.createElement('div');
    typeContainer.style.display = 'flex';
    typeContainer.style.flexWrap = 'wrap';
    typeContainer.style.gap = 'var(--size-card-gap-lg)';
    typeContainer.style.alignItems = 'center';
    
    // Title + Content
    const buttonWithTitle = document.createElement('button');
    buttonWithTitle.type = 'button';
    buttonWithTitle.className = 'btn btn-primary';
    buttonWithTitle.textContent = 'Title + Content';
    
    createPopover({
      trigger: buttonWithTitle,
      content: "And here's some amazing content. It's very engaging. Right?",
      title: 'Popover title',
      placement: 'top',
      triggerType: 'click'
    });
    
    typeContainer.appendChild(buttonWithTitle);
    
    // Content Only
    const buttonContentOnly = document.createElement('button');
    buttonContentOnly.type = 'button';
    buttonContentOnly.className = 'btn btn-primary';
    buttonContentOnly.textContent = 'Content Only';
    
    createPopover({
      trigger: buttonContentOnly,
      content: "And here's some amazing content. It's very engaging. Right?",
      placement: 'top',
      triggerType: 'click'
    });
    
    typeContainer.appendChild(buttonContentOnly);
    
    typeSection.appendChild(typeContainer);
    container.appendChild(typeSection);
    
    // Direction Variants Section - Title + Content
    const directionTitleSection = document.createElement('div');
    directionTitleSection.style.display = 'flex';
    directionTitleSection.style.flexDirection = 'column';
    directionTitleSection.style.gap = 'var(--size-card-gap-md)';
    
    const directionTitleLabel = document.createElement('div');
    directionTitleLabel.className = 'h4';
    directionTitleLabel.textContent = 'Direction Variants (Title + Content)';
    directionTitleLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    directionTitleSection.appendChild(directionTitleLabel);
    
    const directionTitleContainer = document.createElement('div');
    directionTitleContainer.style.display = 'flex';
    directionTitleContainer.style.flexWrap = 'wrap';
    directionTitleContainer.style.gap = 'var(--size-card-gap-md)';
    directionTitleContainer.style.alignItems = 'center';
    
    const directions = ['top', 'bottom', 'left', 'right'];
    directions.forEach((direction) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary';
      button.textContent = `${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
      
      createPopover({
        trigger: button,
        content: "And here's some amazing content. It's very engaging. Right?",
        title: 'Popover title',
        placement: direction,
        triggerType: 'click'
      });
      
      directionTitleContainer.appendChild(button);
    });
    
    directionTitleSection.appendChild(directionTitleContainer);
    container.appendChild(directionTitleSection);
    
    // Direction Variants Section - Content Only
    const directionContentSection = document.createElement('div');
    directionContentSection.style.display = 'flex';
    directionContentSection.style.flexDirection = 'column';
    directionContentSection.style.gap = 'var(--size-card-gap-md)';
    
    const directionContentLabel = document.createElement('div');
    directionContentLabel.className = 'h4';
    directionContentLabel.textContent = 'Direction Variants (Content Only)';
    directionContentLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    directionContentSection.appendChild(directionContentLabel);
    
    const directionContentContainer = document.createElement('div');
    directionContentContainer.style.display = 'flex';
    directionContentContainer.style.flexWrap = 'wrap';
    directionContentContainer.style.gap = 'var(--size-card-gap-md)';
    directionContentContainer.style.alignItems = 'center';
    
    directions.forEach((direction) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary';
      button.textContent = `${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
      
      createPopover({
        trigger: button,
        content: "And here's some amazing content. It's very engaging. Right?",
        placement: direction,
        triggerType: 'click'
      });
      
      directionContentContainer.appendChild(button);
    });
    
    directionContentSection.appendChild(directionContentContainer);
    container.appendChild(directionContentSection);
    
    return container;
  },
};

/**
 * Type Variants
 * Shows the two type options: title + content vs content only
 */
export const TypeVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.alignItems = 'center';
    
    // Title + Content
    const section1 = document.createElement('div');
    section1.style.display = 'flex';
    section1.style.flexDirection = 'column';
    section1.style.gap = 'var(--size-element-gap-sm)';
    section1.style.alignItems = 'center';
    
    const label1 = document.createElement('div');
    label1.className = 'body2-txt';
    label1.textContent = 'title + content';
    section1.appendChild(label1);
    
    const button1 = document.createElement('button');
    button1.type = 'button';
    button1.className = 'btn btn-primary';
    button1.textContent = 'Show Popover';
    
    createPopover({
      trigger: button1,
      content: "And here's some amazing content. It's very engaging. Right?",
      title: 'Popover title',
      placement: 'top',
      triggerType: 'click'
    });
    
    section1.appendChild(button1);
    container.appendChild(section1);
    
    // Content Only
    const section2 = document.createElement('div');
    section2.style.display = 'flex';
    section2.style.flexDirection = 'column';
    section2.style.gap = 'var(--size-element-gap-sm)';
    section2.style.alignItems = 'center';
    
    const label2 = document.createElement('div');
    label2.className = 'body2-txt';
    label2.textContent = 'content';
    section2.appendChild(label2);
    
    const button2 = document.createElement('button');
    button2.type = 'button';
    button2.className = 'btn btn-primary';
    button2.textContent = 'Show Popover';
    
    createPopover({
      trigger: button2,
      content: "And here's some amazing content. It's very engaging. Right?",
      placement: 'top',
      triggerType: 'click'
    });
    
    section2.appendChild(button2);
    container.appendChild(section2);
    
    return container;
  },
};

/**
 * Direction Variants
 * Shows all four direction options
 */
export const DirectionVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.alignItems = 'center';
    
    const directions = [
      { name: 'bottom', label: 'bottom' },
      { name: 'left', label: 'left' },
      { name: 'right', label: 'right' },
      { name: 'top', label: 'top' }
    ];
    
    directions.forEach(({ name, label }) => {
      const section = document.createElement('div');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = 'var(--size-element-gap-sm)';
      section.style.alignItems = 'center';
      
      const labelEl = document.createElement('div');
      labelEl.className = 'body2-txt';
      labelEl.textContent = label;
      section.appendChild(labelEl);
      
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary';
      button.textContent = 'Show Popover';
      
      createPopover({
        trigger: button,
        content: "And here's some amazing content. It's very engaging. Right?",
        title: 'Popover title',
        placement: name,
        triggerType: 'click'
      });
      
      section.appendChild(button);
      container.appendChild(section);
    });
    
    return container;
  },
};

/**
 * Interactive Popover
 * Interactive playground for testing popover variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.alignItems = 'center';
    
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary';
    button.textContent = args.buttonText || 'Popover Trigger';
    
    createPopover({
      trigger: button,
      content: args.content || "And here's some amazing content. It's very engaging. Right?",
      title: args.title,
      placement: args.placement || 'top',
      triggerType: args.triggerType || 'click'
    });
    
    container.appendChild(button);
    
    return container;
  },
  argTypes: {
    buttonText: {
      control: 'text',
      description: 'Button text',
    },
    content: {
      control: 'text',
      description: 'Popover content text',
    },
    title: {
      control: 'text',
      description: 'Popover title (optional - if provided, creates "title + content" type)',
    },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Popover placement relative to trigger',
    },
    triggerType: {
      control: 'select',
      options: ['click', 'hover', 'focus', 'manual'],
      description: 'Trigger type for showing popover',
    },
  },
  args: {
    buttonText: 'Popover Trigger',
    content: "And here's some amazing content. It's very engaging. Right?",
    title: 'Popover title',
    placement: 'top',
    triggerType: 'click',
  },
};

