import React, { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import PromptStarters from './PromptStarters';

/**
 * `PromptStarters` -- a few things a person could ask the agent.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser, and assert what a person gets: a named group of buttons,
 * a row that wraps onto new lines when it runs out of room, and a press that
 * hands back the starter and does nothing else.
 */

export default {
    title: 'AI/Components/Prompt starters',
    component: PromptStarters,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A wrapping row of prompt suggestions. Pressing one hands the starter back so the owner can '
                    + 'fill a PromptInput; it never sends.',
            },
        },
    },
    argTypes: {
        label: { control: 'text' },
        starters: { control: 'object' },
        onSelect: { control: false },
        className: { control: false },
    },
};

const STARTERS = [
    { id: 'plan', label: 'Plan a session', text: 'Plan a 30 minute session on fractions for a 4th grader.' },
    { id: 'recap', label: 'Recap last session', text: 'Recap my last session with Maya.' },
    { id: 'goals', label: 'Set learning goals', text: 'Suggest three learning goals for this term.' },
    { id: 'parent', label: 'Draft a note to a parent', text: 'Draft a short note to a parent about progress this week.' },
];

/* ----------------------------------------------------------------- overview */

export const Overview = () => <PromptStarters label="Suggested prompts" starters={STARTERS} />;

/** The starters are prompt Suggestions in one named group. */
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: 'Suggested prompts' });
    await expect(within(group).getAllByRole('button')).toHaveLength(STARTERS.length);
    await expect(within(group).getByRole('button', { name: 'Plan a session, suggested' })).toBeVisible();
    for (const chip of group.querySelectorAll('button')) {
        await expect(chip.querySelector('.fa-wand-magic-sparkles'), 'the prompt glyph').not.toBeNull();
    }
};

/* --------------------------------------------------------------------- wrap */

export const Wraps = () => (
    <div style={{ maxWidth: 'var(--card-min-width-sm)' }}>
        <PromptStarters label="Suggested prompts" starters={STARTERS} />
    </div>
);

/** In a narrow room the row wraps onto new lines rather than scrolling or clipping. */
Wraps.play = async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('group', { name: 'Suggested prompts' });
    const tops = new Set([...group.querySelectorAll('button')].map((chip) => Math.round(chip.getBoundingClientRect().top)));
    await expect(tops.size, 'more than one row').toBeGreaterThan(1);
    await expect(group.scrollWidth, 'nothing spills sideways').toBeLessThanOrEqual(group.clientWidth);
};

/* ------------------------------------------------------------------- select */

const selectSpy = fn();

export const Selecting = () => {
    const [picked, setPicked] = useState('');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--layout-gutter)' }}>
            <PromptStarters
                label="Suggested prompts"
                starters={STARTERS}
                onSelect={(starter) => { selectSpy(starter); setPicked(starter.text); }}
            />
            <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{picked || 'Nothing chosen'}</span>
        </div>
    );
};

Selecting.beforeEach = () => selectSpy.mockClear();

/** A press hands back the whole starter, once. What happens next is the owner's call. */
Selecting.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Recap last session, suggested' }));
    await expect(selectSpy).toHaveBeenCalledTimes(1);
    await expect(selectSpy.mock.calls[0][0]).toEqual(STARTERS[1]);
    await expect(canvas.getByText('Recap my last session with Maya.')).toBeInTheDocument();
};

/* --------------------------------------------------------------- playground */

export const Interactive = (args) => <PromptStarters {...args} onSelect={() => {}} />;
Interactive.args = { label: 'Suggested prompts', starters: STARTERS };
