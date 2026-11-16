import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Radio from './Radio';

describe('Radio soft appearance', () => {
    it('matches a plain Radio in role, aria-checked, row activation, and form submission', async () => {
        const user = userEvent.setup();
        const onPlainChange = vi.fn();
        const onSoftChange = vi.fn();

        const { container } = render(
            <form>
                <Radio
                    name="plainGoal"
                    value="fluency"
                    label="Plain fluency"
                    description="Plain description"
                    appearance="plain"
                    onChange={onPlainChange}
                />
                <Radio
                    name="softGoal"
                    value="fluency"
                    label="Soft fluency"
                    description="Soft description"
                    appearance="soft"
                    onChange={onSoftChange}
                />
            </form>
        );

        const plain = screen.getByRole('radio', { name: 'Plain fluency' });
        const soft = screen.getByRole('radio', { name: 'Soft fluency' });

        expect(soft.getAttribute('role')).toBe(plain.getAttribute('role'));
        expect(soft.getAttribute('aria-checked')).toBe(plain.getAttribute('aria-checked'));

        await user.click(plain);
        await user.click(screen.getByText('Soft description'));

        expect(soft.getAttribute('aria-checked')).toBe('true');
        expect(soft.getAttribute('aria-checked')).toBe(plain.getAttribute('aria-checked'));
        expect(onSoftChange).toHaveBeenCalledWith({
            target: { name: 'softGoal', value: 'fluency', checked: true },
        });
        expect(onPlainChange).toHaveBeenCalledWith({
            target: { name: 'plainGoal', value: 'fluency', checked: true },
        });

        const formData = new FormData(container.querySelector('form'));
        expect(formData.get('softGoal')).toBe(formData.get('plainGoal'));
    });

    it('ignores row surface clicks when disabled or read-only', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <>
                <Radio
                    name="disabledGoal"
                    value="fluency"
                    label="Disabled fluency"
                    description="Disabled description"
                    appearance="soft"
                    isDisabled
                    onChange={onChange}
                />
                <Radio
                    name="readOnlyGoal"
                    value="fluency"
                    label="Read-only fluency"
                    description="Read-only description"
                    appearance="soft"
                    isReadOnly
                    onChange={onChange}
                />
            </>
        );

        await user.click(screen.getByText('Disabled description'));
        await user.click(screen.getByText('Read-only description'));

        expect(screen.getByRole('radio', { name: 'Disabled fluency' })).toHaveAttribute('aria-checked', 'false');
        expect(screen.getByRole('radio', { name: 'Read-only fluency' })).toHaveAttribute('aria-checked', 'false');
        expect(onChange).not.toHaveBeenCalled();
    });
});
