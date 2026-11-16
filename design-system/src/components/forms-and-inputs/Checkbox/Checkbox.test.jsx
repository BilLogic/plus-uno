import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkbox from './Checkbox';

describe('Checkbox soft appearance', () => {
    it('matches a plain Checkbox in role, aria-checked, keyboard Space toggle, row activation, and form submission', async () => {
        const user = userEvent.setup();
        const onPlainChange = vi.fn();
        const onSoftChange = vi.fn();

        const { container } = render(
            <form>
                <Checkbox
                    name="plainTopic"
                    value="fractions"
                    label="Plain fractions"
                    description="Plain description"
                    appearance="plain"
                    onChange={onPlainChange}
                />
                <Checkbox
                    name="softTopic"
                    value="fractions"
                    label="Soft fractions"
                    description="Soft description"
                    appearance="soft"
                    onChange={onSoftChange}
                />
            </form>
        );

        const plain = screen.getByRole('checkbox', { name: 'Plain fractions' });
        const soft = screen.getByRole('checkbox', { name: 'Soft fractions' });

        expect(soft.getAttribute('role')).toBe(plain.getAttribute('role'));
        expect(soft.getAttribute('aria-checked')).toBe(plain.getAttribute('aria-checked'));

        plain.focus();
        await user.keyboard(' ');
        soft.focus();
        await user.keyboard(' ');

        expect(soft.getAttribute('aria-checked')).toBe('true');
        expect(soft.getAttribute('aria-checked')).toBe(plain.getAttribute('aria-checked'));

        const formData = new FormData(container.querySelector('form'));
        expect(formData.get('softTopic')).toBe(formData.get('plainTopic'));

        await user.click(plain);
        await user.click(screen.getByText('Soft description'));

        expect(soft.getAttribute('aria-checked')).toBe('false');
        expect(soft.getAttribute('aria-checked')).toBe(plain.getAttribute('aria-checked'));
    });

    it('renders fa-minus instead of fa-check when indeterminate', () => {
        const { container, rerender } = render(
            <Checkbox
                name="allTopics"
                value="all"
                label="All topics"
                appearance="soft"
                isChecked={false}
                isIndeterminate
            />
        );

        const checkbox = screen.getByRole('checkbox', { name: 'All topics' });
        expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
        const icon = container.querySelector('i[aria-hidden="true"]');
        expect(icon).toHaveClass('fa-solid', 'fa-minus');
        expect(icon).not.toHaveClass('fa-check');

        rerender(
            <Checkbox
                name="allTopics"
                value="all"
                label="All topics"
                appearance="soft"
                isChecked
            />
        );
        expect(checkbox).toHaveAttribute('aria-checked', 'true');
        expect(container.querySelector('i[aria-hidden="true"]')).toHaveClass('fa-solid', 'fa-check');
    });

    it('ignores row surface clicks when disabled or read-only', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <>
                <Checkbox
                    name="disabledTopic"
                    value="fractions"
                    label="Disabled fractions"
                    description="Disabled description"
                    appearance="soft"
                    isDisabled
                    onChange={onChange}
                />
                <Checkbox
                    name="readOnlyTopic"
                    value="fractions"
                    label="Read-only fractions"
                    description="Read-only description"
                    appearance="soft"
                    isReadOnly
                    onChange={onChange}
                />
            </>
        );

        await user.click(screen.getByText('Disabled description'));
        await user.click(screen.getByText('Read-only description'));

        expect(screen.getByRole('checkbox', { name: 'Disabled fractions' })).toHaveAttribute('aria-checked', 'false');
        expect(screen.getByRole('checkbox', { name: 'Read-only fractions' })).toHaveAttribute('aria-checked', 'false');
        expect(onChange).not.toHaveBeenCalled();
    });
});
