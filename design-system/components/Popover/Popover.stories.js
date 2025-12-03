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
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { createPopover, createPopoverButton } from "../index.js";
import { AllContent as PopoverAllContent } from "./Popover.Content.stories.js";
import { AllOrientations as PopoverAllOrientations } from "./Popover.Orientations.stories.js";

export default {
  title: 'Components/Popover',
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
 * Overview
 * Shows all popover variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    container.style.padding = 'var(--size-section-pad-y-lg) var(--size-section-pad-x-lg)';
    
    const createSection = (title, contentRender) => {
      const section = document.createElement('div');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = 'var(--size-card-gap-md)';
      
      const heading = document.createElement('div');
      heading.className = 'h5';
      heading.textContent = title;
      heading.style.marginBottom = 'var(--size-element-gap-sm)';
      section.appendChild(heading);
      
      const content = contentRender();
      section.appendChild(content);
      return section;
    };
    
    // Content Section
    container.appendChild(createSection('Content', PopoverAllContent.render));
    
    // Orientations Section
    container.appendChild(createSection('Orientations', PopoverAllOrientations.render));
    
    return container;
  },
};

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

