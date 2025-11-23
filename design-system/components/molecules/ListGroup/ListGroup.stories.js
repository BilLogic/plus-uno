/**
 * List Group Molecule Stories
 * 
 * ## Usage and Implementation
 * 
 * List groups are **Element** components used for displaying a series of content items in a structured list format.
 * They provide a clean, organized way to present related information and can be interactive or static.
 * 
 * ### When to Use
 * - **Content lists**: When displaying a series of related items (e.g., notifications, messages, tasks)
 * - **Navigation menus**: For vertical navigation menus with multiple options
 * - **Selection lists**: When users need to select items from a list (with active states)
 * - **Information display**: For displaying structured information in a list format
 * - **Action lists**: When items have associated actions (links or buttons)
 * - **Grouped content**: When organizing related content items together
 * - **Status lists**: For displaying items with status indicators or badges
 * 
 * ### When NOT to Use
 * - **Simple navigation**: Use Navigation component for primary navigation menus
 * - **Dropdown menus**: Use Dropdown component for compact selection menus
 * - **Form inputs**: Use radio buttons or checkboxes for form selections
 * - **Tables**: Use Table component for tabular data with multiple columns
 * - **Cards**: Use Card component for self-contained content blocks with images/actions
 * 
 * ### Implementation Context
 * - **Component Type**: Element (list items use `element-*` tokens)
 * - **Bootstrap Framework**: Uses Bootstrap 4.6.2's `list-group` pattern
 * - **Styling**: Customized with PLUS design tokens (colors, spacing, typography)
 * - **Reference**: https://getbootstrap.com/docs/4.6/components/list-group/
 * 
 * ### State Variants
 * - **Default**: Normal list item state
 * - **Active**: Selected/highlighted state (uses primary container color)
 * - **Disabled**: Non-interactive state (reduced opacity)
 * - **Hover**: Interactive hover state (for action items)
 * - **Focus**: Keyboard focus state (for action items)
 * 
 * ### Content Variants
 * - **Basic list**: Simple text items
 * - **Action list**: Items with links or buttons (interactive)
 * - **Badge list**: Items with badges or status indicators
 * - **Flush list**: No borders or rounded corners (for full-width layouts)
 * - **Mixed content**: Items with various content types
 * 
 * ### Best Practices
 * - Use clear, descriptive content for each item
 * - Provide visual feedback for interactive items (hover, focus states)
 * - Use active state to indicate selected items
 * - Use badges sparingly and only when they add value
 * - Ensure sufficient spacing between items
 * - Use flush variant when list spans full width of container
 * - Maintain consistent item structure within a list
 * - Use semantic HTML (<ul> for lists, <div> for non-semantic containers)
 * 
 * See docs/guidelines/terminology.md for Element Component Guidelines
 * See docs/guidelines/token-reference.md for Token Reference
 */

import { PlusInterface } from '@/js/components/index.js';

export default {
  title: 'Molecules/ListGroup',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'List group component for displaying a series of content items. Built on Bootstrap 4.6.2 list-group pattern with PLUS design token customizations.',
      },
    },
  },
};

/**
 * Basic List Group
 * Simple list with text items
 */
export const Basic = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'List item 1' },
        { content: 'List item 2' },
        { content: 'List item 3' },
        { content: 'List item 4' },
      ],
    });
    return listGroup;
  },
};

/**
 * Action List Group
 * Interactive list with clickable items
 */
export const Action = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { 
          content: 'Action item 1',
          href: '#',
          onClick: (e) => {
            e.preventDefault();
            console.log('Clicked item 1');
          }
        },
        { 
          content: 'Action item 2',
          href: '#',
          onClick: (e) => {
            e.preventDefault();
            console.log('Clicked item 2');
          }
        },
        { 
          content: 'Action item 3',
          href: '#',
          onClick: (e) => {
            e.preventDefault();
            console.log('Clicked item 3');
          }
        },
      ],
    });
    return listGroup;
  },
};

/**
 * Active State
 * List with active/selected item
 */
export const Active = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'List item 1' },
        { content: 'List item 2', active: true },
        { content: 'List item 3' },
        { content: 'List item 4' },
      ],
    });
    return listGroup;
  },
};

/**
 * Disabled State
 * List with disabled items
 */
export const Disabled = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'List item 1' },
        { content: 'List item 2', disabled: true },
        { content: 'List item 3' },
        { content: 'List item 4', disabled: true },
      ],
    });
    return listGroup;
  },
};

/**
 * With Badges
 * List items with badge indicators
 */
export const WithBadges = {
  render: () => {
    const badge1 = PlusInterface.createBadge({ text: '14', style: 'primary' });
    const badge2 = PlusInterface.createBadge({ text: '2', style: 'success' });
    const badge3 = PlusInterface.createBadge({ text: 'New', style: 'info' });
    
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'List item 1', badge: badge1 },
        { content: 'List item 2', badge: badge2 },
        { content: 'List item 3', badge: badge3 },
        { content: 'List item 4' },
      ],
    });
    return listGroup;
  },
};

/**
 * Flush Variant
 * List without borders or rounded corners
 */
export const Flush = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'List item 1' },
        { content: 'List item 2' },
        { content: 'List item 3' },
        { content: 'List item 4' },
      ],
      flush: true,
    });
    return listGroup;
  },
};

/**
 * Action with Active
 * Interactive list with active item
 */
export const ActionWithActive = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { 
          content: 'Action item 1',
          href: '#',
        },
        { 
          content: 'Action item 2',
          href: '#',
          active: true,
        },
        { 
          content: 'Action item 3',
          href: '#',
        },
        { 
          content: 'Action item 4',
          href: '#',
        },
      ],
    });
    return listGroup;
  },
};

/**
 * Button Actions
 * List items as buttons instead of links
 */
export const ButtonActions = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { 
          content: 'Button item 1',
          action: 'button',
          onClick: () => console.log('Button 1 clicked'),
        },
        { 
          content: 'Button item 2',
          action: 'button',
          active: true,
          onClick: () => console.log('Button 2 clicked'),
        },
        { 
          content: 'Button item 3',
          action: 'button',
          onClick: () => console.log('Button 3 clicked'),
        },
      ],
    });
    return listGroup;
  },
};

/**
 * All Variants
 * Shows all list group combinations: states, badges, actions
 */
export const AllVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Basic list
    const basicSection = document.createElement('div');
    basicSection.style.display = 'flex';
    basicSection.style.flexDirection = 'column';
    basicSection.style.gap = 'var(--size-element-gap-sm)';
    
    const basicLabel = document.createElement('div');
    basicLabel.className = 'h6';
    basicLabel.textContent = 'Basic List';
    basicLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    basicSection.appendChild(basicLabel);
    
    const basicList = PlusInterface.createListGroup({
      items: [
        { content: 'List item 1' },
        { content: 'List item 2' },
        { content: 'List item 3' },
      ],
    });
    basicSection.appendChild(basicList);
    container.appendChild(basicSection);
    
    // Action list
    const actionSection = document.createElement('div');
    actionSection.style.display = 'flex';
    actionSection.style.flexDirection = 'column';
    actionSection.style.gap = 'var(--size-element-gap-sm)';
    
    const actionLabel = document.createElement('div');
    actionLabel.className = 'h6';
    actionLabel.textContent = 'Action List';
    actionLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    actionSection.appendChild(actionLabel);
    
    const actionList = PlusInterface.createListGroup({
      items: [
        { content: 'Action item 1', href: '#' },
        { content: 'Action item 2', href: '#', active: true },
        { content: 'Action item 3', href: '#' },
      ],
    });
    actionSection.appendChild(actionList);
    container.appendChild(actionSection);
    
    // With badges
    const badgeSection = document.createElement('div');
    badgeSection.style.display = 'flex';
    badgeSection.style.flexDirection = 'column';
    badgeSection.style.gap = 'var(--size-element-gap-sm)';
    
    const badgeLabel = document.createElement('div');
    badgeLabel.className = 'h6';
    badgeLabel.textContent = 'List with Badges';
    badgeLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    badgeSection.appendChild(badgeLabel);
    
    const badge1 = PlusInterface.createBadge({ text: '14', style: 'primary' });
    const badge2 = PlusInterface.createBadge({ text: '2', style: 'success' });
    const badge3 = PlusInterface.createBadge({ text: 'New', style: 'info' });
    
    const badgeList = PlusInterface.createListGroup({
      items: [
        { content: 'List item 1', badge: badge1 },
        { content: 'List item 2', badge: badge2 },
        { content: 'List item 3', badge: badge3 },
      ],
    });
    badgeSection.appendChild(badgeList);
    container.appendChild(badgeSection);
    
    // Disabled items
    const disabledSection = document.createElement('div');
    disabledSection.style.display = 'flex';
    disabledSection.style.flexDirection = 'column';
    disabledSection.style.gap = 'var(--size-element-gap-sm)';
    
    const disabledLabel = document.createElement('div');
    disabledLabel.className = 'h6';
    disabledLabel.textContent = 'List with Disabled Items';
    disabledLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    disabledSection.appendChild(disabledLabel);
    
    const disabledList = PlusInterface.createListGroup({
      items: [
        { content: 'List item 1' },
        { content: 'List item 2', disabled: true },
        { content: 'List item 3' },
        { content: 'List item 4', disabled: true },
      ],
    });
    disabledSection.appendChild(disabledList);
    container.appendChild(disabledSection);
    
    // Flush variant
    const flushSection = document.createElement('div');
    flushSection.style.display = 'flex';
    flushSection.style.flexDirection = 'column';
    flushSection.style.gap = 'var(--size-element-gap-sm)';
    
    const flushLabel = document.createElement('div');
    flushLabel.className = 'h6';
    flushLabel.textContent = 'Flush List (No Borders)';
    flushLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    flushSection.appendChild(flushLabel);
    
    const flushList = PlusInterface.createListGroup({
      items: [
        { content: 'List item 1' },
        { content: 'List item 2' },
        { content: 'List item 3' },
      ],
      flush: true,
    });
    flushSection.appendChild(flushList);
    container.appendChild(flushSection);
    
    return container;
  },
};

/**
 * Interactive List Group
 * Interactive playground for testing list group variations
 */
export const Interactive = {
  render: (args) => {
    const listGroup = PlusInterface.createListGroup(args);
    return listGroup;
  },
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of list item configuration objects',
    },
    flush: {
      control: 'boolean',
      description: 'Whether to use flush variant (no borders)',
    },
    useListElement: {
      control: 'boolean',
      description: 'Whether to use <ul> (true) or <div> (false)',
    },
  },
  args: {
    items: [
      { content: 'List item 1' },
      { content: 'List item 2', active: true },
      { content: 'List item 3' },
    ],
    flush: false,
    useListElement: true,
  },
};



