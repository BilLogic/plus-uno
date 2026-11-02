import React, { useState } from 'react';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px } from '@/storybook-docs/lib/style-probes.js';
import { Button } from '@/components';
import PromptStarters from '../PromptStarters';
import PromptInput from './PromptInput';

/**
 * `PromptInput` -- where a person writes to the agent.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser, and assert what a person gets by using it: Enter sends,
 * Shift+Enter starts a line, an input method mid-composition sends nothing,
 * the box grows to a most and then scrolls, the send button becomes Stop while
 * a reply is generated, and the send button's AI ground resolves from tokens
 * in every color mode.
 */

export default {
    title: 'AI/Components/Prompt input',
    component: PromptInput,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A text area that grows to a most, an optional control before it, and one send action in the AI '
                    + 'bold ground. While a reply is generated the action becomes Stop and the field gets a GenerativeBorder.',
            },
        },
    },
    argTypes: {
        label: { control: 'text' },
        placeholder: { control: 'text' },
        defaultValue: { control: 'text' },
        isGenerating: { control: 'boolean' },
        isDisabled: { control: 'boolean' },
        value: { control: false },
        startSlot: { control: false },
        onChange: { control: false },
        onSubmit: { control: false },
        onStop: { control: false },
        state: { control: false },
        className: { control: false },
    },
};

const wrap = { maxWidth: 'var(--section-min-width-main)' };
const column = { ...wrap, display: 'flex', flexDirection: 'column', gap: 'var(--layout-gutter)' };

const attach = <Button leadingVisual="paperclip" aria-label="Attach a file" title="Attach a file" style="secondary" fill="ghost" size="small" />;

const textbox = (el) => within(el).getByRole('textbox', { name: 'Message to PLUS AI' });

/* ------------------------------------------------------------------- states */

export const States = () => (
    <div style={column}>
        <PromptInput label="Message to PLUS AI" placeholder="Ask PLUS AI" />
        <PromptInput label="Message to PLUS AI" placeholder="Ask PLUS AI" state="focus" />
        <PromptInput label="Message to PLUS AI" defaultValue="Plan a 30 minute session on fractions" />
        <PromptInput label="Message to PLUS AI" defaultValue="Plan a 30 minute session on fractions" isGenerating onStop={() => {}} />
        <PromptInput label="Message to PLUS AI" placeholder="Ask PLUS AI" isDisabled />
    </div>
);

/**
 * Empty, the send button is disabled. Filled, it is the AI bold ground with an
 * inverse glyph in every color mode. Generating, it is Stop and the field is
 * ringed. Disabled, the field and the button are both off.
 */
States.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const boxes = [...canvasElement.querySelectorAll('.plus-prompt-input')];
    await expect(boxes, 'five states').toHaveLength(5);
    const [empty, focused, filled, generating, disabled] = boxes;

    await expect(within(empty).getByRole('button', { name: 'Send' })).toBeDisabled();
    await expect(within(focused).getByRole('textbox')).toBeInTheDocument();
    await expect(within(filled).getByRole('button', { name: 'Send' })).toBeEnabled();
    await expect(within(generating).getByRole('button', { name: 'Stop generating' })).toBeEnabled();
    await expect(generating.getAttribute('aria-busy'), 'generating is busy').toBe('true');
    await expect(generating.querySelector('.plus-generative-border__ring'), 'ringed').not.toBeNull();
    await expect(empty.querySelector('.plus-generative-border__ring'), 'not ringed').toBeNull();
    await expect(within(disabled).getByRole('textbox')).toBeDisabled();
    await expect(within(disabled).getByRole('button', { name: 'Send' })).toBeDisabled();

    const send = within(filled).getByRole('button', { name: 'Send' });
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(send).backgroundColor, `send ground, ${mode}`).toBe(token('--ds-ai-background-bold'));
        await expect(getComputedStyle(send).color, `send glyph, ${mode}`).toBe(token('--ds-text-inverse'));
    });
};

/* ----------------------------------------------------------------- behavior */

const submitSpy = fn();

export const EnterSubmits = () => <div style={wrap}><PromptInput label="Message to PLUS AI" onSubmit={submitSpy} /></div>;

EnterSubmits.beforeEach = () => submitSpy.mockClear();

/** Enter sends what was typed and the field empties. Shift+Enter starts a line instead. */
EnterSubmits.play = async ({ canvasElement }) => {
    const input = textbox(canvasElement);
    await userEvent.type(input, 'one{Shift>}{Enter}{/Shift}two');
    await expect(submitSpy, 'Shift+Enter does not send').not.toHaveBeenCalled();
    await expect(input).toHaveValue('one\ntwo');
    await userEvent.type(input, '{Enter}');
    await expect(submitSpy).toHaveBeenCalledTimes(1);
    await expect(submitSpy.mock.calls[0][0]).toBe('one\ntwo');
    await expect(input, 'cleared after a send').toHaveValue('');
    await expect(within(canvasElement).getByRole('button', { name: 'Send' }), 'empty again').toBeDisabled();
};

export const IgnoresComposition = () => <div style={wrap}><PromptInput label="Message to PLUS AI" defaultValue="にほん" onSubmit={submitSpy} /></div>;

IgnoresComposition.beforeEach = () => submitSpy.mockClear();

/** The Enter that confirms an input method's candidate is not a send. */
IgnoresComposition.play = async ({ canvasElement }) => {
    const input = textbox(canvasElement);
    await fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    await fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    await expect(submitSpy).not.toHaveBeenCalled();
    await fireEvent.keyDown(input, { key: 'Enter' });
    await expect(submitSpy).toHaveBeenCalledTimes(1);
};

/* --------------------------------------------------------------------- grow */

export const GrowsToAMaximum = () => <div style={wrap}><PromptInput label="Message to PLUS AI" /></div>;

/** The box starts at one line, grows with the text, and stops at the most before it scrolls. */
GrowsToAMaximum.play = async ({ canvasElement }) => {
    const input = textbox(canvasElement);
    const one = input.getBoundingClientRect().height;
    await userEvent.type(input, 'a{Shift>}{Enter}{/Shift}b{Shift>}{Enter}{/Shift}c');
    const three = input.getBoundingClientRect().height;
    await expect(three, 'taller with more lines').toBeGreaterThan(one);
    await userEvent.type(input, '{Shift>}{Enter}{/Shift}d'.repeat(12));
    const most = px(getComputedStyle(input).maxHeight);
    await expect(Math.round(input.getBoundingClientRect().height), 'stops at the maximum').toBe(Math.round(most));
    await expect(input.scrollHeight, 'the rest scrolls').toBeGreaterThan(input.clientHeight);
};

/* --------------------------------------------------------------------- stop */

const stopSpy = fn();

export const StopWhileGenerating = () => (
    <div style={wrap}><PromptInput label="Message to PLUS AI" isGenerating onStop={stopSpy} onSubmit={submitSpy} defaultValue="Next question" /></div>
);

StopWhileGenerating.beforeEach = () => {
    stopSpy.mockClear();
    submitSpy.mockClear();
};

/** While generating there is no Send. Stop calls `onStop`, and Enter sends nothing. */
StopWhileGenerating.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: 'Send' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Stop generating' }));
    await expect(stopSpy).toHaveBeenCalledTimes(1);
    await userEvent.type(textbox(canvasElement), '{Enter}');
    await expect(submitSpy).not.toHaveBeenCalled();
};

/* --------------------------------------------------------------- start slot */

export const WithAStartSlot = () => <div style={wrap}><PromptInput label="Message to PLUS AI" startSlot={attach} placeholder="Ask PLUS AI" /></div>;

/** One quiet control sits before the text, and the AI send stays the only filled action. */
WithAStartSlot.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const attachButton = canvas.getByRole('button', { name: 'Attach a file' });
    const input = textbox(canvasElement);
    await expect(attachButton.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING, 'before the text').toBeTruthy();
    await expect(getComputedStyle(attachButton).backgroundColor, 'the slot control is not filled').toBe('rgba(0, 0, 0, 0)');
};

/* ------------------------------------------------------------- in a surface */

export const WithStarters = () => {
    const [text, setText] = useState('');
    const [sent, setSent] = useState('');
    return (
        <div style={column}>
            <PromptStarters
                label="Suggested prompts"
                starters={[
                    { id: 'plan', label: 'Plan a session', text: 'Plan a 30 minute session on fractions.' },
                    { id: 'recap', label: 'Recap last session', text: 'Recap my last session with Maya.' },
                ]}
                onSelect={(starter) => setText(starter.text)}
            />
            <PromptInput
                label="Message to PLUS AI"
                placeholder="Ask PLUS AI"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onSubmit={(value) => { setSent(value); setText(''); }}
            />
            <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{sent ? `Sent: ${sent}` : 'Nothing sent'}</span>
        </div>
    );
};

/** A starter fills the field for the person to read; it does not send. Sending is theirs. */
WithStarters.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Plan a session, suggested' }));
    await expect(textbox(canvasElement)).toHaveValue('Plan a 30 minute session on fractions.');
    await expect(canvas.getByText('Nothing sent'), 'selecting a starter sends nothing').toBeInTheDocument();
    await userEvent.type(textbox(canvasElement), '{Enter}');
    await expect(canvas.getByText('Sent: Plan a 30 minute session on fractions.')).toBeInTheDocument();
};

/* --------------------------------------------------------------- playground */

export const Interactive = (args) => <div style={wrap}><PromptInput {...args} onSubmit={() => {}} onStop={() => {}} /></div>;
Interactive.args = {
    label: 'Message to PLUS AI',
    placeholder: 'Ask PLUS AI',
    defaultValue: '',
    isGenerating: false,
    isDisabled: false,
};
