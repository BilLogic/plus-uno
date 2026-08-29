import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import ChoiceGrid from './ChoiceGrid';
import Scale from './RadioButtonGroup';

/**
 * What "not answered yet" looks like, and what an answer does to the state you
 * handed in.
 *
 * WHY THIS FILE EXISTS (#325). Two components in this group got the empty case
 * wrong, in opposite directions.
 *
 * `Scale`, uncontrolled, initialised to `options[0].value`. A scale question
 * therefore arrived already showing "1", and a genuine answer of 1 could not be
 * told apart from no answer at all. That is a data defect wearing an interface:
 * every response set collected through an uncontrolled scale has a floor of
 * ones that may or may not be real, and nothing downstream can tell.
 *
 * `ChoiceGrid`, in checkbox mode, spread `values` one level and then wrote into
 * the row object it found there. The object the caller passed in and the object
 * handed back shared that row, so the "previous" state changed under anyone
 * holding it — which defeats an identity comparison and quietly rewrites what a
 * caller believes the last answer was.
 *
 * Neither is visible on screen. The grid renders the same either way, and a
 * pre-selected scale looks like a scale. Both need the state read back.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '560px' };

export default {
    title: 'Components/Forms and inputs/Answer state',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #325: an unanswered question reads as unanswered, and '
                    + 'answering one does not modify the state it was given.',
            },
        },
    },
};

const SCALE_OPTIONS = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
];

/**
 * An uncontrolled scale starts with nothing checked.
 */
export const ScaleStartsUnanswered = () => (
    <div style={stack}>
        <Scale name="confidence" label="Confidence" options={SCALE_OPTIONS} />
    </div>
);

ScaleStartsUnanswered.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: /Confidence/ });
    const radios = within(group).getAllByRole('radio');

    await expect(radios).toHaveLength(3);
    // The discriminator: the first radio used to arrive checked.
    await expect(radios.filter((radio) => radio.checked)).toHaveLength(0);

    // And it still answers when asked to.
    await userEvent.click(radios[1]);
    await expect(radios[1].checked).toBe(true);
};

/**
 * A `defaultValue` of zero is a starting value, not a falsy miss.
 */
export const ScaleAcceptsAFalsyDefault = () => (
    <div style={stack}>
        {/*
          * The zero is deliberately NOT the first option. With `defaultValue ||
          * options[0].value`, a falsy default fell through to the first option,
          * so `0` here used to start the scale on "1" — a wrong answer rather
          * than merely a premature one. Putting 0 first would have hidden that:
          * both the old expression and the new one land on 0.
          */}
        <Scale
            name="score"
            label="Score"
            defaultValue={0}
            options={[{ value: 1, label: '1' }, { value: 0, label: '0' }]}
        />
    </div>
);

ScaleAcceptsAFalsyDefault.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: /Score/ });
    const radios = within(group).getAllByRole('radio');
    await expect(radios[0].checked).toBe(false);
    await expect(radios[1].checked).toBe(true);
};

/**
 * The grid hands back a new object and leaves the old one alone.
 *
 * The assertion is a snapshot of the input taken BEFORE the click, compared
 * after. Comparing the two objects the component produced would not find this:
 * they differ at the top level, which is the level that was copied correctly.
 */
export const ChoiceGridDoesNotMutateItsInput = () => {
    const [values, setValues] = useState({ punctuality: { agree: true } });
    const [snapshot] = useState(() => JSON.stringify({ punctuality: { agree: true } }));
    const [before, setBefore] = useState(null);

    return (
        <div style={stack}>
            <ChoiceGrid
                type="checkbox"
                name="feedback"
                rows={[{ id: 'punctuality', label: 'Punctuality' }]}
                columns={[{ id: 'agree', label: 'Agree' }, { id: 'disagree', label: 'Disagree' }]}
                values={values}
                onChange={(next) => {
                    // Read the object we passed IN, at the moment we are handed
                    // the new one. This is the only point the defect is visible.
                    setBefore(JSON.stringify(values));
                    setValues(next);
                }}
            />
            <p data-testid="as-snapshot">{snapshot}</p>
            <p data-testid="as-before">{before === null ? 'not yet' : before}</p>
        </div>
    );
};

ChoiceGridDoesNotMutateItsInput.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const disagree = canvas.getByRole('checkbox', { name: /Punctuality Disagree/ });
    await userEvent.click(disagree);

    const snapshot = canvas.getByTestId('as-snapshot').textContent;
    const before = canvas.getByTestId('as-before').textContent;

    // The object we handed in is the same as when we built it. Before the fix
    // it had already grown `disagree: true`, because it WAS the new row.
    await expect(before).toBe(snapshot);

    // And the change did land.
    await expect(disagree.checked).toBe(true);
};
