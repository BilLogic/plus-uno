import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import {
    BareStringCase,
    HeaderOverNothingCase,
    ReplacedTableCase,
    WhatBelongsHereCase,
} from './EmptyCases.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('Empty live cases and TypeCard links', () => {
    it('WhatBelongsHereCase renders interactive EmptyState while BareStringCase renders a bare string', async () => {
        const user = userEvent.setup();
        const { container, unmount } = render(<WhatBelongsHereCase />);
        expect(container.querySelector('[inert]')).toBeNull();
        expect(screen.getByRole('heading', { name: 'No students in this group yet' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Add students' }));
        expect(screen.getByRole('table')).toBeInTheDocument();
        unmount();

        render(<BareStringCase />);
        expect(screen.getByText('No results')).toBeInTheDocument();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('ReplacedTableCase replaces the whole table while HeaderOverNothingCase leaves headers and footer over empty rows', async () => {
        const user = userEvent.setup();
        const { container, unmount } = render(<ReplacedTableCase />);
        expect(container.querySelector('[inert]')).toBeNull();
        expect(screen.queryByRole('table')).toBeNull();
        expect(screen.queryByRole('navigation')).toBeNull();
        expect(screen.getByRole('heading', { name: 'No students match these filters' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Reset filters' }));
        expect(screen.getByRole('table')).toBeInTheDocument();
        unmount();

        render(<HeaderOverNothingCase />);
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getAllByRole('columnheader')).toHaveLength(3);
        expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('links every TypeCard anchor to a ComponentExample heading id in Empty.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Empty.mdx'), 8);
    });
});
