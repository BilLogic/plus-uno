import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { settleMsOf, springBack } from '@/lib/damping';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { Illustration } from '@/storybook-docs/illustrations/Illustration.jsx';
import { Layer, Rule, SkeletonBar } from '@/storybook-docs/illustrations/primitives.jsx';
import { CORNER, HAIRLINE, PAINT } from '@/storybook-docs/illustrations/paint.js';
import { staggerDelays } from '@/storybook-docs/illustrations/motion-choreography.jsx';
import { TURN, turnPoint, turnTransform } from '@/storybook-docs/lib/iso-turn.js';
import { composeShadow, parseShadow, slotted } from '@/storybook-docs/lib/shadow-anatomy';

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
const RISE = 24;
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

const usePlateRise = (ref, count) => {
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

const resetLabelButton = {
    display: 'inline-flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 'var(--inline-sm)',
    padding: 0,
    border: 0,
    background: 'none',
    font: 'var(--body-default)',
    color: 'inherit',
    textAlign: 'start',
    cursor: 'default',
    borderRadius: 'var(--radius-sm)',
};

const IsometricStack = ({ testId, ariaTitle, legendLabel, plates, stepDy = 52 }) => {
    const stageRef = useRef(null);
    const offsets = usePlateRise(stageRef, plates.length);
    const narrow = useNarrowStage(stageRef);
    const [active, setActive] = useState(plates[plates.length - 1].id);
    const [focusRing, setFocusRing] = useState(null);

    const stageW = ISO_PAD + PLATE.w * TURN.scaleX + 20;
    const stageH = ISO_PAD + CLIMB + (plates.length - 1) * stepDy + PLATE.h + ISO_PAD;
    const share = (stageW / (stageW + LABEL_W)) * 100;
    const plateAt = (i) => ({ x: ISO_PAD, y: ISO_PAD + CLIMB + (plates.length - 1 - i) * stepDy });

    const placed = plates.map((plate, i) => {
        const at = plateAt(i);
        return { ...plate, x: at.x, y: at.y + offsets[i] * RISE, opacity: 1 - offsets[i] };
    });
    const point = (p, lx, ly) => turnPoint(p.x, p.y, lx, ly);

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
                            onMouseEnter={() => setActive(plate.id)}
                            onClick={() => setActive(plate.id)}
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
                            ? { margin: 0 }
                            : {
                                position: 'absolute',
                                insetInline: 0,
                                insetBlockStart: `${(tickY / stageH) * 100}%`,
                                transform: 'translateY(-50%)',
                                paddingInlineStart: 'var(--inline-md)',
                                margin: 0,
                            }
                    }
                >
                    <button
                        type="button"
                        aria-current={on ? 'true' : undefined}
                        onFocus={(e) => {
                            setActive(plate.id);
                            setFocusRing(e.currentTarget.matches(':focus-visible') ? plate.id : null);
                        }}
                        onBlur={() => setFocusRing(null)}
                        style={{
                            ...resetLabelButton,
                            color: on ? 'var(--ds-text-brand)' : 'var(--ds-text)',
                            outline:
                                focusRing === plate.id
                                    ? 'var(--border-width-focused) solid var(--ds-border-focused)'
                                    : 'none',
                            outlineOffset: 'var(--stroke-1)',
                        }}
                    >
                        <strong style={{ fontWeight: 'inherit' }}>{plate.title}</strong>
                        {plate.subtitle && (
                            <span style={{ color: on ? 'var(--ds-text-brand)' : 'var(--ds-text-subtle)', font: 'var(--code-default)' }}>
                                {plate.subtitle}
                            </span>
                        )}
                    </button>
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
                        <ol aria-label={legendLabel} style={{ ...listStyle, display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
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
        title: 'Frame',
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
        title: 'Page',
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
        title: 'Navigation',
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
        title: 'Non-blocking overlay',
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
        title: 'Blocking overlay',
        subtitle: '--ds-shadow-blocking',
        ground: PAINT.blanket,
        draw: () => (
            <>
                <Layer x={38} y={16} w={84} h={58} fill={PAINT.modalSurface} shadow={PAINT.modalShadow} corner="modal" />
                <SkeletonBar x={46} y={24} w={38} h={4} heading />
                <SkeletonBar x={46} y={34} w={64} h={3} />
                <SkeletonBar x={46} y={41} w={52} h={3} />
                <Rule x1={38} x2={122} y1={56} y2={56} stroke={PAINT.modalDivider} />
                <SkeletonBar x={76} y={61} w={18} h={7} />
                <SkeletonBar x={98} y={61} w={18} h={7} accent />
            </>
        ),
    },
];

/** Overview key figure: the five layers lifted apart in stack order. */
export const OverviewStack = () => (
    <IsometricStack
        testId="overview-stack"
        ariaTitle="The five layers in stack order: Frame, Page, Navigation, Non-blocking overlay and Blocking overlay"
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

const SkelLines = ({ widths, gap = 'var(--stack-sm)', tall = false }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap, minWidth: 0 }}>
        {widths.map((w, i) => (
            <span
                key={i}
                data-skeleton=""
                style={{
                    display: 'block',
                    width: w,
                    height: tall ? 'var(--space-100)' : 'var(--space-075)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--ds-skeleton)',
                }}
            />
        ))}
    </div>
);

const TokenBadge = ({ children }) => (
    <code
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: 'var(--space-025) var(--inline-md)',
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

const HairlineRows = ({ widths }) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
        {widths.map((w, i) => (
            <div
                key={i}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    paddingBlock: 'var(--space-075)',
                    borderBottom: 'var(--border-width-default) solid var(--ds-border)',
                }}
            >
                <div style={{ flex: 1 }}>
                    <SkelLines widths={[w]} />
                </div>
            </div>
        ))}
    </div>
);

/**
 * Miniature app-shell wireframe inside the shared panel container, paired with
 * token callout pills for the layer or page surface being explained.
 */
export const LayerDiagramPanel = ({ variant }) => {
    const dimSidebar = variant !== 'frame';
    const badgesByVariant = {
        frame: ['--ds-surface-sunken'],
        page: ['--ds-surface'],
        navigation: ['--ds-surface', '--ds-shadow-overflow'],
        'non-blocking-overlay': ['--ds-surface-overlay', '--ds-shadow-overlay'],
        'blocking-overlay': ['--ds-blanket', '--ds-surface-overlay', '--ds-shadow-blocking'],
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
                {/* Miniature app shell */}
                <div
                    style={{
                        position: 'relative',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(var(--image-lg), 22%) minmax(0, 1fr)',
                        minHeight: 'var(--image-xl)',
                        borderRadius: 'var(--card-radius-compact)',
                        background: 'var(--ds-surface-sunken)',
                        boxShadow: 'inset 0 0 0 var(--border-width-default) var(--ds-border)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Docked Frame sidebar */}
                    <div
                        style={{
                            padding: 'var(--card-pad-default) var(--card-pad-compact)',
                            opacity: dimSidebar ? 0.55 : 1,
                        }}
                    >
                        <SkelLines widths={['80%', '95%', '70%', '85%', '65%']} gap="var(--stack-md)" />
                    </div>

                    {/* Page sheet */}
                    <div
                        style={{
                            position: 'relative',
                            background: 'var(--ds-surface)',
                            borderInlineStart: 'var(--border-width-default) solid var(--ds-border)',
                            padding: variant === 'navigation' ? 0 : 'var(--card-pad-default)',
                            opacity: variant === 'frame' ? 0.5 : 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--stack-md)',
                        }}
                    >
                        {variant === 'navigation' && (
                            <>
                                <div
                                    style={{
                                        position: 'relative',
                                        zIndex: 1,
                                        background: 'var(--ds-surface)',
                                        borderBottom: 'var(--border-width-default) solid var(--ds-border)',
                                        boxShadow: 'var(--ds-shadow-overflow)',
                                        padding: 'var(--card-pad-compact) var(--card-pad-default)',
                                    }}
                                >
                                    <SkelLines widths={['36%']} tall />
                                </div>
                                <div style={{ paddingInline: 'var(--card-pad-default)', paddingBottom: 'var(--card-pad-compact)', opacity: 0.65 }}>
                                    <HairlineRows widths={['84%', '68%', '76%', '60%']} />
                                </div>
                            </>
                        )}

                        {(variant === 'frame' || variant === 'page' || variant === 'surface-default') && (
                            <>
                                <SkelLines widths={['34%']} tall />
                                <HairlineRows widths={['85%', '70%', '78%', '64%', '72%']} />
                            </>
                        )}

                        {variant === 'non-blocking-overlay' && (
                            <>
                                <div style={{ opacity: 0.45, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                                    <SkelLines widths={['34%']} tall />
                                    <HairlineRows widths={['82%', '68%', '74%']} />
                                </div>
                                {/* Floating Popup */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        insetBlockStart: 'var(--card-pad-default)',
                                        insetInlineEnd: 'var(--card-pad-default)',
                                        width: '44%',
                                        padding: 'var(--card-pad-compact)',
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--ds-surface-overlay)',
                                        boxShadow: 'var(--ds-shadow-overlay)',
                                    }}
                                >
                                    <SkelLines widths={['80%', '60%', '70%']} />
                                </div>
                                {/* Floating Flag */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        insetBlockEnd: 'var(--card-pad-compact)',
                                        insetInlineStart: 'var(--card-pad-default)',
                                        width: '52%',
                                        padding: 'var(--card-pad-compact)',
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--ds-surface-overlay)',
                                        boxShadow: 'var(--ds-shadow-overlay)',
                                    }}
                                >
                                    <SkelLines widths={['75%', '48%']} />
                                </div>
                            </>
                        )}

                        {variant === 'blocking-overlay' && (
                            <>
                                <div style={{ opacity: 0.4, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                                    <SkelLines widths={['34%']} tall />
                                    <HairlineRows widths={['82%', '68%', '74%']} />
                                </div>
                            </>
                        )}

                        {variant === 'surface-sunken' && (
                            <>
                                <SkelLines widths={['32%']} tall />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--stack-sm)' }}>
                                    <div style={{ padding: 'var(--card-pad-compact)', borderRadius: 'var(--card-radius-compact)', background: 'var(--ds-surface-sunken)' }}>
                                        <SkelLines widths={['62%', '42%']} />
                                    </div>
                                    <div style={{ padding: 'var(--card-pad-compact)', borderRadius: 'var(--card-radius-compact)', background: 'var(--ds-surface-sunken)' }}>
                                        <SkelLines widths={['52%']} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1', padding: 'var(--card-pad-compact)', borderRadius: 'var(--card-radius-compact)', background: 'var(--ds-surface-sunken)' }}>
                                        <SkelLines widths={['70%', '48%']} />
                                    </div>
                                </div>
                            </>
                        )}

                        {variant === 'surface-raised' && (
                            <>
                                <SkelLines widths={['32%']} tall />
                                <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 'var(--stack-sm)', alignItems: 'stretch' }}>
                                    <div
                                        style={{
                                            padding: 'var(--card-pad-compact)',
                                            borderRadius: 'var(--card-radius-compact)',
                                            background: 'var(--ds-surface-raised)',
                                            boxShadow: 'var(--ds-shadow-raised)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 'var(--stack-md)',
                                        }}
                                    >
                                        <SkelLines widths={['64%', '44%']} />
                                        <span
                                            data-skeleton=""
                                            style={{
                                                display: 'block',
                                                marginTop: 'auto',
                                                width: '42%',
                                                height: 'var(--space-200)',
                                                borderRadius: 'var(--radius-sm)',
                                                background: 'var(--ds-background-brand-bold)',
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            padding: 'var(--card-pad-compact)',
                                            borderRadius: 'var(--card-radius-compact)',
                                            background: 'var(--ds-surface-sunken)',
                                        }}
                                    >
                                        <SkelLines widths={['58%']} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Full-shell Blanket + Modal for Blocking overlay */}
                    {variant === 'blocking-overlay' && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'var(--ds-blanket)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 'var(--card-pad-default)',
                            }}
                        >
                            <div
                                style={{
                                    width: '56%',
                                    padding: 'var(--card-pad-default)',
                                    borderRadius: 'var(--card-radius-compact)',
                                    background: 'var(--ds-surface-overlay)',
                                    boxShadow: 'var(--ds-shadow-blocking)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--stack-md)',
                                }}
                            >
                                <SkelLines widths={['54%']} tall />
                                <SkelLines widths={['90%', '72%']} />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--inline-sm)' }}>
                                    <span style={{ width: '24%', height: 'var(--space-200)', borderRadius: 'var(--radius-sm)', background: 'var(--ds-skeleton)' }} />
                                    <span style={{ width: '28%', height: 'var(--space-200)', borderRadius: 'var(--radius-sm)', background: 'var(--ds-background-brand-bold)' }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Token callouts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', alignItems: 'flex-start' }}>
                    {badges.map((token) => (
                        <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 'var(--inline-sm)' }}>
                            <span
                                aria-hidden="true"
                                style={{
                                    width: 'var(--space-200)',
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

/** Side-by-side row pairing a LayerDiagramPanel with its usage prose. */
export const LayerDetailRow = ({ variant, children }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, var(--card-min-width-md)), 1fr))',
            gap: 'var(--grid-gutter)',
            alignItems: 'start',
        }}
    >
        <div style={{ gridColumn: 'span 1' }}>
            <LayerDiagramPanel variant={variant} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', font: 'var(--body-default)', color: 'var(--ds-text)' }}>
            {children}
        </div>
    </div>
);

/* ----------------------------------------------------- by-template gallery */

const TemplateTile = ({ title, description, tokens, children }) => (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
        <div
            style={{
                boxSizing: 'border-box',
                minHeight: 'var(--image-xl)',
                padding: 'var(--card-pad-default)',
                borderRadius: 'var(--card-radius-compact)',
                background: 'var(--ds-surface)',
                boxShadow: 'inset 0 0 0 var(--border-width-default) var(--ds-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
            }}
        >
            {children}
        </div>
        <figcaption style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-025)' }}>
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
                    <TemplateTile title="Section" description="Default: heading, view bar, body" tokens="no surface · no shadow">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                            <SkelLines widths={['40%']} tall />
                            <SkelLines widths={['90%', '75%', '82%']} />
                        </div>
                    </TemplateTile>
                    <TemplateTile title="Section and its side" description="Default: two columns, set apart by the gap" tokens="no surface · no line">
                        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--grid-gutter)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                                <SkelLines widths={['50%']} tall />
                                <SkelLines widths={['90%', '75%', '82%']} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                                <SkelLines widths={['60%']} tall />
                                <SkelLines widths={['85%', '70%']} />
                            </div>
                        </div>
                    </TemplateTile>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                <h4 style={{ margin: 0, font: 'var(--heading-sm)', color: 'var(--ds-text)' }}>Table</h4>
                <div style={TEMPLATE_GRID_STYLE}>
                    <TemplateTile title="Table" description="Default, hairline rows, no head fill" tokens="--ds-border">
                        <HairlineRows widths={['50%', '85%', '70%', '78%']} />
                    </TemplateTile>
                    <TemplateTile title="Sticky header, scrolled" description="Navigation: rows pass under the header" tokens="--ds-shadow-overflow">
                        <div style={{ overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}>
                            <div
                                style={{
                                    position: 'relative',
                                    zIndex: 1,
                                    paddingBlock: 'var(--space-075)',
                                    background: 'var(--ds-surface)',
                                    borderBottom: 'var(--border-width-default) solid var(--ds-border)',
                                    boxShadow: 'var(--ds-shadow-overflow)',
                                }}
                            >
                                <SkelLines widths={['42%']} />
                            </div>
                            <HairlineRows widths={['70%', '85%', '60%']} />
                        </div>
                    </TemplateTile>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                <h4 style={{ margin: 0, font: 'var(--heading-sm)', color: 'var(--ds-text)' }}>Card</h4>
                <div style={TEMPLATE_GRID_STYLE}>
                    <TemplateTile title="Card at rest" description="Raised at rest, one focal card per view" tokens="--ds-surface-raised · --ds-shadow-raised">
                        <div
                            style={{
                                padding: 'var(--card-pad-compact)',
                                borderRadius: 'var(--card-radius-compact)',
                                background: 'var(--ds-surface-raised)',
                                boxShadow: 'var(--ds-shadow-raised)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--stack-md)',
                            }}
                        >
                            <SkelLines widths={['55%', '35%']} />
                            <span
                                data-skeleton=""
                                style={{
                                    display: 'block',
                                    width: '38%',
                                    height: 'var(--space-250)',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--ds-background-brand-bold)',
                                }}
                            />
                        </div>
                    </TemplateTile>
                    <TemplateTile title="Clickable card, hover" description="Lifts on hover: hovered raised surface, overlay shadow" tokens="--ds-surface-raised-hovered · --ds-shadow-overlay">
                        <div
                            style={{
                                padding: 'var(--card-pad-compact)',
                                borderRadius: 'var(--card-radius-compact)',
                                background: 'var(--ds-surface-raised-hovered)',
                                boxShadow: 'var(--ds-shadow-overlay)',
                            }}
                        >
                            <SkelLines widths={['60%', '40%']} />
                        </div>
                    </TemplateTile>
                    <TemplateTile title="Dragged card" description="Leaves the page for Non-blocking overlay" tokens="--ds-surface-overlay · --ds-shadow-overlay">
                        <div
                            style={{
                                padding: 'var(--card-pad-compact)',
                                borderRadius: 'var(--card-radius-compact)',
                                background: 'var(--ds-surface-overlay)',
                                boxShadow: 'var(--ds-shadow-overlay)',
                                transform: 'rotate(-2deg)',
                            }}
                        >
                            <SkelLines widths={['55%', '35%']} />
                        </div>
                    </TemplateTile>
                </div>
            </div>
        </div>
    </ElevationPanel>
);

/* ----------------------------------------------------- shadow ramp figures */

const RAMP_STEPS = [
    { id: 'raised', label: 'raised', surface: '--ds-surface-raised', shadow: '--ds-shadow-raised' },
    { id: 'overflow', label: 'overflow', surface: '--ds-surface', shadow: '--ds-shadow-overflow' },
    { id: 'overlay', label: 'overlay', surface: '--ds-surface-overlay', shadow: '--ds-shadow-overlay' },
    { id: 'blocking', label: 'blocking', surface: '--ds-surface-overlay', shadow: '--ds-shadow-blocking' },
];

/** Shadow ramp key figure: four shadows in layer order, shown side by side in light and dark. */
export const ShadowRampFigure = () => (
    <ElevationPanel>
        <div
            data-testid="shadow-ramp"
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, var(--card-min-width-md)), 1fr))',
                borderRadius: 'var(--card-radius-compact)',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 0 var(--border-width-default) var(--ds-border)',
            }}
        >
            {(['light', 'dark']).map((mode) => (
                <div
                    key={mode}
                    data-color-mode={mode}
                    style={{
                        background: 'var(--ds-surface)',
                        color: 'var(--ds-text)',
                        padding: 'var(--section-stack-md) var(--card-pad-default) var(--card-pad-default)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--stack-md)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {RAMP_STEPS.map((step, i) => (
                            <div
                                key={step.id}
                                data-shadow-step={step.id}
                                style={{
                                    width: 'var(--image-md)',
                                    height: 'var(--image-md)',
                                    borderRadius: 'var(--radius-full)',
                                    background: `var(${step.surface})`,
                                    boxShadow: `var(${step.shadow})`,
                                    marginInlineStart: i === 0 ? 0 : 'calc(-1 * var(--space-250))',
                                    position: 'relative',
                                    zIndex: i,
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--inline-sm)', width: '100%', maxWidth: 'calc(4 * var(--image-md))' }}>
                        {RAMP_STEPS.map((step) => (
                            <span
                                key={step.id}
                                style={{
                                    textAlign: 'center',
                                    font: 'var(--code-default)',
                                    color: 'var(--ds-text-subtle)',
                                }}
                            >
                                {step.label}
                            </span>
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

const formatLayerSummary = (layer) => {
    if (!layer) return '0';
    const pct = `${Math.round(layer.color.a * 1000) / 10}%`;
    if (layer.blur === 0 && layer.spread > 0) {
        return `${layer.x} ${layer.y} 0 ${layer.spread}px · ${pct}`;
    }
    return `${layer.x} ${layer.y}px ${layer.blur}px · ${pct}`;
};

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
            description: 'The border: a hairline ring; a 3:1 line under increased contrast.',
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

    const discStyle = (shadow) => ({
        width: 'var(--image-lg)',
        height: 'var(--image-lg)',
        borderRadius: 'var(--radius-full)',
        background: 'var(--ds-surface-overlay)',
        boxShadow: shadow,
    });

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
                            <div style={discStyle(part.boxShadow)} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-025)' }}>
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
                    <div style={discStyle('var(--ds-shadow-blocking)')} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-025)' }}>
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
