import React, { useEffect, useRef } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button, DynamicTable, HeadingContextProvider, Popup, Select, StaticTable, Tooltip } from '@/components';
import { Modal, Card, Section, PanelBody, PanelContainer, PanelHeader } from '@/templates';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';
import { DocsOverlayBoundary } from '@/storybook-docs/lib/docs-overlay-boundary.jsx';
import { Do, Dont, DoDont, C } from '@/storybook-docs/foundation-blocks.jsx';
import { Illustration } from '@/storybook-docs/illustrations/Illustration.jsx';
import { Flag as FlagIllustration, Layer, Rect, SkeletonBar } from '@/storybook-docs/illustrations/primitives.jsx';
import { PAINT } from '@/storybook-docs/illustrations/paint.js';
import { usePageContrast } from '@/storybook-docs/lib/use-page-contrast.js';
import {
    AccessibilityCardEdges,
    AccessibilityForcedColors,
    ColorDarkMode,
    ColorKeepShadow,
    ColorMeaning,
    ColorSolidOnly,
    ColorSurfaceTable,
    ColorSwapNeverStack,
    ControlBoundaryDoDont,
    UsageBlockingUsesBlanket,
    UsageDarkLightensFloating,
    UsageFlatByDefault,
    UsageGroupWithoutShadow,
    UsageInMotion,
    UsageLiftMeansAction,
    UsageNoStrokeOnElevated,
    UsageOneBlockingOverlay,
    UsagePairSurfaceShadow,
    UsageRaiseOneThing,
} from '@/storybook-docs/elevation-usage-figures.jsx';
import {
    MaterialAnatomyFigure,
    MaterialAsIs,
    MaterialChooseTable,
    MaterialEdge,
    MaterialMatchSurface,
    MaterialNeutralOnly,
    MaterialNoBlur,
    MaterialOnBlanket,
    MaterialOnlyFloating,
    MaterialOnMedia,
    MaterialRampFigure,
    MaterialValuesTable,
} from '@/storybook-docs/elevation-material-figures.jsx';
import {
    ColoredComposeTable,
    ColoredMaterialEdge,
    ColoredMaterialLive,
    ColoredMaterialOverSomething,
    ColoredMaterialPairText,
    ColoredMaterialSmall,
    ColoredTokensTable,
    ColoredTreatmentsTable,
} from '@/storybook-docs/elevation-colored-material-figures.jsx';
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
        // Evenly spaced up the figure, once the fade in place has settled.
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
        await expect(root.querySelector('[data-legend="modal"] button')).toHaveAttribute('aria-pressed', 'true');
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

/** The surfaces lowest to highest; in dark only overlays step lighter past the page. */
export const Ladder = {
    render: () => <SurfaceLadder />,
    play: async ({ canvasElement }) => {
        const dark = canvasElement.querySelector('[data-ladder="dark"]');
        const steps = () => [...dark.querySelectorAll('[data-lightness]')].map((n) => Number(n.dataset.lightness));
        await waitFor(() => expect(steps().every((v) => v > 0)).toBe(true));
        const [sunken, page, raised, overlay] = steps();
        await expect(page, 'page is lighter than sunken in dark').toBeGreaterThan(sunken);
        await expect(raised, 'dark raised matches the page tone').toBe(page);
        await expect(overlay, 'overlay steps lighter in dark').toBeGreaterThan(raised);
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

/** The three card surfaces: Raised is the one focal card, placed first in reading order; Sunken is the default; Default is bordered. */
export const CardLevels = {
    render: () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-sm), 1fr))', gap: 'var(--grid-gutter)', padding: 'var(--card-pad)', borderRadius: 'var(--card-radius)', background: 'var(--ds-surface)' }}>
            <Card surface="raised" title="Raised" description="The one focal card, first in reading order." />
            <Card surface="sunken" title="Sunken" description="The default. Clickable, it lifts in place on hover." onClick={() => {}} />
            <Card surface="default" title="Default" description="Bordered and flat." />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const [raised, sunken, bordered] = canvasElement.querySelectorAll('.plus-template-card');
        await expect(getComputedStyle(raised).boxShadow).not.toBe(getComputedStyle(sunken).boxShadow);
        await expect(getComputedStyle(bordered).boxShadow).toBe(getComputedStyle(sunken).boxShadow);
    },
};

const options = ['Lincoln Middle', 'Roosevelt K-8', 'North High', 'South High'].map((label) => ({ value: label.toLowerCase(), label }));

/** A Popup held open beside its trigger. */
export const OpenPopup = {
    render: () => (
        <DocsOverlayBoundary containHeight>
            <div style={{ minHeight: 'calc(var(--image-xl) * 2)', display: 'flex', alignItems: 'flex-start', padding: 'var(--card-pad)' }}>
                <Popup trigger={<Button text="Details" />} title="Session 12" placement="right-start" triggerType="manual" show initialFocus={false}>
                    Ran 45 minutes over.
                </Popup>
            </div>
        </DocsOverlayBoundary>
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
                    <Card title="Session 12" description="Thursday, 4:30 PM · Lincoln Middle" />
                    <Card title="Session 13" description="Monday, 4:30 PM · Roosevelt K-8" />
                    {columns > 1 && <Card title="Session 14" description="Tuesday, 5:00 PM · Reading" />}
                    {columns > 1 && <Card title="Session 15" description="Friday, 3:30 PM · Writing" />}
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
        <Modal
            inline
            show
            screenWidth={768}
            screenHeight={420}
            width="6-col"
            title="Move session"
            body="Move Thursday’s session with Ana Ruiz to 4:30 PM?"
            primaryButton={{ text: 'Move session', onClick: () => {} }}
            secondaryButton={{ text: 'Cancel', onClick: () => {} }}
            onClose={() => {}}
        />
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
        <div style={{ padding: 'var(--card-pad)', display: 'flex', justifyContent: 'center' }}>
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
                const scroller = ref.current?.querySelector('.plus-table-shell-scroll');
                if (scroller) scroller.scrollTop = scroller.scrollHeight;
            }, []);
            return (
                <div ref={ref}>
                    <Section title="Tutors">
                        <DynamicTable
                            label="Tutors"
                            stickyHeader
                            maxHeight="var(--card-max-height-sm)"
                            head={{ cells: [{ key: 'tutor', content: 'Tutor' }, { key: 'sessions', content: 'Sessions', align: 'number' }] }}
                            rows={['Ana Ruiz', 'Ben Cho', 'Cara Diaz', 'Dev Shah', 'Eli Park', 'Fay Wu', 'Gus Lee', 'Hana Ito', 'Ivy Moss', 'Jon Bell'].map((n, i) => ({
                                key: n,
                                cells: [{ key: 'tutor', content: n }, { key: 'sessions', content: String(12 - i) }],
                            }))}
                        />
                    </Section>
                </div>
            );
        };
        return <Demo />;
    },
    play: async ({ canvasElement }) => {
        const scroller = canvasElement.querySelector('.plus-table-shell-scroll');
        await expect(scroller).not.toBeNull();
        scroller.scrollTop = scroller.scrollHeight;
        scroller.dispatchEvent(new Event('scroll'));
        await waitFor(() => expect(canvasElement.querySelector('[data-scrolled-y]')).not.toBeNull());
        const headCell = canvasElement.querySelector('thead th');
        await expect(headCell).not.toBeNull();
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
        await waitFor(() => expect(root.querySelector('.plus-popup')).not.toBeNull());
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
        const scroller = root.querySelector('.plus-table-shell-scroll');
        await expect(scroller).not.toBeNull();
        await expect(root).toHaveAttribute('data-progress', '0');
        scroller.scrollTop = 4;
        scroller.dispatchEvent(new Event('scroll'));
        await waitFor(() => expect(Number(root.dataset.progress)).toBeGreaterThan(0));
        await expect(Number(root.dataset.progress)).toBeLessThan(100);
        await waitFor(() => expect(root.querySelector('[data-scrolled-y]')).not.toBeNull());
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
        const card = ground.querySelector('.plus-template-card, [class*="card"]');
        await waitFor(() => expect(ground.querySelector('.plus-popup')).not.toBeNull());
        const ringAlpha = () => parseShadow(getComputedStyle(card).boxShadow)[0]?.color.a ?? 0;
        await expect(ground).toHaveAttribute('data-contrast-mode', 'no-preference');
        const before = ringAlpha();
        await userEvent.click(canvas.getByRole('switch', { name: 'Increased contrast' }));
        await expect(ground).toHaveAttribute('data-contrast-mode', 'more');
        await waitFor(() => expect(ringAlpha()).toBeGreaterThan(before));
    },
};

/* ------------------------------------------------------------ do, don't */

const ground = { padding: 'var(--card-pad)', borderRadius: 'var(--card-radius)', background: 'var(--ds-surface)' };
const menu = (style) => (
    <DocsOverlayBoundary containHeight>
        <div style={{ minHeight: 'calc(var(--image-xl) * 2)', display: 'flex', alignItems: 'flex-start' }}>
            <Popup
                trigger={<Button text="Session details" />}
                title="Session 12"
                placement="bottom-start"
                triggerType="manual"
                show
                rootClose={false}
                initialFocus={false}
                style={style}
            >
                Ran 45 minutes over.
            </Popup>
        </div>
    </DocsOverlayBoundary>
);

/** The ground a figure sits on: the page color, a sunken page, or a column of cards; `tip` makes room for a tooltip. */
const GroundFigure = ({ children, sunken = false, column = false, tip = false }) => (
    <div
        style={{
            ...ground,
            ...(sunken ? { background: 'var(--ds-surface-sunken)' } : null),
            ...(tip ? { minHeight: 'calc(var(--image-xl) * 1.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end' } : null),
            ...(column ? { display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' } : null),
        }}
    >
        {children}
    </div>
);

/** A raised Card whose gray fill replaces its shadow lift: the fill is the subject. */
const GrayFillDontFigure = () => (
    <GroundFigure>
        <Card surface="raised" title="Upcoming sessions" description="3 this week" style={{ background: 'var(--ds-surface-sunken)', boxShadow: 'none' }} />
    </GroundFigure>
);

/** A Panel lifted with the blocking shadow and no Blanket. */
const BlockingPanelDontFigure = () => (
    <GroundFigure>
        <div style={{ boxShadow: 'var(--ds-shadow-blocking)', borderRadius: 'var(--card-radius)' }}>
            <HeadingContextProvider value={2}>
                <PanelContainer width="100%">
                    <PanelHeader title="Session notes" />
                    <PanelBody>Factoring went well.</PanelBody>
                </PanelContainer>
            </HeadingContextProvider>
        </div>
    </GroundFigure>
);

/** A sunken fill with an overlay shadow on one Card. */
const SunkenShadowDontFigure = () => (
    <GroundFigure>
        <Card surface="raised" title="Session 12" description="Ran 45 minutes over." style={{ background: 'var(--ds-surface-sunken)', boxShadow: 'var(--ds-shadow-overlay)' }} />
    </GroundFigure>
);

/** A Tooltip drawn with the overlay pair instead of the flat dark fill. */
const OverlayTooltipDontFigure = () => (
    <DocsOverlayBoundary containHeight>
        <GroundFigure tip>
            <style>{'.plus-tooltip--dont-overlay { background: var(--ds-surface-overlay); color: var(--ds-text); box-shadow: var(--ds-shadow-overlay); }'}</style>
            <Tooltip text="Reschedule this session" placement="top" trigger="manual" show className="plus-tooltip--dont-overlay">
                <Button text="Reschedule" />
            </Tooltip>
        </GroundFigure>
    </DocsOverlayBoundary>
);

/** Lift a surface with its shadow, never with a darker gray. */
export const LiftWithShadow = {
    render: () => (
        <DoDont>
            <Do caption={<>The card keeps the page color and lifts on <C>--ds-shadow-raised</C>.</>}>
                <GroundFigure><Card surface="raised" title="Upcoming sessions" description="3 this week" /></GroundFigure>
            </Do>
            <Dont caption="A gray fill reads as a hole in the page, and dark loses the step.">
                <GrayFillDontFigure />
            </Dont>
        </DoDont>
    ),
    play: async ({ canvasElement }) => {
        const cards = canvasElement.querySelectorAll('.plus-template-card');
        await expect(cards).toHaveLength(2);
        await expect(getComputedStyle(cards[0]).boxShadow).not.toBe('none');
        await expect(getComputedStyle(cards[1]).boxShadow).toBe('none');
    },
};

/** The edge slot is the border: a lifted surface draws no border of its own. */
export const NoBorder = {
    render: () => (
        <DoDont>
            <Do caption="The edge slot is the Popup's border.">
                <GroundFigure>{menu()}</GroundFigure>
            </Do>
            <Dont caption="A border on top doubles the edge and outlines the Popup.">
                <GroundFigure>{menu({ border: 'var(--border-width-default) solid var(--ds-border-bold)' })}</GroundFigure>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => expect(canvasElement.querySelectorAll('.plus-popup').length).toBe(2));
        const [doPopup, dontPopup] = canvasElement.querySelectorAll('.plus-popup');
        await expect(getComputedStyle(doPopup).borderTopColor).toBe('rgba(0, 0, 0, 0)');
        await expect(getComputedStyle(dontPopup).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
    },
};

/** A surface and its shadow travel together. */
export const AlwaysPair = {
    render: () => (
        <DoDont>
            <Do caption={<>The overlay pair: <C>--ds-surface-overlay</C> with <C>--ds-shadow-overlay</C>.</>}>
                <GroundFigure sunken>{menu()}</GroundFigure>
            </Do>
            <Dont caption="The overlay surface with no shadow melts into the page.">
                <GroundFigure sunken>{menu({ boxShadow: 'none' })}</GroundFigure>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => expect(canvasElement.querySelectorAll('.plus-popup').length).toBe(2));
        const [doPopup, dontPopup] = canvasElement.querySelectorAll('.plus-popup');
        await expect(getComputedStyle(doPopup).boxShadow).not.toBe('none');
        await expect(getComputedStyle(dontPopup).boxShadow).toBe('none');
    },
};

/** Blocking belongs to the Modal on its Blanket. */
export const BlockingOnBlanket = {
    render: () => (
        <DoDont>
            <Do caption="The Modal on the Blanket takes the blocking shadow.">
                <Modal inline show screenWidth={360} screenHeight={300} width={280} title="Move session" body="To 4:30 PM?" primaryButton={{ text: 'Move', onClick: () => {} }} onClose={() => {}} />
            </Do>
            <Dont caption="A Panel with the blocking shadow and no Blanket: if it needs full attention, make it a Modal.">
                <BlockingPanelDontFigure />
            </Dont>
        </DoDont>
    ),
    play: async ({ canvasElement }) => {
        const blanket = canvasElement.querySelector('.plus-template-blanket');
        const modal = canvasElement.querySelector('.plus-modal');
        const panel = canvasElement.querySelector('.plus-panel');
        await expect(blanket).not.toBeNull();
        await expect(modal).not.toBeNull();
        await expect(getComputedStyle(modal).boxShadow).not.toBe('none');
        await expect(panel).not.toBeNull();
    },
};

/** Sunken holds the work; it never floats. */
export const SunkenNeverFloats = {
    render: () => (
        <DoDont>
            <Do caption="Sunken is the ground: the frame, or a sunken Card.">
                <GroundFigure>
                    <Card surface="sunken" title="This week" description="12 sessions" />
                </GroundFigure>
            </Do>
            <Dont caption="A sunken fill with a shadow: the gray says recessed, the shadow says lifted.">
                <SunkenShadowDontFigure />
            </Dont>
        </DoDont>
    ),
    play: async ({ canvasElement }) => {
        const sunken = canvasElement.querySelector('.plus-template-card--surface-sunken');
        const raised = canvasElement.querySelector('.plus-template-card--surface-raised');
        await expect(sunken).not.toBeNull();
        await expect(getComputedStyle(sunken).boxShadow).toBe('none');
        await expect(raised).not.toBeNull();
        await expect(getComputedStyle(raised).boxShadow).not.toBe('none');
    },
};

/** A Tooltip is a label: dark fill, no shadow. */
export const TooltipFlat = {
    render: () => (
        <DoDont>
            <Do caption="Dark fill, inverse text, no shadow.">
                <DocsOverlayBoundary containHeight>
                    <GroundFigure tip>
                        <Tooltip text="Reschedule this session" placement="top" trigger="manual" show>
                            <Button text="Reschedule" />
                        </Tooltip>
                    </GroundFigure>
                </DocsOverlayBoundary>
            </Do>
            <Dont caption="The overlay pair makes it look like a menu, so people try to click it.">
                <OverlayTooltipDontFigure />
            </Dont>
        </DoDont>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => expect(canvasElement.querySelectorAll('.plus-tooltip').length).toBe(2));
        const [doTip, dontTip] = canvasElement.querySelectorAll('.plus-tooltip');
        await expect(getComputedStyle(doTip).boxShadow).toBe('none');
        await expect(getComputedStyle(dontTip).boxShadow).not.toBe('none');
    },
};

/** Raise one focal point. */
export const OneFocalPoint = {
    render: () => (
        <DoDont>
            <Do caption="One raised Card marks the next session.">
                <GroundFigure>
                    <Section title="Sessions">
                        <Card surface="raised" title="Next session" description="Today, 4:30 PM" />
                        <StaticTable
                            headers={['Session', 'Day']}
                            rows={[['Past session', 'Monday'], ['Past session', 'Friday']]}
                        />
                    </Section>
                </GroundFigure>
            </Do>
            <Dont caption="Every row raised: nothing stands out.">
                <GroundFigure column>
                    <Card surface="raised" title="Next session" description="Today, 4:30 PM" />
                    <Card surface="raised" title="Past session" description="Monday" />
                    <Card surface="raised" title="Past session" description="Friday" />
                </GroundFigure>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvasElement }) => {
        const pair = canvasElement.querySelector('.sb-ds-dodont-pair');
        await expect(pair).not.toBeNull();
        const cards = pair.querySelectorAll('.plus-template-card');
        await expect(cards).toHaveLength(4);
        await expect(pair.querySelectorAll('.plus-static-table')).toHaveLength(1);
    },
};

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
export const UsingShadowTokens = {
    render: () => (
        <DoDont>
            <Do caption="Use the layer’s token.">
                {menu()}
            </Do>
            <Dont caption="Don’t write a raw shadow.">
                {menu({ boxShadow: '0 6px 18px rgba(0, 0, 0, 0.22)' })}
            </Dont>
        </DoDont>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => expect(canvasElement.querySelectorAll('.plus-popup').length).toBe(2));
    },
};

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
export const KeepComponentShadow = {
    render: () => (
        <DoDont>
            <Do caption="A Popup keeps the overlay pair it ships with.">
                {menu()}
            </Do>
            <Dont caption="Reassigning a component’s shadow puts it on the wrong layer.">
                {menu({ boxShadow: 'var(--ds-shadow-raised)' })}
            </Dont>
        </DoDont>
    ),
    play: async ({ canvasElement }) => {
        await waitFor(() => expect(canvasElement.querySelectorAll('.plus-popup').length).toBe(2));
        const [doPopup, dontPopup] = canvasElement.querySelectorAll('.plus-popup');
        await expect(getComputedStyle(dontPopup).boxShadow).not.toBe(getComputedStyle(doPopup).boxShadow);
    },
};

/* ----------------------------------------------------- EL-D4 Usage page */

const expectPairIllustrations = async (canvasElement) => {
    const pair = canvasElement.querySelector('.sb-ds-dodont-pair');
    await expect(pair).not.toBeNull();
    await expect(pair.querySelectorAll('svg').length).toBe(2);
};

export const UsageRule1 = { render: () => <UsageFlatByDefault />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const UsageRule2 = { render: () => <UsageLiftMeansAction />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const UsageRule3 = { render: () => <UsageRaiseOneThing />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const UsageRule4 = { render: () => <UsageGroupWithoutShadow />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const UsageRule5 = { render: () => <UsageBlockingUsesBlanket />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const UsageRule6 = { render: () => <UsageOneBlockingOverlay />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const UsageRule7 = { render: () => <UsageNoStrokeOnElevated />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const UsageRule8 = { render: () => <UsagePairSurfaceShadow />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const UsageRule9 = { render: () => <UsageDarkLightensFloating />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const UsageRule10 = { render: () => <ControlBoundaryDoDont />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const InMotion = {
    render: () => <UsageInMotion />,
    play: async ({ canvasElement }) => {
        const panel = canvasElement.querySelector('[data-testid="usage-in-motion"]');
        await assertPanelContainer(panel);
        await expect(panel.querySelectorAll('figure').length).toBe(3);
    },
};

/* ----------------------------------------------------- EL-D5 Color page */

export const SurfaceColorTable = {
    render: () => <ColorSurfaceTable />,
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('[data-testid="color-surface-table"]');
        await expect(root).not.toBeNull();
        await expect(root.querySelectorAll('tbody tr').length).toBe(4);
    },
};
export const ColoredSurfaceSwap = { render: () => <ColorSwapNeverStack />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const ColoredSurfaceShadow = { render: () => <ColorKeepShadow />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const ColoredSurfaceSolid = { render: () => <ColorSolidOnly />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const ColoredSurfaceMeaning = { render: () => <ColorMeaning />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const DarkModeOverlay = { render: () => <ColorDarkMode />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };

/* --------------------------------------------- EL-D7 Accessibility page */

export const ControlBoundary = { render: () => <ControlBoundaryDoDont everyMode />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const CardEdgeContrast = { render: () => <AccessibilityCardEdges />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const CardsInForcedColors = { render: () => <AccessibilityForcedColors />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };


/* ----------------------------------------------------- Material page */

export const MaterialRamp = {
    render: () => <MaterialRampFigure />,
    play: async ({ canvasElement }) => {
        const panel = canvasElement.querySelector('[data-testid="material-ramp"]');
        await assertPanelContainer(panel);
        await expect(panel.querySelectorAll('figure').length).toBe(2);
        await expect(panel.querySelector('svg text'), 'the ramp draws no words').toBeNull();
    },
};
export const MaterialAnatomy = {
    render: () => <MaterialAnatomyFigure />,
    play: async ({ canvasElement }) => {
        const panel = canvasElement.querySelector('[data-testid="material-anatomy"]');
        await assertPanelContainer(panel);
        await expect(panel.querySelectorAll('figure').length).toBe(4);
    },
};
export const MaterialChoose = {
    render: () => <MaterialChooseTable />,
    play: async ({ canvasElement }) => {
        const table = canvasElement.querySelector('[data-testid="material-choose-table"]');
        await expect(table.querySelectorAll('tbody tr').length).toBe(5);
    },
};
export const MaterialValues = {
    render: () => <MaterialValuesTable />,
    play: async ({ canvasElement }) => {
        const table = canvasElement.querySelector('[data-testid="material-values-table"]');
        await expect(table.querySelectorAll('tbody tr').length).toBe(4);
    },
};
export const MaterialOnMediaPair = { render: () => <MaterialOnMedia />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const MaterialMatchSurfacePair = { render: () => <MaterialMatchSurface />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const MaterialEdgePair = { render: () => <MaterialEdge />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const MaterialOnlyFloatingPair = { render: () => <MaterialOnlyFloating />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const MaterialNoBlurPair = { render: () => <MaterialNoBlur />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const MaterialAsIsPair = { render: () => <MaterialAsIs />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const MaterialNeutralOnlyPair = { render: () => <MaterialNeutralOnly />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };
export const MaterialOnBlanketPair = { render: () => <MaterialOnBlanket />, play: async ({ canvasElement }) => expectPairIllustrations(canvasElement) };

/* ------------------------------------------- Colored material section */

const expectPair = async (canvasElement) => {
    const pair = canvasElement.querySelector('.sb-ds-dodont-pair');
    await expect(pair).not.toBeNull();
    await expect(pair.querySelectorAll('figure').length).toBe(2);
};

export const ColoredTreatments = { render: () => <ColoredTreatmentsTable /> };
export const ColoredTokens = { render: () => <ColoredTokensTable /> };
export const ColoredCompose = { render: () => <ColoredComposeTable /> };

/** Tag and Status tag in every color, bold and subtle, over a picture. */
export const ColoredMaterialOnMedia = {
    render: () => <ColoredMaterialLive />,
    play: async ({ canvasElement }) => {
        for (const m of ['bold', 'subtle']) {
            const picture = canvasElement.querySelector(`[data-testid="colored-${m}"]`);
            await expect(picture.querySelectorAll(`.plus-tag--material-${m}`).length).toBe(6);
            await expect(picture.querySelectorAll(`.plus-status--material-${m}`).length).toBe(5);
            const tag = picture.querySelector('.plus-tag');
            await expect(getComputedStyle(tag).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
        }
    },
};
export const ColoredSmallPair = { render: () => <ColoredMaterialSmall />, play: async ({ canvasElement }) => expectPair(canvasElement) };
export const ColoredTextPair = { render: () => <ColoredMaterialPairText />, play: async ({ canvasElement }) => expectPair(canvasElement) };
export const ColoredEdgePair = { render: () => <ColoredMaterialEdge />, play: async ({ canvasElement }) => expectPair(canvasElement) };
export const ColoredOverSomethingPair = { render: () => <ColoredMaterialOverSomething />, play: async ({ canvasElement }) => expectPair(canvasElement) };
