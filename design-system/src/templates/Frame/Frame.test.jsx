import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComponentExample, exampleSlug } from '@/storybook-docs/ds-docs-layout.jsx';
import { TypeCard } from '@/storybook-docs/lib/template-page.jsx';
import { BarInOrder, BarScrambled, BareColumn, BareWithSidebar, CODE, MultiStepInnerSidebar, MultiStepStepsInPage } from './FrameCases.jsx';
import Frame from './Frame.jsx';
import { usePanelControl } from './PanelControl.js';
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
    const appearance = ['primary', 'subtle', 'link', 'danger-link', 'default'].find((a) => button.classList.contains(`plus-btn--${a}`));
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

const withWindowWidth = (width, fn) => {
    const previousWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
    try {
        return fn();
    } finally {
        Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: previousWidth });
    }
};

describe('Frame panelKind', () => {
    it('defaults panelKind to details and floats as an overlay at 1440 with the Sidebar docked and full splitter range', () => {
        withWindowWidth(1440, () => {
            render(
                <Frame
                    panelLabel="Session details"
                    panelOpen
                    panelStorageKey={null}
                    sidebar={<div>Nav</div>}
                    panel={<div>Details</div>}
                >
                    <div>Page content</div>
                </Frame>,
            );
            const panel = document.querySelector('.plus-frame__panel');
            expect(panel).toHaveClass('plus-frame__panel--overlay');
            expect(panel).not.toHaveClass('plus-frame__panel--docked');
            expect(document.querySelector('.plus-frame__blanket')).toBeNull();
            expect(document.querySelector('.plus-frame__sidebar')).toHaveClass('plus-frame__sidebar--docked');
            const splitter = screen.getByRole('separator', { name: /Resize/i });
            expect(splitter).toHaveAttribute('aria-valuemin', String(FRAME_LAYOUT.panelMin));
            expect(splitter).toHaveAttribute('aria-valuemax', String(FRAME_LAYOUT.panelMax));
        });
    });

    it('docks AI chat at 1440 when panelKind="ai" is passed', () => {
        withWindowWidth(1440, () => {
            render(
                <Frame
                    panelKind="ai"
                    panelLabel="AI chat"
                    panelOpen
                    panelStorageKey={null}
                    sidebar={<div>Nav</div>}
                    panel={<div>Chat</div>}
                >
                    <div>Page content</div>
                </Frame>,
            );
            const aiPanel = document.querySelector('.plus-frame__panel');
            expect(aiPanel).toHaveClass('plus-frame__panel--docked');
            expect(document.querySelector('.plus-frame__sidebar')).toHaveClass('plus-frame__sidebar--docked');
        });
    });

    it('leaves a Sidebar link and a table button focusable and not inert when Details is open at 1440', () => {
        withWindowWidth(1440, () => {
            render(
                <Frame
                    panelLabel="Session details"
                    panelOpen
                    panelStorageKey={null}
                    sidebar={<nav aria-label="Primary"><a href="#sessions">Sessions</a></nav>}
                    panel={<button type="button">Close</button>}
                >
                    <table>
                        <tbody>
                            <tr>
                                <td><button type="button">Review</button></td>
                            </tr>
                        </tbody>
                    </table>
                </Frame>,
            );
            const panel = screen.getByRole('complementary', { name: 'Session details' });
            expect(panel).not.toHaveAttribute('aria-modal');
            expect(document.querySelector('.plus-frame__sidebar')).not.toHaveAttribute('inert');
            expect(document.querySelector('.plus-frame__surface')).not.toHaveAttribute('inert');

            const sidebarLink = screen.getByRole('link', { name: 'Sessions' });
            const tableButton = screen.getByRole('button', { name: 'Review' });
            expect(sidebarLink.closest('[inert]')).toBeNull();
            expect(tableButton.closest('[inert]')).toBeNull();

            sidebarLink.focus();
            expect(sidebarLink).toHaveFocus();
            tableButton.focus();
            expect(tableButton).toHaveFocus();
        });
    });

    it('moves focus into Details when opened at 1440, swaps on another row trigger, and closes on Escape or outside press', async () => {
        const RowTriggers = ({ onPick }) => {
            const panel = usePanelControl();
            return (
                <div>
                    <button type="button" aria-controls={panel?.open ? panel.panelId : undefined} onClick={() => onPick('Ava')}>Row 1</button>
                    <button type="button" aria-controls={panel?.open ? panel.panelId : undefined} onClick={() => onPick('Marcus')}>Row 2</button>
                    <p>Outside page area</p>
                </div>
            );
        };
        const Demo = () => {
            const [picked, setPicked] = useState(null);
            return (
                <Frame
                    panelLabel="Session details"
                    panelOpen={Boolean(picked)}
                    onPanelOpenChange={(next) => { if (!next) setPicked(null); }}
                    panelStorageKey={null}
                    sidebar={<nav aria-label="Primary"><a href="#sessions">Sessions</a></nav>}
                    panel={(
                        <div>
                            <h2>{picked}</h2>
                            <button type="button" onClick={() => setPicked(null)}>Close</button>
                        </div>
                    )}
                >
                    <RowTriggers onPick={setPicked} />
                </Frame>
            );
        };
        await withWindowWidth(1440, async () => {
            render(<Demo />);
            const row1 = screen.getByRole('button', { name: 'Row 1' });
            const row2 = screen.getByRole('button', { name: 'Row 2' });
            expect(row1).not.toHaveAttribute('aria-controls');
            expect(row2).not.toHaveAttribute('aria-controls');
            row1.focus();
            fireEvent.click(row1);

            const panel = await screen.findByRole('complementary', { name: 'Session details' });
            await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true));
            expect(row1).toHaveAttribute('aria-controls', panel.id);
            expect(row2).toHaveAttribute('aria-controls', panel.id);

            // Pressing another row trigger swaps the content in the same Panel without closing it.
            fireEvent.pointerDown(row2);
            fireEvent.click(row2);
            expect(screen.getByRole('complementary', { name: 'Session details' })).toBe(panel);
            expect(within(panel).getByRole('heading', { name: 'Marcus' })).toBeInTheDocument();

            // Escape closes the Panel and returns focus to the opener.
            within(panel).getByRole('button', { name: 'Close' }).focus();
            fireEvent.keyDown(document.activeElement, { key: 'Escape' });
            await waitFor(() => expect(screen.queryByRole('complementary', { name: 'Session details' })).toBeNull());
            expect(row1).not.toHaveAttribute('aria-controls');
            await waitFor(() => expect(row1).toHaveFocus());

            // Opening again and pressing on the page outside the Panel closes it.
            row2.focus();
            fireEvent.click(row2);
            await screen.findByRole('complementary', { name: 'Session details' });
            const outside = screen.getByText('Outside page area');
            fireEvent.pointerDown(outside);
            fireEvent.click(outside);
            await waitFor(() => expect(screen.queryByRole('complementary', { name: 'Session details' })).toBeNull());
        });
    });

    it('keeps a full-width Details Panel modal under 768', () => {
        withWindowWidth(600, () => {
            render(
                <Frame
                    panelLabel="Session details"
                    panelOpen
                    panelStorageKey={null}
                    sidebar={<div>Nav</div>}
                    panel={<button type="button">Close</button>}
                >
                    <div>Page content</div>
                </Frame>,
            );
            const panel = screen.getByRole('dialog', { name: 'Session details' });
            expect(panel).toHaveAttribute('aria-modal', 'true');
            expect(document.querySelector('.plus-frame__surface')).toHaveAttribute('inert');
        });
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
