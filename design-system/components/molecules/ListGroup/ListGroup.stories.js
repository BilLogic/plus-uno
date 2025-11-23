/**
 * List Group Molecule Stories
 * 
 * Matches Figma design system specifications exactly
 * 
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=69-16193&t=XxnevshHwphhdAOI-4
 * 
 * ## Usage and Implementation
 * 
 * List groups are **Element** components used for displaying a series of content items in a structured list format.
 * 
 * ### When to Use
 * - **Content lists**: When displaying a series of related items
 * - **Navigation menus**: For vertical navigation menus
 * - **Selection lists**: When users need to select items from a list
 * - **Action lists**: When items have associated actions (links or buttons)
 * - **Status lists**: For displaying items with status indicators or badges
 * 
 * ### Implementation Context
 * - **Component Type**: Element (list items use `element-*` tokens)
 * - **Bootstrap Framework**: Uses Bootstrap 4.6.2's `list-group` pattern
 * - **Styling**: Customized with PLUS design tokens
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
        component: 'List group component for displaying a series of content items. Built on Bootstrap 4.6.2 list-group pattern with PLUS design token customizations. Matches Figma design system specifications exactly.',
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
    listGroup.classList.add('body2-txt');
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
        { content: 'Action item 1', href: '#' },
        { content: 'Action item 2', href: '#' },
        { content: 'Action item 3', href: '#' },
      ],
    });
    listGroup.classList.add('body2-txt');
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
    listGroup.classList.add('body2-txt');
    return listGroup;
  },
};

/**
 * Disabled State
 * List with disabled items (38% opacity)
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
    listGroup.classList.add('body2-txt');
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
    listGroup.classList.add('body2-txt');
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
    listGroup.classList.add('body2-txt');
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
        { content: 'Action item 1', href: '#' },
        { content: 'Action item 2', href: '#', active: true },
        { content: 'Action item 3', href: '#' },
        { content: 'Action item 4', href: '#' },
      ],
    });
    listGroup.classList.add('body2-txt');
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
        { content: 'Button item 1', action: 'button', onClick: () => console.log('Button 1') },
        { content: 'Button item 2', action: 'button', active: true, onClick: () => console.log('Button 2') },
        { content: 'Button item 3', action: 'button', onClick: () => console.log('Button 3') },
      ],
    });
    listGroup.classList.add('body2-txt');
    return listGroup;
  },
};

/**
 * Mixed States
 * List with various states combined
 */
export const MixedStates = {
  render: () => {
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'Normal item' },
        { content: 'Active item', active: true },
        { content: 'Disabled item', disabled: true },
        { content: 'Action item', href: '#' },
      ],
    });
    listGroup.classList.add('body2-txt');
    return listGroup;
  },
};

/**
 * All Variants
 * Shows all list group combinations matching Figma design system
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
    basicList.classList.add('body2-txt');
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
    actionList.classList.add('body2-txt');
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
    badgeList.classList.add('body2-txt');
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
    disabledList.classList.add('body2-txt');
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
    flushList.classList.add('body2-txt');
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
    listGroup.classList.add('body2-txt');
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

/**
 * Color Style Variants
 * List groups with different color token variants matching Figma design system
 * 
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=5173-6149&t=XxnevshHwphhdAOI-4
 */
export const ColorStyleVariants = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Primary Style (default)
    const primarySection = document.createElement('div');
    primarySection.style.display = 'flex';
    primarySection.style.flexDirection = 'column';
    primarySection.style.gap = 'var(--size-element-gap-sm)';
    
    const primaryLabel = document.createElement('div');
    primaryLabel.className = 'h6';
    primaryLabel.textContent = 'Primary Style';
    primaryLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    primarySection.appendChild(primaryLabel);
    
    const primaryList = PlusInterface.createListGroup({
      items: [
        { content: 'Primary item 1', href: '#', style: 'primary' },
        { content: 'Primary item 2', href: '#', style: 'primary', active: true },
        { content: 'Primary item 3', href: '#', style: 'primary' },
      ],
    });
    primaryList.classList.add('body2-txt');
    primarySection.appendChild(primaryList);
    container.appendChild(primarySection);
    
    // Secondary Style
    const secondarySection = document.createElement('div');
    secondarySection.style.display = 'flex';
    secondarySection.style.flexDirection = 'column';
    secondarySection.style.gap = 'var(--size-element-gap-sm)';
    
    const secondaryLabel = document.createElement('div');
    secondaryLabel.className = 'h6';
    secondaryLabel.textContent = 'Secondary Style';
    secondaryLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    secondarySection.appendChild(secondaryLabel);
    
    const secondaryList = PlusInterface.createListGroup({
      items: [
        { content: 'Secondary item 1', href: '#', style: 'secondary' },
        { content: 'Secondary item 2', href: '#', style: 'secondary', active: true },
        { content: 'Secondary item 3', href: '#', style: 'secondary' },
      ],
    });
    secondaryList.classList.add('body2-txt');
    secondarySection.appendChild(secondaryList);
    container.appendChild(secondarySection);
    
    // Tertiary Style
    const tertiarySection = document.createElement('div');
    tertiarySection.style.display = 'flex';
    tertiarySection.style.flexDirection = 'column';
    tertiarySection.style.gap = 'var(--size-element-gap-sm)';
    
    const tertiaryLabel = document.createElement('div');
    tertiaryLabel.className = 'h6';
    tertiaryLabel.textContent = 'Tertiary Style';
    tertiaryLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    tertiarySection.appendChild(tertiaryLabel);
    
    const tertiaryList = PlusInterface.createListGroup({
      items: [
        { content: 'Tertiary item 1', href: '#', style: 'tertiary' },
        { content: 'Tertiary item 2', href: '#', style: 'tertiary', active: true },
        { content: 'Tertiary item 3', href: '#', style: 'tertiary' },
      ],
    });
    tertiaryList.classList.add('body2-txt');
    tertiarySection.appendChild(tertiaryList);
    container.appendChild(tertiarySection);
    
    // Success Style
    const successSection = document.createElement('div');
    successSection.style.display = 'flex';
    successSection.style.flexDirection = 'column';
    successSection.style.gap = 'var(--size-element-gap-sm)';
    
    const successLabel = document.createElement('div');
    successLabel.className = 'h6';
    successLabel.textContent = 'Success Style';
    successLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    successSection.appendChild(successLabel);
    
    const successList = PlusInterface.createListGroup({
      items: [
        { content: 'Success item 1', href: '#', style: 'success' },
        { content: 'Success item 2', href: '#', style: 'success', active: true },
        { content: 'Success item 3', href: '#', style: 'success' },
      ],
    });
    successList.classList.add('body2-txt');
    successSection.appendChild(successList);
    container.appendChild(successSection);
    
    // Danger Style
    const dangerSection = document.createElement('div');
    dangerSection.style.display = 'flex';
    dangerSection.style.flexDirection = 'column';
    dangerSection.style.gap = 'var(--size-element-gap-sm)';
    
    const dangerLabel = document.createElement('div');
    dangerLabel.className = 'h6';
    dangerLabel.textContent = 'Danger Style';
    dangerLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    dangerSection.appendChild(dangerLabel);
    
    const dangerList = PlusInterface.createListGroup({
      items: [
        { content: 'Danger item 1', href: '#', style: 'danger' },
        { content: 'Danger item 2', href: '#', style: 'danger', active: true },
        { content: 'Danger item 3', href: '#', style: 'danger' },
      ],
    });
    dangerList.classList.add('body2-txt');
    dangerSection.appendChild(dangerList);
    container.appendChild(dangerSection);
    
    // Warning Style
    const warningSection = document.createElement('div');
    warningSection.style.display = 'flex';
    warningSection.style.flexDirection = 'column';
    warningSection.style.gap = 'var(--size-element-gap-sm)';
    
    const warningLabel = document.createElement('div');
    warningLabel.className = 'h6';
    warningLabel.textContent = 'Warning Style';
    warningLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    warningSection.appendChild(warningLabel);
    
    const warningList = PlusInterface.createListGroup({
      items: [
        { content: 'Warning item 1', href: '#', style: 'warning' },
        { content: 'Warning item 2', href: '#', style: 'warning', active: true },
        { content: 'Warning item 3', href: '#', style: 'warning' },
      ],
    });
    warningList.classList.add('body2-txt');
    warningSection.appendChild(warningList);
    container.appendChild(warningSection);
    
    // Info Style
    const infoSection = document.createElement('div');
    infoSection.style.display = 'flex';
    infoSection.style.flexDirection = 'column';
    infoSection.style.gap = 'var(--size-element-gap-sm)';
    
    const infoLabel = document.createElement('div');
    infoLabel.className = 'h6';
    infoLabel.textContent = 'Info Style';
    infoLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    infoSection.appendChild(infoLabel);
    
    const infoList = PlusInterface.createListGroup({
      items: [
        { content: 'Info item 1', href: '#', style: 'info' },
        { content: 'Info item 2', href: '#', style: 'info', active: true },
        { content: 'Info item 3', href: '#', style: 'info' },
      ],
    });
    infoList.classList.add('body2-txt');
    infoSection.appendChild(infoList);
    container.appendChild(infoSection);
    
    return container;
  },
};
