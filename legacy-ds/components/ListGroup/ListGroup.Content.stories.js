/**
 * List Group Content Variants Stories
 * Content variants for list group elements
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/ListGroup/Content',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'List group content variants: basic, action, with badges, flush, and button actions.',
      },
    },
  },
};

/**
 * Basic
 */
export const Basic = {
  render: () => {
    const badge14 = PlusInterface.createBadge({ text: '14', style: 'primary' });
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'An item' },
        { content: 'A second item', badge: badge14 },
        { content: 'A third item', badge: badge14 },
        { content: 'A fourth item', badge: badge14 },
        { content: 'And a fifth one', badge: badge14 },
      ],
    });
    listGroup.classList.add('body1-txt');
    return listGroup;
  },
};

/**
 * Action
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
    listGroup.classList.add('body1-txt');
    return listGroup;
  },
};

/**
 * With Badges
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
    listGroup.classList.add('body1-txt');
    return listGroup;
  },
};

/**
 * Flush
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
    listGroup.classList.add('body1-txt');
    return listGroup;
  },
};

/**
 * Button Actions
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
    listGroup.classList.add('body1-txt');
    return listGroup;
  },
};

/**
 * All Content Variants
 */
export const AllContent = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    // Basic
    const basicLabel = document.createElement('div');
    basicLabel.className = 'h6';
    basicLabel.textContent = 'Basic';
    basicLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(basicLabel);
    
    const basicList = PlusInterface.createListGroup({
      items: [
        { content: 'List item 1' },
        { content: 'List item 2' },
        { content: 'List item 3' },
      ],
    });
    basicList.classList.add('body2-txt');
    container.appendChild(basicList);
    
    // Action
    const actionLabel = document.createElement('div');
    actionLabel.className = 'h6';
    actionLabel.textContent = 'Action';
    actionLabel.style.marginTop = 'var(--size-section-gap-md)';
    actionLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    container.appendChild(actionLabel);
    
    const actionList = PlusInterface.createListGroup({
      items: [
        { content: 'Action item 1', href: '#' },
        { content: 'Action item 2', href: '#' },
        { content: 'Action item 3', href: '#' },
      ],
    });
    actionList.classList.add('body2-txt');
    container.appendChild(actionList);
    
    return container;
  },
};

