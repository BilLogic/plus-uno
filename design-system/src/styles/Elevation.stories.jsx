import React, { useEffect, useRef } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button, Modal, PanelBody, PanelContainer, PanelHeader, Popup, Select, Tooltip } from '@/components';
import { Blanket, PatternCard, PatternSection, PatternTable } from '@/patterns';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';
import { Do, Dont, DoDont, C } from '@/storybook-docs/foundation-blocks.jsx';
import {
    BehaviorGuide,
    ClipDemo,
    ContrastDemo,
    CrossSection,
    ExplodedStack,
    LayerStack,
    LevelTiles as LevelTilesBlock,
    LiftDemo,
    ScrollShadowDemo,
    ShadowComposer,
    ShadowSlotTable,
    SurfaceLadder,
} from '@/storybook-docs/elevation-demos.jsx';
import { parseShadow } from '@/storybook-docs/lib/shadow-anatomy';

/**
 * Live blocks for Foundations/Elevation. Each interactive block has a play
 * test; the values every block shows are read from the page's tokens.
 */
export default {
    title: 'Foundations/Elevation',
    tags: ['!dev', '!autodocs'],
};

const layersOf = (el) => parseShadow(getComputedStyle(el).boxShadow).length;

/* ------------------------------------------------------------ overview */

/** One screen, taken apart into its layers and put back together. */
export const Stack = {
    render: () => <ExplodedStack />,
    play: async ({ canvasElement }) => {
        const root = canvasElement.querySelector('[data-testid="exploded-stack"]');
        const canvas = within(canvasElement);
        await expect(root).toHaveAttribute('data-state', 'exploded');
        // Six plates, each drawn from the illustration kit, with no words inside the figure:
        // the names and the --layer-* values live in the numbered legend beside it.
        const plates = root.querySelectorAll('[data-plate]');
        await expect(plates).toHaveLength(6);
        for (const plate of plates) {
            await expect(plate.querySelector('svg'), `${plate.dataset.plate} is a kit drawing`).not.toBeNull();
            await expect(plate.querySelector('svg text'), `${plate.dataset.plate} draws no words`).toBeNull();
        }
        const legend = within(root.querySelector('[data-testid="stack-legend"]'));
        await waitFor(() => expect(legend.getByText(/--layer-modal \d+/)).toBeInTheDocument());
        await expect(legend.getByText('Backdrop')).toBeInTheDocument();
        await expect(root.querySelector('[data-plate="card"]').closest('[data-testid="exploded-stack"]')).not.toBeNull();
        await expect(within(root).getByText('raised, no layer')).toBeInTheDocument();
        await expect(legend.queryByText(/--layer-card/)).toBeNull();
        await userEvent.click(canvas.getByRole('button', { name: 'Collapse' }));
        await expect(root).toHaveAttribute('data-state', 'collapsed');
        await waitFor(() => expect(root).toHaveAttribute('data-progress', '0'));
        await userEvent.click(canvas.getByRole('button', { name: 'Explode' }));
        await expect(root).toHaveAttribute('data-state', 'exploded');
        // Settled, so the labels are fully drawn before the accessibility pass.
        await waitFor(() => expect(root).toHaveAttribute('data-progress', '100'));
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
        const values = [...canvasElement.querySelectorAll('[data-layer] strong')].map((n) => Number(n.textContent));
        await waitFor(() => expect(values.length).toBe(9));
        for (let i = 1; i < values.length; i += 1) await expect(values[i]).toBeGreaterThan(values[i - 1]);
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

const options = ['Algebra I', 'Geometry', 'Reading', 'Writing'].map((label) => ({ value: label.toLowerCase(), label }));

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
                breadcrumbs={[{ text: 'Home', href: '#' }, { text: 'Sessions' }]}
                account={ACCOUNT}
                panelStorageKey={null}
                {...frameProps}
            >
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 'var(--grid-gutter)' }}>
                    <PatternCard title="Session 12" description="Thursday, 4:30 PM · Algebra I" />
                    <PatternCard title="Session 13" description="Monday, 4:30 PM · Geometry" />
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
    await expect(canvasElement.querySelector('.plus-frame__blanket'), 'no Backdrop under it').toBeNull();
};

/** The real Sidebar peeked from the left edge: it floats over the page with no Backdrop. */
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

/** The Modal on its Backdrop. */
export const ModalOnBackdrop = {
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
            <Select label="Subject" options={options} defaultOpen />
        </div>
    ),
    play: async () => {
        await waitFor(() => expect(document.querySelector('[role="listbox"]')).not.toBeNull());
    },
};

/** The real Panel peeked from the right edge: it floats over the page with no Backdrop. */
export const FloatingPanel = {
    render: () => (
        <SessionsFrame
            edge=".plus-frame__panel-edge"
            panelLabel="Session notes"
            panelPeek
            panel={(
                <PanelContainer>
                    <PanelHeader title="Session notes" />
                    <PanelBody>Thursday with Ana Ruiz: factoring went well; review the quadratic formula next time.</PanelBody>
                </PanelContainer>
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
            <div style={ground}>{menu({ border: 'var(--border-default) solid var(--ds-border-bold)' })}</div>
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

/** Blocking belongs to the Modal on its Backdrop. */
export const BlockingOnBackdrop = () => (
    <DoDont>
        <Do caption="The Modal on the Backdrop takes the blocking shadow.">
            <Blanket inline screenWidth={360} screenHeight={220}>
                <Modal show renderAs="inline" width={280} title="Move session" body="To 4:30 PM?" primaryButton={{ text: 'Move', onClick: () => {} }} onClose={() => {}} />
            </Blanket>
        </Do>
        <Dont caption="A Panel with the blocking shadow and no Backdrop. If it needs full attention, make it a Modal.">
            <div style={ground}>
                <div style={{ boxShadow: 'var(--ds-shadow-blocking)', borderRadius: 'var(--card-radius)' }}>
                    <PanelContainer width="100%">
                        <PanelHeader title="Session notes" />
                        <PanelBody>Factoring went well.</PanelBody>
                    </PanelContainer>
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
                <span className="plus-tooltip" style={{ position: 'relative', boxShadow: 'none' }}>Reschedule this session</span>
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
