import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComponentExample, exampleSlug } from '@/storybook-docs/ds-docs-layout.jsx';
import { TypeCard } from '@/storybook-docs/lib/template-page.jsx';
import { AddInViewBar, AddTwice, OneTabSystem, TwoTabSystems } from './PageCases.jsx';

vi.mock('@storybook/addon-docs/blocks', async () => {
    const React = await import('react');
    return {
        Canvas: ({ children, of }) => (
            <div data-testid="mock-canvas">
                {of?.render ? <of.render /> : children}
            </div>
        ),
        Story: ({ of }) => (of?.render ? <of.render /> : null),
        Meta: () => null,
        Title: () => null,
    };
});

const pageMdx = readFileSync(join(__dirname, 'Page.mdx'), 'utf8');

describe('Page live cases', () => {
    it('AddInViewBar puts Add student once in the view bar, while AddTwice duplicates it in PageHeader', () => {
        const r1 = render(<AddInViewBar />);
        expect(screen.getAllByRole('button', { name: 'Add student' })).toHaveLength(1);
        r1.unmount();

        const r2 = render(<AddTwice />);
        expect(screen.getAllByRole('button', { name: 'Add student' })).toHaveLength(2);
        r2.unmount();
    });

    it('OneTabSystem uses one tablist and switches Status via PopupSelect and page tabs', () => {
        render(<OneTabSystem />);
        expect(screen.getAllByRole('tablist')).toHaveLength(1);
        expect(screen.getByRole('button', { name: 'Status: Upcoming' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Status: Upcoming' }));
        fireEvent.click(screen.getByRole('option', { name: 'Past' }));
        expect(screen.getByRole('button', { name: 'Status: Past' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'Two-step equations' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('tab', { name: 'Overview' }));
        expect(screen.getByText('Lincoln Middle · Grade 8')).toBeInTheDocument();
    });

    it('TwoTabSystems shows the anti-pattern of two tablists on one page', () => {
        render(<TwoTabSystems />);
        expect(screen.getAllByRole('tablist')).toHaveLength(2);
    });

    it('links Page TypeCard anchors to unique ComponentExample and heading ids in Page.mdx', () => {
        const typeCards = [...pageMdx.matchAll(/<TypeCard\s+[^>]*to="#([^"]+)"[^>]*title="([^"]+)"/g)]
            .map(([, to, title]) => ({ to, title }));
        const exampleTitles = [...pageMdx.matchAll(/<ComponentExample\s+[^>]*title="([^"]+)"/g)]
            .map(([, title]) => title);
        const examplesTab = pageMdx.split('<DocsTab tab="examples">')[1].split('</DocsTab>')[0];
        const headingSlugs = [
            ...exampleTitles.map(exampleSlug),
            ...[...examplesTab.matchAll(new RegExp('^#{2,3}\\s+([^\\n<]+)', 'gm'))].map(([, h]) => exampleSlug(h)),
        ];

        expect(new Set(headingSlugs).size).toBe(headingSlugs.length);
        typeCards.forEach(({ to }) => expect(headingSlugs).toContain(to));

        const Stub = { render: () => <div /> };
        render(
            <div>
                {typeCards.map(({ to, title }) => (
                    <TypeCard key={title} of={Stub} to={`#${to}`} title={title}>{title}</TypeCard>
                ))}
                {exampleTitles.map((title) => (
                    <ComponentExample key={title} of={Stub} title={title} description={title} />
                ))}
            </div>,
        );

        for (const { to, title } of typeCards) {
            expect(screen.getByRole('link', { name: new RegExp(title) })).toHaveAttribute('href', `#${to}`);
        }
        for (const title of exampleTitles) {
            expect(within(document.body).getByRole('heading', { level: 3, name: title })).toHaveAttribute('id', exampleSlug(title));
        }
    });
});
