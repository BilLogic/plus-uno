import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import Dropdown from './Dropdown/Dropdown';
import Select from './Select';
import Switch from './Switch';

/**
 * Props that were declared and did nothing.
 *
 * WHY THIS FILE EXISTS (#207). Three components carried API in their signature
 * and their `propTypes` that the render never read. `Select` destructured
 * `required`, `onFocus` and `onBlur` and referenced none of them. `Dropdown`
 * had no `onToggle` at all, so a caller who passed `isOpen` owned the state
 * and had no way to set it back — the dropdown opened and stayed open.
 * `Switch` rendered a checkbox with no `role`, so what looked like a switch
 * announced itself as a checkbox.
 *
 * A dead prop is invisible to every guard the repo already had. `propTypes`
 * validates the value it is given, not whether anything uses it. axe sees
 * rendered output, so it cannot miss what was never rendered — a `required`
 * that emits nothing emits nothing wrong. And a screenshot of a dropdown that
 * cannot close looks exactly like a screenshot of one that can.
 *
 * So the cover has to be behavioural: call the prop and assert the effect.
 * Every story below fails on the code that shipped before #207.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' };

const schoolOptions = [
    { value: 'school-a', label: 'School A' },
    { value: 'school-b', label: 'School B' },
];

const menuItems = [
    { text: 'Rename' },
    { text: 'Duplicate' },
];

export default {
    title: 'Components/Forms and inputs/Declared API',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #207: a prop that appears in a signature and in '
                    + '`propTypes` has to do something. Each story exercises one prop that '
                    + 'used to be declared and ignored.',
            },
        },
    },
};

/* ------------------------------------------------------------------ Select */

/**
 * `required` reaches assistive technology.
 *
 * It cannot do it through `aria-required`: the trigger is a `div` with
 * `role="button"`, and that role does not allow the attribute. So `required`
 * points the trigger at a visually hidden description instead, which is the
 * half the 26 call sites passing `required` were actually missing — they all
 * draw their own visible asterisk beside their own label already.
 */
export const SelectRequired = () => (
    <div style={stack}>
        <Select
            id="dapi-school"
            options={schoolOptions}
            placeholder="Select a school"
            required
        />
        <Select
            id="dapi-optional"
            options={schoolOptions}
            placeholder="Select a subject"
        />
    </div>
);

SelectRequired.play = async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const canvas = within(canvasElement);

    const trigger = canvas.getByRole('button', { name: /Select a school/ });
    const describedBy = trigger.getAttribute('aria-describedby');

    // Declared and ignored means: no attribute at all. That is the assertion.
    await expect(describedBy).not.toBeNull();

    const description = doc.getElementById(describedBy);
    await expect(description).not.toBeNull();
    await expect(description.textContent.trim()).toBe('Required');

    // ...and it stays off the fields that did not ask for it.
    const optional = canvas.getByRole('button', { name: /Select a subject/ });
    await expect(optional.getAttribute('aria-describedby')).toBeNull();
};

/**
 * `onFocus` and `onBlur` fire on the field, not on whatever is inside it.
 *
 * The two things that have to hold at once: focus crossing the widget
 * boundary reports, and focus moving *within* the widget does not. The second
 * is why they are bound in the capture phase — the search `Input` stops
 * propagation on focus and blur to keep the menu from toggling, which would
 * otherwise swallow a blur that leaves the widget from the search box.
 */
export const SelectFocusAndBlur = () => {
    const [log, setLog] = useState([]);

    return (
        <div style={stack}>
            <button type="button">Before</button>
            <Select
                id="dapi-focus"
                options={schoolOptions}
                placeholder="Select a school"
                searchable
                onFocus={() => setLog((prev) => [...prev, 'focus'])}
                onBlur={() => setLog((prev) => [...prev, 'blur'])}
            />
            <button type="button">After</button>
            <p data-testid="focus-log">{log.join(',')}</p>
        </div>
    );
};

SelectFocusAndBlur.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const logEl = canvas.getByTestId('focus-log');
    const trigger = canvas.getByRole('button', { name: /Select a school/ });

    canvas.getByRole('button', { name: 'Before' }).focus();
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await expect(logEl).toHaveTextContent('focus');

    // Into the search box, which is inside the widget: still one focus, no blur.
    await userEvent.click(trigger);
    const search = await canvas.findByPlaceholderText('Search');
    await userEvent.click(search);
    await expect(logEl).toHaveTextContent(/^focus$/);

    // Out of the widget entirely: one blur, and the menu closed behind us.
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole('button', { name: 'After' }));
    await expect(logEl).toHaveTextContent(/^focus,blur$/);
};

/* ---------------------------------------------------------------- Dropdown */

/**
 * A controlled `Dropdown` can close again.
 *
 * `isOpen` alone is a one-way door: the component only ever wrote to its
 * internal state, which a controlled caller is not reading. `onToggle` has to
 * fire for the toggle button, for an item click, and for a click outside —
 * all three are the ways a menu gets dismissed.
 */
export const DropdownControlledToggle = () => {
    const [open, setOpen] = useState(false);

    return (
        <div style={stack}>
            <Dropdown
                id="dapi-menu"
                buttonText="Actions"
                items={menuItems}
                isOpen={open}
                onToggle={setOpen}
            />
            <p data-testid="open-state">{open ? 'open' : 'closed'}</p>
        </div>
    );
};

DropdownControlledToggle.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const state = canvas.getByTestId('open-state');
    const toggle = canvas.getByRole('button', { name: 'Actions' });

    await userEvent.click(toggle);
    await expect(state).toHaveTextContent('open');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // The defect: before #207 this click changed nothing at all.
    await userEvent.click(toggle);
    await expect(state).toHaveTextContent('closed');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // An item click dismisses it too, which is the common case.
    await userEvent.click(toggle);
    await userEvent.click(canvas.getByRole('button', { name: 'Rename' }));
    await expect(state).toHaveTextContent('closed');
};

/**
 * The uncontrolled contract the fix must not disturb: no `isOpen`, no
 * `onToggle`, and the component still opens and closes on its own.
 */
export const DropdownUncontrolled = () => (
    <div style={stack}>
        <Dropdown id="dapi-uncontrolled" buttonText="Actions" items={menuItems} />
    </div>
);

DropdownUncontrolled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Actions' });

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(canvas.getByRole('button', { name: 'Duplicate' }));
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
};

/* ------------------------------------------------------------------ Switch */

/**
 * `Switch` presents as a switch.
 *
 * The decision and its reasoning are recorded in `Switch.jsx` and in the
 * accessibility section of `Switch.mdx`. What this asserts is only the part a
 * test can hold: the role is there by default, `inputProps` can still take it
 * away, and the native checkbox underneath is untouched — same `type`, same
 * `checked`, same `name`/`value` in a form.
 */
export const SwitchRole = () => {
    const [checked, setChecked] = useState(false);

    return (
        <div style={stack}>
            <Switch
                id="dapi-wifi"
                name="wifi"
                label="Wi-Fi"
                checked={checked}
                onChange={(event) => setChecked(event.target.checked)}
            />
            <Switch
                id="dapi-optout"
                name="optout"
                label="Announce me as a checkbox"
                inputProps={{ role: 'checkbox' }}
            />
        </div>
    );
};

SwitchRole.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const wifi = canvas.getByRole('switch', { name: 'Wi-Fi' });
    await expect(wifi).toHaveAttribute('type', 'checkbox');
    await expect(wifi).not.toBeChecked();

    await userEvent.click(wifi);
    await expect(wifi).toBeChecked();

    // The escape hatch keeps working in both directions.
    canvas.getByRole('checkbox', { name: 'Announce me as a checkbox' });
};
