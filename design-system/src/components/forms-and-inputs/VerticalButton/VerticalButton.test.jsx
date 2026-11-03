import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VerticalButton from './VerticalButton';

describe('VerticalButton', () => {
    it('stacks a glyph over its label', () => {
        const { container } = render(<VerticalButton icon="user-gear" label="Admin" />);
        const button = screen.getByRole('button', { name: 'Admin' });
        expect(button).toHaveClass('plus-btn--vertical', 'plus-btn--default');
        expect(container.querySelector('i')).toHaveClass('fa-solid', 'fa-user-gear');
    });

    it('takes an appearance and the three states', () => {
        const { rerender } = render(<VerticalButton icon="user" label="Tutor" appearance="primary" isSelected />);
        expect(screen.getByRole('button')).toHaveClass('plus-btn--primary');
        expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
        rerender(<VerticalButton icon="user" label="Tutor" isDisabled />);
        expect(screen.getByRole('button')).toBeDisabled();
        rerender(<VerticalButton icon="user" label="Tutor" isLoading />);
        expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('fires onClick', () => {
        const onClick = vi.fn();
        render(<VerticalButton icon="user" label="Tutor" onClick={onClick} />);
        fireEvent.click(screen.getByRole('button', { name: 'Tutor' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
