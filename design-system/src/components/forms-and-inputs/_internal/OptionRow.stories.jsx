import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import Count from '@/components/labels/Count/Count';
import OptionRow from './OptionRow';

/**
 * The internal option row (Figma `Dropdown list Item`). Every option list
 * draws it: Select, TagInput, the Cascader's columns and TreeSelect's levels.
 * It is not exported from the barrel; `Listbox` places it.
 */
export default {
    title: 'Components/Forms and inputs/Option row',
    component: OptionRow,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Internal part: one row with three kinds (option, create, group heading), '
                    + 'a Leading slot of up to four items, a Trailing item and a description line.',
            },
        },
    },
};

const frame = { width: 320, display: 'flex', flexDirection: 'column' };

/** Option, Create and group-heading rows, and the selected and disabled states. */
export const Kinds = () => (
    <div role="listbox" aria-label="Kinds" style={frame}>
        <div role="group" aria-labelledby="or-kinds-heading">
            <OptionRow kind="group" id="or-kinds-heading" label="Recent" />
            <OptionRow label="Algebra" />
            <OptionRow label="Biology" selected />
            <OptionRow label="Chemistry" highlighted />
            <OptionRow label="Physics" disabled />
        </div>
        <OptionRow kind="create" label="Music" />
    </div>
);

Kinds.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = canvas.getAllByRole('option');
    // Every row fills the list's width, so the highlight spans the whole row.
    const listWidth = canvas.getByRole('listbox').getBoundingClientRect().width;
    for (const row of rows) {
        await expect(Math.round(row.getBoundingClientRect().width)).toBe(Math.round(listWidth));
    }
    await expect(canvas.getByRole('option', { name: 'Create Music' })).toBeInTheDocument();
};

/**
 * What the Leading slot takes: tree indent and caret, a checkbox (including
 * partly checked), a radio, an icon or a drag handle. Trailing takes a Count,
 * a chevron or a "…".
 */
export const LeadingAndTrailing = () => (
    <div role="listbox" aria-label="Slots" aria-multiselectable="true" style={frame}>
        <OptionRow
            label="Algebra"
            check={false}
            leading={[
                <OptionRow.Indent key="i" level={0} />,
                <OptionRow.Toggle key="t" state="expanded" />,
                <OptionRow.Checkbox key="c" checked={false} indeterminate />,
            ]}
        />
        <OptionRow
            label="Linear equations"
            check={false}
            selected
            leading={[
                <OptionRow.Indent key="i" level={1} />,
                <OptionRow.Toggle key="t" state="leaf" />,
                <OptionRow.Checkbox key="c" checked />,
            ]}
        />
        <OptionRow label="Tuesday" leading={<OptionRow.Radio checked={false} />} />
        <OptionRow
            label="Decision recall"
            leading={<i className="fa-solid fa-grip-vertical" aria-hidden="true" />}
            trailing={<i className="fa-solid fa-ellipsis" aria-hidden="true" />}
        />
        <OptionRow label="Unread" leading={<i className="fa-solid fa-inbox" aria-hidden="true" />} trailing={<Count value={12} />} />
        <OptionRow label="Pennsylvania" trailing={<OptionRow.Chevron />} />
        <OptionRow label="Maria Lopez" description="Grade 7 · Brookfield Middle School" />
    </div>
);

LeadingAndTrailing.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [parent, child] = canvas.getAllByRole('option');
    // Depth is exactly level × the indent step: the child's label sits one step right.
    const labelLeft = (row) => row.querySelector('.plus-option-row-check').getBoundingClientRect().left;
    const step = labelLeft(child) - labelLeft(parent);
    await expect(step).toBeGreaterThan(0);
    await expect(step).toBe(parseFloat(getComputedStyle(child).getPropertyValue('--plus-option-row-indent-step')) || 20);
};

/** A long label truncates to one line, and hovering shows it whole. */
export const LongLabelsTruncate = () => {
    const [chosen, setChosen] = useState(null);
    return (
        <div role="listbox" aria-label="Schools" style={{ ...frame, width: 200 }}>
            <OptionRow
                value="eagle"
                label="Eagle Ridge Intermediate School of the Arts and Sciences"
                selected={chosen === 'eagle'}
                onSelect={setChosen}
            />
        </div>
    );
};

LongLabelsTruncate.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole('option');
    const label = row.querySelector('.plus-option-row-label');
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);

    await userEvent.hover(label);
    const tip = await within(canvasElement.ownerDocument.body).findByRole('tooltip');
    await expect(tip).toHaveTextContent('Eagle Ridge Intermediate School of the Arts and Sciences');
    await userEvent.unhover(label);
    await waitFor(() => expect(within(canvasElement.ownerDocument.body).queryByRole('tooltip')).toBeNull());
};

/**
 * The row's colors: hover the neutral subtle step, selection neutral ink with
 * an `icon.selected` check, a checked mark Lagoon with an `icon.inverse` check,
 * a lifted row on the overlay surface, and the drop line `border.selected`.
 */
export const Colors = () => (
    <div role="listbox" aria-label="Colors" aria-multiselectable="true" style={frame}>
        <OptionRow label="Algebra" />
        <OptionRow label="Biology" highlighted />
        <OptionRow label="Chemistry" selected description="Grade 9" />
        <OptionRow label="Physics" check={false} selected leading={<OptionRow.Checkbox checked />} />
        <OptionRow label="Geometry" dragging />
        <OptionRow label="History" dropIndicator="before" />
    </div>
);
Colors.parameters = { docs: { disable: true } };
Colors.play = async ({ canvasElement }) => {
    const row = (name) => within(canvasElement).getByRole('option', { name: new RegExp(`^${name}`) });
    const style = (el, pseudo) => getComputedStyle(el, pseudo);
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(style(row('Algebra')).color, `${mode}: row text`).toBe(token('--ds-text'));
        await expect(style(row('Biology')).backgroundColor, `${mode}: highlighted row`).toBe(token('--ds-background-neutral-subtle-hovered'));
        await expect(style(row('Chemistry')).backgroundColor, `${mode}: selected row`).toBe(token('--ds-background-selected'));
        await expect(style(row('Chemistry')).color, `${mode}: selected text`).toBe(token('--ds-text-selected'));
        await expect(style(row('Chemistry').querySelector('.plus-option-row-description')).color, `${mode}: selected description`).toBe(token('--ds-text-selected'));
        await expect(style(row('Chemistry').querySelector('.plus-option-row-selected-mark')).color, `${mode}: the check`).toBe(token('--ds-icon-selected'));
        const mark = row('Physics').querySelector('.plus-option-row-check');
        await expect(style(mark).backgroundColor, `${mode}: checked mark`).toBe(token('--ds-background-selected-bold'));
        await expect(style(mark).borderTopColor, `${mode}: checked mark edge`).toBe(token('--ds-border-selected'));
        await expect(style(mark.querySelector('i')).color, `${mode}: checked mark's check`).toBe(token('--ds-icon-inverse'));
        await expect(style(row('Geometry')).backgroundColor, `${mode}: lifted row`).toBe(token('--ds-surface-overlay'));
        await expect(style(row('History'), '::before').backgroundColor, `${mode}: drop line`).toBe(token('--ds-border-selected'));
    });
};
