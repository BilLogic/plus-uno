import React, { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import PromptInput from './PromptInput';
import { iconClass } from '../../../lib/icon';

/**
 * `PromptInput` — where a person writes to the AI.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser: Enter sends, Shift+Enter starts a line, an empty field
 * cannot send, loading swaps the send button for Stop and rings the field, and
 * an uncontrolled field clears itself after a send.
 */

export default {
    title: 'Components/Forms and inputs/Prompt input',
    component: PromptInput,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A text area that grows from one line to five, then scrolls, with one send '
                    + 'action and slots for an attach control, staged attachments and extra actions.',
            },
        },
    },
    argTypes: {
        isDisabled: { control: 'boolean' },
        isLoading: { control: 'boolean' },
        placeholder: { control: 'text' },
        label: { control: 'text' },
    },
};

const wrap = { maxWidth: 'var(--width-3000)' };

/* ----------------------------------------------------------------- default */

export const Default = () => (
    <div style={wrap}>
        <PromptInput label="Message to AI chat" placeholder="Ask anything" onSubmit={fn()} />
    </div>
);

Default.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Message to AI chat' });
    await expect(field).toBeVisible();
    const send = canvas.getByRole('button', { name: 'Send' });
    await expect(send, 'empty field cannot send').toBeDisabled();
};

/* --------------------------------------------------------------- enter-sends */

export const EnterSends = () => {
    const onSubmit = fn();
    return (
        <div style={wrap}>
            <PromptInput label="Message to AI chat" onSubmit={onSubmit} />
        </div>
    );
};

/** Enter sends the typed text and, uncontrolled, clears the field. */
EnterSends.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Message to AI chat' });
    await userEvent.type(field, 'Summarize this session');
    await userEvent.keyboard('{Enter}');
    await expect(field).toHaveValue('');
};

/* ----------------------------------------------------------- shift-enter */

export const ShiftEnterStartsALine = () => (
    <div style={wrap}>
        <PromptInput label="Message to AI chat" onSubmit={fn()} />
    </div>
);

/** Shift+Enter starts a new line instead of sending. */
ShiftEnterStartsALine.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Message to AI chat' });
    await userEvent.type(field, 'Line one');
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}');
    await userEvent.type(field, 'Line two');
    await expect(field).toHaveValue('Line one\nLine two');
};

/* -------------------------------------------------------------------- empty */

export const CannotSendWhenEmpty = () => (
    <div style={wrap}>
        <PromptInput label="Message to AI chat" onSubmit={fn()} />
    </div>
);

CannotSendWhenEmpty.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const send = canvas.getByRole('button', { name: 'Send' });
    await expect(send).toBeDisabled();
    const field = canvas.getByRole('textbox', { name: 'Message to AI chat' });
    await userEvent.type(field, '   ');
    await expect(send, 'whitespace-only is still empty').toBeDisabled();
};

/* ------------------------------------------------------------------ loading */

export const Loading = () => (
    <div style={wrap}>
        <PromptInput
            label="Message to AI chat"
            defaultValue="Drafting a reply…"
            isLoading
            onStop={fn()}
            onSubmit={fn()}
        />
    </div>
);

/** While loading, the send button becomes Stop and the field is ringed. */
Loading.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stop = canvas.getByRole('button', { name: 'Stop generating' });
    await expect(stop).toBeEnabled();
    await expect(canvas.queryByRole('button', { name: 'Send' })).toBeNull();
    await expect(canvasElement.querySelector('.plus-generative-border__ring')).not.toBeNull();
    await userEvent.click(stop);
};

/* -------------------------------------------------------------------- slots */

export const WithSlots = () => (
    <div style={wrap}>
        <PromptInput
            label="Message to AI chat"
            placeholder="Ask anything"
            startSlot={<i className={iconClass('paperclip')} aria-hidden="true" title="Attach a file" />}
            attachments={<span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>session-notes.pdf</span>}
            actions={<i className={iconClass('microphone')} aria-hidden="true" title="Dictate" />}
            onSubmit={fn()}
        />
    </div>
);

WithSlots.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('session-notes.pdf')).toBeVisible();
    await expect(canvasElement.querySelector('.fa-paperclip')).not.toBeNull();
    await expect(canvasElement.querySelector('.fa-microphone')).not.toBeNull();
};

/* -------------------------------------------------------------------- composition */

export const ComposingDoesNotSend = () => (
    <div style={wrap}>
        <PromptInput label="Message to AI chat" onSubmit={fn()} />
    </div>
);

/** An input method's own Enter, mid-composition, does not submit. */
ComposingDoesNotSend.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Message to AI chat' });
    await userEvent.type(field, '日本語');
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true }));
    await expect(field).toHaveValue('日本語');
};

/* ------------------------------------------------------------------- states */

/** `state="focus"` draws the focus ring still, for documentation. */
export const Focused = () => (
    <div style={wrap}>
        <PromptInput label="Message to AI chat" placeholder="Ask anything" state="focus" onSubmit={fn()} />
    </div>
);

export const Disabled = () => (
    <div style={wrap}>
        <PromptInput label="Message to AI chat" placeholder="Ask anything" isDisabled onSubmit={fn()} />
    </div>
);

Disabled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('textbox', { name: 'Message to AI chat' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Send' })).toBeDisabled();
};

/* --------------------------------------------------------------- playground */

export const Interactive = (args) => {
    const [value, setValue] = useState('');
    return (
        <div style={wrap}>
            <PromptInput
                {...args}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onSubmit={(text) => { setValue(''); args.onSubmit?.(text); }}
            />
        </div>
    );
};
Interactive.args = { label: 'Message to AI chat', placeholder: 'Ask anything', isDisabled: false, isLoading: false };
