/**
 * List Group State Variants Stories
 * State variants for list group elements
 */

import { PlusInterface } from "../index.js";

export default {
  title: 'Components/ListGroup/States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'List group state variants: active and disabled.',
      },
    },
  },
};

/**
 * Active
 */
export const Active = {
  render: () => {
    const badge14 = PlusInterface.createBadge({ text: '14', style: 'primary' });
    const activeBadge = PlusInterface.createBadge({ text: '14', style: 'primary' });
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'An active item', active: true, badge: activeBadge },
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
 * Disabled
 */
export const Disabled = {
  render: () => {
    const badge14 = PlusInterface.createBadge({ text: '14', style: 'primary' });
    const disabledBadge = PlusInterface.createBadge({ text: '14', style: 'secondary' });
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'A disabled item', disabled: true, badge: disabledBadge },
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
 * All States
 */
export const AllStates = {
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-lg)';
    
    const listGroup = PlusInterface.createListGroup({
      items: [
        { content: 'Normal item' },
        { content: 'Active item', active: true },
        { content: 'Disabled item', disabled: true },
        { content: 'Action item', href: '#' },
      ],
    });
    listGroup.classList.add('body2-txt');
    container.appendChild(listGroup);
    
    return container;
  },
};


