import React from 'react';
import { expect, within } from 'storybook/test';

import InputGroup from './InputGroup/InputGroup';
import MultipleChoice from './MultipleChoice';
import RichTextEditor from './RichTextEditor/RichTextEditor';

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
 * controls with no subject.
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
        <MultipleChoice
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
    //    question. `fieldset`/`legend` reports as a group to the role query.
    const group = canvas.getByRole('group', { name: 'What level are you teaching?' });
    await expect(within(group).getAllByRole('radio')).toHaveLength(2);
};

/**
 * Naming a field must not change what it looks like.
 *
 * `showLabel={false}` on `InputGroup`, and `MultipleChoice` without a legend,
 * are the two ways a caller keeps the old appearance — so both have to keep
 * working, and the first has to keep the name it is hiding.
 */
export const HidingTheLabelKeepsTheName = () => (
    <div style={stack}>
        <InputGroup id="nf-hidden" label="Search" showLabel={false} trailingVisual="icon" />
        <MultipleChoice name="unlabelled" options={['One', 'Two']} />
    </div>
);

HidingTheLabelKeepsTheName.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Named, and the name is not on screen.
    const search = canvas.getByRole('textbox', { name: 'Search' });
    await expect(search).toBeTruthy();

    const label = canvasElement.querySelector('label');
    await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);

    // With no legend there is no group — an unnamed `fieldset` would be a group
    // that says nothing, which is worse than the div it replaced.
    await expect(canvas.queryAllByRole('group')).toHaveLength(0);
    await expect(canvas.getAllByRole('radio')).toHaveLength(2);
};
