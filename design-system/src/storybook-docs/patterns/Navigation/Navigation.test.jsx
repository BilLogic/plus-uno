import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import {
    BreadcrumbCase, CODE, OneTabSystemCase, OpenItemsDoCase, OpenItemsDontCase, TwoTabSystemsCase,
} from './NavigationCases.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('Navigation live cases and links', () => {
    it('BreadcrumbCase renders Maya Rodriguez sessions only on record pages and area breadcrumbs without inert', () => {
        const { container, unmount } = render(<BreadcrumbCase record />);
        expect(container.querySelector('[inert], [aria-hidden="true"] [role="navigation"]')).toBeNull();
        const recordNav = screen.getByRole('navigation', { name: 'Record page breadcrumb' });
        expect(recordNav).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Students' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Maya Rodriguez' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'Algebra' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'Fractions' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'Linear equations' })).toBeInTheDocument();
        expect(screen.queryByRole('cell', { name: 'Geometry' })).toBeNull();
        expect(screen.queryByRole('cell', { name: 'Mr. Patel' })).toBeNull();
        unmount();

        render(<BreadcrumbCase record={false} />);
        const areaNav = screen.getByRole('navigation', { name: 'Area page breadcrumb' });
        expect(areaNav).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 4, name: 'Students' })).toBeInTheDocument();
    });

    it('prints the breadcrumb examples from their own source', () => {
        expect(Object.keys(CODE)).toEqual([
            'BreadcrumbOnRecordPage', 'BreadcrumbOnAreaPage', 'OpenItemsByTimeAndWho', 'OpenItemsCarryEverything', 'OneTabSystem', 'TwoTabSystems',
        ]);
        expect(CODE.BreadcrumbOnRecordPage).toContain("import { Breadcrumb, DynamicTable, PageHeader } from '@/components';");
        expect(CODE.BreadcrumbOnAreaPage).toContain('const Table');
        for (const code of Object.values(CODE)) expect(code).not.toMatch(/Example\.|storybook-docs/);
    });

    it('OpenItemsPicture and OpenItemsDont render interactive, non-inert Sidebar open items', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <div>
                <OpenItemsDoCase />
                <OpenItemsDontCase />
            </div>,
        );
        expect(container.querySelector('[inert]')).toBeNull();
        const navs = screen.getAllByRole('navigation');
        expect(navs.map((nav) => nav.getAttribute('aria-label'))).toEqual(['Open items — do', "Open items — don't"]);

        const item = screen.getByRole('button', { name: '4:00 PM · Ms. Ortiz' });
        await user.click(item);
        expect(item).toHaveAttribute('aria-current', 'page');
    });

    it('OneTabSystemCase has one tab system under the page tabs; TwoTabSystemsCase adds pill views', () => {
        const one = render(<OneTabSystemCase />);
        expect(screen.getAllByRole('tab')).toHaveLength(2);
        expect(screen.getByRole('button', { name: /Status/ })).toBeInTheDocument();
        one.unmount();
        render(<TwoTabSystemsCase />);
        expect(screen.getAllByRole('tab')).toHaveLength(4);
        expect(CODE.OneTabSystem).toContain('<PopupSelect');
    });

    it('links every TypeCard anchor to a unique ComponentExample heading id in Navigation.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Navigation.mdx'), 4);
    });
});
