import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
    it('renders the title as a Heading', () => {
        render(<PageHeader title="Dashboard" />);
        expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
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
