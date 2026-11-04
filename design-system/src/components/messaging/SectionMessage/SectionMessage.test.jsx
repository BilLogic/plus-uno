import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SectionMessage from './SectionMessage';

// Mock FontAwesome since we don't load the CSS in tests
vi.mock('@fortawesome/fontawesome-free', () => ({}));

describe('SectionMessage Component', () => {
    it('renders the title and content', () => {
        render(
            <SectionMessage title="Test Title">
                Test Content
            </SectionMessage>
        );
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders with correct variant class', () => {
        const { container } = render(<SectionMessage appearance="success">Success message</SectionMessage>);
        expect(container.querySelector('.plus-section-message')).toHaveClass('success');
    });

    it('calls onDismiss when close button is clicked', () => {
        const handleDismiss = vi.fn();
        render(<SectionMessage onDismiss={handleDismiss} dismissible={true}>Dismiss Me</SectionMessage>);

        const closeButton = screen.getByRole('button', { name: /dismiss message/i });
        fireEvent.click(closeButton);

        expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not render close button when dismissible is false', () => {
        render(<SectionMessage dismissible={false}>Cannot Dismiss</SectionMessage>);
        expect(screen.queryByRole('button', { name: /dismiss message/i })).not.toBeInTheDocument();
    });

    it('renders actions after the body', () => {
        render(
            <SectionMessage actions={[{ text: 'Reschedule', onClick: vi.fn() }]}>
                This term's schedule is provisional.
            </SectionMessage>
        );
        expect(screen.getByRole('button', { name: 'Reschedule' })).toBeInTheDocument();
    });
});
