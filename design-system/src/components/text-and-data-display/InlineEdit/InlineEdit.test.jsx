import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
