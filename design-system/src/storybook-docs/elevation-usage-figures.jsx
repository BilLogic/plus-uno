import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { animate } from 'motion';
import { useReducedMotion } from 'motion/react';
import { settleMsOf } from '@/lib/damping';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { C, Do, Dont, DoDont, RefTable } from '@/storybook-docs/foundation-blocks.jsx';
import { ElevationPanel } from '@/storybook-docs/elevation-folder-figures.jsx';
import { Illustration } from '@/storybook-docs/illustrations/Illustration.jsx';
import {
    Blanket,
    Layer,
    Rect,
    Rule,
    SkeletonBar,
} from '@/storybook-docs/illustrations/primitives.jsx';
import { Pointer } from '@/storybook-docs/illustrations/primitives-motion.jsx';
import { PAINT } from '@/storybook-docs/illustrations/paint.js';
import { usePageContrast } from '@/storybook-docs/lib/use-page-contrast.js';

/**
 * Kit-scale stage for Do/Don't and Color/Accessibility illustrations: 1 kit unit = 2px,
 * matching the 420x200 frame on boards EL-D4, EL-D5 and EL-D7 inside a 220x108 viewBox.
 */
const STAGE = { w: 220, h: 108 };
const FRAME = { x: 5, y: 4, w: 210, h: 100 };

const PageCanvas = ({ mode, contrast, children }) => {
    const pageContrast = usePageContrast();
    const resolvedContrast = contrast ?? pageContrast;
    return (
        <g
            {...(mode ? { 'data-color-mode': mode } : {})}
            {...(resolvedContrast ? { 'data-contrast-mode': resolvedContrast } : {})}
        >
            <Layer x={FRAME.x} y={FRAME.y} w={FRAME.w} h={FRAME.h} fill={PAINT.pageSurface} corner="card" />
            <Rect x={FRAME.x} y={FRAME.y} w={FRAME.w} h={FRAME.h} stroke={PAINT.frameDivider} corner="card" />
            {children}
        </g>
    );
};

const CardBars = ({ x, y, w, tone, headingTone }) => (
    <>
        <SkeletonBar x={x + 6} y={y + 6} w={Math.round((w - 12) * 0.6)} h={3.5} tone={headingTone} />
        <SkeletonBar x={x + 6} y={y + 13} w={Math.round((w - 12) * 0.4)} h={3.5} tone={tone} />
    </>
);

const TableRows = ({ x, y, w, widths }) => (
    <>
        {widths.map((pct, i) => {
            const rowY = y + i * 12;
            return (
                <React.Fragment key={i}>
                    <SkeletonBar x={x} y={rowY + 4} w={Math.round(w * pct)} h={3.5} />
                    <Rule x1={x} x2={x + w} y1={rowY + 12} y2={rowY + 12} stroke={PAINT.rowDivider} />
                </React.Fragment>
            );
        })}
    </>
);

/* ----------------------------------------------------- EL-D4 Golden rules */

/** Rule 1: Static numbers sit flat on Sunken cards vs every static card lifts. */
export const UsageFlatByDefault = () => (
    <DoDont>
        <Do caption="Static numbers sit flat on Sunken cards.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Three static Sunken cards above table rows">
                <PageCanvas>
                    {[0, 1, 2].map((i) => {
                        const cx = FRAME.x + 9 + i * 66;
                        const cy = FRAME.y + 9;
                        return (
                            <React.Fragment key={i}>
                                <Layer x={cx} y={cy} w={60} h={39} fill={PAINT.frameSunken} corner="card" />
                                <CardBars x={cx} y={cy} w={60} />
                            </React.Fragment>
                        );
                    })}
                    <TableRows x={FRAME.x + 9} y={FRAME.y + 56} w={192} widths={[0.85, 0.7]} />
                </PageCanvas>
            </Illustration>
        </Do>
        <Dont caption="Every static card lifts; nothing stands out.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Three static cards each carrying a raised shadow">
                <PageCanvas>
                    {[0, 1, 2].map((i) => {
                        const cx = FRAME.x + 9 + i * 66;
                        const cy = FRAME.y + 9;
                        return (
                            <React.Fragment key={i}>
                                <Layer x={cx} y={cy} w={60} h={39} fill={PAINT.cardSurface} shadow={PAINT.cardShadow} corner="card" />
                                <CardBars x={cx} y={cy} w={60} />
                            </React.Fragment>
                        );
                    })}
                    <TableRows x={FRAME.x + 9} y={FRAME.y + 56} w={192} widths={[0.85, 0.7]} />
                </PageCanvas>
            </Illustration>
        </Dont>
    </DoDont>
);

/** Rule 2: A clickable card lifts to Raised on hover vs a non-actionable card raised. */
export const UsageLiftMeansAction = () => (
    <DoDont>
        <Do caption="A clickable card lifts to Raised on hover.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Three action cards with the middle hovered card raised">
                <PageCanvas>
                    {[0, 1, 2].map((i) => {
                        const cx = FRAME.x + 9 + i * 66;
                        const cy = FRAME.y + 9;
                        const lifted = i === 1;
                        return (
                            <React.Fragment key={i}>
                                <Layer
                                    x={cx}
                                    y={cy}
                                    w={60}
                                    h={39}
                                    fill={lifted ? PAINT.cardSurface : PAINT.frameSunken}
                                    shadow={lifted ? PAINT.cardShadow : undefined}
                                    corner="card"
                                />
                                <SkeletonBar x={cx + 6} y={cy + 6} w={30} h={3.5} />
                                <Rect x={cx + 43} y={cy + 22} w={11} h={11} fill={PAINT.placeholderText} corner="full" />
                            </React.Fragment>
                        );
                    })}
                    <TableRows x={FRAME.x + 9} y={FRAME.y + 56} w={192} widths={[0.85, 0.7]} />
                </PageCanvas>
            </Illustration>
        </Do>
        <Dont caption="A card with nothing to press is raised.">
            <Illustration width={STAGE.w} height={STAGE.h} title="A static card without an action raised next to Sunken cards">
                <PageCanvas>
                    {[0, 1, 2].map((i) => {
                        const cx = FRAME.x + 9 + i * 66;
                        const cy = FRAME.y + 9;
                        const lifted = i === 0;
                        return (
                            <React.Fragment key={i}>
                                <Layer
                                    x={cx}
                                    y={cy}
                                    w={60}
                                    h={39}
                                    fill={lifted ? PAINT.cardSurface : PAINT.frameSunken}
                                    shadow={lifted ? PAINT.cardShadow : undefined}
                                    corner="card"
                                />
                                <CardBars x={cx} y={cy} w={60} />
                            </React.Fragment>
                        );
                    })}
                    <TableRows x={FRAME.x + 9} y={FRAME.y + 56} w={192} widths={[0.85, 0.7]} />
                </PageCanvas>
            </Illustration>
        </Dont>
    </DoDont>
);

/** Rule 3: One primary card is Raised; the rest are Sunken vs three lifts compete. */
export const UsageRaiseOneThing = () => (
    <DoDont>
        <Do caption="One primary card is Raised; the rest are Sunken.">
            <Illustration width={STAGE.w} height={STAGE.h} title="One raised primary card over two flat Sunken cards">
                <PageCanvas>
                    <Layer x={FRAME.x + 9} y={FRAME.y + 9} w={192} h={48} fill={PAINT.cardSurface} shadow={PAINT.cardShadow} corner="card" />
                    <SkeletonBar x={FRAME.x + 15} y={FRAME.y + 15} w={90} h={3.5} />
                    <SkeletonBar x={FRAME.x + 15} y={FRAME.y + 22} w={126} h={3.5} />
                    <Rect x={FRAME.x + 15} y={FRAME.y + 39} w={32} h={10} fill={PAINT.buttonPrimary} corner="button" />
                    {[0, 1].map((i) => {
                        const cx = FRAME.x + 9 + i * 99;
                        const cy = FRAME.y + 63;
                        return (
                            <React.Fragment key={i}>
                                <Layer x={cx} y={cy} w={93} h={25} fill={PAINT.frameSunken} corner="card" />
                                <CardBars x={cx} y={cy} w={93} />
                            </React.Fragment>
                        );
                    })}
                </PageCanvas>
            </Illustration>
        </Do>
        <Dont caption="Three lifts compete for attention.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Three raised cards competing on one page">
                <PageCanvas>
                    <Layer x={FRAME.x + 9} y={FRAME.y + 9} w={192} h={48} fill={PAINT.cardSurface} shadow={PAINT.cardShadow} corner="card" />
                    <CardBars x={FRAME.x + 9} y={FRAME.y + 9} w={192} />
                    {[0, 1].map((i) => {
                        const cx = FRAME.x + 9 + i * 99;
                        const cy = FRAME.y + 63;
                        return (
                            <React.Fragment key={i}>
                                <Layer x={cx} y={cy} w={93} h={25} fill={PAINT.cardSurface} shadow={PAINT.cardShadow} corner="card" />
                                <CardBars x={cx} y={cy} w={93} />
                            </React.Fragment>
                        );
                    })}
                </PageCanvas>
            </Illustration>
        </Dont>
    </DoDont>
);

/** Rule 4: Group with a surface color or a border, never a shadow. */
export const UsageGroupWithoutShadow = () => (
    <DoDont>
        <Do caption="A Section takes no surface; its cards are Sunken, or Default with a border.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Section with no surface holding a bordered Default card and two Sunken cards">
                <PageCanvas>
                    <SkeletonBar x={FRAME.x + 9} y={FRAME.y + 9} w={58} h={5.5} heading />
                    {[0, 1, 2].map((i) => {
                        const cx = FRAME.x + 9 + i * 66;
                        const cy = FRAME.y + 21;
                        return (
                            <React.Fragment key={i}>
                                <Layer
                                    x={cx}
                                    y={cy}
                                    w={60}
                                    h={39}
                                    fill={i === 0 ? PAINT.pageSurface : PAINT.frameSunken}
                                    corner="card"
                                />
                                {i === 0 && <Rect x={cx} y={cy} w={60} h={39} stroke={PAINT.illustrationEdge} corner="card" />}
                                <CardBars x={cx} y={cy} w={60} />
                            </React.Fragment>
                        );
                    })}
                </PageCanvas>
            </Illustration>
        </Do>
        <Dont caption="A shadow used as a group box; lifts nest inside lifts.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Shadowed group box holding three raised cards">
                <PageCanvas>
                    <Layer x={FRAME.x + 9} y={FRAME.y + 9} w={192} h={65} fill={PAINT.cardSurface} shadow={PAINT.cardShadow} corner="card" />
                    <SkeletonBar x={FRAME.x + 15} y={FRAME.y + 15} w={54} h={5.5} heading />
                    {[0, 1, 2].map((i) => {
                        const cx = FRAME.x + 15 + i * 61;
                        const cy = FRAME.y + 27;
                        return (
                            <React.Fragment key={i}>
                                <Layer x={cx} y={cy} w={55} h={39} fill={PAINT.cardSurface} shadow={PAINT.cardShadow} corner="card" />
                                <CardBars x={cx} y={cy} w={55} />
                            </React.Fragment>
                        );
                    })}
                </PageCanvas>
            </Illustration>
        </Dont>
    </DoDont>
);

/** Rule 5: A blocking overlay sits on the Blanket. */
export const UsageBlockingUsesBlanket = () => (
    <DoDont>
        <Do caption="The Modal blocks, so the page behind dims.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Modal sitting on the dimmed Blanket over page rows">
                <PageCanvas>
                    <SkeletonBar x={FRAME.x + 9} y={FRAME.y + 9} w={58} h={5.5} heading />
                    <TableRows x={FRAME.x + 9} y={FRAME.y + 21} w={192} widths={[0.85, 0.7, 0.78, 0.62]} />
                    <Blanket x={FRAME.x} y={FRAME.y} w={FRAME.w} h={FRAME.h} corner="card" />
                    <Layer x={FRAME.x + 55} y={FRAME.y + 20} w={100} h={60} fill={PAINT.modalSurface} shadow={PAINT.modalShadow} corner="modal" />
                    <SkeletonBar x={FRAME.x + 62} y={FRAME.y + 27} w={48} h={4.5} heading />
                </PageCanvas>
            </Illustration>
        </Do>
        <Dont caption="With no Blanket the page still looks usable.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Modal floating directly over an undimmed page">
                <PageCanvas>
                    <SkeletonBar x={FRAME.x + 9} y={FRAME.y + 9} w={58} h={5.5} heading />
                    <TableRows x={FRAME.x + 9} y={FRAME.y + 21} w={192} widths={[0.85, 0.7, 0.78, 0.62]} />
                    <Layer x={FRAME.x + 55} y={FRAME.y + 20} w={100} h={60} fill={PAINT.modalSurface} shadow={PAINT.modalShadow} corner="modal" />
                    <SkeletonBar x={FRAME.x + 62} y={FRAME.y + 27} w={48} h={4.5} heading />
                </PageCanvas>
            </Illustration>
        </Dont>
    </DoDont>
);

/** Rule 6: One blocking overlay at a time. */
export const UsageOneBlockingOverlay = () => (
    <DoDont>
        <Do caption="Finish or close one Modal before the next.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Single Modal on a dimmed Blanket">
                <PageCanvas>
                    <SkeletonBar x={FRAME.x + 9} y={FRAME.y + 9} w={58} h={5.5} heading />
                    <TableRows x={FRAME.x + 9} y={FRAME.y + 21} w={192} widths={[0.85, 0.7, 0.78, 0.62]} />
                    <Blanket x={FRAME.x} y={FRAME.y} w={FRAME.w} h={FRAME.h} corner="card" />
                    <Layer x={FRAME.x + 55} y={FRAME.y + 20} w={100} h={60} fill={PAINT.modalSurface} shadow={PAINT.modalShadow} corner="modal" />
                    <SkeletonBar x={FRAME.x + 62} y={FRAME.y + 27} w={48} h={4.5} heading />
                </PageCanvas>
            </Illustration>
        </Do>
        <Dont caption="A Modal over a Modal.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Two Modals stacked on top of each other">
                <PageCanvas>
                    <SkeletonBar x={FRAME.x + 9} y={FRAME.y + 9} w={58} h={5.5} heading />
                    <TableRows x={FRAME.x + 9} y={FRAME.y + 21} w={192} widths={[0.85, 0.7, 0.78, 0.62]} />
                    <Blanket x={FRAME.x} y={FRAME.y} w={FRAME.w} h={FRAME.h} corner="card" />
                    <Layer x={FRAME.x + 55} y={FRAME.y + 20} w={100} h={60} fill={PAINT.modalSurface} shadow={PAINT.modalShadow} corner="modal" />
                    <SkeletonBar x={FRAME.x + 62} y={FRAME.y + 27} w={48} h={4.5} heading />
                    <Layer x={FRAME.x + 75} y={FRAME.y + 35} w={100} h={55} fill={PAINT.modalSurface} shadow={PAINT.modalShadow} corner="modal" />
                </PageCanvas>
            </Illustration>
        </Dont>
    </DoDont>
);

/** Rule 7: No stroke on an elevated surface. */
export const UsageNoStrokeOnElevated = () => (
    <DoDont>
        <Do caption="The shadow’s edge is the border.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Overlay surface with shadow only and no border">
                <PageCanvas>
                    <Layer x={FRAME.x + 55} y={FRAME.y + 22} w={100} h={55} fill={PAINT.popupSurface} shadow={PAINT.popupShadow} corner="popup" />
                    <SkeletonBar x={FRAME.x + 61} y={FRAME.y + 28} w={62} h={3.5} />
                    <SkeletonBar x={FRAME.x + 61} y={FRAME.y + 35} w={48} h={3.5} />
                    <SkeletonBar x={FRAME.x + 61} y={FRAME.y + 42} w={70} h={3.5} />
                </PageCanvas>
            </Illustration>
        </Do>
        <Dont caption="A border plus a shadow draws the edge twice.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Overlay surface carrying both a shadow and a visible border stroke">
                <PageCanvas>
                    <Layer x={FRAME.x + 55} y={FRAME.y + 22} w={100} h={55} fill={PAINT.popupSurface} shadow={PAINT.popupShadow} corner="popup" />
                    <Rect x={FRAME.x + 55} y={FRAME.y + 22} w={100} h={55} stroke={PAINT.annotation} corner="popup" />
                    <SkeletonBar x={FRAME.x + 61} y={FRAME.y + 28} w={62} h={3.5} />
                    <SkeletonBar x={FRAME.x + 61} y={FRAME.y + 35} w={48} h={3.5} />
                    <SkeletonBar x={FRAME.x + 61} y={FRAME.y + 42} w={70} h={3.5} />
                </PageCanvas>
            </Illustration>
        </Dont>
    </DoDont>
);

/** Rule 8: Pair the surface with its shadow. */
export const UsagePairSurfaceShadow = () => (
    <DoDont>
        <Do caption="Raised surface with the raised shadow.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Card pairing --ds-surface-raised with --ds-shadow-raised">
                <PageCanvas>
                    <Layer x={FRAME.x + 55} y={FRAME.y + 22} w={100} h={55} fill={PAINT.cardSurface} shadow={PAINT.cardShadow} corner="card" />
                    <CardBars x={FRAME.x + 55} y={FRAME.y + 22} w={100} />
                </PageCanvas>
            </Illustration>
        </Do>
        <Dont caption="A Sunken fill with a shadow: neither flat nor raised.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Card mixing --ds-surface-sunken with --ds-shadow-raised">
                <PageCanvas>
                    <Layer x={FRAME.x + 55} y={FRAME.y + 22} w={100} h={55} fill={PAINT.frameSunken} shadow={PAINT.cardShadow} corner="card" />
                    <CardBars x={FRAME.x + 55} y={FRAME.y + 22} w={100} />
                </PageCanvas>
            </Illustration>
        </Dont>
    </DoDont>
);

/** Rule 9: Dark mode lightens only what floats. */
export const UsageDarkLightensFloating = () => (
    <DoDont>
        <Do caption="Cards stay flat and dark; only the Popup steps lighter.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Dark page with flat Sunken cards and a lighter floating Popup">
                <PageCanvas mode="dark">
                    {[0, 1].map((i) => {
                        const cx = FRAME.x + 9 + i * 66;
                        const cy = FRAME.y + 9;
                        return (
                            <React.Fragment key={i}>
                                <Layer x={cx} y={cy} w={60} h={39} fill={PAINT.frameSunken} corner="card" />
                                <CardBars x={cx} y={cy} w={60} />
                            </React.Fragment>
                        );
                    })}
                    <Layer x={FRAME.x + 120} y={FRAME.y + 35} w={75} h={48} fill={PAINT.popupSurface} shadow={PAINT.popupShadow} corner="popup" />
                    <CardBars x={FRAME.x + 120} y={FRAME.y + 35} w={75} />
                </PageCanvas>
            </Illustration>
        </Do>
        <Dont caption="Cards lighten too, so the Popup no longer stands apart.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Dark page where raised cards lighten to match the Popup">
                <PageCanvas mode="dark">
                    {[0, 1].map((i) => {
                        const cx = FRAME.x + 9 + i * 66;
                        const cy = FRAME.y + 9;
                        return (
                            <React.Fragment key={i}>
                                <Layer x={cx} y={cy} w={60} h={39} fill={PAINT.popupSurface} shadow={PAINT.cardShadow} corner="card" />
                                <CardBars x={cx} y={cy} w={60} />
                            </React.Fragment>
                        );
                    })}
                    <Layer x={FRAME.x + 120} y={FRAME.y + 35} w={75} h={48} fill={PAINT.popupSurface} shadow={PAINT.popupShadow} corner="popup" />
                    <CardBars x={FRAME.x + 120} y={FRAME.y + 35} w={75} />
                </PageCanvas>
            </Illustration>
        </Dont>
    </DoDont>
);

/** Rule 10 (Usage) & Control boundary (Accessibility): 3:1 edge vs shadow alone. */
export const ControlBoundaryDoDont = ({ everyMode = false }) => (
    <DoDont>
        <Do caption={everyMode ? 'A field’s edge is its boundary: 3:1 against the page, in every mode.' : 'A field’s edge is its boundary: 3:1 against the page.'}>
            <Illustration width={STAGE.w} height={STAGE.h} title="Text field bounded by a 3:1 border against the page">
                <PageCanvas>
                    <Layer x={FRAME.x + 45} y={FRAME.y + 40} w={120} h={20} fill={PAINT.fieldSurface} corner="field" />
                    <Rect x={FRAME.x + 45} y={FRAME.y + 40} w={120} h={20} stroke={PAINT.fieldBorder} corner="field" />
                    <SkeletonBar x={FRAME.x + 51} y={FRAME.y + 48} w={54} h={3.5} heading />
                </PageCanvas>
            </Illustration>
        </Do>
        <Dont caption="A shadow alone is not a boundary.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Text field relying on a shadow with no 3:1 border">
                <PageCanvas>
                    <Layer x={FRAME.x + 45} y={FRAME.y + 40} w={120} h={20} fill={PAINT.fieldSurface} shadow={PAINT.cardShadow} corner="field" />
                    <SkeletonBar x={FRAME.x + 51} y={FRAME.y + 48} w={54} h={3.5} heading />
                </PageCanvas>
            </Illustration>
        </Dont>
    </DoDont>
);

/** EL-D4 In motion: three looping spring figures (Hover, Pickup, Scroll) in the shared panel container. */
export const UsageInMotion = () => {
    const reduced = useReducedMotion();
    const clipId = useId();
    const [progress, setProgress] = useState(() => (reduced ? 1 : 0));

    useEffect(() => {
        if (reduced) {
            setProgress(1);
            return undefined;
        }
        const appearance = SPRINGS['appearance.default'].productive;
        const spatial = SPRINGS['spatial.default'].productive;
        const holdMs = Math.max(settleMsOf(appearance), settleMsOf(spatial)) * 2;
        let cancelled = false;
        let activeControls = null;
        let timerId = null;

        const runCycle = (target) => {
            if (cancelled) return;
            activeControls = animate(target === 1 ? 0 : 1, target, {
                ...(target === 1 ? spatial : appearance),
                onUpdate: (v) => {
                    if (!cancelled) setProgress(v);
                },
            });
            activeControls.then(() => {
                if (cancelled) return;
                timerId = window.setTimeout(() => runCycle(target === 1 ? 0 : 1), holdMs);
            });
        };

        timerId = window.setTimeout(() => runCycle(1), Math.round(holdMs * 0.5));
        return () => {
            cancelled = true;
            if (timerId !== null) window.clearTimeout(timerId);
            activeControls?.stop?.();
        };
    }, [reduced]);

    const t = Math.max(0, Math.min(1, progress));
    const pointerX = 128 - t * 20;
    const pointerY = 74 - t * 18;
    const pickX = 22 + t * 62;
    const pickY = 28 - t * 4;
    const scrollOffset = t * 20;

    const captionStyle = { margin: 0, font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' };
    const cardWrap = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' };
    return (
        <ElevationPanel data-testid="usage-in-motion" data-reduced-motion={reduced ? 'true' : 'false'}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-sm), 1fr))', gap: 'var(--grid-gutter)' }}>
                <figure style={{ margin: 0, ...cardWrap }}>
                    <Illustration width={160} height={100} title="Clickable Sunken card fading in place to the raised surface and shadow on hover">
                        <Layer x={10} y={10} w={140} h={80} fill={PAINT.pageSurface} corner="card" />
                        <Layer x={30} y={22} w={100} h={56} fill={PAINT.frameSunken} corner="card" />
                        <g opacity={t}>
                            <Layer x={30} y={22} w={100} h={56} fill={PAINT.cardSurface} shadow={PAINT.cardShadow} corner="card" />
                        </g>
                        <CardBars x={30} y={22} w={100} />
                        <g opacity={0.25 + t * 0.75}>
                            <Pointer x={pointerX} y={pointerY} />
                        </g>
                    </Illustration>
                    <figcaption style={captionStyle}>Hover: a clickable Sunken card fades to the raised pair. Nothing moves.</figcaption>
                </figure>
                <figure style={{ margin: 0, ...cardWrap }}>
                    <Illustration width={160} height={100} title="Dragged card lifted to the overlay surface and shadow while moving">
                        <Layer x={10} y={10} w={140} h={80} fill={PAINT.pageSurface} corner="card" />
                        <Layer x={22} y={28} w={54} h={44} fill={PAINT.frameSunken} corner="card" />
                        <g opacity={1 - t}>
                            <Layer x={pickX} y={pickY} w={54} h={44} fill={PAINT.frameSunken} corner="card" />
                        </g>
                        <g opacity={t}>
                            <Layer x={pickX} y={pickY} w={54} h={44} fill={PAINT.popupSurface} shadow={PAINT.popupShadow} corner="card" />
                        </g>
                        <CardBars x={pickX} y={pickY} w={54} />
                        <Pointer x={pickX + 32} y={pickY + 28} accent />
                    </Illustration>
                    <figcaption style={captionStyle}>Pickup: a dragged card takes the overlay pair and follows the pointer.</figcaption>
                </figure>
                <figure style={{ margin: 0, ...cardWrap }}>
                    <Illustration width={160} height={100} title="Sticky table header showing the overflow shadow while rows scroll under it">
                        <defs>
                            <clipPath id={clipId}>
                                <rect x={10} y={26} width={140} height={64} />
                            </clipPath>
                        </defs>
                        <Layer x={10} y={10} w={140} h={80} fill={PAINT.pageSurface} corner="card" />
                        <Rect x={10} y={10} w={140} h={80} stroke={PAINT.frameDivider} corner="card" />
                        <g clipPath={`url(#${clipId})`}>
                            <g transform={`translate(0 ${-scrollOffset})`}>
                                <TableRows x={16} y={30} w={128} widths={[0.75, 0.58, 0.82, 0.64, 0.72, 0.54]} />
                            </g>
                        </g>
                        <Layer x={10} y={10} w={140} h={16} fill={PAINT.pageSurface} />
                        <g opacity={t}>
                            <Layer x={10} y={10} w={140} h={16} fill={PAINT.pageSurface} shadow={PAINT.overflowShadow} />
                        </g>
                        <SkeletonBar x={16} y={16} w={48} h={3.5} heading />
                        <Rule x1={10} x2={150} y1={26} y2={26} stroke={PAINT.target} />
                    </Illustration>
                    <figcaption style={captionStyle}>Scroll: the sticky header takes the overflow shadow only while rows pass under it.</figcaption>
                </figure>
            </div>
        </ElevationPanel>
    );
};

/* ----------------------------------------------------------- EL-D5 Color */

const COLOR_TOKENS = [
    { token: '--ds-surface-sunken', usedBy: 'Frame; Sunken cards, empty box' },
    { token: '--ds-surface', usedBy: 'Page · Default' },
    { token: '--ds-surface-raised', usedBy: 'Page · Raised' },
    { token: '--ds-surface-overlay', usedBy: 'Layer 3 and Layer 4' },
];

const toHex = (value) => {
    const match = String(value ?? '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return value || '—';
    return `#${match.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
};

const SwatchCell = ({ mode, token, hex }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-sm)' }}>
        <span
            data-color-mode={mode}
            style={{
                display: 'inline-block',
                width: 'var(--icon-md)',
                height: 'var(--icon-md)',
                borderRadius: 'var(--radius-sm)',
                background: `var(${token})`,
                boxShadow: 'inset 0 0 0 var(--border-width-default) var(--ds-border)',
                flex: 'none',
            }}
        />
        <C>{hex}</C>
    </span>
);

/** Live surface color table for Elevation › Color, computing Light/Dark hex from shipped tokens. */
export const ColorSurfaceTable = () => {
    const lightRef = useRef(null);
    const darkRef = useRef(null);
    const [hexes, setHexes] = useState({ light: {}, dark: {} });

    const measure = useCallback(() => {
        const readMode = (el) => {
            if (!el) return {};
            const cs = getComputedStyle(el);
            return Object.fromEntries(COLOR_TOKENS.map(({ token }) => {
                el.style.backgroundColor = `var(${token})`;
                return [token, toHex(cs.backgroundColor)];
            }));
        };
        setHexes({ light: readMode(lightRef.current), dark: readMode(darkRef.current) });
    }, []);

    useLayoutEffect(() => {
        measure();
        const observer = new MutationObserver(measure);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode', 'data-contrast-mode'] });
        return () => observer.disconnect();
    }, [measure]);

    return (
        <div data-testid="color-surface-table">
            <span ref={lightRef} data-color-mode="light" hidden />
            <span ref={darkRef} data-color-mode="dark" hidden />
            <RefTable
                head={['Token', 'Used by', 'Light', 'Dark']}
                rows={COLOR_TOKENS.map(({ token, usedBy }) => [
                    <C key="t">{token}</C>,
                    usedBy,
                    <SwatchCell key="l" mode="light" token={token} hex={hexes.light[token] ?? '—'} />,
                    <SwatchCell key="d" mode="dark" token={token} hex={hexes.dark[token] ?? '—'} />,
                ])}
            />
        </div>
    );
};

/** Color Pair 1: Swap the surface; never stack it. */
export const ColorSwapNeverStack = () => (
    <DoDont>
        <Do caption="A status card swaps Sunken for its status background (--ds-background-warning).">
            <Illustration width={STAGE.w} height={STAGE.h} title="Warning status card beside a Sunken card on the page">
                <PageCanvas>
                    <Layer x={FRAME.x + 10} y={FRAME.y + 22} w={115} h={56} fill="var(--ds-background-warning)" corner="card" />
                    <Rect x={FRAME.x + 17} y={FRAME.y + 29} w={8} h={8} fill="var(--ds-icon-warning)" corner="full" />
                    <SkeletonBar x={FRAME.x + 29} y={FRAME.y + 31} w={74} h={4} />
                    <SkeletonBar x={FRAME.x + 17} y={FRAME.y + 44} w={80} h={4} />
                    <SkeletonBar x={FRAME.x + 17} y={FRAME.y + 52} w={50} h={4} />
                    <Layer x={FRAME.x + 132} y={FRAME.y + 22} w={68} h={56} fill={PAINT.frameSunken} corner="card" />
                    <CardBars x={FRAME.x + 132} y={FRAME.y + 22} w={68} />
                </PageCanvas>
            </Illustration>
        </Do>
        <Dont caption="A colored region holding cards. Color goes on the card, one step, like Sunken.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Colored region wrapping two white cards">
                <PageCanvas>
                    <Layer x={FRAME.x + 28} y={FRAME.y + 22} w={154} h={56} fill="var(--ds-background-warning)" corner="card" />
                    {[0, 1].map((i) => {
                        const cx = FRAME.x + 34 + i * 74;
                        const cy = FRAME.y + 28;
                        return (
                            <React.Fragment key={i}>
                                <Layer x={cx} y={cy} w={68} h={44} fill={PAINT.pageSurface} corner="card" />
                                <CardBars x={cx} y={cy} w={68} />
                            </React.Fragment>
                        );
                    })}
                </PageCanvas>
            </Illustration>
        </Dont>
    </DoDont>
);

/** Color Pair 2: Keep the shadow with the color. */
export const ColorKeepShadow = () => (
    <DoDont>
        <Do caption="The primary card may swap Raised for the brand surface (--ds-background-brand-subtlest); it keeps --ds-shadow-raised.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Primary brand card keeping --ds-shadow-raised beside a Sunken card">
                <PageCanvas>
                    <Layer
                        x={FRAME.x + 10}
                        y={FRAME.y + 22}
                        w={115}
                        h={56}
                        fill="var(--ds-background-brand-subtlest)"
                        shadow={PAINT.cardShadow}
                        corner="card"
                    />
                    <CardBars x={FRAME.x + 10} y={FRAME.y + 22} w={115} />
                    <Rect x={FRAME.x + 17} y={FRAME.y + 60} w={36} h={11} fill={PAINT.buttonPrimary} corner="button" />
                    <Layer x={FRAME.x + 132} y={FRAME.y + 22} w={68} h={56} fill={PAINT.frameSunken} corner="card" />
                    <CardBars x={FRAME.x + 132} y={FRAME.y + 22} w={68} />
                </PageCanvas>
            </Illustration>
        </Do>
        <Dont caption="The brand card drops its shadow: it now reads as a status, not the one thing to act on.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Primary brand card without its shadow beside a Sunken card">
                <PageCanvas>
                    <Layer
                        x={FRAME.x + 10}
                        y={FRAME.y + 22}
                        w={115}
                        h={56}
                        fill="var(--ds-background-brand-subtlest)"
                        corner="card"
                    />
                    <CardBars x={FRAME.x + 10} y={FRAME.y + 22} w={115} />
                    <Rect x={FRAME.x + 17} y={FRAME.y + 60} w={36} h={11} fill={PAINT.buttonPrimary} corner="button" />
                    <Layer x={FRAME.x + 132} y={FRAME.y + 22} w={68} h={56} fill={PAINT.frameSunken} corner="card" />
                    <CardBars x={FRAME.x + 132} y={FRAME.y + 22} w={68} />
                </PageCanvas>
            </Illustration>
        </Dont>
    </DoDont>
);

/** Color Pair 3: Solid color only (truth-rule: omits unshipped material clause). */
export const ColorSolidOnly = () => (
    <DoDont>
        <Do caption="A selected card: --ds-background-selected with a --ds-border-selected edge, never color alone.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Middle selected card with --ds-background-selected fill and --ds-border-selected edge">
                <PageCanvas>
                    {[0, 1, 2].map((i) => {
                        const cx = FRAME.x + 10 + i * 65;
                        const cy = FRAME.y + 22;
                        const selected = i === 1;
                        return (
                            <React.Fragment key={i}>
                                <Layer
                                    x={cx}
                                    y={cy}
                                    w={60}
                                    h={56}
                                    fill={selected ? 'var(--ds-background-selected)' : PAINT.frameSunken}
                                    corner="card"
                                />
                                {selected && <Rect x={cx} y={cy} w={60} h={56} stroke="var(--ds-border-selected)" corner="card" />}
                                <CardBars x={cx} y={cy} w={60} />
                            </React.Fragment>
                        );
                    })}
                </PageCanvas>
            </Illustration>
        </Do>
        <Dont caption="A translucent tint on a card or overlay.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Two cards painted with translucent tinted fills and shadows">
                <PageCanvas>
                    <Layer
                        x={FRAME.x + 10}
                        y={FRAME.y + 22}
                        w={92}
                        h={56}
                        fill="var(--ds-background-accent-blue-subtler)"
                        shadow={PAINT.popupShadow}
                        corner="card"
                    />
                    <CardBars x={FRAME.x + 10} y={FRAME.y + 22} w={92} />
                    <Layer
                        x={FRAME.x + 108}
                        y={FRAME.y + 22}
                        w={92}
                        h={56}
                        fill="var(--ds-background-accent-yellow-subtler)"
                        shadow={PAINT.popupShadow}
                        corner="card"
                    />
                    <CardBars x={FRAME.x + 108} y={FRAME.y + 22} w={92} />
                </PageCanvas>
            </Illustration>
        </Dont>
    </DoDont>
);

/** Color Pair 4: Color means brand, status or selection. */
export const ColorMeaning = () => (
    <DoDont>
        <Do caption="A success card says so with its color, an icon and words.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Success status card with icon and text bars beside a Sunken card">
                <PageCanvas>
                    <Layer x={FRAME.x + 10} y={FRAME.y + 22} w={115} h={56} fill="var(--ds-background-success)" corner="card" />
                    <Rect x={FRAME.x + 17} y={FRAME.y + 29} w={8} h={8} fill="var(--ds-icon-success)" corner="full" />
                    <SkeletonBar x={FRAME.x + 29} y={FRAME.y + 31} w={64} h={4} />
                    <SkeletonBar x={FRAME.x + 17} y={FRAME.y + 44} w={80} h={4} />
                    <SkeletonBar x={FRAME.x + 17} y={FRAME.y + 52} w={46} h={4} />
                    <Layer x={FRAME.x + 132} y={FRAME.y + 22} w={68} h={56} fill={PAINT.frameSunken} corner="card" />
                    <CardBars x={FRAME.x + 132} y={FRAME.y + 22} w={68} />
                </PageCanvas>
            </Illustration>
        </Do>
        <Dont caption="A rainbow of cards that mean nothing.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Three decorative cards in unrelated accent fills">
                <PageCanvas>
                    {[
                        'var(--ds-background-accent-blue-subtler)',
                        'var(--ds-background-accent-purple-subtler)',
                        'var(--ds-background-accent-green-subtler)',
                    ].map((fill, i) => {
                        const cx = FRAME.x + 10 + i * 65;
                        const cy = FRAME.y + 22;
                        return (
                            <React.Fragment key={fill}>
                                <Layer x={cx} y={cy} w={60} h={56} fill={fill} corner="card" />
                                <CardBars x={cx} y={cy} w={60} />
                            </React.Fragment>
                        );
                    })}
                </PageCanvas>
            </Illustration>
        </Dont>
    </DoDont>
);

/** Color Pair 5: Dark mode — pair a lighter surface with its shadow. */
export const ColorDarkMode = () => (
    <DoDont>
        <Do caption="The overlay steps lighter in dark and keeps its shadow, so it floats in both modes.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Overlay with --ds-surface-overlay and --ds-shadow-overlay in light and dark modes">
                {['light', 'dark'].map((mode, idx) => {
                    const py = 4 + idx * 52;
                    return (
                        <g key={mode} data-color-mode={mode}>
                            <Layer x={FRAME.x} y={py} w={FRAME.w} h={48} fill={PAINT.pageSurface} corner="card" />
                            <Rect x={FRAME.x} y={py} w={FRAME.w} h={48} stroke={PAINT.frameDivider} corner="card" />
                            <Layer x={FRAME.x + 30} y={py + 8} w={150} h={32} fill={PAINT.popupSurface} shadow={PAINT.popupShadow} corner="popup" />
                            <Rect x={FRAME.x + 38} y={py + 18} w={12} h={12} fill={PAINT.placeholderText} corner="full" />
                            <SkeletonBar x={FRAME.x + 56} y={py + 18} w={84} h={3.5} />
                            <SkeletonBar x={FRAME.x + 56} y={py + 26} w={54} h={3.5} />
                        </g>
                    );
                })}
            </Illustration>
        </Do>
        <Dont caption="Lighter fill, no shadow token: fine in dark, flat and lost in light.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Overlay surface without a shadow token, blending into the light page">
                {['light', 'dark'].map((mode, idx) => {
                    const py = 4 + idx * 52;
                    return (
                        <g key={mode} data-color-mode={mode}>
                            <Layer x={FRAME.x} y={py} w={FRAME.w} h={48} fill={PAINT.pageSurface} corner="card" />
                            <Rect x={FRAME.x} y={py} w={FRAME.w} h={48} stroke={PAINT.frameDivider} corner="card" />
                            <Layer x={FRAME.x + 30} y={py + 8} w={150} h={32} fill={PAINT.popupSurface} corner="popup" />
                            <Rect x={FRAME.x + 30} y={py + 8} w={150} h={32} stroke={PAINT.frameDivider} corner="popup" />
                            <Rect x={FRAME.x + 38} y={py + 18} w={12} h={12} fill={PAINT.placeholderText} corner="full" />
                            <SkeletonBar x={FRAME.x + 56} y={py + 18} w={84} h={3.5} />
                            <SkeletonBar x={FRAME.x + 56} y={py + 26} w={54} h={3.5} />
                        </g>
                    );
                })}
            </Illustration>
        </Dont>
    </DoDont>
);

/* --------------------------------------------------- EL-D7 Accessibility */

/** EL-D7 Pair 2 (two Dos): clickable card with no chevron takes 3:1 edge; static grouping needs no edge. */
export const AccessibilityCardEdges = () => (
    <DoDont>
        <Do caption="A clickable card with no Button or chevron takes a 3:1 edge.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Clickable Sunken card carrying a 3:1 border">
                <PageCanvas>
                    <Layer x={FRAME.x + 50} y={FRAME.y + 26} w={110} h={48} fill={PAINT.frameSunken} corner="card" />
                    <Rect x={FRAME.x + 50} y={FRAME.y + 26} w={110} h={48} stroke={PAINT.fieldBorder} corner="card" />
                    <CardBars x={FRAME.x + 50} y={FRAME.y + 26} w={110} />
                </PageCanvas>
            </Illustration>
        </Do>
        <Do caption="Static grouping needs no edge: text and layout carry it.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Static Sunken card with no border">
                <PageCanvas>
                    <Layer x={FRAME.x + 50} y={FRAME.y + 26} w={110} h={48} fill={PAINT.frameSunken} corner="card" />
                    <CardBars x={FRAME.x + 50} y={FRAME.y + 26} w={110} />
                </PageCanvas>
            </Illustration>
        </Do>
    </DoDont>
);

/** EL-D7 Pair 3: Cards in forced colors keep their 1px transparent border vs losing their edges. */
export const AccessibilityForcedColors = () => (
    <DoDont>
        <Do caption="In forced colors, each card’s transparent border becomes its edge.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Two cards in forced colors keeping visible hairline borders">
                <g data-color-mode="dark" data-contrast-mode="more">
                    <Layer x={FRAME.x} y={FRAME.y} w={FRAME.w} h={FRAME.h} fill={PAINT.frameSunken} corner="card" />
                    {[0, 1].map((i) => {
                        const cx = FRAME.x + 25 + i * 84;
                        const cy = FRAME.y + 26;
                        return (
                            <React.Fragment key={i}>
                                <Rect x={cx} y={cy} w={76} h={48} stroke={PAINT.glyph} corner="card" />
                                <CardBars x={cx} y={cy} w={76} tone={PAINT.glyph} headingTone={PAINT.glyph} />
                            </React.Fragment>
                        );
                    })}
                </g>
            </Illustration>
        </Do>
        <Dont caption="With no border, the cards lose their edges.">
            <Illustration width={STAGE.w} height={STAGE.h} title="Two cards in forced colors without borders, losing their edges">
                <g data-color-mode="dark" data-contrast-mode="more">
                    <Layer x={FRAME.x} y={FRAME.y} w={FRAME.w} h={FRAME.h} fill={PAINT.frameSunken} corner="card" />
                    {[0, 1].map((i) => {
                        const cx = FRAME.x + 25 + i * 84;
                        const cy = FRAME.y + 26;
                        return (
                            <CardBars key={i} x={cx} y={cy} w={76} tone={PAINT.glyph} headingTone={PAINT.glyph} />
                        );
                    })}
                </g>
            </Illustration>
        </Dont>
    </DoDont>
);
