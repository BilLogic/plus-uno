import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PromptInput from '.';

const field = () => screen.getByRole('textbox', { name: 'Message to PLUS AI' });

describe('PromptInput', () => {
    it('names the field and starts with the send button disabled', () => {
        render(<PromptInput label="Message to PLUS AI" />);
        expect(field()).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    });

    it('submits the text on Enter and clears an uncontrolled field', async () => {
        const onSubmit = vi.fn();
        render(<PromptInput label="Message to PLUS AI" onSubmit={onSubmit} />);
        await userEvent.type(field(), 'Plan a session{Enter}');
        expect(onSubmit).toHaveBeenCalledExactlyOnceWith('Plan a session');
        expect(field()).toHaveValue('');
    });

    it('starts a new line on Shift+Enter and does not submit', async () => {
        const onSubmit = vi.fn();
        render(<PromptInput label="Message to PLUS AI" onSubmit={onSubmit} />);
        await userEvent.type(field(), 'one{Shift>}{Enter}{/Shift}two');
        expect(onSubmit).not.toHaveBeenCalled();
        expect(field()).toHaveValue('one\ntwo');
    });

    it('submits from the send button', async () => {
        const onSubmit = vi.fn();
        render(<PromptInput label="Message to PLUS AI" onSubmit={onSubmit} defaultValue="Hello" />);
        await userEvent.click(screen.getByRole('button', { name: 'Send' }));
        expect(onSubmit).toHaveBeenCalledExactlyOnceWith('Hello');
    });

    it('sends nothing while the field holds only spaces', async () => {
        const onSubmit = vi.fn();
        render(<PromptInput label="Message to PLUS AI" onSubmit={onSubmit} />);
        await userEvent.type(field(), '   {Enter}');
        expect(onSubmit).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    });

    it('does not submit while an input method is composing', () => {
        const onSubmit = vi.fn();
        render(<PromptInput label="Message to PLUS AI" onSubmit={onSubmit} defaultValue="にほん" />);
        fireEvent.keyDown(field(), { key: 'Enter', isComposing: true });
        fireEvent.keyDown(field(), { key: 'Enter', keyCode: 229 });
        expect(onSubmit).not.toHaveBeenCalled();
        fireEvent.keyDown(field(), { key: 'Enter' });
        expect(onSubmit).toHaveBeenCalledExactlyOnceWith('にほん');
    });

    it('leaves a controlled field for its owner to clear', async () => {
        const onSubmit = vi.fn();
        const Owner = () => {
            const [value, setValue] = useState('');
            return (
                <PromptInput
                    label="Message to PLUS AI"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onSubmit={(text) => { onSubmit(text); setValue(''); }}
                />
            );
        };
        render(<Owner />);
        await userEvent.type(field(), 'Hi{Enter}');
        expect(onSubmit).toHaveBeenCalledExactlyOnceWith('Hi');
        expect(field()).toHaveValue('');
    });

    it('becomes Stop while generating, rings the field, and ignores Enter', async () => {
        const onStop = vi.fn();
        const onSubmit = vi.fn();
        const { container } = render(
            <PromptInput label="Message to PLUS AI" isGenerating onStop={onStop} onSubmit={onSubmit} defaultValue="Next" />,
        );
        expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Stop generating' }));
        expect(onStop).toHaveBeenCalledOnce();
        await userEvent.type(field(), '{Enter}');
        expect(onSubmit).not.toHaveBeenCalled();
        expect(container.querySelector('.plus-generative-border__ring')).not.toBeNull();
        expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    });

    it('has no ring when it is not generating', () => {
        const { container } = render(<PromptInput label="Message to PLUS AI" />);
        expect(container.querySelector('.plus-generative-border__ring')).toBeNull();
    });

    it('disables the field and the action', async () => {
        const onSubmit = vi.fn();
        render(<PromptInput label="Message to PLUS AI" isDisabled defaultValue="Hello" onSubmit={onSubmit} />);
        expect(field()).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    });

    it('shows the start slot before the text', () => {
        render(<PromptInput label="Message to PLUS AI" startSlot={<button type="button">Attach</button>} />);
        const attach = screen.getByRole('button', { name: 'Attach' });
        expect(attach.compareDocumentPosition(field()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('calls onChange with the event', async () => {
        const onChange = vi.fn();
        render(<PromptInput label="Message to PLUS AI" onChange={onChange} />);
        await userEvent.type(field(), 'a');
        expect(onChange).toHaveBeenCalledOnce();
    });
});
