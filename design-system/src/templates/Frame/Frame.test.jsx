import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComponentExample, exampleSlug } from '@/storybook-docs/ds-docs-layout.jsx';
import { TypeCard } from '@/storybook-docs/lib/template-page.jsx';
import { AiPanelDocked, AiPanelFloating, BarInOrder, BarScrambled, BareColumn, BareWithSidebar, CODE, MultiStepInnerSidebar, MultiStepStepsInPage } from './FrameCases.jsx';
import { FRAME_LAYOUT } from './frameLayout.js';
import { readFileSync as readSource } from 'node:fs';

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

/** Each `<Button text=... appearance=...>` of a Show code string, in source order. */
const snippetButtons = (code) => [...code.matchAll(/<(?:Link)?Button text="([^"]+)"(?: href="[^"]*")?(?: appearance="([^"]+)")?/g)]
    .map(([, text, appearance]) => `${text}:${appearance ?? 'default'}`);

/** The buttons a live case renders, in DOM order, as the same `text:appearance` strings. */
const renderedButtons = (container) => [...container.querySelectorAll('.plus-btn')].map((button) => {
    const appearance = ['primary', 'subtle', 'default'].find((a) => button.classList.contains(`plus-btn--${a}`));
    return `${button.textContent.trim()}:${appearance}`;
});

describe('Frame Show code', () => {
    it.each([['BarInOrder', BarInOrder], ['BarScrambled', BarScrambled]])('%s prints the buttons the live bar renders', (key, Example) => {
        const { container } = render(<Example />);
        expect(snippetButtons(CODE[key])).toEqual(renderedButtons(container));
    });

    it('states the dock breakpoints the layout constants give', () => {
        const panelAlone = 2 * FRAME_LAYOUT.pagePad + FRAME_LAYOUT.contentFloor + FRAME_LAYOUT.panelDefault;
        const both = panelAlone + FRAME_LAYOUT.sidebarWidth;
        expect([panelAlone, both, FRAME_LAYOUT.dockMin]).toEqual([1168, 1408, 1024]);
        const here = (file) => readSource(join(__dirname, file), 'utf8');
        for (const file of ['Frame.mdx', 'FrameCases.jsx', 'FrameExamples.jsx']) {
            expect(here(file), `${file} names the old 1200 dock`).not.toMatch(/(under|or more|from|at) 1200\b(?! with)/);
        }
        expect(frameMdx).toContain(String(both));
        expect(frameMdx).toContain(String(panelAlone));
        expect(frameMdx).not.toMatch(/docked wherever it shows/);
    });
});

describe('Frame Show code source', () => {
    it('prints each example from FrameExamples.jsx, with none of the docs staging', () => {
        const examples = readSource(join(__dirname, 'FrameExamples.jsx'), 'utf8');
        for (const [key, code] of Object.entries(CODE)) {
            expect(code, key).toContain(`const ${key} =`);
            expect(code, key).not.toMatch(/CaseSurface|FitStage|BrowserWindow|InAppFrame|InWindow/);
            expect(examples, key).toContain(code.split('\n\n').pop());
        }
    });
});

describe('Frame live cases', () => {
    it('BarInOrder renders Save and exit, Back and Next in FooterActions without Cancel', () => {
        render(<BarInOrder />);
        expect(screen.getByRole('link', { name: 'Save and exit' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
    });

    it('BarScrambled renders the anti-pattern Cancel beside Save and exit and Next', () => {
        render(<BarScrambled />);
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Save and exit' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it.each([
        ['MultiStepInnerSidebar', MultiStepInnerSidebar, true],
        ['MultiStepStepsInPage', MultiStepStepsInPage, true],
        ['BareColumn', BareColumn, false],
        ['BareWithSidebar', BareWithSidebar, true],
    ])('%s renders a live Frame, with its Sidebar', (_name, Example, withSidebar) => {
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
        const keys = [...frameMdx.matchAll(/(?:do|dont)Code=\{CODE\.(\w+)\}/g)].map(([, key]) => key);
        expect(keys.length).toBeGreaterThan(0);
        keys.forEach((key) => expect(CODE[key]?.length, key).toBeGreaterThan(20));
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
