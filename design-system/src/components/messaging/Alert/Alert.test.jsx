import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Alert from './Alert';

// Mock FontAwesome since we don't load the CSS in tests
vi.mock('@fortawesome/fontawesome-free', () => ({}));

describe('Alert Component', () => {
    it('renders the title and content', () => {
        render(
            <Alert title="Test Title">
                Test Content
            </Alert>
        );
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders with correct variant class', () => {
        const { container } = render(<Alert style="success">Success Alert</Alert>);
        // Bootstrap adds 'alert-success', our wrapper adds 'success' and 'plus-alert'
        // We look for our class specifically
        expect(container.querySelector('.plus-alert')).toHaveClass('success');
    });

    it('calls onDismiss when close button is clicked', () => {
        const handleDismiss = vi.fn();
        render(<Alert onDismiss={handleDismiss} dismissable={true}>Dismiss Me</Alert>);

        const closeButton = screen.getByRole('button', { name: /close alert/i });
        fireEvent.click(closeButton);

        expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not render close button when dismissable is false', () => {
        render(<Alert dismissable={false}>Cannot Dismiss</Alert>);
        expect(screen.queryByRole('button', { name: /close alert/i })).not.toBeInTheDocument();
    });
});
