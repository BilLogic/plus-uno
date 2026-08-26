import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import Select from './Select';

/**
 * Choosing a value in a `Select`, which is the only thing a `Select` is for.
 *
 * WHY THIS FILE EXISTS (#209). `Select` is the fourth most-used component in
 * the repo (24 files) and the most stateful thing in this folder: it owns an
 * open flag, a search term, a created-options list, and — when the caller does
 * not pass `value` — the selection itself. #207 covered three props that were
 * declared and ignored (`required`, `onFocus`, `onBlur`); the transitions the
 * component exists to perform were still unexercised.
 *
 * They are unreachable from a render assertion for the ordinary reason: the
 * menu is not rendered until it is opened, so nothing about opening, filtering,
 * committing or un-committing is in the DOM a story renders. The nearest thing
 * to cover was `defaultOpen`, which shows the menu without ever having gone
 * through the toggle that opens it.
 *
 * Four transitions, one per story where the setup differs: commit in single
 * mode (which also closes), filter, accumulate and remove in multi mode. The
 * refusals ride along in the story whose setup they share.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' };

const schools = [
    { value: 'north', label: 'North High' },
    { value: 'south', label: 'South High' },
    { value: 'riverside', label: 'Riverside Academy' },
];

export default {
    title: 'Components/Forms and inputs/Select commit',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Interaction cover for #209: opening a `Select`, filtering it, '
                    + 'committing a value, and taking one back — the transitions that only '
                    + 'exist once something has been clicked.',
            },
        },
    },
};

/**
 * Single mode: one commit replaces the last, and closes the menu behind it.
 *
 * Closing on commit is the part that is easy to lose and impossible to see in a
 * screenshot of the closed state — it is `setIsOpen(false)` inside
 * `handleSelect`, on the single-mode branch only.
 *
 * The disabled field beside it is the refusal: a `Select` that opens when it
 * was told not to has no visible tell until someone picks from it.
 */
export const SingleCommitClosesTheMenu = () => {
    const [value, setValue] = useState('');

    return (
        <div style={stack}>
            <Select
                id="scommit-school"
                options={schools}
                placeholder="Select a school"
                value={value}
                onChange={setValue}
            />
            <Select
                id="scommit-locked"
                options={schools}
                placeholder="Select a district"
                disabled
            />
            <p data-testid="chosen">{value}</p>
        </div>
    );
};

SingleCommitClosesTheMenu.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chosen = canvas.getByTestId('chosen');
    const trigger = canvas.getByRole('button', { name: /Select a school/ });

    // Closed means the options are not merely hidden — they are not rendered.
    await expect(canvas.queryByRole('button', { name: 'North High' })).toBeNull();

    await userEvent.click(trigger);
    await userEvent.click(await canvas.findByRole('button', { name: 'North High' }));

    await expect(chosen).toHaveTextContent(/^north$/);
    await expect(trigger).toHaveTextContent('North High');
    await waitFor(() =>
        expect(canvas.queryByRole('button', { name: 'South High' })).toBeNull());

    // A second commit replaces the first rather than adding to it.
    await userEvent.click(trigger);
    await userEvent.click(await canvas.findByRole('button', { name: 'Riverside Academy' }));
    await expect(chosen).toHaveTextContent(/^riverside$/);
    await expect(trigger).toHaveTextContent('Riverside Academy');

    // The disabled field does not open at all. CSS shields it — `userEvent`
    // refuses to click through `pointer-events: none`, correctly, since a user
    // cannot — but the shield is the outer of two guards, and it is the toggle's
    // own `if (!disabled)` that has to hold if a stylesheet ever changes. So the
    // click is dispatched on the node, past the shield, to reach it.
    const locked = canvas.getByRole('button', { name: /Select a district/ });
    await expect(locked).toHaveAttribute('aria-disabled', 'true');
    await expect(getComputedStyle(locked).pointerEvents).toBe('none');
    locked.click();
    await expect(canvas.queryByRole('button', { name: 'South High' })).toBeNull();
};

/**
 * `searchable`: typing narrows the list, and an empty list says so.
 *
 * The empty case is worth its own assertion because the alternative failure is
 * silent — a filter that matches nothing and renders nothing looks like a menu
 * that failed to open.
 */
export const SearchNarrowsTheList = () => (
    <div style={stack}>
        <Select
            id="scommit-search"
            options={schools}
            placeholder="Select a school"
            searchable
        />
    </div>
);

SearchNarrowsTheList.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Select a school/ });

    await userEvent.click(trigger);
    const search = await canvas.findByPlaceholderText('Search');

    await userEvent.type(search, 'high');
    await waitFor(() =>
        expect(canvas.queryByRole('button', { name: 'Riverside Academy' })).toBeNull());
    await expect(canvas.getByRole('button', { name: 'North High' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'South High' })).toBeInTheDocument();

    // No match is a stated result, not an empty menu.
    await userEvent.type(search, 'lands');
    await expect(await canvas.findByText('No options found')).toBeInTheDocument();

    // Clearing the term brings the whole list back, and an option found through
    // a filter still commits — the filter is a view, not a new option set.
    await userEvent.clear(search);
    await expect(await canvas.findByRole('button', { name: 'North High' }))
        .toBeInTheDocument();
    await userEvent.type(search, 'riverside');
    await userEvent.click(await canvas.findByRole('button', { name: 'Riverside Academy' }));
    await expect(trigger).toHaveTextContent('Riverside Academy');
};

/**
 * Multi mode: selections accumulate, the menu stays open, and a badge in the
 * trigger takes one back without reopening the menu it sits on top of.
 *
 * That last clause is the interesting one. The dismiss button is inside the
 * trigger, so its click would toggle the dropdown as well if `Badge`'s handler
 * did not stop propagation — one `stopPropagation` between "removed a value"
 * and "removed a value and reopened the menu over the top of it".
 */
export const MultiAccumulatesAndRemoves = () => {
    const [value, setValue] = useState([]);

    return (
        <div style={stack}>
            <Select
                id="scommit-multi"
                mode="multi"
                options={schools}
                placeholder="Select schools"
                value={value}
                onChange={setValue}
            />
            <p data-testid="chosen">{value.join(',')}</p>
        </div>
    );
};

MultiAccumulatesAndRemoves.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chosen = canvas.getByTestId('chosen');
    // Captured before anything is selected: once badges land in the trigger,
    // its accessible name is the badges, not the placeholder.
    const trigger = canvas.getByRole('button', { name: /Select schools/ });

    await userEvent.click(trigger);

    // Multi options are `role="option"` in a listbox, not buttons.
    const north = await canvas.findByRole('option', { name: 'North High' });
    await userEvent.click(north);
    await expect(chosen).toHaveTextContent(/^north$/);
    await expect(north).toHaveAttribute('aria-selected', 'true');

    // The menu stays open, which is what makes a second pick possible.
    await userEvent.click(canvas.getByRole('option', { name: 'South High' }));
    await expect(chosen).toHaveTextContent(/^north,south$/);

    // Picking a selected option again removes it.
    await userEvent.click(canvas.getByRole('option', { name: 'North High' }));
    await expect(chosen).toHaveTextContent(/^south$/);

    // Close it — with Escape rather than a second click on the trigger, whose
    // centre is now a badge — then take the last value back from that badge.
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
        expect(canvas.queryByRole('option', { name: 'South High' })).toBeNull());

    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await expect(chosen.textContent).toBe('');
    await expect(trigger).toHaveTextContent('Select schools');
    // ...and the menu it sits on did not reopen behind the removal.
    await expect(canvas.queryByRole('option', { name: 'South High' })).toBeNull();
};
