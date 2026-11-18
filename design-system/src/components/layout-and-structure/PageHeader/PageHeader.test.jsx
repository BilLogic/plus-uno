import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeadingContextProvider } from '@/components/text-and-data-display/Heading';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
    it('renders the title as an h1 Heading at size lg by default', () => {
        render(<PageHeader title="Dashboard" />);
        const heading = screen.getByRole('heading', { level: 1, name: 'Dashboard' });
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveAttribute('data-size', 'lg');
    });

    it('renders an explicit titleAs heading level at size lg', () => {
        render(<PageHeader title="Details" titleAs="h2" />);
        const heading = screen.getByRole('heading', { level: 2, name: 'Details' });
        expect(heading).toHaveAttribute('data-size', 'lg');
    });

    it('follows the ambient HeadingContextProvider when titleAs is omitted', () => {
        render(
            <HeadingContextProvider value={2}>
                <PageHeader title="Nested" />
            </HeadingContextProvider>,
        );
        expect(screen.getByRole('heading', { level: 2, name: 'Nested' })).toHaveAttribute('data-size', 'lg');
    });

    it('renders breadcrumbs, actions and a bottom bar only when given', () => {
        const { container, rerender } = render(<PageHeader title="X" />);
        expect(container.querySelector('.plus-page-header-breadcrumbs')).toBeNull();
        expect(container.querySelector('.plus-page-header-actions')).toBeNull();
        expect(container.querySelector('.plus-page-header-bottom-bar')).toBeNull();

        rerender(
            <PageHeader
                title="X"
                breadcrumbs={<span>Home</span>}
                actions={<button type="button">Act</button>}
                bottomBar={<span>Bar</span>}
            />
        );
        expect(container.querySelector('.plus-page-header-breadcrumbs')).toHaveTextContent('Home');
        expect(container.querySelector('.plus-page-header-actions')).toHaveTextContent('Act');
        expect(container.querySelector('.plus-page-header-bottom-bar')).toHaveTextContent('Bar');
    });

    it('disableTitleStyles renders the title plain, with no heading role', () => {
        render(<PageHeader title="X" disableTitleStyles />);
        expect(screen.queryByRole('heading')).toBeNull();
        expect(screen.getByText('X')).toBeInTheDocument();
    });
});
