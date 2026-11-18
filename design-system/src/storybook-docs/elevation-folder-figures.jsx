import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components';
import { settleMsOf, springBack } from '@/lib/damping';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { Illustration } from '@/storybook-docs/illustrations/Illustration.jsx';
import {
    Blanket,
    ButtonShape,
    CardBox,
    Frame,
    Layer,
    Modal,
    Page,
    Popup,
    Rect,
    Row,
    Rule,
    Section,
    Sidebar,
    SkeletonBar,
    StickyHeader,
} from '@/storybook-docs/illustrations/primitives.jsx';
import { CORNER, HAIRLINE, PAINT } from '@/storybook-docs/illustrations/paint.js';
import { staggerDelays } from '@/storybook-docs/illustrations/motion-choreography.jsx';
import { TURN, turnPoint, turnTransform } from '@/storybook-docs/lib/iso-turn.js';
import { composeShadow, parseShadow, slotted } from '@/storybook-docs/lib/shadow-anatomy';
import { usePageContrast } from '@/storybook-docs/lib/use-page-contrast.js';

const PLATE = { w: 160, h: 90 };

const useReducedMotion = () => {
    const [reduced, setReduced] = useState(
        () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),
    );
    useEffect(() => {
        const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        if (!mq) return undefined;
        const onChange = () => setReduced(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    return reduced;
};

/**
 * Shared panel container for every Elevation figure: a rounded neutral field
 * styled strictly on `--ds-*` and card tokens so both Default (`--ds-surface`)
 * and Sunken (`--ds-surface-sunken`) read clearly inside it in light and dark.
 */
export const ElevationPanel = React.forwardRef(({ children, style, ...rest }, ref) => (
    <div
        ref={ref}
        data-elevation-panel=""
        data-docs-stage=""
        style={{
            position: 'relative',
            boxSizing: 'border-box',
            width: '100%',
            padding: 'var(--card-pad-spacious)',
            borderRadius: 'var(--card-radius)',
            background: 'var(--ds-background-neutral)',
            color: 'var(--ds-text)',
            font: 'var(--body-default)',
            ...style,
        }}
        {...rest}
    >
        {children}
    </div>
));
ElevationPanel.displayName = 'ElevationPanel';

const MODE_ATTRIBUTES = ['data-color-mode', 'data-contrast-mode'];

const useVarsOn = (ref, names) => {
    const key = names.join('|');
    const [values, setValues] = useState({});
    useLayoutEffect(() => {
        const read = () => {
            const target = ref.current ?? document.documentElement;
            const cs = getComputedStyle(target);
            setValues(Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(n).trim()])));
        };
        read();
        const observer = new MutationObserver(read);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: MODE_ATTRIBUTES });
        if (ref.current) observer.observe(ref.current, { attributes: true, attributeFilter: MODE_ATTRIBUTES });
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    return values;
};

/* --------------------------------------------------- isometric plate stacks */

const ISO_PAD = 14;
const CLIMB = -turnPoint(0, 0, PLATE.w, 0).y;
const TICK_Y = 64;
const LABEL_W = 240;
const NARROW_PX = 560;

const PlateOutline = ({ x = 0, y = 0, w = PLATE.w, h = PLATE.h, corner = 'window', stroke, dashed = false }) => (
    <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke={stroke}
        strokeDasharray={dashed ? '4 3' : undefined}
        vectorEffect="non-scaling-stroke"
        style={{ strokeWidth: 'var(--stroke-hairline)', rx: CORNER[corner], ry: CORNER[corner] }}
    />
);

/** Fades each plate in place on the appearance spring; settles immediately under reduced motion. */
const usePlateFade = (ref, count) => {
    const reduced = useReducedMotion();
    const [offsets, setOffsets] = useState(() => Array.from({ length: count }, () => (reduced ? 0 : 1)));
    useEffect(() => {
        const node = ref.current;
        if (reduced || !node || typeof IntersectionObserver === 'undefined') {
            setOffsets(Array.from({ length: count }, () => 0));
            return undefined;
        }
        const settleMs = settleMsOf(SPRINGS['appearance.default'].productive);
        const cancels = [];
        const observer = new IntersectionObserver((entries) => {
            if (!entries.some((e) => e.isIntersecting)) return;
            observer.disconnect();
            staggerDelays(count).forEach((delay, i) => {
                const timer = setTimeout(() => {
                    cancels.push(
                        springBack(1, {
                            settleMs,
                            onUpdate: (v) => setOffsets((prev) => prev.map((x, j) => (j === i ? v : x))),
                        }),
                    );
                }, delay);
                cancels.push(() => clearTimeout(timer));
            });
        }, { threshold: 0.2 });
        observer.observe(node);
        return () => {
            observer.disconnect();
            cancels.forEach((c) => c());
        };
    }, [ref, count, reduced]);
    return offsets;
};

const useNarrowStage = (ref) => {
    const [narrow, setNarrow] = useState(false);
    useLayoutEffect(() => {
        const node = ref.current;
        if (!node || typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < NARROW_PX));
        observer.observe(node);
        return () => observer.disconnect();
    }, [ref]);
    return narrow;
};

const IsometricStack = ({ testId, ariaTitle, legendLabel, plates, stepDy = 52 }) => {
    const stageRef = useRef(null);
    const controlRefs = useRef({});
    const offsets = usePlateFade(stageRef, plates.length);
    const narrow = useNarrowStage(stageRef);
    const [active, setActive] = useState(plates[plates.length - 1].id);

    const stageW = ISO_PAD + PLATE.w * TURN.scaleX + 20;
    const stageH = ISO_PAD + CLIMB + (plates.length - 1) * stepDy + PLATE.h + ISO_PAD;
    const share = (stageW / (stageW + LABEL_W)) * 100;
    const plateAt = (i) => ({ x: ISO_PAD, y: ISO_PAD + CLIMB + (plates.length - 1 - i) * stepDy });

    const placed = plates.map((plate, i) => {
        const at = plateAt(i);
        return { ...plate, x: at.x, y: at.y, opacity: 1 - offsets[i] };
    });
    const point = (p, lx, ly) => turnPoint(p.x, p.y, lx, ly);

    const selectPlate = (id, moveFocus = false) => {
        setActive(id);
        if (moveFocus) {
            controlRefs.current[id]?.focus();
        }
    };

    const svgFigure = (
        <Illustration viewBox={`0 0 ${stageW} ${stageH}`} capped={false} title={ariaTitle}>
            {placed.map((plate) => {
                const on = plate.id === active;
                const tick = point(plate, PLATE.w, TICK_Y);
                return (
                    <React.Fragment key={plate.id}>
                        <g
                            data-plate={plate.id}
                            data-active={on}
                            opacity={plate.opacity}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setActive(plate.id)}
                            onClick={() => selectPlate(plate.id, true)}
                        >
                            <g data-turn="" transform={turnTransform(plate.x, plate.y)}>
                                {plate.ground && (
                                    <rect
                                        x={0}
                                        y={0}
                                        width={PLATE.w}
                                        height={PLATE.h}
                                        fill={plate.ground}
                                        style={{ rx: CORNER.window, ry: CORNER.window }}
                                    />
                                )}
                                {plate.draw()}
                                <PlateOutline
                                    stroke={on ? PAINT.accent : PAINT.frameDivider}
                                    dashed={Boolean(plate.dashed && !on)}
                                />
                            </g>
                        </g>
                        {!narrow && (
                            <line
                                data-tick={plate.id}
                                x1={tick.x + 3}
                                y1={tick.y}
                                x2={stageW}
                                y2={tick.y}
                                stroke={on ? PAINT.accent : PAINT.frameDivider}
                                vectorEffect="non-scaling-stroke"
                                opacity={plate.opacity}
                                style={HAIRLINE}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </Illustration>
    );

    const labels = placed
        .map((plate, i) => {
            const on = plate.id === active;
            const tickY = point(plateAt(i), PLATE.w, TICK_Y).y;
            return (
                <li
                    key={plate.id}
                    data-legend={plate.id}
                    data-active={on}
                    onMouseEnter={() => setActive(plate.id)}
                    style={
                        narrow
                            ? { margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--stack-sm)' }
                            : {
                                position: 'absolute',
                                insetInline: 0,
                                insetBlockStart: `${(tickY / stageH) * 100}%`,
                                transform: 'translateY(-50%)',
                                paddingInlineStart: 'var(--inline-md)',
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: 'var(--stack-sm)',
                            }
                    }
                >
                    <Button
                        ref={(el) => {
                            controlRefs.current[plate.id] = el;
                        }}
                        appearance="subtle"
                        spacing="compact"
                        isSelected={on}
                        text={plate.title}
                        onClick={() => selectPlate(plate.id)}
                        onFocus={() => setActive(plate.id)}
                    />
                    {plate.subtitle && (
                        <span
                            style={{
                                paddingInlineStart: 'var(--pad-x-sm)',
                                color: on ? 'var(--ds-text-brand)' : 'var(--ds-text-subtle)',
                                font: 'var(--code-default)',
                            }}
                        >
                            {plate.subtitle}
                        </span>
                    )}
                </li>
            );
        })
        .reverse();

    const listStyle = { margin: 0, padding: 0, listStyle: 'none' };
    return (
        <ElevationPanel ref={stageRef}>
            <div data-testid={testId} data-layout={narrow ? 'list' : 'column'}>
                {narrow ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
                        <div style={{ width: '100%' }}>{svgFigure}</div>
                        <ol aria-label={legendLabel} style={{ ...listStyle, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                            {labels}
                        </ol>
                    </div>
                ) : (
                    <div
                        style={{
                            position: 'relative',
                            aspectRatio: `${stageW + LABEL_W} / ${stageH}`,
                            maxInlineSize: `${(stageW + LABEL_W) * 1.45}px`,
                            marginInline: 'auto',
                        }}
                    >
                        <div style={{ position: 'absolute', insetBlock: 0, insetInlineStart: 0, width: `${share}%` }}>
                            {svgFigure}
                        </div>
                        <ol
                            aria-label={legendLabel}
                            style={{
                                ...listStyle,
                                position: 'absolute',
                                insetBlock: 0,
                                insetInlineEnd: 0,
                                width: `${100 - share}%`,
                            }}
                        >
                            {labels}
                        </ol>
                    </div>
                )}
            </div>
        </ElevationPanel>
    );
};

const OVERVIEW_PLATES = [
    {
        id: 'frame',
        title: 'Layer 0 · Frame',
        subtitle: '--ds-surface-sunken',
        ground: PAINT.frameSunken,
        draw: () => (
            <>
                {[22, 28, 25, 19, 27, 24].map((w, i) => (
                    <SkeletonBar key={i} x={8} y={12 + i * 11} w={w} h={3.5} />
                ))}
            </>
        ),
    },
    {
        id: 'page',
        title: 'Layer 1 · Page',
        subtitle: '--ds-surface',
        ground: null,
        draw: () => (
            <>
                <Layer x={42} y={4} w={114} h={82} fill={PAINT.pageSurface} corner="card" />
                <Rule x1={42} x2={42} y1={4} y2={86} stroke={PAINT.frameDivider} />
                <SkeletonBar x={50} y={11} w={36} h={4.5} heading />
                {/* One Raised focal card beside two flat Sunken backdrops */}
                <Layer x={50} y={20} w={36} h={24} fill={PAINT.cardSurface} shadow={PAINT.cardShadow} corner="card" />
                <SkeletonBar x={55} y={25} w={22} h={3} />
                <SkeletonBar x={55} y={31} w={15} h={3} />
                <Layer x={90} y={20} w={27} h={24} fill={PAINT.frameSunken} corner="card" />
                <SkeletonBar x={94} y={25} w={16} h={3} />
                <Layer x={121} y={20} w={27} h={24} fill={PAINT.frameSunken} corner="card" />
                <SkeletonBar x={125} y={25} w={14} h={3} />
                {/* Hairline table rows */}
                {[0, 1, 2, 3].map((r) => {
                    const y = 52 + r * 8;
                    const widths = [76, 62, 70, 54];
                    return (
                        <React.Fragment key={r}>
                            <SkeletonBar x={50} y={y} w={widths[r]} h={2.8} />
                            <Rule x1={50} x2={148} y1={y + 5.5} y2={y + 5.5} stroke={PAINT.rowDivider} />
                        </React.Fragment>
                    );
                })}
            </>
        ),
    },
    {
        id: 'navigation',
        title: 'Layer 2 · Navigation',
        subtitle: '--ds-shadow-overflow',
        ground: null,
        dashed: true,
        draw: () => (
            <>
                <Layer x={42} y={6} w={112} h={16} fill={PAINT.pageSurface} shadow={PAINT.overflowShadow} corner="card" />
                <SkeletonBar x={50} y={12.5} w={34} h={3.2} heading />
            </>
        ),
    },
    {
        id: 'non-blocking-overlay',
        title: 'Layer 3 · Non-blocking overlay',
        subtitle: '--ds-shadow-overlay',
        ground: null,
        dashed: true,
        draw: () => (
            <>
                {/* Popup */}
                <Layer x={98} y={16} w={50} h={32} fill={PAINT.popupSurface} shadow={PAINT.popupShadow} corner="popup" />
                <SkeletonBar x={104} y={22} w={36} h={2.8} />
                <SkeletonBar x={104} y={29} w={28} h={2.8} />
                <SkeletonBar x={104} y={36} w={32} h={2.8} />
                {/* Flag */}
                <Layer x={44} y={56} w={64} h={20} fill={PAINT.flagSurface} shadow={PAINT.flagShadow} corner="card" />
                <SkeletonBar x={50} y={62} w={44} h={2.8} />
                <SkeletonBar x={50} y={68} w={28} h={2.8} />
            </>
        ),
    },
    {
        id: 'blocking-overlay',
        title: 'Layer 4 · Blocking overlay',
        subtitle: '--ds-shadow-blocking',
        ground: PAINT.blanket,
        draw: () => (
            <>
                <Layer x={38} y={16} w={84} h={58} fill={PAINT.modalSurface} shadow={PAINT.modalShadow} corner="modal" />
                <SkeletonBar x={46} y={24} w={38} h={4} heading />
                <SkeletonBar x={46} y={34} w={64} h={3} />
                <SkeletonBar x={46} y={41} w={52} h={3} />
                <SkeletonBar x={76} y={60} w={18} h={7} />
                <SkeletonBar x={98} y={60} w={18} h={7} accent />
            </>
        ),
    },
];

/** Overview key figure: the five layers lifted apart in stack order. */
export const OverviewStack = () => (
    <IsometricStack
        testId="overview-stack"
        ariaTitle="The five layers in stack order: Layer 0 Frame, Layer 1 Page, Layer 2 Navigation, Layer 3 Non-blocking overlay and Layer 4 Blocking overlay"
        legendLabel="Layers, top first"
        plates={OVERVIEW_PLATES}
        stepDy={52}
    />
);

const PAGE_SURFACE_PLATES = [
    {
        id: 'default',
        title: 'Default',
        subtitle: '--ds-surface',
        ground: PAINT.pageSurface,
        draw: () => (
            <>
                <SkeletonBar x={10} y={10} w={42} h={4.5} heading />
                {[0, 1, 2, 3, 4].map((r) => {
                    const y = 22 + r * 12;
                    const widths = [118, 96, 108, 84, 100];
                    return (
                        <React.Fragment key={r}>
                            <SkeletonBar x={10} y={y} w={widths[r]} h={3} />
                            <Rule x1={10} x2={150} y1={y + 7} y2={y + 7} stroke={PAINT.rowDivider} />
                        </React.Fragment>
                    );
                })}
            </>
        ),
    },
    {
        id: 'sunken',
        title: 'Sunken',
        subtitle: '--ds-surface-sunken',
        ground: null,
        dashed: true,
        draw: () => (
            <>
                <Layer x={10} y={10} w={66} h={32} fill={PAINT.frameSunken} corner="card" />
                <SkeletonBar x={16} y={17} w={34} h={3.2} />
                <SkeletonBar x={16} y={24} w={46} h={3.2} />
                <Layer x={84} y={10} w={66} h={32} fill={PAINT.frameSunken} corner="card" />
                <SkeletonBar x={90} y={17} w={28} h={3.2} />
                <Layer x={10} y={48} w={140} h={32} fill={PAINT.frameSunken} corner="card" />
                <SkeletonBar x={56} y={62} w={48} h={3.2} />
            </>
        ),
    },
    {
        id: 'raised',
        title: 'Raised',
        subtitle: '--ds-surface-raised · --ds-shadow-raised',
        ground: null,
        dashed: true,
        draw: () => (
            <>
                <Layer x={10} y={10} w={78} h={42} fill={PAINT.cardSurface} shadow={PAINT.cardShadow} corner="card" />
                <SkeletonBar x={17} y={17} w={42} h={3.2} />
                <SkeletonBar x={17} y={24} w={28} h={3.2} />
                <SkeletonBar x={17} y={37} w={28} h={8} accent />
            </>
        ),
    },
];

/** Layer system key figure: the three surfaces within the Page. */
export const PageSurfacesStack = () => (
    <IsometricStack
        testId="page-surfaces-stack"
        ariaTitle="The three surfaces within the Page: Default, Sunken and Raised"
        legendLabel="Page surfaces, top first"
        plates={PAGE_SURFACE_PLATES}
        stepDy={56}
    />
);

/* ------------------------------------------- layer & page-surface diagrams */

const TokenBadge = ({ children }) => (
    <code
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: 'var(--pad-y-sm) var(--pad-x-md)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--ds-surface)',
            boxShadow: 'inset 0 0 0 var(--border-width-default) var(--ds-border)',
            font: 'var(--code-default)',
            color: 'var(--ds-text)',
            whiteSpace: 'nowrap',
        }}
    >
        {children}
    </code>
);

const DIAGRAM_TITLE = {
    frame: 'Layer 0 Frame: sunken ground with the docked Sidebar',
    page: 'Layer 1 Page: page surface beside the docked Sidebar',
    navigation: 'Layer 2 Navigation: sticky header over scrolling rows',
    'non-blocking-overlay': 'Layer 3 Non-blocking overlay: floating Popup over the usable Page',
    'blocking-overlay': 'Layer 4 Blocking overlay: Modal on the Blanket over the dimmed Page',
    'surface-default': 'Default surface: page rows and side section without a fill',
    'surface-sunken': 'Sunken surface: subtle Section grouping static content on the Page',
    'surface-raised': 'Raised surface: one raised focal Card beside flat Sections',
};

const drawLayerDiagram = (variant) => {
    const shell = (pageContent, { accentFrame = false, dimSidebar = true, dimPage = false, accentPage = false } = {}) => (
        <>
            <Frame x={2} y={2} w={196} h={108} chrome={false} accent={accentFrame} />
            <g opacity={dimSidebar ? 0.5 : 1}>
                <Sidebar x={2} y={2} w={42} h={108} accent={accentFrame} />
            </g>
            {pageContent !== null && (
                <Page x={44} y={2} w={154} h={108} accent={accentPage}>
                    <g opacity={dimPage ? 0.45 : 1}>{pageContent}</g>
                </Page>
            )}
        </>
    );

    if (variant === 'frame') {
        return (
            <>
                <Frame x={2} y={2} w={196} h={108} chrome={false} accent />
                <Sidebar x={2} y={2} w={42} h={108} accent />
            </>
        );
    }

    if (variant === 'page') {
        return shell(
            <>
                <SkeletonBar x={52} y={10} w={44} h={4.5} heading />
                <CardBox x={52} y={20} w={66} h={28} />
                <SkeletonBar x={58} y={26} w={36} h={3.5} />
                <SkeletonBar x={58} y={34} w={24} h={3.5} />
                <Section x={124} y={20} w={64} h={28} rows={2} subtle />
                <Row x={52} y={54} w={136} />
                <Row x={52} y={68} w={136} />
                <Row x={52} y={82} w={136} />
            </>,
            { accentPage: true },
        );
    }

    if (variant === 'navigation') {
        return shell(
            <StickyHeader x={44} y={2} w={154} h={106} accent />,
        );
    }

    if (variant === 'non-blocking-overlay') {
        return (
            <>
                {shell(
                    <>
                        <SkeletonBar x={52} y={10} w={44} h={4.5} heading />
                        <ButtonShape x={52} y={20} w={26} />
                        <ButtonShape x={82} y={20} w={22} />
                        <Row x={52} y={36} w={136} />
                        <Row x={52} y={50} w={136} />
                        <Row x={52} y={64} w={136} />
                        <Row x={52} y={78} w={136} />
                    </>,
                )}
                <ButtonShape x={160} y={18} w={28} />
                <Popup x={122} y={30} w={66} h={48} accent />
            </>
        );
    }

    if (variant === 'blocking-overlay') {
        return (
            <>
                {shell(
                    <>
                        <SkeletonBar x={52} y={10} w={44} h={4.5} heading />
                        <Row x={52} y={24} w={136} />
                        <Row x={52} y={38} w={136} />
                        <Row x={52} y={52} w={136} />
                    </>,
                    { dimSidebar: false },
                )}
                <Blanket x={2} y={2} w={196} h={108} />
                <Modal x={54} y={22} w={96} h={64} divider={false} accent />
            </>
        );
    }

    if (variant === 'surface-default') {
        return shell(
            <>
                <SkeletonBar x={52} y={10} w={44} h={4.5} heading />
                <Row x={52} y={22} w={82} />
                <Row x={52} y={36} w={82} />
                <Row x={52} y={50} w={82} />
                <Row x={52} y={64} w={82} />
                <Row x={52} y={78} w={82} />
                <Section x={142} y={24} w={46} h={58} rows={3} />
            </>,
            { accentPage: true },
        );
    }

    if (variant === 'surface-sunken') {
        return shell(
            <>
                <SkeletonBar x={52} y={10} w={44} h={4.5} heading />
                <Section x={52} y={22} w={136} h={74} rows={4} subtle accent />
            </>,
        );
    }

    // surface-raised
    return shell(
        <>
            <SkeletonBar x={52} y={10} w={44} h={4.5} heading />
            <CardBox x={52} y={22} w={82} h={48} accent />
            <SkeletonBar x={58} y={29} w={48} h={4} heading />
            <SkeletonBar x={58} y={38} w={32} h={3.5} />
            <ButtonShape x={58} y={54} w={30} appearance="primary" />
            <Section x={140} y={22} w={48} h={48} rows={2} subtle />
            <Section x={52} y={76} w={136} h={24} rows={1} subtle />
        </>,
    );
};

/**
 * Miniature app-shell wireframe composed from the shared illustration kit inside
 * the shared panel container, paired with token callout pills.
 */
export const LayerDiagramPanel = ({ variant }) => {
    const badgesByVariant = {
        frame: ['--ds-surface-sunken'],
        page: ['--ds-surface'],
        navigation: ['--ds-shadow-overflow'],
        'non-blocking-overlay': ['--ds-surface-overlay', '--ds-shadow-overlay'],
        'blocking-overlay': ['--ds-surface-overlay', '--ds-shadow-blocking', '--ds-blanket'],
        'surface-default': ['--ds-border', '--ds-surface'],
        'surface-sunken': ['--ds-surface-sunken'],
        'surface-raised': ['--ds-surface-raised', '--ds-shadow-raised'],
    };
    const badges = badgesByVariant[variant] ?? [];

    return (
        <ElevationPanel data-layer-diagram={variant}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) auto',
                    gap: 'var(--grid-gutter)',
                    alignItems: 'center',
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <Illustration width={200} height={112} capped={false} title={DIAGRAM_TITLE[variant] ?? variant}>
                        {drawLayerDiagram(variant)}
                    </Illustration>
                </div>

                {/* Token callouts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', alignItems: 'flex-start' }}>
                    {badges.map((token) => (
                        <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-sm)' }}>
                            <span
                                aria-hidden="true"
                                style={{
                                    width: 'var(--icon-md)',
                                    height: 'var(--border-width-default)',
                                    background: 'var(--ds-border)',
                                }}
                            />
                            <TokenBadge>{token}</TokenBadge>
                        </div>
                    ))}
                </div>
            </div>
        </ElevationPanel>
    );
};

/** Side-by-side row pairing a LayerDiagramPanel with its usage prose in a 2:1 desktop split that stacks when narrow. */
export const LayerDetailRow = ({ variant, children }) => (
    <div
        data-layer-detail={variant}
        style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--grid-gutter)',
            alignItems: 'flex-start',
        }}
    >
        <div style={{ flex: '2 1 var(--grid-gutter)', minWidth: 'min(100%, var(--section-min-width-main))' }}>
            <LayerDiagramPanel variant={variant} />
        </div>
        <div
            style={{
                flex: '1 1 0',
                minWidth: 'min(100%, var(--section-min-width-side))',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--stack-sm)',
                font: 'var(--body-default)',
                color: 'var(--ds-text)',
            }}
        >
            {children}
        </div>
    </div>
);

/* ----------------------------------------------------- by-template gallery */

const TemplateTile = ({ title, description, tokens, ariaTitle, children }) => (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
        <div
            style={{
                boxSizing: 'border-box',
                padding: 'var(--card-pad-compact)',
                borderRadius: 'var(--card-radius-compact)',
                background: 'var(--ds-surface)',
                boxShadow: 'inset 0 0 0 var(--border-width-default) var(--ds-border)',
            }}
        >
            <Illustration width={160} height={84} capped={false} title={ariaTitle ?? title}>
                {children}
            </Illustration>
        </div>
        <figcaption style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
            <strong style={{ font: 'var(--body-default)', fontWeight: 'inherit', color: 'var(--ds-text)' }}>
                {title}
            </strong>
            <span style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>{description}</span>
            <code style={{ font: 'var(--code-default)', color: 'var(--ds-text-subtle)' }}>{tokens}</code>
        </figcaption>
    </figure>
);

const TEMPLATE_GRID_STYLE = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, var(--card-min-width-sm)), 1fr))',
    gap: 'var(--grid-gutter)',
};

/** Within-the-page surface summary grouped by Section, Table, and Card (shipped code truth). */
export const ByTemplateGrid = () => (
    <ElevationPanel data-testid="by-template-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                <h4 style={{ margin: 0, font: 'var(--heading-sm)', color: 'var(--ds-text)' }}>Section</h4>
                <div style={TEMPLATE_GRID_STYLE}>
                    <TemplateTile
                        title="Section"
                        description="Default: heading, view bar, body"
                        tokens="no surface · no shadow"
                        ariaTitle="Section on the Default surface with no shadow"
                    >
                        <Section x={12} y={14} w={136} h={56} rows={3} />
                    </TemplateTile>
                    <TemplateTile
                        title="Section and its side"
                        description="Default: two columns, set apart by the gap"
                        tokens="no surface · no line"
                        ariaTitle="Section and its side column separated by the gap"
                    >
                        <Section x={10} y={14} w={84} h={56} rows={3} />
                        <Section x={104} y={14} w={46} h={56} rows={2} />
                    </TemplateTile>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                <h4 style={{ margin: 0, font: 'var(--heading-sm)', color: 'var(--ds-text)' }}>Table</h4>
                <div style={TEMPLATE_GRID_STYLE}>
                    <TemplateTile
                        title="Table"
                        description="Default, hairline rows, no head fill"
                        tokens="--ds-border"
                        ariaTitle="Table on the Default surface with hairline rows"
                    >
                        <Row x={10} y={12} w={140} />
                        <Row x={10} y={26} w={140} />
                        <Row x={10} y={40} w={140} />
                        <Row x={10} y={54} w={140} />
                    </TemplateTile>
                    <TemplateTile
                        title="Sticky header, scrolled"
                        description="Layer 2 · Navigation: rows pass under the header"
                        tokens="--ds-shadow-overflow"
                        ariaTitle="Table with a sticky header carrying the overflow shadow"
                    >
                        <StickyHeader x={10} y={12} w={140} h={60} />
                    </TemplateTile>
                    <TemplateTile
                        title="Empty box"
                        description="Sunken: the table’s empty state"
                        tokens="--ds-surface-sunken"
                        ariaTitle="Empty state box on the sunken surface replacing a table"
                    >
                        <Rect x={14} y={8} w={132} h={68} fill={PAINT.frameSunken} corner="card" />
                        <Rect x={72} y={16} w={16} h={16} stroke={PAINT.placeholderHeading} corner="icon" />
                        <SkeletonBar x={46} y={39} w={68} />
                        <SkeletonBar x={56} y={47} w={48} />
                        <ButtonShape x={58} y={58} w={44} />
                    </TemplateTile>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                <h4 style={{ margin: 0, font: 'var(--heading-sm)', color: 'var(--ds-text)' }}>Card</h4>
                <div style={TEMPLATE_GRID_STYLE}>
                    <TemplateTile
                        title="Sunken card"
                        description="Sunken, flat (static), the default card"
                        tokens="--ds-surface-sunken"
                        ariaTitle="Sunken card on the sunken surface with no shadow or border"
                    >
                        <Rect x={18} y={14} w={124} h={56} fill={PAINT.frameSunken} corner="card" />
                        <SkeletonBar x={28} y={25} w={52} heading />
                        <SkeletonBar x={28} y={36} w={84} />
                        <SkeletonBar x={28} y={45} w={68} />
                    </TemplateTile>
                    <TemplateTile
                        title="Default card"
                        description="Default: bordered, flat; on the Frame, Sunken or colored areas, or dense"
                        tokens="--ds-surface · --ds-border"
                        ariaTitle="Default card on the default surface with a hairline border"
                    >
                        <Rect x={18} y={14} w={124} h={56} fill={PAINT.pageSurface} stroke={PAINT.frameDivider} corner="card" />
                        <SkeletonBar x={28} y={25} w={52} heading />
                        <SkeletonBar x={28} y={36} w={84} />
                        <SkeletonBar x={28} y={45} w={68} />
                    </TemplateTile>
                    <TemplateTile
                        title="Primary card"
                        description="Raised at rest, one per view"
                        tokens="--ds-surface-raised · --ds-shadow-raised"
                        ariaTitle="Primary card on the raised surface and shadow"
                    >
                        <CardBox x={18} y={14} w={124} h={56} />
                        <SkeletonBar x={26} y={22} w={68} h={4} heading />
                        <SkeletonBar x={26} y={32} w={46} />
                        <ButtonShape x={26} y={48} w={40} appearance="primary" />
                    </TemplateTile>
                    <TemplateTile
                        title="Clickable card, rest"
                        description="Sunken, flat in a grid"
                        tokens="--ds-surface-sunken"
                        ariaTitle="Clickable cards at rest on the sunken surface in a grid"
                    >
                        <Rect x={12} y={14} w={64} h={56} fill={PAINT.frameSunken} corner="card" />
                        <SkeletonBar x={20} y={24} w={36} heading />
                        <SkeletonBar x={20} y={34} w={26} />
                        <Rect x={84} y={14} w={64} h={56} fill={PAINT.frameSunken} corner="card" />
                        <SkeletonBar x={92} y={24} w={32} heading />
                    </TemplateTile>
                    <TemplateTile
                        title="Clickable card, hover"
                        description="Raised on hover: raised pair, no movement"
                        tokens="--ds-surface-raised · --ds-shadow-raised"
                        ariaTitle="Clickable card on hover lifted onto the raised surface and shadow"
                    >
                        <CardBox x={12} y={14} w={64} h={56} />
                        <SkeletonBar x={20} y={24} w={36} heading />
                        <SkeletonBar x={20} y={34} w={26} />
                        <Rect x={84} y={14} w={64} h={56} fill={PAINT.frameSunken} corner="card" />
                        <SkeletonBar x={92} y={24} w={32} heading />
                    </TemplateTile>
                    <TemplateTile
                        title="Dragged card"
                        description="leaves the page for L3"
                        tokens="--ds-surface-overlay · --ds-shadow-overlay"
                        ariaTitle="Dragged card lifted onto the overlay surface and shadow"
                    >
                        <g transform="rotate(-2 80 42)">
                            <Layer x={18} y={14} w={124} h={56} fill={PAINT.popupSurface} shadow={PAINT.popupShadow} corner="card" />
                            <SkeletonBar x={26} y={24} w={68} h={4} heading />
                            <SkeletonBar x={26} y={34} w={46} />
                        </g>
                    </TemplateTile>
                </div>
            </div>
        </div>
    </ElevationPanel>
);

/* ----------------------------------------------------- shadow ramp figures */

const RAMP_STEPS = [
    { id: 'raised', label: 'raised', fill: PAINT.cardSurface, shadow: PAINT.cardShadow },
    { id: 'overflow', label: 'overflow', fill: PAINT.pageSurface, shadow: PAINT.overflowShadow },
    { id: 'overlay', label: 'overlay', fill: PAINT.popupSurface, shadow: PAINT.popupShadow },
    { id: 'blocking', label: 'blocking', fill: PAINT.modalSurface, shadow: PAINT.modalShadow },
];

/** Shadow ramp key figure: four shadows in layer order, shown side by side in light and dark. */
export const ShadowRampFigure = () => {
    const contrast = usePageContrast();
    return (
    <ElevationPanel>
        <div
            data-testid="shadow-ramp"
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, var(--card-min-width-md)), 1fr))',
                borderRadius: 'var(--card-radius-compact)',
                overflow: 'hidden',
                border: 'var(--border-width-default) solid var(--ds-border)',
            }}
        >
            {(['light', 'dark']).map((mode) => (
                <div
                    key={mode}
                    data-color-mode={mode}
                    {...(contrast ? { 'data-contrast-mode': contrast } : {})}
                    style={{
                        background: 'var(--ds-surface)',
                        color: 'var(--ds-text)',
                        padding: 'var(--card-pad-spacious) var(--card-pad-default)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--stack-lg)',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                            gap: 'var(--inline-sm)',
                            width: '100%',
                        }}
                    >
                        {RAMP_STEPS.map((step) => (
                            <div
                                key={step.id}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 'var(--stack-md)',
                                }}
                            >
                                <div data-shadow-step={step.id} style={{ width: '100%' }}>
                                    <Illustration width={84} height={84} capped={false} title={`${step.label} shadow in ${mode} mode`}>
                                        <Layer x={18} y={14} w={48} h={48} fill={step.fill} shadow={step.shadow} corner="full" />
                                    </Illustration>
                                </div>
                                <span
                                    style={{
                                        textAlign: 'center',
                                        font: 'var(--code-default)',
                                        color: 'var(--ds-text-subtle)',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>
                    <span style={{ font: 'var(--heading-xxs)', color: 'var(--ds-text-subtle)' }}>
                        {mode === 'light' ? 'Light' : 'Dark'}
                    </span>
                </div>
            ))}
        </div>
    </ElevationPanel>
    );
};

const formatLayerSummary = (layer) => {
    if (!layer) return '0';
    const pct = `${Math.round(layer.color.a * 1000) / 10}%`;
    if (layer.blur === 0 && layer.spread > 0) {
        return `${layer.x} ${layer.y} 0 ${layer.spread}px · ${pct}`;
    }
    return `${layer.x} ${layer.y}px ${layer.blur}px · ${pct}`;
};

const EquationDisc = ({ shadow, title }) => (
    <Illustration width={72} height={72} title={title}>
        <Layer x={16} y={14} w={40} h={40} fill={PAINT.modalSurface} shadow={shadow} corner="full" />
    </Illustration>
);

/** Edge + Key + Ambient = --ds-shadow-blocking, reading live resolved values from the page. */
export const ShadowTokensEquation = () => {
    const probeRef = useRef(null);
    const vars = useVarsOn(probeRef, ['--ds-shadow-blocking']);
    const parsed = slotted(parseShadow(vars['--ds-shadow-blocking'] ?? ''));
    const slots = Object.fromEntries(parsed.map((l) => [l.slot, l]));
    const only = (slot) => composeShadow(parsed, { edge: slot === 'edge', key: slot === 'key', ambient: slot === 'ambient' });

    const parts = [
        {
            id: 'edge',
            title: 'Edge',
            // docs-literal: board EL-D3 prose copy describing the edge slot's 1px ring
            description: 'The border: a 1px ring; a 3:1 line under increased contrast.',
            boxShadow: only('edge'),
            code: formatLayerSummary(slots.edge),
        },
        {
            id: 'key',
            title: 'Key',
            description: 'Contact: short and dark, where the surface meets the ground.',
            boxShadow: only('key'),
            code: formatLayerSummary(slots.key),
        },
        {
            id: 'ambient',
            title: 'Ambient',
            description: 'Height: the wider and softer, the higher it reads.',
            boxShadow: only('ambient'),
            code: formatLayerSummary(slots.ambient),
        },
    ];

    return (
        <ElevationPanel ref={probeRef} data-testid="shadow-equation">
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    gap: 'var(--stack-lg) var(--inline-lg)',
                }}
            >
                {parts.map((part, idx) => (
                    <React.Fragment key={part.id}>
                        <div
                            data-equation-part={part.id}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 'var(--stack-md)',
                                maxWidth: '20ch',
                                textAlign: 'center',
                            }}
                        >
                            <EquationDisc shadow={part.boxShadow} title={`${part.title} shadow layer`} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                                <strong style={{ font: 'var(--body-default)', fontWeight: 'inherit', color: 'var(--ds-text)' }}>
                                    {part.title}
                                </strong>
                                <span style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>{part.description}</span>
                                <code style={{ font: 'var(--code-default)', color: 'var(--ds-text-subtle)' }}>{part.code}</code>
                            </div>
                        </div>
                        <span
                            aria-hidden="true"
                            style={{
                                alignSelf: 'center',
                                font: 'var(--heading-lg)',
                                color: 'var(--ds-text-subtle)',
                            }}
                        >
                            {idx < parts.length - 1 ? '+' : '='}
                        </span>
                    </React.Fragment>
                ))}
                <div
                    data-equation-part="composite"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--stack-md)',
                        maxWidth: '22ch',
                        textAlign: 'center',
                    }}
                >
                    <EquationDisc shadow={PAINT.modalShadow} title="Composite --ds-shadow-blocking shadow" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                        <strong style={{ font: 'var(--code-default)', fontWeight: 'inherit', color: 'var(--ds-text)' }}>
                            --ds-shadow-blocking
                        </strong>
                        <span style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>
                            One composite token, always used whole.
                        </span>
                        <code style={{ font: 'var(--code-default)', color: 'var(--ds-text-subtle)' }}>edge, key, ambient</code>
                    </div>
                </div>
            </div>
        </ElevationPanel>
    );
};
