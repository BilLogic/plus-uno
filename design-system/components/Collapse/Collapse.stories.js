/**
 * Collapse Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * Collapse components are **Element** components used to show and hide content through a clickable trigger.
 * They allow users to expand or collapse sections of content to save space and organize information.
 * 
 * ### When to Use
 * - **Progressive disclosure**: When you want to hide detailed information until the user needs it
 * - **FAQ sections**: For frequently asked questions where answers can be expanded
 * - **Accordions**: For organizing related content into collapsible sections
 * - **Long content**: When content is lengthy and you want to reduce initial visual clutter
 * - **Settings panels**: For organizing settings into collapsible groups
 * - **Navigation menus**: For nested navigation items that can be expanded/collapsed
 * - **Details sections**: For showing additional details on demand
 * 
 * ### When NOT to Use
 * - **Critical information**: Don't hide information that users need to see immediately
 * - **Short content**: If content is very short, consider showing it directly
 * - **Primary actions**: Don't hide primary actions or important content behind a collapse
 * - **Modal content**: Use modals for pop-up windows, not collapse
 * 
 * ### Implementation Context
 * - **Component Type**: Element (uses `element-*` tokens)
 * - **Bootstrap Framework**: Uses Bootstrap 4.6.2's collapse functionality
 * - **Token Usage**: 
 *   - Padding: `--size-element-pad-x-md`, `--size-element-pad-y-md`
 *   - Gap: `--size-element-gap-lg` (12px between buttons and content)
 *   - Typography: Uses body1-txt class for content
 *   - Colors: `--color-on-surface` for text, `--color-primary` for buttons
 * - **Reference**: https://getbootstrap.com/docs/4.6/components/collapse/
 * 
 * ### Type Variants
 * - **default**: Toggle button to show corresponding content. Only one content can be shown at a time.
 * - **multiple target**: Each content takes up half of the container width. Both pieces of content can be toggled independently or together.
 * - **accordion**: Toggle the item name to show/hide corresponding content. Only one content can be shown at a time.
 * 
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/Collapse',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Collapse component for showing and hiding content through a clickable trigger. Built on Bootstrap 4.6.2 collapse functionality with PLUS design token customizations. Supports three types: default, multiple target, and accordion.',
      },
    },
  },
};

/**
 * Interactive Collapse
 * Interactive playground for testing collapse variations
 */
export const Interactive = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-element-gap-lg)';
    container.style.padding = 'var(--size-section-pad-x-md)';
    container.style.backgroundColor = 'var(--color-surface)';
    container.style.width = args.width || '511px';
    
    const collapse = PlusInterface.createCollapse({
      id: args.id || 'interactive-collapse',
      trigger: args.triggerText || 'Toggle Collapse',
      content: args.content || 'Some placeholder content for the collapse component. This panel is hidden by default but revealed when the user activates the relevant trigger.',
      show: args.show || false,
      triggerTag: args.triggerTag || 'button',
      triggerClass: args.triggerClass || '',
      contentClass: args.contentClass || '',
      icon: args.icon || null,
      iconPosition: args.iconPosition || 'left',
      onShow: () => {
        console.log('Collapse shown');
      },
      onHide: () => {
        console.log('Collapse hidden');
      }
    });
    
    container.appendChild(collapse);
    return container;
  },
  argTypes: {
    id: {
      control: 'text',
      description: 'Collapse ID (required)',
    },
    triggerText: {
      control: 'text',
      description: 'Trigger button text',
    },
    content: {
      control: 'text',
      description: 'Collapsible content text',
    },
    show: {
      control: 'boolean',
      description: 'Initially shown',
    },
    triggerTag: {
      control: 'select',
      options: ['button', 'a'],
      description: 'HTML tag for trigger',
    },
    triggerClass: {
      control: 'text',
      description: 'Additional CSS classes for trigger',
    },
    contentClass: {
      control: 'text',
      description: 'Additional CSS classes for content',
    },
    icon: {
      control: 'text',
      description: 'Icon name (Font Awesome, without fa- prefix)',
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Icon position',
    },
    width: {
      control: 'text',
      description: 'Container width',
    },
  },
  args: {
    id: 'interactive-collapse',
    triggerText: 'Toggle Collapse',
    content: 'Some placeholder content for the collapse component. This panel is hidden by default but revealed when the user activates the relevant trigger.',
    show: false,
    triggerTag: 'button',
    triggerClass: '',
    contentClass: '',
    icon: null,
    iconPosition: 'left',
    width: '511px',
  },
};
