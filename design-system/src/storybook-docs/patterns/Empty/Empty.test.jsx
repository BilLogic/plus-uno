import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import {
    BareStringCase,
    CODE,
    HeaderOverNothingCase,
    ReplacedTableCase,
    WhatBelongsHereCase,
} from './EmptyCases.jsx';
import { EmptyTableBoxCase } from './emptyDemo.jsx';

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

    it('prints each example from its own source', () => {
        expect(Object.keys(CODE)).toEqual(['WhatBelongsHere', 'BareString', 'ReplacedTable', 'HeaderOverNothing']);
        expect(CODE.WhatBelongsHere).toContain('header="No students in this group yet"');
        expect(CODE.ReplacedTable).toContain('const rowsOf');
        expect(CODE.HeaderOverNothing).toContain('<StaticTable');
        for (const code of Object.values(CODE)) expect(code).not.toMatch(/Example\.|storybook-docs/);
    });

    it('links every TypeCard anchor to a ComponentExample heading id in Empty.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Empty.mdx'), 8);
    });

    it('renders the three EmptyTableBoxCase variants inside .plus-table-shell-empty', async () => {
        const user = userEvent.setup();
        const { container, rerender } = render(<EmptyTableBoxCase variant="nothingYet" />);
        expect(container.querySelector('.plus-table-shell-empty')).not.toBeNull();
        expect(screen.getAllByRole('button', { name: 'Add students' })).toHaveLength(2);

        rerender(<EmptyTableBoxCase variant="hiddenByFilter" />);
        expect(container.querySelector('.plus-table-shell-empty')).not.toBeNull();
        await user.click(screen.getByRole('button', { name: 'Reset filters' }));
        expect(screen.getByRole('table')).toBeInTheDocument();

        rerender(<EmptyTableBoxCase variant="nothingToCreate" />);
        expect(container.querySelector('.plus-table-shell-empty')).not.toBeNull();
        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });
});
