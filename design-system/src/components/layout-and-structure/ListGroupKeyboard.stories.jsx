import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import ListGroup from './ListGroup/ListGroup';

/**
 * Walking a listbox with the arrow keys.
 *
 * WHY THIS FILE EXISTS (#331). `ListGroup` takes `role="listbox"` when every
 * child is option-shaped, and gave each of those options its own `tabIndex={0}`.
 * That is usable — you can Tab to each one and press it — and it is not the
 * pattern the role announces. A listbox is ONE tab stop with the arrow keys
 * moving inside it, so a screen-reader user who hears "listbox, 8 options" and
 * presses Down got nothing, then found the options one Tab at a time.
 *
 * axe has nothing to say here. Every option has a role, a name and a tab stop;
 * having too many tab stops is not a markup defect. The gap is between what the
 * role promises and what the keys do, which only pressing them can find.
 *
 * The second story is the guard on the guard: a `ListGroup` of links and
 * buttons is NOT a listbox, is walked with Tab, and must keep being walked with
 * Tab. Taking that away would be a regression dressed as a fix.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '420px' };

export default {
    title: 'Components/Layout and structure/List group keyboard',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Interaction cover for #331: a list that announces itself as a listbox is '
                    + 'navigated like one, and a list of links still is not.',
            },
        },
    },
};

const SUBJECTS = ['Maths', 'Science', 'History'];

export const ArrowKeysWalkTheOptions = () => {
    const [chosen, setChosen] = useState('Maths');
    return (
        <div style={stack}>
            {/* A listbox has to be named — axe's `aria-input-field-name` says so,
                and it is right: "listbox, 3 options" of what? Extra props reach
                the list element, so `aria-label` is the route. */}
            <ListGroup aria-label="Subject">
                {SUBJECTS.map((subject) => (
                    <ListGroup.Item
                        key={subject}
                        selectable="single"
                        value={subject}
                        selected={chosen === subject}
                        onClick={(value) => setChosen(value)}
                    >
                        {subject}
                    </ListGroup.Item>
                ))}
            </ListGroup>
            <p data-testid="lgk-chosen">{chosen}</p>
        </div>
    );
};

ArrowKeysWalkTheOptions.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const listbox = canvas.getByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    const readout = () => canvas.getByTestId('lgk-chosen').textContent;

    // One tab stop, not three. This is the discriminator.
    const tabbable = options.filter((option) => option.getAttribute('tabindex') === '0');
    await expect(tabbable).toHaveLength(1);

    await userEvent.tab();
    await expect(document.activeElement).toBe(options[0]);

    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement).toBe(options[1]);

    await userEvent.keyboard('{End}');
    await expect(document.activeElement).toBe(options[2]);

    await userEvent.keyboard('{Home}');
    await expect(document.activeElement).toBe(options[0]);

    // It does not walk off either end.
    await userEvent.keyboard('{ArrowUp}');
    await expect(document.activeElement).toBe(options[0]);

    // And the tab stop follows the cursor, so Tab out and back returns here.
    await userEvent.keyboard('{ArrowDown}');
    await expect(options[1].getAttribute('tabindex')).toBe('0');
    await expect(options[0].getAttribute('tabindex')).toBe('-1');

    // Selection is still a click or an activation, not a side effect of moving.
    await expect(readout()).toBe('Maths');
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
