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
 * See design-system/components/overview.md for Element Component Guidelines
 * See design-system/styles/ (colors.md, layout.md, typography.md, icons.md, elevation.md) for Token Reference
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/ListGroup',
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
 * Overview
 * Shows all list group variants organized by category in a scrollable format
 */
export const Overview = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Content Section
    const contentSection = document.createElement('div');
    contentSection.style.display = 'flex';
    contentSection.style.flexDirection = 'column';
    contentSection.style.gap = 'var(--size-card-gap-md)';
    
    const contentHeading = document.createElement('div');
    contentHeading.className = 'h5';
    contentHeading.textContent = 'Content';
    contentHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    contentSection.appendChild(contentHeading);
    
    const basicList = PlusInterface.createListGroup({
      items: [
        { content: 'List item 1' },
        { content: 'List item 2' },
        { content: 'List item 3' },
      ],
    });
    basicList.classList.add('body2-txt');
    contentSection.appendChild(basicList);
    container.appendChild(contentSection);
    
    // States Section
    const statesSection = document.createElement('div');
    statesSection.style.display = 'flex';
    statesSection.style.flexDirection = 'column';
    statesSection.style.gap = 'var(--size-card-gap-md)';
    
    const statesHeading = document.createElement('div');
    statesHeading.className = 'h5';
    statesHeading.textContent = 'States';
    statesHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    statesSection.appendChild(statesHeading);
    
    const activeList = PlusInterface.createListGroup({
      items: [
        { content: 'Normal item' },
        { content: 'Active item', active: true },
        { content: 'Disabled item', disabled: true },
      ],
    });
    activeList.classList.add('body2-txt');
    statesSection.appendChild(activeList);
    container.appendChild(statesSection);
    
    // Colors Section
    const colorsSection = document.createElement('div');
    colorsSection.style.display = 'flex';
    colorsSection.style.flexDirection = 'column';
    colorsSection.style.gap = 'var(--size-card-gap-md)';
    
    const colorsHeading = document.createElement('div');
    colorsHeading.className = 'h5';
    colorsHeading.textContent = 'Colors';
    colorsHeading.style.marginBottom = 'var(--size-element-gap-sm)';
    colorsSection.appendChild(colorsHeading);
    
    const primaryList = PlusInterface.createListGroup({
      items: [
        { content: 'Primary item 1', href: '#', style: 'primary' },
        { content: 'Primary item 2', href: '#', style: 'primary', active: true },
        { content: 'Primary item 3', href: '#', style: 'primary' },
      ],
    });
    primaryList.classList.add('body2-txt');
    colorsSection.appendChild(primaryList);
    container.appendChild(colorsSection);
    
    return container;
  },
};

export const Interactive = {
  render: (args) => {
    const listGroup = PlusInterface.createListGroup(args);
    listGroup.classList.add('body1-txt');
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

