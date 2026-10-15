import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import ListGroup from './ListGroup/ListGroup';

/**
 * A ListGroup is a list of links, actions or content, never a listbox: picking
 * a value is the forms option list's job (`forms-and-inputs/_internal/Listbox`),
 * which carries the arrow-key contract and its play tests. This file guards
 * the other half: a list of links is walked with Tab, and must keep being.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '420px' };

export default {
    title: 'Components/Layout and structure/List group keyboard',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Interaction cover: a list of links is walked with Tab, and is not a listbox.',
            },
        },
    },
};

/**
 * A list of links is not a listbox and is still walked with Tab.
 */
export const LinkListsStillTabThrough = () => (
    <div style={stack}>
        <ListGroup>
            <ListGroup.Item href="#lgk-one">Session notes</ListGroup.Item>
            <ListGroup.Item href="#lgk-two">Attendance</ListGroup.Item>
        </ListGroup>
    </div>
);

LinkListsStillTabThrough.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // No listbox: the children are links, so the role is correctly absent.
    await expect(canvas.queryByRole('listbox')).toBeNull();

    const links = canvas.getAllByRole('link');
    await expect(links).toHaveLength(2);

    await userEvent.tab();
    await expect(document.activeElement).toBe(links[0]);
    await userEvent.tab();
    await expect(document.activeElement).toBe(links[1]);
};
