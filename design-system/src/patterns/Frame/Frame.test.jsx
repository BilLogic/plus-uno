import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComponentExample, exampleSlug } from '@/storybook-docs/ds-docs-layout.jsx';
import { TypeCard } from '@/storybook-docs/lib/template-page.jsx';
import { AiPanelDocked, AiPanelFloating, BarInOrder, BarScrambled, BareColumn, BareWithSidebar, FocusedNoSidebar, FocusedWithSidebar } from './FrameCases.jsx';
import { CODE } from './FrameCaseCode.js';

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

const frameMdx = readFileSync(join(__dirname, 'Frame.mdx'), 'utf8');

describe('Frame live cases', () => {
    it('BarInOrder renders Back and Next in FooterActions without Cancel', () => {
        render(<BarInOrder />);
        expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
    });

    it('BarScrambled renders the anti-pattern Cancel beside Back and Next', () => {
        render(<BarScrambled />);
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it.each([
        ['FocusedNoSidebar', FocusedNoSidebar, false],
        ['FocusedWithSidebar', FocusedWithSidebar, true],
        ['BareColumn', BareColumn, false],
        ['BareWithSidebar', BareWithSidebar, true],
    ])('%s renders a live Frame, with a Sidebar only when it is the don\'t', (_name, Example, withSidebar) => {
        const { container } = render(<Example />);
        expect(container.querySelector('.plus-frame')).not.toBeNull();
        expect(Boolean(container.querySelector('.plus-frame__sidebar'))).toBe(withSidebar);
    });

    it.each([['AiPanelDocked', AiPanelDocked], ['AiPanelFloating', AiPanelFloating]])('%s renders a live Frame with the AI chat panel open', (_name, Example) => {
        const { container } = render(<Example />);
        expect(container.querySelector('.plus-frame')).not.toBeNull();
        expect(screen.getAllByText('AI chat').length).toBeGreaterThan(0);
    });

    it('has Show code source for every live pair in Frame.mdx', () => {
        ['BarInOrder', 'BarScrambled', 'FocusedNoSidebar', 'FocusedWithSidebar', 'AiPanelDocked', 'AiPanelFloating', 'BareColumn', 'BareWithSidebar']
            .forEach((key) => expect(CODE[key].length).toBeGreaterThan(20));
    });

    it('links TypeCard anchors to unique ComponentExample and heading ids in Frame.mdx', () => {
        const typeCards = [...frameMdx.matchAll(/<TypeCard\s+[^>]*to="#([^"]+)"[^>]*title="([^"]+)"/g)]
            .map(([, to, title]) => ({ to, title }));
        const exampleTitles = [...frameMdx.matchAll(/<ComponentExample\s+[^>]*title="([^"]+)"/g)]
            .map(([, title]) => title);
        const examplesTab = frameMdx.split('<DocsTab tab="examples">')[1].split('</DocsTab>')[0];
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
