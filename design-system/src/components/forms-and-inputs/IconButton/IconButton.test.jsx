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

    it('wraps in a Tooltip when given tooltip content', () => {
        render(<IconButton icon="trash" label="Delete session" tooltip="Remove this session" />);
        const button = screen.getByRole('button', { name: 'Delete session' });
        expect(button).not.toHaveAttribute('title');
    });

    it('drops the tooltip and title while disabled', () => {
        const { rerender } = render(<IconButton icon="trash" label="Delete session" isDisabled />);
        expect(screen.getByRole('button', { name: 'Delete session' })).not.toHaveAttribute('title');
        rerender(<IconButton icon="trash" label="Delete session" tooltip="Remove this session" isDisabled />);
        const button = screen.getByRole('button', { name: 'Delete session' });
        expect(button).toBeDisabled();
        expect(button).not.toHaveAttribute('aria-describedby');
    });

    it('suppresses the tooltip and title with isTooltipDisabled', () => {
        render(<IconButton icon="trash" label="Delete session" isTooltipDisabled />);
        const button = screen.getByRole('button', { name: 'Delete session' });
        expect(button).not.toHaveAttribute('title');
    });

    it('adds the applied count to the accessible name and drops the square', () => {
        const { container } = render(<IconButton icon="filter" label="Filters" trailingMetric={2} isSelected />);
        const button = screen.getByRole('button', { name: 'Filters, 2 applied' });
        expect(button).toHaveAttribute('title', 'Filters');
        expect(button).toHaveAttribute('aria-pressed', 'true');
        expect(button).toHaveClass('plus-icon-btn--metric');
        expect(button).not.toHaveClass('plus-btn--icon-only');
        const metric = container.querySelector('.plus-icon-btn__metric');
        expect(metric).toHaveAttribute('aria-hidden', 'true');
        expect(metric).toHaveTextContent('2');
    });

    it('shows a count of 0 and hides the count when trailingMetric is left out', () => {
        const { rerender } = render(<IconButton icon="filter" label="Filters" trailingMetric={0} />);
        expect(screen.getByRole('button', { name: 'Filters, 0 applied' })).toHaveTextContent('0');
        rerender(<IconButton icon="filter" label="Filters" />);
        const button = screen.getByRole('button', { name: 'Filters' });
        expect(button).toHaveClass('plus-btn--icon-only');
        expect(button.querySelector('.plus-icon-btn__metric')).toBeNull();
    });

    it('swaps the drawn count for a new one when the count changes', () => {
        const { container, rerender } = render(<IconButton icon="filter" label="Filters" trailingMetric={1} />);
        const before = container.querySelector('.plus-icon-btn__metric-value');
        rerender(<IconButton icon="filter" label="Filters" trailingMetric={2} />);
        const after = container.querySelector('.plus-icon-btn__metric-value');
        expect(after).not.toBe(before);
        expect(after).toHaveTextContent('2');
    });
});
