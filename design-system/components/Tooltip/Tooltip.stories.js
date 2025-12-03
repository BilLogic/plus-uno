/**
 * Tooltip Molecule Stories
 * 
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=42-6020&m=dev
 * Matches Figma design system specifications exactly
 * 
 * ## Usage and Implementation
 * 
 * Tooltips are **Element** components that display brief information when triggered.
 * They appear as small overlays positioned relative to a trigger element (button, link, icon, etc.).
 * 
 * ### When to Use
 * - **Brief Information**: Display short, single-line text hints or explanations
 * - **Contextual Help**: Provide quick help text for form fields, buttons, or icons
 * - **Additional Details**: Show supplementary information without cluttering the interface
 * - **Accessibility**: Provide accessible descriptions for icon-only buttons or controls
 * - **Hover Hints**: Display helpful hints on hover for interactive elements
 * 
 * ### When NOT to Use
 * - **Complex Content**: Use popovers for content with titles or formatted text
 * - **Critical Information**: Use alerts or modals for important information that must be seen
 * - **Multi-line Text**: Use popovers for longer, multi-line content
 * - **Interactive Content**: Use popovers or modals for interactive content
 * - **Navigation**: Use dropdowns or menus for navigation options
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-` tokens)
 * - **Token Usage** (from Figma design):
 *   - Tooltip Container: Uses `element-` tokens (tooltips are Element components)
 *   - Padding: `--size-element-pad-x-sm` (8px) horizontal, `--size-element-pad-y-lg` (8px) vertical
 *   - Radius: `--size-element-radius-md` (4px)
 *   - Colors: `--color-inverse-surface` (#2e3133) for background, `--color-inverse-on-surface` (#f0f1f3) for text
 *   - Typography: Body/B2/Regular - Merriweather Sans Light, 14px, weight 300, line-height 1.571
 *   - Arrow: 10px wide, 5px tall
 *   - Shadow: None (no box-shadow in Figma design)
 * - **Bootstrap Integration**: Uses Bootstrap 4.6.2 tooltip component (requires Popper.js)
 * 
 * ### Placement Options
 * - **top**: Tooltip appears above the trigger
 * - **bottom**: Tooltip appears below the trigger (default)
 * - **left**: Tooltip appears to the left of the trigger
 * - **right**: Tooltip appears to the right of the trigger
 * 
 * ### Trigger Types
 * - **hover**: Tooltip appears on hover (default)
 * - **focus**: Tooltip appears on focus (useful for form fields and keyboard navigation)
 * - **click**: Tooltip appears on click
 * - **manual**: Tooltip is controlled programmatically
 * 
 * ### Size Variants
 * - **Small**: Compact size for brief information. Padding: 4px top/bottom, 8px left/right. Typography: body3-txt. Max width: 150px
 * - **Default**: Standard size for most use cases. Padding: 6px top/bottom, 10px left/right. Typography: body2-txt. Max width: 200px
 * - **Large**: Spacious size for more detailed information. Padding: 8px top/bottom, 16px left/right. Typography: body1-txt. Max width: 300px
 * 
 * ### Best Practices
 * - Keep tooltip text concise (typically 1-2 lines)
 * - Use hover for quick reference, focus for accessibility
 * - Position tooltips to avoid covering important content
 * - Test tooltip positioning on different screen sizes
 * - Ensure tooltip content is accessible (keyboard navigation, screen readers)
 * - Use tooltips for brief hints, popovers for detailed information
 * - Consider using focus trigger for form fields to improve accessibility
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ for Token Reference
 */

import { createTooltip, createTooltipButton, destroyAllTooltips } from "../index.js";
import { AllOrientations as TooltipAllOrientations } from "./Tooltip.Orientations.stories.js";
import { AllSizes as TooltipAllSizes } from "./Tooltip.Sizes.stories.js";

export default {
  title: 'Components/Tooltip',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Tooltip component for displaying brief information. Supports multiple placements, trigger types, and sizes. Uses element-level tokens.',
      },
    },
  },
  decorators: [
    (story) => {
      // Destroy all tooltips before rendering Tooltip stories
      destroyAllTooltips();
      
      // Return the story
      return story();
    },
  ],
};

/**
 * Overview
 * Shows all tooltip variants organized by category in a scrollable format
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
    
    // Orientations Section
    container.appendChild(createSection('Orientations', TooltipAllOrientations.render));
    
    // Sizes Section
    container.appendChild(createSection('Sizes', TooltipAllSizes.render));
    
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
    
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary';
    button.textContent = args.buttonText || 'Tooltip Trigger';
    
    createTooltip({
      trigger: button,
      text: args.text || 'This is an interactive tooltip. Adjust the controls to see different variations.',
      placement: args.placement || 'top',
      triggerType: args.triggerType || 'hover',
      size: args.size || 'default'
    });
    
    container.appendChild(button);
    
    return container;
  },
  argTypes: {
    buttonText: {
      control: 'text',
      description: 'Button text',
    },
    text: {
      control: 'text',
      description: 'Tooltip text content',
    },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Tooltip placement relative to trigger',
    },
    triggerType: {
      control: 'select',
      options: ['hover', 'focus', 'click', 'manual'],
      description: 'Trigger type for showing tooltip',
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Tooltip size. Uses element padding tokens for spacing.',
    },
  },
  args: {
    buttonText: 'Tooltip Trigger',
    text: 'This is an interactive tooltip. Adjust the controls to see different variations.',
    placement: 'top',
    triggerType: 'hover',
    size: 'default',
  },
};


