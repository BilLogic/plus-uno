import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InlineEdit, { INLINE_EDIT_SPACINGS } from '.';
import InlineEditableTextfield from '@/components/forms-and-inputs/InlineEditableTextfield';

describe('InlineEdit spacing', () => {
    it('uses default and compact spacing values', () => {
        expect(INLINE_EDIT_SPACINGS).toEqual(['default', 'compact']);

        const { container, rerender } = render(
            <InlineEdit
                label="Display name"
                defaultValue="Ada"
                readView={() => 'Ada'}
                editView={({ id, value, onChange }) => (
                    <input id={id} value={value} onChange={onChange} />
                )}
            />,
        );
        expect(container.querySelector('.plus-inline-edit')).not.toHaveClass('plus-inline-edit--compact');

        rerender(
            <InlineEdit
                label="Display name"
                defaultValue="Ada"
                spacing="compact"
                readView={() => 'Ada'}
                editView={({ id, value, onChange }) => (
                    <input id={id} value={value} onChange={onChange} />
                )}
            />,
        );
        expect(container.querySelector('.plus-inline-edit')).toHaveClass('plus-inline-edit--compact');
    });

    it('forwards spacing="compact" from InlineEditableTextfield to InlineEdit and TextField', () => {
        const { container } = render(
            <InlineEditableTextfield label="Display name" defaultValue="Ada" spacing="compact" />,
        );
        expect(container.querySelector('.plus-inline-edit')).toHaveClass('plus-inline-edit--compact');
        fireEvent.click(screen.getByRole('button', { name: 'Display name Ada' }));
        expect(container.querySelector('.plus-field')).toHaveClass('plus-field--compact');
    });
});

// The editor's keys and blur are hand-written: Base UI has no inline-edit
// part (ADR-037). These hold them.
describe('InlineEdit keyboard', () => {
    const setup = (props = {}) => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        render(
            <InlineEdit
                label="Display name"
                defaultValue="Ada"
                readView={() => 'Ada'}
                editView={({ id, value, onChange }) => (
                    <input id={id} value={value} onChange={onChange} />
                )}
                onConfirm={onConfirm}
                onCancel={onCancel}
                {...props}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Display name Ada' }));
        return { onConfirm, onCancel, input: screen.getByRole('textbox') };
    };

    it('opens with the caret in the editor', () => {
        const { input } = setup();
        expect(input).toHaveFocus();
    });

    it('confirms on Enter and returns focus to the read view', async () => {
        const { onConfirm, input } = setup();
        fireEvent.change(input, { target: { value: 'Grace' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('Grace'));
        await waitFor(() => expect(screen.getByRole('button', { name: /Display name/ })).toHaveFocus());
    });

    it('cancels on Escape and returns focus to the read view', async () => {
        const { onConfirm, onCancel, input } = setup();
        fireEvent.change(input, { target: { value: 'Grace' } });
        fireEvent.keyDown(input, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalled();
        expect(onConfirm).not.toHaveBeenCalled();
        await waitFor(() => expect(screen.getByRole('button', { name: /Display name/ })).toHaveFocus());
    });

    it('confirms when focus leaves the editor, unless keepEditViewOpenOnBlur', async () => {
        const { onConfirm, input } = setup();
        fireEvent.blur(input, { relatedTarget: document.body });
        await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('Ada'));
    });

    it('stays open on blur with keepEditViewOpenOnBlur', async () => {
        const { onConfirm, input } = setup({ keepEditViewOpenOnBlur: true });
        fireEvent.blur(input, { relatedTarget: document.body });
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(onConfirm).not.toHaveBeenCalled();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
});
