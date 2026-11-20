import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import {
    CODE,
    CountOnIconCase,
    FiltersAmongViewsCase,
    FiltersAtEndCase,
    OneTierCase,
    TagRowCase,
    TwoTiersCase,
} from './FilteringCases.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('Filtering live cases and links', () => {
    it('OneTierCase and TwoTiersCase render non-inert live Section header filter triggers', async () => {
        const user = userEvent.setup();
        const { container, unmount } = render(<OneTierCase />);
        expect(container.querySelector('[inert]')).toBeNull();
        expect(container.querySelector('.plus-section-row--filters')).not.toBeNull();
        expect(screen.getByRole('button', { name: 'Grade: All' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'School: All' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Subject: All' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^Filters/ })).toBeNull();

        await user.click(screen.getByRole('button', { name: 'Grade: All' }));
        await user.click(await screen.findByRole('option', { name: 'Grade 6' }));
        expect(screen.getByRole('button', { name: 'Grade: Grade 6' })).toHaveAttribute('aria-pressed', 'true');
        unmount();

        render(<TwoTiersCase />);
        expect(screen.getByRole('button', { name: /Grade/ })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Filters' }));
        expect(await screen.findByRole('checkbox', { name: 'Math' })).toBeInTheDocument();
    });

    it('FiltersAtEndCase and FiltersAmongViewsCase render live view tabs, Section header slots, and SearchField', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<FiltersAtEndCase />);
        const followUp = screen.getByRole('tab', { name: 'Needs follow-up' });
        await user.click(followUp);
        expect(followUp).toHaveAttribute('aria-selected', 'true');
        unmount();

        const { container } = render(<FiltersAmongViewsCase />);
        expect(container.querySelector('.plus-section-rows')).not.toBeNull();
        expect(screen.getByRole('tab', { name: 'All students' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('button', { name: 'Grade: All' }).closest('.plus-section-row__views')).not.toBeNull();

        const searchbox = await screen.findByRole('searchbox', { name: 'Search students' });
        await user.type(searchbox, 'Sofia');
        expect(screen.getByText('Sofia Ramirez')).toBeInTheDocument();
        expect(screen.queryByText('Ava Thompson')).toBeNull();
    });

    it('CountOnIconCase and TagRowCase render live count vs removable tag row with live FilterMenu', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<CountOnIconCase />);
        expect(screen.getByRole('button', { name: /^Filters\s*2/ })).toBeInTheDocument();
        expect(screen.queryByRole('list', { name: 'Applied filters' })).toBeNull();
        unmount();

        render(<TagRowCase />);
        const list = screen.getByRole('list', { name: 'Applied filters' });
        expect(within(list).getByText('Grade 7')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /Remove.*Grade 7/i }));
        expect(within(list).queryByText('Grade 7')).toBeNull();

        await user.click(screen.getByRole('button', { name: /^Filters/ }));
        expect(await screen.findByRole('checkbox', { name: 'Grade 7' })).toBeInTheDocument();
    });

    it('links every TypeCard anchor to a unique ComponentExample heading id in Filtering.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Filtering.mdx'), 5);
    });

    it('prints each pair\'s own source, as a consumer writes it', () => {
        expect(Object.keys(CODE)).toHaveLength(6);
        expect(CODE.OneTier).toContain("from '@/components';");
        expect(CODE.OneTier).toContain("import { Section } from '@/templates';");
        expect(CODE.TwoTiers).toContain('<FilterMenu');
        for (const code of Object.values(CODE)) expect(code).not.toMatch(/\b[A-Z]\w*Case\b|storybook-docs|filteringDemo/);
    });
});
