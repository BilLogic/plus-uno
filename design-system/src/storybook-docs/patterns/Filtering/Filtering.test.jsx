import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import {
    CountOnIconCase,
    FiltersAmongViewsCase,
    FiltersAtEndCase,
    OneTierCase,
    TagRowCase,
    TwoTiersCase,
} from './filteringDemo.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('Filtering live cases and links', () => {
    it('OneTierCase and TwoTiersCase render non-inert live view bar filter controls', async () => {
        const user = userEvent.setup();
        const { container, unmount } = render(<OneTierCase />);
        expect(container.querySelector('[inert]')).toBeNull();
        expect(screen.getByRole('button', { name: 'Grade' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'School' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Subject' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^Filters/ })).toBeNull();

        await user.click(screen.getByRole('button', { name: 'Grade' }));
        await user.click(await screen.findByRole('option', { name: 'Grade 7' }));
        expect(screen.getByRole('button', { name: /Grade/ })).toHaveTextContent('1');
        unmount();

        render(<TwoTiersCase />);
        expect(screen.getByRole('button', { name: /Grade/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
    });

    it('FiltersAtEndCase and FiltersAmongViewsCase render live view tabs and filters', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<FiltersAtEndCase />);
        const followUp = screen.getByRole('tab', { name: 'Needs follow-up' });
        await user.click(followUp);
        expect(followUp).toHaveAttribute('aria-selected', 'true');
        unmount();

        render(<FiltersAmongViewsCase />);
        expect(screen.getByRole('tab', { name: 'All students' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('button', { name: 'Grade' })).toBeInTheDocument();
    });

    it('CountOnIconCase and TagRowCase render live count vs removable tag row', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<CountOnIconCase />);
        expect(screen.getByRole('button', { name: 'Filters, 2 applied' })).toBeInTheDocument();
        expect(screen.queryByRole('list', { name: 'Applied filters' })).toBeNull();
        unmount();

        render(<TagRowCase />);
        const list = screen.getByRole('list', { name: 'Applied filters' });
        expect(within(list).getByText('Grade 7')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /Remove.*Grade 7/i }));
        expect(within(list).queryByText('Grade 7')).toBeNull();
    });

    it('links every TypeCard anchor to a unique ComponentExample heading id in Filtering.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Filtering.mdx'), 5);
    });
});
