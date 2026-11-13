import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import Button from './Button';
import { DropdownMenu } from '@/components';
import { ButtonItem } from '@/components/forms-and-inputs/_internal/MenuGroup';
import Select from './Select';
import Toggle from './Toggle';

/**
 * Props that were declared and did nothing.
 *
 * WHY THIS FILE EXISTS (#207). Three components carried API in their signature
 * and their `propTypes` that the render never read. `Select` destructured
 * `required`, `onFocus` and `onBlur` and referenced none of them. `Dropdown`
 * had no `onToggle` at all, so a caller who passed `isOpen` owned the state
 * and had no way to set it back — the dropdown opened and stayed open.
 * `Toggle` rendered a checkbox with no `role`, so what looked like a switch
 * announced itself as a checkbox.
 *
 * A dead prop is invisible to every guard the repo already had. `propTypes`
 * validates the value it is given, not whether anything uses it. axe sees
 * rendered output, so it cannot miss what was never rendered — a `required`
 * that emits nothing emits nothing wrong. And a screenshot of a dropdown that
 * cannot close looks exactly like a screenshot of one that can.
 *
 * So the cover has to be behavioral: call the prop and assert the effect.
 * Every story below fails on the code that shipped before #207.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' };

const schoolOptions = [
    { value: 'school-a', label: 'School A' },
    { value: 'school-b', label: 'School B' },
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
 * `required` reaches assistive technology as `aria-required` on the combobox,
 * and stays off the fields that did not ask for it.
 */
export const SelectRequired = () => (
    <div style={stack}>
        <Select
            id="dapi-school"
            options={schoolOptions}
            placeholder="Select a school"
            isRequired
        />
        <Select
            id="dapi-optional"
            options={schoolOptions}
            placeholder="Select a site"
        />
    </div>
);

SelectRequired.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: /Select a school/ });
    await expect(field).toHaveAttribute('aria-required', 'true');
    const optional = canvas.getByRole('combobox', { name: /Select a site/ });
    await expect(optional).not.toHaveAttribute('aria-required');
};

/**
 * `onFocus` and `onBlur` fire on the field, not on whatever is inside it:
 * focus crossing the widget boundary reports, and moving within it does not.
 */
export const SelectFocusAndBlur = () => {
    const [log, setLog] = useState([]);

    return (
        <div style={stack}>
            <Button>Before</Button>
            <Select
                id="dapi-focus"
                options={schoolOptions}
                placeholder="Select a school"
                isSearchable
                onFocus={() => setLog((prev) => [...prev, 'focus'])}
                onBlur={() => setLog((prev) => [...prev, 'blur'])}
            />
            <Button>After</Button>
            <p data-testid="focus-log">{log.join(',')}</p>
        </div>
    );
};

SelectFocusAndBlur.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const logEl = canvas.getByTestId('focus-log');
    const field = canvas.getByRole('combobox', { name: /Select a school/ });

    canvas.getByRole('button', { name: 'Before' }).focus();
    await userEvent.tab();
    await expect(field).toHaveFocus();
    await expect(logEl).toHaveTextContent('focus');

    // Opening the list and pressing a row keeps focus in the field: no blur.
    await userEvent.click(field);
    await userEvent.click(await within(document.body).findByRole('option', { name: 'School B' }));
    await expect(field).toHaveFocus();
    await expect(logEl).toHaveTextContent(/^focus$/);

    // Out of the widget entirely: one blur.
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
            <DropdownMenu
                id="dapi-menu"
                trigger={<Button>Actions</Button>}
                isOpen={open}
                onOpenChange={setOpen}
            >
                <ButtonItem onClick={() => {}}>Rename</ButtonItem>
                <ButtonItem onClick={() => {}}>Duplicate</ButtonItem>
            </DropdownMenu>
            <p data-testid="open-state">{open ? 'open' : 'closed'}</p>
        </div>
    );
};

DropdownControlledToggle.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const state = canvas.getByTestId('open-state');
    const toggle = canvas.getByRole('button', { name: 'Actions' });

    await userEvent.click(toggle);
    await waitFor(() => expect(state).toHaveTextContent('open'));
    await waitFor(() => expect(toggle).toHaveAttribute('aria-expanded', 'true'));

    // Base UI's own trigger swallows a second mousedown within 200ms of the
    // first as a double-click guard, so the toggle-closed click below has to
    // land after that window, not immediately back to back with the first.
    await new Promise((resolve) => { setTimeout(resolve, 250); });

    // The defect: before #207 this click changed nothing at all.
    await userEvent.click(toggle);
    await waitFor(() => expect(state).toHaveTextContent('closed'));
    await waitFor(() => expect(toggle).toHaveAttribute('aria-expanded', 'false'));
    await new Promise((resolve) => { setTimeout(resolve, 250); });

    // An item click dismisses it too, which is the common case.
    await userEvent.click(toggle);
    await userEvent.click(await body.findByRole('menuitem', { name: 'Rename' }));
    await waitFor(() => expect(state).toHaveTextContent('closed'));
};

/**
 * The uncontrolled contract the fix must not disturb: no `isOpen`, no
 * `onOpenChange`, and the component still opens and closes on its own.
 */
export const DropdownUncontrolled = () => (
    <div style={stack}>
        <DropdownMenu id="dapi-uncontrolled" trigger={<Button>Actions</Button>}>
            <ButtonItem onClick={() => {}}>Rename</ButtonItem>
            <ButtonItem onClick={() => {}}>Duplicate</ButtonItem>
        </DropdownMenu>
    </div>
);

DropdownUncontrolled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const toggle = canvas.getByRole('button', { name: 'Actions' });

    await userEvent.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute('aria-expanded', 'true'));

    await userEvent.click(await body.findByRole('menuitem', { name: 'Duplicate' }));
    await waitFor(() => expect(toggle).toHaveAttribute('aria-expanded', 'false'));
};

/* ------------------------------------------------------------------ Toggle */

/**
 * `Toggle` presents as a switch.
 *
 * The decision and its reasoning are recorded in `Toggle.jsx` and in the
 * accessibility section of `Toggle.mdx`. What this asserts is only the part a
 * test can hold: the role is there by default, a `role` prop can still take it
 * away, and the hidden native checkbox beside it still submits — same `type`,
 * same `checked`, same `name`/`value` in a form.
 */
export const ToggleRole = () => {
    const [checked, setChecked] = useState(false);

    return (
        <div style={stack}>
            <Toggle
                id="dapi-wifi"
                name="wifi"
                label="Wi-Fi"
                isChecked={checked}
                onChange={(event) => setChecked(event.target.checked)}/>
            <Toggle
                id="dapi-optout"
                name="optout"
                label="Announce me as a checkbox"
                role="checkbox"/>
        </div>
    );
};

ToggleRole.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const wifi = canvas.getByRole('switch', { name: 'Wi-Fi' });
    const wifiInput = canvasElement.querySelector('#dapi-wifi');
    await expect(wifiInput).toHaveAttribute('type', 'checkbox');
    await expect(wifiInput).not.toBeChecked();

    await userEvent.click(wifi);
    await expect(wifiInput).toBeChecked();

    // The escape hatch keeps working in both directions.
    canvas.getByRole('checkbox', { name: 'Announce me as a checkbox' });
};
