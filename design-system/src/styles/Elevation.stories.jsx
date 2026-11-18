import React, { useEffect, useRef } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button, HeadingContextProvider, Modal, PanelBody, PanelContainer, PanelHeader, Popup, Select, Tooltip } from '@/components';
import { Blanket, PatternCard, PatternSection, PatternTable } from '@/patterns';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';
import { Do, Dont, DoDont, C } from '@/storybook-docs/foundation-blocks.jsx';
import { Illustration } from '@/storybook-docs/illustrations/Illustration.jsx';
import { Flag as FlagIllustration, Layer, Rect, SkeletonBar } from '@/storybook-docs/illustrations/primitives.jsx';
import { PAINT } from '@/storybook-docs/illustrations/paint.js';
import { usePageContrast } from '@/storybook-docs/lib/use-page-contrast.js';
import {
    BehaviorGuide,
    ByTemplateGrid,
    ClipDemo,
    ContrastDemo,
    CrossSection,
    ExplodedStack,
    LayerStack,
    LevelTiles as LevelTilesBlock,
    LiftDemo,
    OverviewStack,
    PageSurfacesStack,
    ScrollShadowDemo,
    ShadowComposer,
    ShadowRampFigure,
    ShadowSlotTable,
    ShadowTokensEquation,
    SurfaceLadder,
} from '@/storybook-docs/elevation-demos.jsx';
import { parseShadow } from '@/storybook-docs/lib/shadow-anatomy';

/**
 * Live blocks for Foundations/Visual/Elevation. Each interactive block has a play
 * test; the values every block shows are read from the page's tokens.
 */
export default {
    title: 'Foundations/Visual/Elevation/Demos',
    tags: ['!dev', '!autodocs'],
};

const layersOf = (el) => parseShadow(getComputedStyle(el).boxShadow).length;

/* ------------------------------------------------------------ overview */

/** One screen, taken apart into its layers: an exploded view on the docs' flat turn. */
export const Stack = {
    render: () => <ExplodedStack />,
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('[data-testid="exploded-stack"]');
        // Seven plates, bottom first, each drawn from the illustration kit with no words:
        // the names and the --layer-* values live in the labels beside it.
        const plates = [...root.querySelectorAll('[data-plate]')];
        await expect(plates.map((p) => p.dataset.plate)).toEqual(['frame', 'page', 'card', 'popup', 'blanket', 'modal', 'tooltip']);
        for (const plate of plates) await expect(plate.querySelector('svg text, text'), `${plate.dataset.plate} draws no words`).toBeNull();
        // Flat turn, no perspective: every plate wears the same skew, and none is 3D.
        await expect(root.querySelector('[style*="preserve-3d"], [style*="rotateX"]')).toBeNull();
        const turns = plates.map((p) => p.querySelector('[data-turn]').getAttribute('transform').replace(/translate\([^)]*\)\s*/, ''));
        await expect(new Set(turns).size, 'one skew for every plate').toBe(1);
        await expect(turns[0]).toBe('skewY(-12) scale(0.8 1)');
        // Evenly spaced up the figure, once the rise has landed.
        await waitFor(() => {
            const origins = plates.map((p) => p.querySelector('[data-turn]').getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number));
            const steps = origins.slice(1).map(([x, y], i) => [x - origins[i][0], y - origins[i][1]]);
            for (const [dx, dy] of steps) {
                expect(dx).toBeCloseTo(steps[0][0], 3);
                expect(dy).toBeCloseTo(steps[0][1], 3);
            }
            expect(steps[0][1]).toBeLessThan(0);
        });
        // Each plate above the Frame joins its subject to the plate below with dashed accent leaders.
        for (const plate of plates.slice(1)) {
            await expect(root.querySelectorAll(`[data-leader="${plate.dataset.plate}"]`).length, `${plate.dataset.plate} leaders`).toBeGreaterThan(0);
        }
        await expect(root.querySelectorAll('[data-leader="frame"]')).toHaveLength(0);
        // A leader joins a point to the same spot on the plate below, so it runs exactly one step back down.
        await waitFor(() => {
            const [a0, a1] = [0, 1].map((i) => plates[i].querySelector('[data-turn]').getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number));
            for (const line of root.querySelectorAll('[data-leader]')) {
                const n = (k) => Number(line.getAttribute(k));
                expect(n('x1') - n('x2')).toBeCloseTo(a1[0] - a0[0], 3);
                expect(n('y1') - n('y2')).toBeCloseTo(a1[1] - a0[1], 3);
            }
        });
        // A layer with a shadow draws it with its real token; the Tooltip is a label and has none.
        const shadowOf = (id) => root.querySelector(`[data-plate="${id}"] foreignObject div`)?.style.boxShadow ?? '';
        await expect(shadowOf('card')).toBe('var(--ds-shadow-raised)');
        await expect(shadowOf('popup')).toBe('var(--ds-shadow-overlay)');
        await expect(shadowOf('modal')).toBe('var(--ds-shadow-blocking)');
        await expect(plates[6].querySelector('[style*="box-shadow"]')).toBeNull();
        // Labels read top first, in the DOM as on screen.
        await expect([...root.querySelectorAll('[data-legend]')].map((li) => li.dataset.legend)).toEqual(['tooltip', 'modal', 'blanket', 'popup', 'card', 'page', 'frame']);

        const legend = within(root.querySelector('[data-testid="stack-legend"]'));
        await waitFor(() => expect(legend.getByText(/--layer-modal \d+/)).toBeInTheDocument());
        await expect(legend.getByText('Blanket')).toBeInTheDocument();
        await waitFor(() => expect(legend.getByText(/--layer-tooltip \d+/)).toBeInTheDocument());
        await expect(legend.getAllByRole('listitem')).toHaveLength(7);
        // Each label names its shadow; the Tooltip has none.
        await expect(legend.getByText('--ds-shadow-blocking', { selector: '[data-legend="modal"] span' })).toBeInTheDocument();
        await expect(legend.getByText('blanket fill', { selector: '[data-legend="blanket"] span' })).toBeInTheDocument();
        await expect(legend.getByText('no shadow', { selector: '[data-legend="tooltip"] span' })).toBeInTheDocument();
        // Card is raised with no layer: --layer-card belongs to sticky headers and columns.
        await expect(root.querySelector('[data-legend="card"]')).toHaveTextContent(/no layer\s*--ds-shadow-raised/);
        await expect(legend.queryByText(/--layer-card/)).toBeNull();

        // One pair is active at a time, the top one by default; a label and its plate turn accent together.
        const active = () => root.querySelector('[data-active="true"][data-legend]')?.dataset.legend;
        const activePlate = () => root.querySelector('[data-plate][data-active="true"]')?.dataset.plate;
        await expect(active()).toBe('tooltip');
        await expect(activePlate()).toBe('tooltip');
        await userEvent.hover(root.querySelector('[data-legend="card"]'));
        await waitFor(() => expect(active()).toBe('card'));
        await expect(activePlate()).toBe('card');
        await userEvent.hover(root.querySelector('[data-plate="popup"]'));
        await waitFor(() => expect(activePlate()).toBe('popup'));
        await expect(active()).toBe('popup');
        // By keyboard: each label is a stop, and focus activates its pair.
        root.querySelector('[data-legend="modal"] button').focus();
        await waitFor(() => expect(active()).toBe('modal'));
        await expect(activePlate()).toBe('modal');
        await expect(root.querySelector('[data-legend="modal"] button')).toHaveAttribute('aria-current', 'true');
    },
};

/** Narrow: the figure scales down and the labels move under the plates as a list. */
export const StackNarrow = {
    render: () => (
        <div style={{ inlineSize: 360 }}>
            <ExplodedStack />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('[data-testid="exploded-stack"]');
        await waitFor(() => expect(root).toHaveAttribute('data-layout', 'list'));
        const figure = root.querySelector('svg').getBoundingClientRect();
        const legend = root.querySelector('[data-testid="stack-legend"]').getBoundingClientRect();
        await expect(legend.top).toBeGreaterThanOrEqual(figure.bottom - 1);
        await expect(root.querySelectorAll('[data-tick]')).toHaveLength(0);
    },
};

/** Every level, surface and shadow together. */
export const LevelTiles = {
    render: () => <LevelTilesBlock />,
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelectorAll('[data-level]')).toHaveLength(6);
    },
};

/* ------------------------------------------------------------ behavior */

/** The decision path lands on one row of the behavior table. */
export const Behavior = {
    render: () => <BehaviorGuide />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Over the page' }));
        await userEvent.click(canvas.getByRole('button', { name: 'No' }));
        await userEvent.click(canvas.getByRole('button', { name: 'Yes, dimmed' }));
        await expect(canvasElement.querySelector('[data-behavior="blocks"]')).toHaveAttribute('aria-current', 'true');
        await userEvent.click(canvas.getByRole('button', { name: 'In the page' }));
        await expect(canvasElement.querySelector('[aria-current="true"]')).toBeNull();
        await userEvent.click(canvas.getByRole('button', { name: 'Stays put while content scrolls' }));
        await expect(canvasElement.querySelector('[data-behavior="stays"]')).toHaveAttribute('aria-current', 'true');
    },
};

/* ------------------------------------------------------------- anatomy */

/** Switch the slots of a shadow on and off on a real surface. */
export const Composer = {
    render: () => <ShadowComposer />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const surface = canvasElement.querySelector('[data-testid="composer-surface"]');
        await waitFor(() => expect(layersOf(surface)).toBe(3));
        await userEvent.click(canvas.getByRole('switch', { name: 'Ambient' }));
        await waitFor(() => expect(layersOf(surface)).toBe(2));
        await expect(surface).toHaveAttribute('data-layers', '2');
        await userEvent.click(canvas.getByRole('switch', { name: 'Edge' }));
        await userEvent.click(canvas.getByRole('switch', { name: 'Key' }));
        await waitFor(() => expect(getComputedStyle(surface).boxShadow).toBe('none'));
        await userEvent.click(canvas.getByRole('button', { name: 'Raised' }));
        await expect(within(canvasElement.querySelector('[data-slot="key"]')).getByText(/blur/)).toBeInTheDocument();
    },
};

/** The ground's darkness below the edge, per level, from the live tokens. */
export const CrossSectionChart = {
    name: 'Cross-section',
    render: () => <CrossSection />,
    play: async ({ canvasElement }) => {
        await waitFor(() => expect(canvasElement.querySelectorAll('[data-series] polyline')).toHaveLength(3));
        const title = canvasElement.querySelector('title').textContent;
        await expect(title).toMatch(/Blocking reaches \d+ px/);
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Dark' }));
        await expect(canvasElement.querySelector('[data-color-mode="dark"]')).not.toBeNull();
    },
};

/** Every slot of every shadow, light and dark. */
export const SlotTable = {
    render: () => <ShadowSlotTable />,
    play: async ({ canvasElement }) => {
        await waitFor(() => expect(canvasElement.querySelectorAll('tbody tr')).toHaveLength(9));
        const ambient = canvasElement.querySelector('[data-row="blocking-ambient"]');
        await waitFor(() => expect(ambient.textContent).toMatch(/\d+ \d+ · \d+ · \d+ · [\d.]+%/));
        // A value never breaks mid-value: a narrow table scrolls in its own container.
        await expect(getComputedStyle(ambient.querySelectorAll('td')[1]).whiteSpace).toBe('nowrap');
        await expect(canvasElement.querySelector('[data-docs-stage]')).not.toBeNull();
    },
};

/* ----------------------------------------------------- surface and dark */

/** The surfaces lowest to highest; in dark each step up is lighter. */
export const Ladder = {
    render: () => <SurfaceLadder />,
    play: async ({ canvasElement }) => {
        const dark = canvasElement.querySelector('[data-ladder="dark"]');
        const steps = () => [...dark.querySelectorAll('[data-lightness]')].map((n) => Number(n.dataset.lightness));
        await waitFor(() => expect(steps().every((v) => v > 0)).toBe(true));
        const l = steps();
        for (let i = 1; i < l.length; i += 1) await expect(l[i], 'higher is lighter in dark').toBeGreaterThan(l[i - 1]);
    },
};

/* --------------------------------------------------------------- layers */

/** The z stack, bottom to top. */
export const Layers = {
    render: () => <LayerStack />,
    play: async ({ canvasElement }) => {
        // A plain table, highest layer first: token, z-index, what sits there.
        await expect(canvasElement.querySelector('table')).not.toBeNull();
        const values = [...canvasElement.querySelectorAll('tbody tr td:nth-child(2)')].map((n) => Number(n.textContent));
        await waitFor(() => expect(values.length).toBe(9));
        for (let i = 1; i < values.length; i += 1) await expect(values[i]).toBeLessThan(values[i - 1]);
        await expect(canvasElement.querySelector('[data-layer="--layer-dialog"]')).not.toBeNull();
    },
};

/* ----------------------------------------------------- in the system */

/** A Card at rest, a clickable Card, and a Card being dragged. */
export const CardLevels = {
    render: () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-sm), 1fr))', gap: 'var(--grid-gutter)', padding: 'var(--card-pad-compact)', borderRadius: 'var(--card-radius)', background: 'var(--ds-surface)' }}>
            <PatternCard title="At rest" description="Raised." />
            <PatternCard title="Clickable" description="Lifts to overlay on hover." onClick={() => {}} />
            <PatternCard title="Dragged" description="Overlay while it moves." dragging />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const [rest, , dragged] = canvasElement.querySelectorAll('.plus-pattern-card');
        await expect(getComputedStyle(dragged).boxShadow).not.toBe(getComputedStyle(rest).boxShadow);
    },
};

const options = ['Lincoln Middle', 'Roosevelt K-8', 'North High', 'South High'].map((label) => ({ value: label.toLowerCase(), label }));

/** A Popup held open beside its trigger. */
export const OpenPopup = {
    render: () => (
        <div style={{ minHeight: 'calc(var(--image-xl) * 2)', display: 'flex', alignItems: 'flex-start', padding: 'var(--card-pad-compact)' }}>
            <Popup trigger={<Button text="Details" />} title="Session 12" placement="right-start" triggerType="manual" show initialFocus={false}>
                Ran 45 minutes over.
            </Popup>
        </div>
    ),
    play: async () => {
        await waitFor(() => expect(document.querySelector('.plus-popup')).not.toBeNull());
        // At rest: opening it moves no focus, so it draws no focus ring.
        const popup = document.querySelector('.plus-popup');
        await expect(popup.contains(document.activeElement)).toBe(false);
        await expect(popup.matches(':focus-visible')).toBe(false);
    },
};

/** Opens a closed Frame edge by resting a pointer on it, as a person would. */
const peek = (root, selector) => {
    root?.querySelector(selector)?.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
};

const ACCOUNT = { id: 'elevation', name: 'Ana Ruiz', role: 'Tutor' };

/** A Frame at a fixed height, with the real Sidebar and Session cards on its Page, in one or two columns. */
const SessionsFrame = ({ edge, columns = 1, ...frameProps }) => {
    const ref = useRef(null);
    useEffect(() => { peek(ref.current, edge); }, [edge]);
    return (
        <div ref={ref}>
            <InAppFrame
                height="calc(var(--image-xl) * 5)"
                account={ACCOUNT}
                panelStorageKey={null}
                {...frameProps}
            >
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 'var(--grid-gutter)' }}>
                    <PatternCard title="Session 12" description="Thursday, 4:30 PM · Lincoln Middle" />
                    <PatternCard title="Session 13" description="Monday, 4:30 PM · Roosevelt K-8" />
                    {columns > 1 && <PatternCard title="Session 14" description="Tuesday, 5:00 PM · Reading" />}
                    {columns > 1 && <PatternCard title="Session 15" description="Friday, 3:30 PM · Writing" />}
                </div>
            </InAppFrame>
        </div>
    );
};

const expectOverlay = async (canvasElement, selector) => {
    await waitFor(() => expect(canvasElement.querySelector(selector)).not.toBeNull());
    const box = canvasElement.querySelector(selector);
    await waitFor(() => expect(getComputedStyle(box).boxShadow).not.toBe('none'));
    await expect(canvasElement.querySelector('.plus-frame__blanket'), 'no Blanket under it').toBeNull();
};

/** The real Sidebar peeked from the left edge: it floats over the page with no Blanket. */
export const FloatingSidebar = {
    render: () => <SessionsFrame edge=".plus-frame__edge" sidebarDocked={false} columns={2} />,
    play: async ({ canvasElement }) => {
        await expectOverlay(canvasElement, '.plus-frame__sidebar--raised');
        // The real Sidebar, with its rows: not a bare list.
        const sidebar = canvasElement.querySelector('.plus-frame__sidebar--raised');
        await expect(within(sidebar).getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
        await expect(within(sidebar).getByText('Home')).toBeInTheDocument();
    },
};

/** The Modal on its Blanket. */
export const ModalOnBlanket = {
    render: () => (
        <Blanket inline screenWidth={768} screenHeight={420}>
            <Modal
                show
                renderAs="inline"
                width="6-col"
                title="Move session"
                body="Move Thursday’s session with Ana Ruiz to 4:30 PM?"
                primaryButton={{ text: 'Move session', onClick: () => {} }}
                secondaryButton={{ text: 'Cancel', onClick: () => {} }}
                onClose={() => {}}
            />
        </Blanket>
    ),
    play: async ({ canvasElement }) => {
        const modal = canvasElement.querySelector('.plus-modal');
        await expect(modal).not.toBeNull();
        await expect(getComputedStyle(modal).boxShadow, 'the Modal ships on the blocking shadow').not.toBe('none');
        await expect(within(canvasElement).getByRole('button', { name: 'Move session' })).toBeInTheDocument();
    },
};

/** A Tooltip held open on its trigger. */
export const OpenTooltip = {
    render: () => (
        <div style={{ padding: 'var(--card-pad-spacious)', display: 'flex', justifyContent: 'center' }}>
            <Tooltip text="Reschedule this session" show>
                <Button text="Reschedule" />
            </Tooltip>
        </div>
    ),
    play: async () => {
        await waitFor(() => expect(document.querySelector('.plus-tooltip')).not.toBeNull());
    },
};

/** A Select open on the page: its list floats on the overlay pair. */
export const OpenSelect = {
    render: () => (
        <div style={{ minHeight: 'calc(var(--image-xl) * 3)' }}>
            <Select label="Site" options={options} defaultOpen />
        </div>
    ),
    play: async () => {
        await waitFor(() => expect(document.querySelector('[role="listbox"]')).not.toBeNull());
    },
};

/** The real Panel peeked from the right edge: it floats over the page with no Blanket. */
export const FloatingPanel = {
    render: () => (
        <SessionsFrame
            edge=".plus-frame__panel-edge"
            panelLabel="Session notes"
            panelPeek
            panel={(
                <HeadingContextProvider value={2}>
                    <PanelContainer>
                        <PanelHeader title="Session notes" />
                        <PanelBody>Thursday with Ana Ruiz: factoring went well; review the quadratic formula next time.</PanelBody>
                    </PanelContainer>
                </HeadingContextProvider>
            )}
        />
    ),
    play: async ({ canvasElement }) => {
        await expectOverlay(canvasElement, '.plus-frame__panel--peek');
        await expect(within(canvasElement).getByText('Session notes', { selector: 'h1, h2, h3, h4, [class*="title"]' })).toBeInTheDocument();
    },
};

/** A sticky table header, scrolled: the overflow shadow shows where content runs under it. */
export const StickyHeaderScrolled = {
    name: 'Sticky header, scrolled',
    render: () => {
        const Demo = () => {
            const ref = useRef(null);
            useEffect(() => {
                const scroller = ref.current?.querySelector('.plus-pattern-table-scroll');
                if (scroller) scroller.scrollTop = scroller.scrollHeight;
            }, []);
            return (
                <div ref={ref}>
                    <PatternSection title="Tutors">
                        <PatternTable stickyHeader maxHeight="var(--card-max-height-sm)">
                            <thead><tr><th>Tutor</th><th>Sessions</th></tr></thead>
                            <tbody>
                                {['Ana Ruiz', 'Ben Cho', 'Cara Diaz', 'Dev Shah', 'Eli Park', 'Fay Wu', 'Gus Lee', 'Hana Ito', 'Ivy Moss', 'Jon Bell'].map((n, i) => (
                                    <tr key={n}><td>{n}</td><td>{12 - i}</td></tr>
                                ))}
                            </tbody>
                        </PatternTable>
                    </PatternSection>
                </div>
            );
        };
        return <Demo />;
    },
};

/* --------------------------------------------------------------- motion */

/** A clickable Card lifts on a spring: shadow and fill together. */
export const Lift = {
    render: () => <LiftDemo />,
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('[data-testid="lift-demo"]');
        const card = within(canvasElement).getByRole('button', { name: /Session with Ana/ });
        const rest = getComputedStyle(card).boxShadow;
        await userEvent.click(card);
        await expect(root).toHaveAttribute('data-lifted', 'true');
        await expect(card).toHaveAttribute('aria-pressed', 'true');
        await waitFor(() => expect(getComputedStyle(card).boxShadow).not.toBe(rest));
    },
};

/** A Popup's clip edge sits past its shadow's reach. */
export const Clip = {
    render: () => <ClipDemo />,
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('[data-testid="clip-demo"]');
        await waitFor(() => expect(Number(root.dataset.reach)).toBeGreaterThan(0));
        await expect(root.querySelector('[data-clip-line]')).not.toBeNull();
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Close' }));
        await expect(within(canvasElement).getByRole('button', { name: 'Open' })).toBeInTheDocument();
    },
};

/** The header shadow tracks the scroll position one to one. */
export const ScrollShadow = {
    render: () => <ScrollShadowDemo />,
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('[data-testid="scroll-demo"]');
        const scroller = root.querySelector('[data-scroller]');
        await expect(root).toHaveAttribute('data-progress', '0');
        scroller.scrollTop = 4;
        scroller.dispatchEvent(new Event('scroll'));
        await waitFor(() => expect(Number(root.dataset.progress)).toBeGreaterThan(0));
        await expect(Number(root.dataset.progress)).toBeLessThan(100);
        scroller.scrollTop = scroller.scrollHeight;
        scroller.dispatchEvent(new Event('scroll'));
        await waitFor(() => expect(root).toHaveAttribute('data-progress', '100'));
    },
};

/* -------------------------------------------------------- accessibility */

/** Increased contrast turns the ring into a 3:1 line. */
export const Contrast = {
    render: () => <ContrastDemo />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const ground = canvasElement.querySelector('[data-testid="contrast-demo"] [data-contrast-mode]');
        const card = ground.querySelector('.plus-pattern-card, [class*="card"]');
        const ringAlpha = () => parseShadow(getComputedStyle(card).boxShadow)[0]?.color.a ?? 0;
        await expect(ground).toHaveAttribute('data-contrast-mode', 'no-preference');
        const before = ringAlpha();
        await userEvent.click(canvas.getByRole('switch', { name: 'Increased contrast' }));
        await expect(ground).toHaveAttribute('data-contrast-mode', 'more');
        await waitFor(() => expect(ringAlpha()).toBeGreaterThan(before));
    },
};

/* ------------------------------------------------------------ do, don't */

const ground = { padding: 'var(--card-pad-compact)', borderRadius: 'var(--card-radius)', background: 'var(--ds-surface)' };
const menu = (style) => (
    <div className="plus-popup" style={{ position: 'relative', width: 'auto', ...style }}>
        <div className="plus-popup-title">Session 12</div>
        <div className="plus-popup-body">Ran 45 minutes over.</div>
    </div>
);

/** Lift a surface with its shadow, never with a darker gray. */
export const LiftWithShadow = () => (
    <DoDont>
        <Do caption={<>The card keeps the page color and lifts on <C>--ds-shadow-raised</C>.</>}>
            <div style={ground}><PatternCard title="Upcoming sessions" description="3 this week" /></div>
        </Do>
        <Dont caption="A gray fill reads as a hole in the page, and dark loses the step.">
            <div style={ground}>
                <PatternCard title="Upcoming sessions" description="3 this week" style={{ background: 'var(--ds-surface-container)', boxShadow: 'none' }} />
            </div>
        </Dont>
    </DoDont>
);

/** The edge slot is the border: a lifted surface draws no border of its own. */
export const NoBorder = () => (
    <DoDont>
        <Do caption="The edge slot is the Popup's border.">
            <div style={ground}>{menu()}</div>
        </Do>
        <Dont caption="A border on top doubles the edge and outlines the Popup.">
            <div style={ground}>{menu({ border: 'var(--border-width-default) solid var(--ds-border-bold)' })}</div>
        </Dont>
    </DoDont>
);

/** A surface and its shadow travel together. */
export const AlwaysPair = () => (
    <DoDont>
        <Do caption={<>The overlay pair: <C>--ds-surface-overlay</C> with <C>--ds-shadow-overlay</C>.</>}>
            <div style={{ ...ground, background: 'var(--ds-surface-sunken)' }}>{menu()}</div>
        </Do>
        <Dont caption="The overlay surface with no shadow melts into the page.">
            <div style={{ ...ground, background: 'var(--ds-surface-sunken)' }}>{menu({ boxShadow: 'none' })}</div>
        </Dont>
    </DoDont>
);

/** Blocking belongs to the Modal on its Blanket. */
export const BlockingOnBlanket = () => (
    <DoDont>
        <Do caption="The Modal on the Blanket takes the blocking shadow.">
            <Blanket inline screenWidth={360} screenHeight={300}>
                <Modal show renderAs="inline" width={280} title="Move session" body="To 4:30 PM?" primaryButton={{ text: 'Move', onClick: () => {} }} onClose={() => {}} />
            </Blanket>
        </Do>
        <Dont caption="A Panel with the blocking shadow and no Blanket. If it needs full attention, make it a Modal.">
            <div style={ground}>
                <div style={{ boxShadow: 'var(--ds-shadow-blocking)', borderRadius: 'var(--card-radius)' }}>
                    <HeadingContextProvider value={2}>
                        <PanelContainer width="100%">
                            <PanelHeader title="Session notes" />
                            <PanelBody>Factoring went well.</PanelBody>
                        </PanelContainer>
                    </HeadingContextProvider>
                </div>
            </div>
        </Dont>
    </DoDont>
);

/** Sunken holds the work; it never floats. */
export const SunkenNeverFloats = () => (
    <DoDont>
        <Do caption="Sunken is the ground: the frame, or a subtle Section.">
            <div style={ground}>
                <PatternSection fill="subtle" title="This week" description="12 sessions" />
            </div>
        </Do>
        <Dont caption="A sunken fill with a shadow: the gray says recessed, the shadow says lifted.">
            <div style={ground}>{menu({ background: 'var(--ds-surface-sunken)' })}</div>
        </Dont>
    </DoDont>
);

/** A Tooltip is a label: dark fill, no shadow. */
export const TooltipFlat = () => (
    <DoDont>
        <Do caption="Dark fill, inverse text, no shadow.">
            <div style={{ ...ground, display: 'flex', justifyContent: 'center' }}>
                <span className="plus-tooltip" style={{ position: 'relative' }}>Reschedule this session</span>
            </div>
        </Do>
        <Dont caption="The overlay pair makes it look like a menu, so people try to click it.">
            <div style={{ ...ground, display: 'flex', justifyContent: 'center' }}>
                <span className="plus-tooltip" style={{ position: 'relative', background: 'var(--ds-surface-overlay)', color: 'var(--ds-text)', boxShadow: 'var(--ds-shadow-overlay)' }}>Reschedule this session</span>
            </div>
        </Dont>
    </DoDont>
);

/** Raise one focal point. */
export const OneFocalPoint = () => (
    <DoDont>
        <Do caption="One raised Card marks the next session.">
            <div style={ground}>
                <PatternSection title="Sessions">
                    <PatternCard title="Next session" description="Today, 4:30 PM" />
                    <PatternTable>
                        <tbody>
                            <tr><td>Past session</td><td>Monday</td></tr>
                            <tr><td>Past session</td><td>Friday</td></tr>
                        </tbody>
                    </PatternTable>
                </PatternSection>
            </div>
        </Do>
        <Dont caption="Every row raised: nothing stands out.">
            <div style={{ ...ground, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                <PatternCard title="Next session" description="Today, 4:30 PM" />
                <PatternCard title="Past session" description="Monday" />
                <PatternCard title="Past session" description="Friday" />
            </div>
        </Dont>
    </DoDont>
);

/* ------------------------------------------------------------ folder part A figures */

const assertPanelContainer = async (panel) => {
    await expect(panel).not.toBeNull();
    const cs = getComputedStyle(panel);
    await expect(parseFloat(cs.borderTopLeftRadius)).toBeGreaterThan(0);
    await expect(cs.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
};

/** Overview key figure: the five layers in stack order inside the shared panel container. */
export const OverviewLayers = {
    render: () => <OverviewStack />,
    play: async ({ canvasElement }) => {
        const panel = canvasElement.querySelector('[data-elevation-panel]');
        await assertPanelContainer(panel);
        const figure = panel.querySelector('[data-testid="overview-stack"]');
        await expect(figure).not.toBeNull();
        const plates = [...figure.querySelectorAll('[data-plate]')];
        await expect(plates.map((p) => p.dataset.plate)).toEqual([
            'frame',
            'page',
            'navigation',
            'non-blocking-overlay',
            'blocking-overlay',
        ]);
        for (const plate of plates) {
            await expect(plate.querySelector('svg text, text'), `${plate.dataset.plate} draws no words`).toBeNull();
        }
        // Plates stay fixed in geometry (no rising from below) as opacity settles to 1.
        const initialTransforms = plates.map((p) => p.querySelector('[data-turn]').getAttribute('transform'));
        await waitFor(() => {
            for (const plate of plates) {
                expect(Number(plate.getAttribute('opacity'))).toBe(1);
            }
        });
        await expect(plates.map((p) => p.querySelector('[data-turn]').getAttribute('transform'))).toEqual(initialTransforms);

        // Legend controls are PLUS Buttons that show selection; pointer click on a plate and keyboard activation both select and focus the control.
        const buttons = [...figure.querySelectorAll('ol button.plus-btn')];
        await expect(buttons).toHaveLength(5);
        const pageButton = within(figure).getByRole('button', { name: 'Layer 1 · Page' });
        await userEvent.click(figure.querySelector('[data-plate="page"]'));
        await expect(figure.querySelector('[data-plate="page"]')).toHaveAttribute('data-active', 'true');
        await expect(pageButton).toHaveAttribute('aria-pressed', 'true');
        await expect(document.activeElement).toBe(pageButton);

        const navButton = within(figure).getByRole('button', { name: 'Layer 2 · Navigation' });
        navButton.focus();
        await userEvent.keyboard('{Enter}');
        await expect(figure.querySelector('[data-plate="navigation"]')).toHaveAttribute('data-active', 'true');
        await expect(navButton).toHaveAttribute('aria-pressed', 'true');
        await expect(document.activeElement).toBe(navButton);
    },
};

/** Layer system key figure: the three page surfaces inside the shared panel container. */
export const WithinThePage = {
    render: () => <PageSurfacesStack />,
    play: async ({ canvasElement }) => {
        const panel = canvasElement.querySelector('[data-elevation-panel]');
        await assertPanelContainer(panel);
        const figure = panel.querySelector('[data-testid="page-surfaces-stack"]');
        await expect(figure).not.toBeNull();
        const plates = [...figure.querySelectorAll('[data-plate]')];
        await expect(plates.map((p) => p.dataset.plate)).toEqual(['default', 'sunken', 'raised']);
        for (const plate of plates) {
            await expect(plate.querySelector('svg text, text'), `${plate.dataset.plate} draws no words`).toBeNull();
        }
        const sunkenButton = within(figure).getByRole('button', { name: 'Sunken' });
        await userEvent.click(figure.querySelector('[data-plate="sunken"]'));
        await expect(sunkenButton).toHaveAttribute('aria-pressed', 'true');
        await expect(document.activeElement).toBe(sunkenButton);
    },
};

/** Shadow ramp key figure: four shadows in light and dark inside the shared panel container. */
export const Ramp = {
    render: () => <ShadowRampFigure />,
    play: async ({ canvasElement }) => {
        const panel = canvasElement.querySelector('[data-elevation-panel]');
        await assertPanelContainer(panel);
        const figure = panel.querySelector('[data-testid="shadow-ramp"]');
        await expect(figure).not.toBeNull();
        const modes = [...figure.querySelectorAll('[data-color-mode]')];
        await expect(modes.map((m) => m.dataset.colorMode)).toEqual(['light', 'dark']);

        const rectsIntersect = (a, b) =>
            a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        const textBoxOf = (el) => {
            const range = document.createRange();
            range.selectNodeContents(el);
            return range.getBoundingClientRect();
        };

        const steps = ['raised', 'overflow', 'overlay', 'blocking'];
        for (const mode of modes) {
            const stepWraps = [...mode.querySelectorAll('[data-shadow-step]')];
            await expect(stepWraps.map((d) => d.dataset.shadowStep)).toEqual(steps);
            const discs = stepWraps.map((w) => w.querySelector('foreignObject div'));
            for (const disc of discs) {
                await expect(disc).not.toBeNull();
                await expect(getComputedStyle(disc).boxShadow).not.toBe('none');
            }
            const discRects = discs.map((d) => d.getBoundingClientRect());
            for (let i = 0; i < discRects.length; i += 1) {
                await expect(discRects[i].width, `${steps[i]} disc width`).toBeGreaterThanOrEqual(40);
                await expect(discRects[i].height, `${steps[i]} disc height`).toBeGreaterThanOrEqual(40);
                for (let j = i + 1; j < discRects.length; j += 1) {
                    await expect(
                        rectsIntersect(discRects[i], discRects[j]),
                        `${steps[i]} and ${steps[j]} discs must not intersect`,
                    ).toBe(false);
                }
            }

            const labels = steps.map((step) => within(mode).getByText(step));
            const labelRects = labels.map((el) => el.getBoundingClientRect());
            const textRects = labels.map(textBoxOf);
            for (let i = 0; i < labels.length; i += 1) {
                await expect(labelRects[i].top, `${steps[i]} label sits below its disc`).toBeGreaterThanOrEqual(discRects[i].bottom - 1);
                for (let j = i + 1; j < labels.length; j += 1) {
                    await expect(
                        rectsIntersect(labelRects[i], labelRects[j]),
                        `${steps[i]} and ${steps[j]} label boxes must not intersect`,
                    ).toBe(false);
                    await expect(
                        rectsIntersect(textRects[i], textRects[j]),
                        `${steps[i]} and ${steps[j]} label text must not intersect`,
                    ).toBe(false);
                }
            }
        }

        const [lightRect, darkRect] = modes.map((m) => m.getBoundingClientRect());
        await expect(lightRect.right, 'light and dark halves sit side by side').toBeLessThanOrEqual(darkRect.left + 1);
        await expect(Math.abs(lightRect.top - darkRect.top), 'light and dark halves align vertically').toBeLessThan(2);
    },
};

/** Within-the-page summary grouped by Section, Table, and Card inside the shared panel container. */
export const ByTemplate = {
    render: () => <ByTemplateGrid />,
    play: async ({ canvasElement }) => {
        const panel = canvasElement.querySelector('[data-elevation-panel]');
        await assertPanelContainer(panel);
        await expect(panel.getAttribute('data-testid')).toBe('by-template-grid');
        const svgs = [...panel.querySelectorAll('svg')];
        await expect(svgs.length).toBe(11);
        for (const svg of svgs) {
            await expect(svg.querySelector('text'), 'template tiles draw no words').toBeNull();
        }
    },
};

/** Edge + Key + Ambient = --ds-shadow-blocking inside the shared panel container. */
export const ShadowEquation = {
    render: () => <ShadowTokensEquation />,
    play: async ({ canvasElement }) => {
        const panel = canvasElement.querySelector('[data-elevation-panel]');
        await assertPanelContainer(panel);
        await expect(panel.getAttribute('data-testid')).toBe('shadow-equation');
        await expect(panel.querySelectorAll('[data-equation-part]').length).toBe(4);
    },
};

/** Shadow ramp Do/Don't 1: use the layer's token, never a raw shadow. */
export const UsingShadowTokens = () => (
    <DoDont>
        <Do caption="Use the layer’s token.">
            {menu()}
        </Do>
        <Dont caption="Don’t write a raw shadow.">
            {menu({ boxShadow: '0 6px 18px rgba(0, 0, 0, 0.22)' })}
        </Dont>
    </DoDont>
);

const FlagAdaptIllustration = ({ raw = false }) => {
    const contrast = usePageContrast();
    const modeProps = (mode) => ({
        'data-color-mode': mode,
        ...(contrast ? { 'data-contrast-mode': contrast } : {}),
    });
    return (
        <Illustration
            width={160}
            height={96}
            title={raw ? 'Flag in light and dark mode with a hand-made shadow' : 'Flag in light and dark mode using elevation tokens'}
        >
            {(['light', 'dark']).map((mode, idx) => {
                const y = idx === 0 ? 4 : 50;
                return (
                    <g key={mode} {...modeProps(mode)}>
                        <Rect x={4} y={y} w={152} h={42} fill={PAINT.pageSurface} stroke={PAINT.frameDivider} corner="card" />
                        {raw ? (
                            <>
                                <Layer x={20} y={y + 6} w={120} h={30} fill={PAINT.pageSurface} shadow="0 6px 18px rgba(0, 0, 0, 0.22)" corner="flag" />
                                <SkeletonBar x={40} y={y + 13} w={48} h={4} heading />
                                <SkeletonBar x={40} y={y + 22} w={78} />
                            </>
                        ) : (
                            <FlagIllustration x={20} y={y + 6} w={120} h={30} />
                        )}
                    </g>
                );
            })}
        </Illustration>
    );
};

/** Shadow ramp Do/Don't 2: tokens adapt in dark; a raw shadow vanishes. */
export const TokensAdaptInDark = () => (
    <DoDont>
        <Do caption="Tokens adapt: in dark the Flag steps lighter and keeps its ring.">
            <FlagAdaptIllustration />
        </Do>
        <Dont caption="A hand-made shadow vanishes in dark.">
            <FlagAdaptIllustration raw />
        </Dont>
    </DoDont>
);

/** Shadow ramp Do/Don't 3: keep the shadow token a component ships with. */
export const KeepComponentShadow = () => (
    <DoDont>
        <Do caption="A Popup keeps the overlay pair it ships with.">
            {menu()}
        </Do>
        <Dont caption="Reassigning a component’s shadow puts it on the wrong layer.">
            {menu({ boxShadow: 'var(--ds-shadow-raised)' })}
        </Dont>
    </DoDont>
);

