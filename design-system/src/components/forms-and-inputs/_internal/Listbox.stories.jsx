import React, { useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import Modal from '@/components/messaging/Modal/Modal';
import Input from '../Input';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import '../TagInput.scss';
import Listbox from './Listbox';

/**
 * The internal option list (Figma `_Listbox`): the panel that opens under a
 * field for picking a value. It is not exported from the barrel; Select,
 * TagInput, Cascader, TreeSelect and the date pickers build on it.
 *
 * Every keyboard behavior has a play test here. Two shapes are covered:
 * a standalone listbox that takes focus itself, and a combobox, where focus
 * stays in the field and the field hands its keys to the list.
 */
export default {
    title: 'Components/Forms and inputs/Listbox',
    component: Listbox,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Internal part: the option list under a field. One surface, three slots '
                    + '(header, body, footer), one row component, portal placement and the '
                    + 'listbox keyboard contract.',
            },
        },
    },
};

const SUBJECTS = ['Algebra', 'Biology', 'Chemistry', 'Economics', 'Geometry', 'History', 'Physics'];
const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)', maxWidth: '360px' };

/**
 * A field with its list: focus stays in the input, which points at the
 * highlighted row with `aria-activedescendant` and hands its keys to the list.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
const ComboboxDemo = ({ label = 'Subject', options = SUBJECTS, mode = 'single', creatable = false, fieldStyle }) => {
    const inputRef = useRef(null);
    const anchorRef = useRef(null);
    const listRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('');
    const [value, setValue] = useState(mode === 'multi' ? [] : null);
    const [activeId, setActiveId] = useState();
    const [created, setCreated] = useState([]);
    const listId = `${label.toLowerCase().replace(/\W+/g, '-')}-listbox`;

    return (
        <div style={fieldStyle}>
            <div ref={anchorRef}>
                <Input
                    label={label}
                    inputRef={inputRef}
                    value={filter}
                    placeholder="Type to filter"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={open ? activeId : undefined}
                    onFocus={() => setOpen(true)}
                    onChange={(event) => { setFilter(event.target.value); setOpen(true); }}
                    onKeyDown={(event) => {
                        if (!open && event.key === 'ArrowDown') { setOpen(true); event.preventDefault(); return; }
                        if (open && listRef.current) listRef.current.handleKeyDown(event);
                    }}
                />
            </div>
            <Listbox
                ref={listRef}
                id={listId}
                aria-label={`${label} options`}
                open={open}
                anchorRef={anchorRef}
                options={[...options, ...created]}
                mode={mode}
                value={value}
                onChange={(next) => setValue(next)}
                filter={filter}
                onFilterChange={setFilter}
                onCreate={creatable ? (text) => { setCreated((list) => [...list, text]); setValue(text); setFilter(''); } : undefined}
                onActiveChange={setActiveId}
                onClose={() => setOpen(false)}
            />
            <p data-testid="value">{Array.isArray(value) ? value.join(',') || 'none' : value ?? 'none'}</p>
        </div>
    );
};

/* ------------------------------------------------------------------ */

/** A standalone listbox: one tab stop, rows walked with the arrow keys. */
export const ArrowKeysHomeAndEnd = () => {
    const [value, setValue] = useState(null);
    return (
        <div style={stack}>
            <Listbox aria-label="Subject" options={SUBJECTS} value={value} onChange={setValue} />
            <p data-testid="value">{value ?? 'none'}</p>
        </div>
    );
};

ArrowKeysHomeAndEnd.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const listbox = canvas.getByRole('listbox', { name: 'Subject' });
    const options = within(listbox).getAllByRole('option');
    const active = () => listbox.getAttribute('aria-activedescendant');

    // One tab stop: the list itself. The rows take none.
    await expect(listbox.tabIndex).toBe(0);
    await expect(options.every((option) => !option.hasAttribute('tabindex'))).toBe(true);

    await userEvent.tab();
    await expect(document.activeElement).toBe(listbox);
    await expect(active()).toBe(options[0].id);

    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect(active()).toBe(options[2].id);
    await expect(options[2]).toHaveClass('is-highlighted');

    await userEvent.keyboard('{ArrowUp}');
    await expect(active()).toBe(options[1].id);

    await userEvent.keyboard('{End}');
    await expect(active()).toBe(options[options.length - 1].id);
    await userEvent.keyboard('{ArrowDown}');
    await expect(active()).toBe(options[options.length - 1].id);

    await userEvent.keyboard('{Home}');
    await expect(active()).toBe(options[0].id);
};

/** Enter picks the highlighted row; Space does too in a standalone list. */
export const EnterAndSpaceSelect = () => {
    const [days, setDays] = useState([]);
    return (
        <div style={stack}>
            <Listbox aria-label="Days" mode="multi" options={['Monday', 'Tuesday', 'Wednesday']} value={days} onChange={setDays} />
            <p data-testid="value">{days.join(',') || 'none'}</p>
        </div>
    );
};

EnterAndSpaceSelect.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const listbox = canvas.getByRole('listbox', { name: 'Days' });
    const readout = () => canvas.getByTestId('value').textContent;

    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    listbox.focus();
    await userEvent.keyboard('{Enter}');
    await expect(readout()).toBe('Monday');
    await userEvent.keyboard('{ArrowDown} ');
    await expect(readout()).toBe('Monday,Tuesday');
    await userEvent.keyboard(' ');
    await expect(readout()).toBe('Monday');

    const tuesday = within(listbox).getByRole('option', { name: 'Tuesday' });
    await expect(tuesday).toHaveAttribute('aria-selected', 'false');
    await userEvent.click(tuesday);
    await expect(readout()).toBe('Monday,Tuesday');
    await expect(tuesday).toHaveAttribute('aria-selected', 'true');
};

/** Disabled rows are skipped by the arrow keys and cannot be picked. */
export const DisabledRowsAreSkipped = () => {
    const [value, setValue] = useState(null);
    return (
        <div style={stack}>
            <Listbox
                aria-label="Slot"
                options={[{ value: 'am', label: 'Morning' }, { value: 'noon', label: 'Midday', disabled: true }, { value: 'pm', label: 'Afternoon' }]}
                value={value}
                onChange={setValue}
            />
            <p data-testid="value">{value ?? 'none'}</p>
        </div>
    );
};

DisabledRowsAreSkipped.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const listbox = canvas.getByRole('listbox', { name: 'Slot' });
    const [, midday, afternoon] = within(listbox).getAllByRole('option');

    await expect(midday).toHaveAttribute('aria-disabled', 'true');
    listbox.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(listbox.getAttribute('aria-activedescendant')).toBe(afternoon.id);
    await userEvent.click(midday);
    await expect(canvas.getByTestId('value').textContent).toBe('none');
};

/** Group headings sit over their rows and are never the cursor. */
export const GroupHeadings = () => (
    <div style={stack}>
        <Listbox
            aria-label="Student"
            options={[
                { value: 'maria-l', label: 'Maria Lopez', description: 'Grade 7 · Brookfield', group: 'Recent' },
                { value: 'sam', label: 'Sam Chen', description: 'Grade 8 · Clearwater', group: 'Recent' },
                { value: 'maria-g', label: 'Maria Garcia', description: 'Grade 7 · Cedar Valley', group: 'Suggested' },
            ]}
        />
    </div>
);

GroupHeadings.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const listbox = canvas.getByRole('listbox', { name: 'Student' });
    const recent = within(listbox).getByRole('group', { name: 'Recent' });
    await expect(within(recent).getAllByRole('option')).toHaveLength(2);
    await expect(within(listbox).getByRole('group', { name: 'Suggested' })).toBeInTheDocument();

    listbox.focus();
    await expect(listbox.getAttribute('aria-activedescendant'))
        .toBe(within(recent).getAllByRole('option')[0].id);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect(document.getElementById(listbox.getAttribute('aria-activedescendant'))).toHaveTextContent('Maria Garcia');
};

/** Loading, failed and empty lists say so in a message row, and announce it. */
export const MessageRows = () => (
    <div style={stack}>
        <Listbox aria-label="Loading" options={[]} loading />
        <Listbox aria-label="Failed" options={[]} error="Couldn't load schools. Try again." />
        <Listbox aria-label="Empty" options={[]} />
    </div>
);

MessageRows.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const surface = (name) => within(canvas.getByRole('listbox', { name }).closest('.plus-listbox'));
    await expect(canvas.getByRole('listbox', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true');
    await expect(surface('Loading').getByText('Loading…')).toBeInTheDocument();
    await expect(surface('Failed').getByText(/Couldn't load schools/)).toBeInTheDocument();
    await expect(surface('Empty').getByText('No results')).toBeInTheDocument();
};

/* ------------------------------------------------------------------ */

/**
 * Typing filters the rows and the result count is announced. Esc closes the
 * list and clears what was typed, and leaves the value alone.
 */
export const TypingFiltersAndEscClearsTheFilter = () => <ComboboxDemo />;

TypingFiltersAndEscClearsTheFilter.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole('combobox', { name: 'Subject' });

    await userEvent.click(input);
    const listbox = await body.findByRole('listbox', { name: 'Subject options' });
    await expect(input).toHaveAttribute('aria-activedescendant', within(listbox).getAllByRole('option')[0].id);

    // Pick one first, so Esc can be seen to leave it alone.
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(canvas.getByTestId('value').textContent).toBe('Biology');

    await userEvent.click(input);
    await userEvent.type(input, 'ry');
    const filtered = await body.findByRole('listbox', { name: 'Subject options' });
    await waitFor(() => expect(within(filtered).getAllByRole('option').map((o) => o.textContent))
        .toEqual(['Chemistry', 'Geometry', 'History']));
    await waitFor(() => expect(body.getByRole('status')).toHaveTextContent('3 results'));

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('listbox', { name: 'Subject options' })).toBeNull());
    await expect(input).toHaveValue('');
    await expect(canvas.getByTestId('value').textContent).toBe('Biology');
    await expect(document.activeElement).toBe(input);
};

/** With nothing matching, a Create row offers the typed text, and Enter makes it. */
export const EnterCreatesWhenNoMatch = () => <ComboboxDemo label="Topic" options={['Design judgment', 'Decision recall']} creatable />;

EnterCreatesWhenNoMatch.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole('combobox', { name: 'Topic' });

    await userEvent.click(input);
    await userEvent.type(input, 'Music');
    const listbox = await body.findByRole('listbox', { name: 'Topic options' });
    await expect(within(listbox.closest('.plus-listbox')).getByText('No results')).toBeInTheDocument();
    const create = within(listbox).getByRole('option', { name: 'Create Music' });
    await expect(input).toHaveAttribute('aria-activedescendant', create.id);

    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByTestId('value').textContent).toBe('Music');

    // An exact match, in any case, offers no Create row.
    await userEvent.type(input, 'decision RECALL');
    const again = await body.findByRole('listbox', { name: 'Topic options' });
    await expect(within(again).queryByRole('option', { name: /^Create/ })).toBeNull();
};

/**
 * Inside a modal the list renders in a portal above it, so neither the modal
 * nor its scroll area clips it, and a pointer reaches its rows. The portal is
 * the modal's overlay rather than the page, so the list takes the modal's
 * layer and stays inside its focus trap.
 */
export const InsideAModal = () => {
    const [show, setShow] = useState(true);
    return (
        <Modal show={show} onClose={() => setShow(false)} title="Add a student" showBottomButtons={false} width={360}>
            <ComboboxDemo label="School" options={SUBJECTS} />
        </Modal>
    );
};

InsideAModal.play = async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);
    const dialog = await body.findByRole('dialog');
    const input = within(dialog).getByRole('combobox', { name: 'School' });

    await userEvent.click(input);
    const listbox = await body.findByRole('listbox', { name: 'School options' });
    // Outside the dialog's panel, which clips, and inside its overlay.
    await expect(dialog.querySelector('.plus-modal').contains(listbox)).toBe(false);
    await expect(listbox.closest('.modal')).toBe(dialog.closest('.modal'));

    const field = input.getBoundingClientRect();
    const surface = listbox.closest('.plus-listbox').getBoundingClientRect();
    // At least as wide as the field, and no taller than max-height-menu 320.
    await expect(surface.width).toBeGreaterThanOrEqual(Math.floor(field.width));
    await expect(surface.height).toBeLessThanOrEqual(320);

    const physics = within(listbox).getByRole('option', { name: 'Physics' });
    physics.scrollIntoView({ block: 'nearest' });
    const box = physics.getBoundingClientRect();
    await expect(doc.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2).closest('[role="option"]')).toBe(physics);

    await userEvent.click(physics);
    await expect(within(dialog).getByTestId('value').textContent).toBe('Physics');
};

/** Without room below the field, the list opens above it. */
export const FlipsAboveWithoutRoom = () => (
    <ComboboxDemo label="Grade" options={SUBJECTS} fieldStyle={{ position: 'fixed', left: 16, right: 16, bottom: 8, maxWidth: 360 }} />
);

FlipsAboveWithoutRoom.play = async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = within(canvasElement).getByRole('combobox', { name: 'Grade' });
    await userEvent.click(input);
    const listbox = await body.findByRole('listbox', { name: 'Grade options' });
    const surface = listbox.closest('.plus-listbox');
    await waitFor(() => expect(surface.getBoundingClientRect().bottom).toBeLessThanOrEqual(input.getBoundingClientRect().top));
    await expect(surface).toHaveAttribute('data-placement', 'top');
};

/**
 * A thousand options: only the rows on screen are drawn, and the keyboard
 * still reaches the last one with the right position announced.
 */
const MANY = Array.from({ length: 1000 }, (_, index) => ({ value: `s${index + 1}`, label: `Student ${index + 1}` }));

export const AThousandOptions = () => <ComboboxDemo label="Student" options={MANY} />;

AThousandOptions.play = async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = within(canvasElement).getByRole('combobox', { name: 'Student' });

    const start = performance.now();
    await userEvent.click(input);
    const listbox = await body.findByRole('listbox', { name: 'Student options' });
    await expect(performance.now() - start).toBeLessThan(1000);

    const drawn = () => within(listbox).getAllByRole('option');
    await expect(drawn().length).toBeLessThan(60);
    await expect(drawn()[0]).toHaveAttribute('aria-setsize', '1000');

    await userEvent.keyboard('{End}');
    await waitFor(() => {
        const active = canvasElement.ownerDocument.getElementById(input.getAttribute('aria-activedescendant'));
        expect(active).toHaveTextContent('Student 1000');
        expect(active).toHaveAttribute('aria-posinset', '1000');
    });
    await expect(drawn().length).toBeLessThan(60);

    await userEvent.type(input, '99');
    await waitFor(() => expect(body.getByRole('status')).toHaveTextContent('19 results'));
};

/**
 * The list's surface is the overlay pair with a `color.border` edge, its
 * header rule `color.border`, a failed load `text.danger`. A field in the
 * header keeps its 2px-off focus ring inside the list's clip: the header's
 * own padding is the ring's room.
 */
export const Colors = () => (
    <div style={stack}>
        <Listbox
            aria-label="Topic"
            options={[{ value: 'a', label: 'Algebra' }, { value: 'b', label: 'Biology' }]}
            value="a"
            header={(
                <div className="plus-tag-input__rename">
                    <Input label="Name" showLabel={false} size="small" defaultValue="Algebra" />
                </div>
            )}
        />
        <Listbox aria-label="Failed" options={[]} error="Couldn't load schools. Try again." />
    </div>
);
Colors.parameters = { docs: { disable: true } };
Colors.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const surface = canvas.getByRole('listbox', { name: 'Topic' }).closest('.plus-listbox');
    const header = surface.querySelector('.plus-listbox-header');
    const error = within(canvas.getByRole('listbox', { name: 'Failed' }).closest('.plus-listbox')).getByText(/Couldn't load schools/).closest('.plus-listbox-message');
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(surface).backgroundColor, `${mode}: surface`).toBe(token('--ds-surface-overlay'));
        await expect(getComputedStyle(surface).borderTopColor, `${mode}: edge`).toBe(token('--ds-border'));
        await expect(getComputedStyle(header).borderBottomColor, `${mode}: header rule`).toBe(token('--ds-border'));
        await expect(getComputedStyle(error).color, `${mode}: failed load`).toBe(token('--ds-text-danger'));
    });

    const input = canvas.getByRole('textbox', { name: 'Name' });
    input.focus();
    const field = input.closest('.plus-field');
    const ring = parseFloat(getComputedStyle(field).outlineOffset) + parseFloat(getComputedStyle(field).outlineWidth);
    const r = field.getBoundingClientRect();
    const c = surface.getBoundingClientRect();
    const edge = parseFloat(getComputedStyle(surface).borderTopWidth);
    await expect(r.left - ring >= c.left + edge && r.right + ring <= c.right - edge && r.top - ring >= c.top + edge,
        "the list clips the header field's focus ring").toBe(true);
    input.blur();
};
