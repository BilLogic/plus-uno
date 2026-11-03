import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Banner from './Banner';

describe('Banner', () => {
    it('renders as a status region with its message', () => {
        render(<Banner>Scheduled maintenance tonight.</Banner>);
        const banner = screen.getByRole('status');
        expect(banner).toHaveTextContent('Scheduled maintenance tonight.');
        expect(banner).toHaveClass('plus-banner--warning');
    });

    it('draws the appearance default icon', () => {
        const { container, rerender } = render(<Banner appearance="warning">Message</Banner>);
        expect(container.querySelector('.plus-banner-icon')).toHaveClass('fa-triangle-exclamation');
        rerender(<Banner appearance="danger">Message</Banner>);
        expect(container.querySelector('.plus-banner-icon')).toHaveClass('fa-circle-exclamation');
    });

    it('announcement draws no icon by default', () => {
        const { container } = render(<Banner appearance="announcement">General notice</Banner>);
        expect(container.querySelector('.plus-banner-icon')).toBeNull();
    });

    it('icon={false} removes the icon on any appearance', () => {
        const { container } = render(<Banner appearance="warning" icon={false}>Message</Banner>);
        expect(container.querySelector('.plus-banner-icon')).toBeNull();
    });

    it('a custom icon name replaces the default', () => {
        const { container } = render(<Banner appearance="warning" icon="bell">Message</Banner>);
        expect(container.querySelector('.plus-banner-icon')).toHaveClass('fa-bell');
    });
});
