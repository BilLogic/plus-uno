import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import Cascader from './Cascader';
import TreeSelect from './TreeSelect';

/**
 * Reaching a menu-backed field without a mouse.
 *
 * WHY THIS FILE EXISTS (#323). Two components in this group opened a menu that
 * only a pointer could use.
 *
 * `TreeSelect` carried the right roles and none of
 * the behaviour they promise. The trigger was a `combobox` with `aria-expanded`;
 * the panel was a `tree`; every node was a `treeitem` with `aria-selected` and
 * `aria-expanded`. Not one of them was a tab stop, and there was no key handler
 * anywhere in the file — so a screen-reader user was told there was a tree,
 * told which node was selected, and had no way to reach any of it. In `multiple`
 * mode the per-node checkboxes are real inputs, which made the component look
 * partly operable; in single mode there was no keyboard path to a selection at
 * all.
 *
 * A role that describes an interaction the component does not implement is
 * worse than no role: it is an announcement that turns out to be false. axe
 * cannot see that — it checks that roles are used legally, not that they are
 * honoured — and the story suite clicked, so the whole keyboard half of this
 * component was unexercised.
 *
 * The assertions below are the contract, not the implementation: Down moves,
 * Right opens and steps in, Left closes and steps out, Enter chooses, Escape
 * closes and returns focus. How focus is held — a roving `tabIndex` here rather
 * than `aria-activedescendant` — is deliberately not asserted.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '420px' };

const SUBJECTS = [
    {
        label: 'Mathematics',
        value: 'maths',
        children: [
            { label: 'Algebra', value: 'algebra' },
            { label: 'Geometry', value: 'geometry' },
        ],
    },
    {
        label: 'Science',
        value: 'science',
        children: [
            { label: 'Biology', value: 'biology' },
        ],
    },
];

export default {
    title: 'Components/Forms and inputs/Menu keyboard navigation',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Interaction cover for #323: a component that announces a tree has to be '
                    + 'navigable as one.',
            },
        },
    },
};

/**
 * Open, walk, choose — the whole path, with no pointer at any step.
 *
 * The first assertion is the discriminator for the old state: focus inside the
 * tree. Before the fix nothing in the panel could hold it.
 */
export const OpensAndSelectsFromTheKeyboard = () => {
    const [subject, setSubject] = useState(undefined);
    return (
        <div style={stack}>
            <label htmlFor="mkn-single">Subject</label>
            <TreeSelect id="mkn-single" options={SUBJECTS} value={subject} onChange={setSubject} />
            <p data-testid="mkn-single-value">{subject || 'none'}</p>
        </div>
    );
};

OpensAndSelectsFromTheKeyboard.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Subject' });
    const readout = () => canvas.getByTestId('mkn-single-value').textContent;

    // The label resolves to the input — `id` used to land on the wrapper.
    await expect(trigger.tagName).toBe('INPUT');

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');

    const tree = await waitFor(() => canvas.getByRole('tree'));
    await expect(trigger.getAttribute('aria-controls')).toBe(tree.getAttribute('id'));

    // Focus is IN the tree, on its first row.
    await waitFor(() => expect(tree.contains(document.activeElement)).toBe(true));
    await expect(document.activeElement.textContent).toContain('Mathematics');

    // Right opens the branch, Right again steps into it.
    await userEvent.keyboard('{ArrowRight}');
    await expect(document.activeElement.getAttribute('aria-expanded')).toBe('true');
    await userEvent.keyboard('{ArrowRight}');
    await expect(document.activeElement.textContent).toContain('Algebra');

    // Down within the branch, then choose.
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement.textContent).toContain('Geometry');
    await userEvent.keyboard('{Enter}');

    await expect(readout()).toBe('geometry');
    // Choosing closes the panel and hands focus back to the trigger.
    await waitFor(() => expect(canvas.queryByRole('tree')).toBeNull());
    await expect(document.activeElement).toBe(trigger);
};

/**
 * Left is Right's inverse, and Escape is a way out.
 *
 * A panel that can be entered and not left is a keyboard trap, which is a worse
 * failure than the one this file exists for.
 */
export const CollapsesAndEscapes = () => {
    const [subject, setSubject] = useState('algebra');
    return (
        <div style={stack}>
            <label htmlFor="mkn-escape">Subject</label>
            <TreeSelect id="mkn-escape" options={SUBJECTS} value={subject} onChange={setSubject} />
        </div>
    );
};

CollapsesAndEscapes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Subject' });

    trigger.focus();
    await userEvent.keyboard('{Enter}');

    const tree = await waitFor(() => canvas.getByRole('tree'));

    // Opening reveals the selection's branch and starts on the selected node.
    await waitFor(() => expect(tree.contains(document.activeElement)).toBe(true));
    await expect(document.activeElement.textContent).toContain('Algebra');

    // Left from a leaf steps out to its parent.
    await userEvent.keyboard('{ArrowLeft}');
    await expect(document.activeElement.textContent).toContain('Mathematics');

    // Left again collapses the branch it is on.
    await userEvent.keyboard('{ArrowLeft}');
    await expect(document.activeElement.getAttribute('aria-expanded')).toBe('false');

    // End reaches the last visible row — which is Science, now that Mathematics
    // is shut. Movement follows what is on screen, not what is in the data.
    await userEvent.keyboard('{End}');
    await expect(document.activeElement.textContent).toContain('Science');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('tree')).toBeNull());
    await expect(document.activeElement).toBe(trigger);
};

/**
 * `multiple` toggles rather than choosing, and stays open while it does.
 */
export const MultipleTogglesWithoutClosing = () => {
    const [subjects, setSubjects] = useState([]);
    return (
        <div style={stack}>
            <label htmlFor="mkn-multi">Subjects</label>
            <TreeSelect id="mkn-multi" multiple options={SUBJECTS} value={subjects} onChange={setSubjects} />
            <p data-testid="mkn-multi-value">{subjects.join(',') || 'none'}</p>
        </div>
    );
};

MultipleTogglesWithoutClosing.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Subjects' });
    const readout = () => canvas.getByTestId('mkn-multi-value').textContent;

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const tree = await waitFor(() => canvas.getByRole('tree'));
    await expect(tree.getAttribute('aria-multiselectable')).toBe('true');

    await waitFor(() => expect(tree.contains(document.activeElement)).toBe(true));

    // Space on a parent takes its subtree with it, and leaves the panel open.
    await userEvent.keyboard(' ');
    await expect(readout()).toBe('maths,algebra,geometry');
    await expect(canvas.getByRole('tree')).toBeTruthy();

    // And off again.
    await userEvent.keyboard(' ');
    await expect(readout()).toBe('none');
};

/* ---------------------------------------------------------------------------
 * `Cascader`, which was the worse of the two: it had neither the behaviour nor
 * the roles. The trigger was a read-only text input with no `combobox` role and
 * no `aria-expanded`, so nothing said a menu existed, let alone that it had
 * opened; the options were `div`s with an `onClick`; the columns previewed on
 * hover, which is an affordance a keyboard does not have; and the only
 * dismissal was a `mousedown` outside the wrapper.
 * ------------------------------------------------------------------------- */

const REGIONS = [
    {
        label: 'Scotland',
        value: 'scotland',
        children: [
            { label: 'Edinburgh', value: 'edinburgh' },
            { label: 'Glasgow', value: 'glasgow' },
        ],
    },
    {
        label: 'Wales',
        value: 'wales',
        children: [
            { label: 'Cardiff', value: 'cardiff' },
            { label: 'Swansea', value: 'swansea', disabled: true },
        ],
    },
];

/**
 * Down the first column, right into the second, and commit — no pointer.
 */
export const CascaderWalksItsColumns = () => {
    const [path, setPath] = useState([]);
    return (
        <div style={stack}>
            <label htmlFor="mkn-cascader">Region</label>
            <Cascader id="mkn-cascader" options={REGIONS} value={path} onChange={setPath} />
            <p data-testid="mkn-cascader-value">{path.join(' / ') || 'none'}</p>
        </div>
    );
};

CascaderWalksItsColumns.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Region' });
    const readout = () => canvas.getByTestId('mkn-cascader-value').textContent;

    // The label resolves to the input, and the input says what it opens.
    await expect(trigger.tagName).toBe('INPUT');
    await expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('true'));

    const firstColumn = await waitFor(() => canvas.getByRole('listbox', { name: 'Options' }));
    await waitFor(() => expect(firstColumn.contains(document.activeElement)).toBe(true));
    await expect(document.activeElement.textContent).toContain('Scotland');

    // Down within the column.
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement.textContent).toContain('Wales');

    // Right opens the child column and steps into it.
    await userEvent.keyboard('{ArrowRight}');
    const second = await waitFor(() => canvas.getByRole('listbox', { name: /Options under/ }));
    await waitFor(() => expect(second.contains(document.activeElement)).toBe(true));
    await expect(document.activeElement.textContent).toContain('Cardiff');

    // A disabled option is stepped over, not landed on and refused.
    await userEvent.keyboard('{ArrowDown}');
    await expect(document.activeElement.textContent).toContain('Cardiff');

    // Enter on a leaf commits the whole path and closes.
    await userEvent.keyboard('{Enter}');
    await expect(readout()).toBe('wales / cardiff');
    await waitFor(() => expect(canvas.queryByRole('listbox')).toBeNull());
    await expect(document.activeElement).toBe(trigger);
};

/**
 * Left is the way back, and Escape is the way out.
 */
export const CascaderGoesBackAndCloses = () => {
    const [path, setPath] = useState([]);
    return (
        <div style={stack}>
            <label htmlFor="mkn-cascader-back">Region</label>
            <Cascader id="mkn-cascader-back" options={REGIONS} value={path} onChange={setPath} />
        </div>
    );
};

CascaderGoesBackAndCloses.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: 'Region' });

    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => canvas.getByRole('listbox', { name: 'Options' }));

    // Into the second column…
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(document.activeElement.textContent).toContain('Edinburgh'));

    // …and back out, landing on the parent that opened it.
    await userEvent.keyboard('{ArrowLeft}');
    await expect(document.activeElement.textContent).toContain('Scotland');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(canvas.queryByRole('listbox')).toBeNull());
    await expect(document.activeElement).toBe(trigger);
};
