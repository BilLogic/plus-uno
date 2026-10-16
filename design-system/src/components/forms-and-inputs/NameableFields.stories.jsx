import React from 'react';
import { expect, within } from 'storybook/test';

import ChoiceGroup from './ChoiceGroup';
import DatePicker from './DatePicker/DatePicker';
import InputGroup from './InputGroup/InputGroup';
import RichTextEditor from './RichTextEditor/RichTextEditor';
import Select from './Select';

/**
 * Three fields that could not be named.
 *
 * WHY THIS FILE EXISTS (#329). #206 gave every field in this directory a label
 * that resolves to its control. Three were left out of that fix because they had
 * no control for a label to resolve to, and nothing was put in its place.
 *
 * `InputGroup` was the starkest: it had no `label` prop, `id` was applied to the
 * GROUP, and extra props were spread there too — so no route existed, through
 * any prop, to give the input a name. A caller who wanted one had to stop using
 * the component.
 *
 * `RichTextEditor`'s editable region was a bare `contentEditable` div: no
 * `role`, no name, and `id` on the outer container, so a `label` pointing at it
 * named a `div`. Someone hearing the page arrived in an editable area that did
 * not say what it was for or that it was editable at all.
 *
 * `MultipleChoice` rendered the options and nothing around them. The question
 * lived on the page and was attached to nothing, so the answers were four
 * controls with no subject. `ChoiceGroup` replaced it and is always a
 * `fieldset`, named by its `legend`.
 *
 * axe catches the first of those three and not the other two: an `input` with no
 * accessible name is a rule, a `contentEditable` div with no role is not, and
 * neither is a set of radios whose question is a heading somewhere above them.
 * Which is why the assertions here ask for names, not for attributes.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '520px' };

export default {
    title: 'Components/Forms and inputs/Nameable fields',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #329: every field in this group can be given an '
                    + 'accessible name, and the group of answers can be given a question.',
            },
        },
    },
};

export const EveryFieldCanBeNamed = () => (
    <div style={stack}>
        <InputGroup id="nf-amount" label="Amount" leadingVisual="£" />
        <RichTextEditor id="nf-notes" label="Session notes" />
        <ChoiceGroup
            name="level"
            legend="What level are you teaching?"
            options={['Beginner', 'Advanced']}
        />
    </div>
);

EveryFieldCanBeNamed.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;

    // 1. The joined field. `getByRole` with a name throws if it is not there.
    const amount = canvas.getByRole('textbox', { name: 'Amount' });
    await expect(amount.tagName).toBe('INPUT');

    // And the label points at the input, not at the group around it.
    const label = canvasElement.querySelector('label[for]');
    await expect(doc.getElementById(label.getAttribute('for'))).toBe(amount);

    // 2. The editor announces itself as a multi-line textbox with a name.
    const editor = canvas.getByRole('textbox', { name: 'Session notes' });
    await expect(editor.getAttribute('aria-multiline')).toBe('true');
    await expect(editor.isContentEditable).toBe(true);

    // 3. The options are inside a named group, which is what ties them to the
    //    question. A radio `fieldset` reports as a radiogroup to the role query.
    const group = canvas.getByRole('radiogroup', { name: 'What level are you teaching?' });
    await expect(within(group).getAllByRole('radio')).toHaveLength(2);
};

/**
 * Naming a field must not change what it looks like.
 *
 * `showLabel={false}` on `InputGroup`, and `ChoiceGroup` with `aria-label`
 * instead of a legend, are the two ways a caller keeps a question off screen —
 * so both have to keep the name they are hiding.
 */
export const HidingTheLabelKeepsTheName = () => (
    <div style={stack}>
        <InputGroup id="nf-hidden" label="Search" showLabel={false} trailingVisual="icon" />
        <ChoiceGroup name="unlabeled" aria-label="Pick one" options={['One', 'Two']} />
    </div>
);

HidingTheLabelKeepsTheName.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Named, and the name is not on screen.
    const search = canvas.getByRole('textbox', { name: 'Search' });
    await expect(search).toBeTruthy();

    const label = canvasElement.querySelector('label');
    await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);

    // No legend on screen, and the group still says what it asks.
    const group = canvas.getByRole('radiogroup', { name: 'Pick one' });
    await expect(group.querySelector('legend')).toBeNull();
    await expect(within(group).getAllByRole('radio')).toHaveLength(2);
};

/**
 * A field with no label of its own takes its name from the caller.
 *
 * A plain `Select` is a `div role="combobox"`, which a `<label for>` cannot
 * name, and `DatePicker` has no `label` prop. For both, `aria-label` or
 * `aria-labelledby` passed by the caller is the only route to a name, so the
 * component has to hand those on to the control rather than drop them.
 */
export const CallerPropsNameTheControl = () => (
    <div style={stack}>
        <span id="nf-term-label">Term</span>
        <Select
            id="nf-subject"
            aria-label="Subject"
            options={[{ value: 'maths', label: 'Maths' }, { value: 'english', label: 'English' }]}
        />
        <Select
            id="nf-term"
            aria-labelledby="nf-term-label"
            required
            options={[{ value: 'fall', label: 'Fall' }]}
        />
        <DatePicker id="nf-session-date" aria-label="Session date" />
    </div>
);

CallerPropsNameTheControl.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const subject = canvas.getByRole('combobox', { name: 'Subject' });
    await expect(subject.classList.contains('plus-select-combobox')).toBe(true);

    // A caller's own label and `required` both survive.
    const term = canvas.getByRole('combobox', { name: 'Term' });
    await expect(term).toHaveAttribute('aria-required', 'true');

    const date = canvas.getByRole('combobox', { name: 'Session date' });
    await expect(date.tagName).toBe('INPUT');
};

/**
 * A dropdown addon's props reach the dropdown, and only the dropdown.
 *
 * Spreading them on the addon wrapper as well put the same `id` on two
 * elements, and wrote props such as `ariaLabel` to a `span` as unknown DOM
 * attributes, where they name nothing.
 */
export const DropdownAddonTakesItsPropsOnce = () => (
    <div style={stack}>
        <InputGroup
            id="nf-price"
            label="Price"
            leadingVisual={{
                type: 'dropdown',
                id: 'nf-currency',
                text: 'GBP',
                ariaLabel: 'Currency',
                items: [{ label: 'GBP' }, { label: 'USD' }],
            }}
        />
    </div>
);

DropdownAddonTakesItsPropsOnce.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvasElement.querySelectorAll('#nf-currency')).toHaveLength(1);
    await expect(canvasElement.querySelector('[arialabel]')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Currency' })).toBeTruthy();
};
