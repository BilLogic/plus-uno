import React, { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import PromptStarters from './PromptStarters';
import PromptInput from '../../forms-and-inputs/PromptInput/PromptInput';

/**
 * `PromptStarters` — a few things a person could ask the AI, as a wrapping
 * row of `Suggestion` chips.
 *
 * THE TEST SEAM IS THIS FILE. `play:` functions assert the group role and
 * name, that a press hands back the whole starter, and that pressing one never
 * sends anything on its own.
 */

const STARTERS = [
    { id: 'summarize', label: 'Summarize this session', text: 'Summarize this session for the family.' },
    { id: 'plan', label: 'Plan next steps', text: 'What should we cover next session?' },
    { id: 'explain', label: 'Explain this concept', text: 'Explain this in simpler terms.' },
];

export default {
    title: 'AI UI/Components/Prompt starters',
    component: PromptStarters,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A wrapping row of prompt Suggestion chips. A press hands the whole starter to '
                    + '`onSelect`; it never sends anything by itself.',
            },
        },
    },
    argTypes: {
        label: { control: 'text' },
    },
};

const wrap = { maxWidth: 'var(--width-3000)' };

/* ----------------------------------------------------------------- default */

export const Default = () => (
    <div style={wrap}>
        <PromptStarters label="Suggested prompts" starters={STARTERS} onSelect={fn()} />
    </div>
);

Default.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: 'Suggested prompts' });
    await expect(group).toBeVisible();
    STARTERS.forEach((starter) => {
        expect(canvas.getByRole('button', { name: `${starter.label}, suggested` })).toBeVisible();
    });
};

/* --------------------------------------------------------------------- select */

export const SelectHandsBackTheStarter = {
    args: { label: 'Suggested prompts', starters: STARTERS, onSelect: fn() },
    render: (args) => (
        <div style={wrap}>
            <PromptStarters {...args} />
        </div>
    ),
    /** Pressing a chip calls `onSelect` with the whole starter object. */
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Plan next steps, suggested' }));
        await expect(args.onSelect).toHaveBeenCalledWith(STARTERS[1]);
    },
};

/* -------------------------------------------------------------------- empty */

export const EmptyRendersNothing = () => (
    <PromptStarters label="Suggested prompts" starters={[]} data-testid="starters" />
);

EmptyRendersNothing.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[role="group"]')).toBeNull();
};

/* ------------------------------------------------------------------- composed */

/** Paired with PromptInput: selecting a starter fills the field rather than sending it. */
export const FillsThePromptInput = () => {
    const [value, setValue] = useState('');
    return (
        <div style={{ ...wrap, display: 'flex', flexDirection: 'column', gap: 'var(--grid-gutter)' }}>
            <PromptInput label="Message to AI chat" value={value} onChange={(e) => setValue(e.target.value)} onSubmit={fn()} />
            <PromptStarters
                label="Suggested prompts"
                starters={STARTERS}
                onSelect={(starter) => setValue(starter.text)}
            />
        </div>
    );
};

FillsThePromptInput.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Summarize this session, suggested' }));
    const field = canvas.getByRole('textbox', { name: 'Message to AI chat' });
    await expect(field).toHaveValue('Summarize this session for the family.');
};

/* -------------------------------------------------------------- playground */

/** Interactive playground. */
export const Interactive = {
    args: { label: 'Suggested prompts', starters: STARTERS, onSelect: fn() },
    render: (args) => (
        <div style={wrap}>
            <PromptStarters {...args} />
        </div>
    ),
};
