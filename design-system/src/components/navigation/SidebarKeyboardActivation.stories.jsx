import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import SidebarTab from './SidebarTab/SidebarTab';

/**
 * Opening a sidebar row without a mouse.
 *
 * WHY THIS FILE EXISTS (#320). `SidebarTab` rendered a `div` with
 * `role="button"` and `tabIndex={0}` and no key handler of any kind. Enter and
 * Space activate the `button` ELEMENT; they are not a property of the role. So
 * every row of a sidebar was announced as a button, took a tab stop, and did
 * nothing when pressed — reachable by keyboard and not operable by it, which is
 * the worst of the three possible states because it looks correct in the tab
 * order.
 *
 * Nothing already in the repo could catch it. axe's rules cover a `div` with a
 * role and no name, and a control with no tab stop; a focusable, named,
 * correctly-roled element that ignores the keyboard is not a markup defect and
 * has to be pressed to be found.
 *
 * The second assertion is the other half of the same issue: which row you are
 * on was a background colour and nothing else, so `aria-current` had to arrive
 * with the key handler.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' };

export default {
    title: 'Components/Navigation/Sidebar keyboard activation',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Interaction cover for #320: a row announced as a button has to activate '
                    + 'from the keyboard, and the selected row has to say that it is selected.',
            },
        },
    },
};

const SECTIONS = [
    { key: 'sessions', text: 'Sessions' },
    { key: 'students', text: 'Students' },
    { key: 'reports', text: 'Reports' },
];

/**
 * Enter and Space, one row each, against real state.
 *
 * The log is the assertion in the same sense as `ModalDismissal`'s: the row
 * reporting an activation it was previously unable to report.
 */
export const EnterAndSpaceActivate = () => {
    const [section, setSection] = useState('sessions');
    return (
        <div style={stack}>
            {SECTIONS.map((s) => (
                <SidebarTab
                    key={s.key}
                    text={s.text}
                    icon="list"
                    state={section === s.key ? 'selected' : 'enabled'}
                    onClick={() => setSection(s.key)}
                />
            ))}
            <p data-testid="ska-section">{section}</p>
        </div>
    );
};

EnterAndSpaceActivate.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const readout = () => canvas.getByTestId('ska-section').textContent;

    await expect(readout()).toBe('sessions');

    // Tab to the second row and press Enter. Before the fix this did nothing.
    await userEvent.tab();
    await userEvent.tab();
    await expect(document.activeElement.textContent).toContain('Students');
    await userEvent.keyboard('{Enter}');
    await expect(readout()).toBe('students');

    // And Space, which also must not scroll the page under the press.
    await userEvent.tab();
    await expect(document.activeElement.textContent).toContain('Reports');
    await userEvent.keyboard(' ');
    await expect(readout()).toBe('reports');
};

/**
 * Which row is current, said rather than coloured.
 */
export const SelectedIsAnnounced = () => (
    <div style={stack}>
        <SidebarTab text="Sessions" icon="list" state="enabled" onClick={() => {}} />
        <SidebarTab text="Students" icon="user" state="selected" onClick={() => {}} />
        <SidebarTab text="Reports" icon="chart-simple" state="disabled" onClick={() => {}} />
    </div>
);

SelectedIsAnnounced.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const rows = canvas.getAllByRole('button');
    await expect(rows).toHaveLength(3);

    const current = rows.filter((row) => row.getAttribute('aria-current') === 'page');
    await expect(current).toHaveLength(1);
    await expect(current[0].textContent).toContain('Students');

    // The disabled row still announces, and still refuses the tab order.
    const disabled = rows.filter((row) => row.getAttribute('aria-disabled') === 'true');
    await expect(disabled).toHaveLength(1);
    await expect(disabled[0].getAttribute('tabindex')).toBe('-1');
};
