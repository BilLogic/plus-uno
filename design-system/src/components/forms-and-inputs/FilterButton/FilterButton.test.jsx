import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FilterButton from './FilterButton';

describe('FilterButton', () => {
    it('shows the name and a chevron by default', () => {
        const { container } = render(<FilterButton text="Status" />);
        expect(screen.getByRole('button', { name: 'Status' })).toBeInTheDocument();
        expect(container.querySelector('.fa-chevron-down')).not.toBeNull();
    });

    it('drops the chevron when hasChevronDown is false', () => {
        const { container } = render(<FilterButton text="Status" hasChevronDown={false} />);
        expect(container.querySelector('.fa-chevron-down')).toBeNull();
    });

    it('shows a count of 0 and hides it when omitted', () => {
        const { container, rerender } = render(<FilterButton text="Status" trailingMetric={0} />);
        expect(container.querySelector('.plus-filter-btn__metric')).toHaveTextContent('0');
        rerender(<FilterButton text="Status" />);
        expect(container.querySelector('.plus-filter-btn__metric')).toBeNull();
    });

    it('takes a formatted count and publishes selection', () => {
        render(<FilterButton text="Grade" trailingMetric="99+" isSelected />);
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('99+');
        expect(button).toHaveAttribute('aria-pressed', 'true');
    });
});
