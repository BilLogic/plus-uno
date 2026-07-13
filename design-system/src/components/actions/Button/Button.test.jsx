import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button Component', () => {
    it('renders with text content', () => {
        render(<Button>Click Me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders different styles/variants', () => {
        const { container } = render(<Button style="primary" fill="outline">Primary Outline</Button>);
        const btn = container.querySelector('button');
        expect(btn).toHaveClass('plus-btn--primary');
        expect(btn).toHaveClass('plus-btn--outline');
    });

    it('handles onClick events', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click Me</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables button when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows loading state', () => {
        const { container } = render(<Button loading>Loading</Button>);
        const btn = container.querySelector('button');
        expect(btn).toHaveClass('plus-btn--loading');
        expect(btn).toBeDisabled();
    });
});
