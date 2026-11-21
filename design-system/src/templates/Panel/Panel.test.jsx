import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComponentExample, exampleSlug } from '@/storybook-docs/ds-docs-layout.jsx';
import { TypeCard } from '@/storybook-docs/lib/template-page.jsx';
import { BesideAiPanel, CODE, CoversAiPanel, FloatsNoBlanket, OneFloatingPanel, PanelOnBlanket, ReadingNoFooter, ReadingWithFooter, TwoFloatingPanels } from './PanelCases.jsx';

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

const panelMdx = readFileSync(join(__dirname, 'Panel.mdx'), 'utf8');

describe('Panel Show code', () => {
    it('prints each floating example as PLUS parts, with no docs helper or stage', () => {
        expect(Object.keys(CODE)).toHaveLength(7);
        Object.entries(CODE).forEach(([name, code]) => {
            expect(code, name).not.toMatch(/panelDemo|CaseSurface|FloatStage/);
            // The one Don't that is not a Panel is the same details opened in a Modal.
            expect(code, name).toContain(name === 'DetailsInModal' ? '<Modal' : '<PanelContainer');
        });
    });
});

describe('Panel live cases', () => {
    it('ReadingNoFooter renders header and body with no footer button', () => {
        render(<ReadingNoFooter />);
        expect(screen.getByRole('heading', { name: 'Ben Okafor · Thu 5:00 PM' })).toBeInTheDocument();
        expect(screen.getByText(/Math · 60 minutes/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
    });

    it('ReadingWithFooter shows the anti-pattern Done button in the footer while reading', () => {
        render(<ReadingWithFooter />);
        expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    it('FloatsNoBlanket and OneFloatingPanel show one Panel with no Blanket, while PanelOnBlanket adds one', () => {
        for (const Case of [FloatsNoBlanket, OneFloatingPanel]) {
            const { unmount } = render(<Case />);
            expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(1);
            expect(document.querySelector('.plus-modal-blanket')).toBeNull();
            unmount();
        }
        render(<PanelOnBlanket />);
        expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(1);
        expect(document.querySelector('.plus-modal-blanket')).not.toBeNull();
    });

    it('TwoFloatingPanels opens two Panels at once', () => {
        render(<TwoFloatingPanels />);
        expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(2);
    });

    it('BesideAiPanel and CoversAiPanel are live Panels: the floating Panel clears or covers the docked one', () => {
        for (const Case of [BesideAiPanel, CoversAiPanel]) {
            const { unmount } = render(<Case />);
            expect(screen.getByRole('heading', { name: 'Assistant' })).toBeInTheDocument();
            expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(2);
            expect(document.querySelector('svg[role="img"]')).toBeNull();
            unmount();
        }
    });

    it('links Panel TypeCard anchors to unique ComponentExample and heading ids in Panel.mdx', () => {
        const typeCards = [...panelMdx.matchAll(/<TypeCard\s+[^>]*to="#([^"]+)"[^>]*title="([^"]+)"/g)]
            .map(([, to, title]) => ({ to, title }));
        const exampleTitles = [...panelMdx.matchAll(/<ComponentExample\s+[^>]*title="([^"]+)"/g)]
            .map(([, title]) => title);
        const examplesTab = panelMdx.split('<DocsTab tab="examples">')[1].split('</DocsTab>')[0];
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
