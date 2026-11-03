import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IconButton from './IconButton';

describe('IconButton', () => {
    it('uses the label as its accessible name and tooltip', () => {
        render(<IconButton icon="trash" label="Delete session" />);
        const button = screen.getByRole('button', { name: 'Delete session' });
        expect(button).toHaveAttribute('title', 'Delete session');
        expect(button).toHaveClass('plus-btn--icon-only');
    });

    it('draws a Font Awesome glyph', () => {
        const { container } = render(<IconButton icon="trash" label="Delete" />);
        expect(container.querySelector('i')).toHaveClass('fa-solid', 'fa-trash');
    });

    it('is square by default and round for shape circle', () => {
        const { rerender } = render(<IconButton icon="bars" label="Menu" />);
        expect(screen.getByRole('button')).not.toHaveClass('plus-btn--circle');
        rerender(<IconButton icon="bars" label="Menu" shape="circle" />);
        expect(screen.getByRole('button')).toHaveClass('plus-btn--circle');
    });

    it('takes spacing and appearance', () => {
        render(<IconButton icon="plus" label="Add" appearance="primary" spacing="compact" />);
        expect(screen.getByRole('button')).toHaveClass('plus-btn--primary', 'plus-btn--compact');
    });

    it('fires onClick', () => {
        const onClick = vi.fn();
        render(<IconButton icon="plus" label="Add" onClick={onClick} />);
        fireEvent.click(screen.getByRole('button', { name: 'Add' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
