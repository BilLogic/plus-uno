import React from 'react';
import { HAIRLINE, PAINT } from '../illustrations/paint.js';
import {
    Backdrop,
    Breadcrumb,
    PageSheet,
    ButtonShape,
    CardBox,
    Field,
    Modal,
    Rect,
    Row,
    Rule,
    Section,
    Sidebar,
    SkeletonBar,
    Popup,
} from '../illustrations/primitives.jsx';
import { IsoStack } from '../illustrations/shapes.jsx';
import { HeroDrawing, FRAME_UNITS, STAGE_UNITS } from './HeroDrawing.jsx';
import { AppWindow } from './HeroWindow.jsx';

/**
 * The Templates heroes: each template's anatomy blocked out, with the template
 * itself ringed by the one accent. Drawn from the illustration kit and painted
 * by its roles; text is soft skeleton bars. Coordinates are kit units (1 = 2px)
 * from the stage's corner. Every surface on the hero ground carries a hairline
 * in `illustrationEdge`, so none blends into the sunken ground.
 *
 * Alignment, from `guidelines/composition/layout.md`: a view bar's controls
 * share the content's left and right edges, so a Section's heading starts at
 * the rows' left edge and its last control ends at the content's right edge. A
 * Popup opens bottom-end: its end edge meets its trigger's end edge and it sits
 * 4 below.
 */

/** A page-surface rectangle with its edge, or the ring when it is the subject. */
const PageFill = ({ x, y, w, h, ring = false, corner = 'window' }) => (
    <PageSheet x={x} y={y} w={w} h={h} accent={ring} corner={corner} />
);

/** Rows of a table between two content edges. */
const Rows = ({ x, w, y, n, pitch = 14 }) => (
    <>
        {Array.from({ length: n }, (_, i) => (
            <Row key={i} x={x} y={y + i * pitch} w={w} />
        ))}
    </>
);

/** The whole frame the hero sits in, in stage units: the backdrop covers all of it. */
const WHOLE = {
    x: -(FRAME_UNITS.w - STAGE_UNITS.w) / 2,
    y: -(FRAME_UNITS.h - STAGE_UNITS.h) / 2,
    w: FRAME_UNITS.w,
    h: FRAME_UNITS.h,
};

export const OverviewHero = () => (
    <HeroDrawing>
        <IsoStack x={50} y={-4} w={200} h={168} layers={4} accent />
    </HeroDrawing>
);

export const FrameHero = () => {
    const f = { x: 20, y: 6, w: 260, h: 148 };
    const panelW = 70;
    return (
        <HeroDrawing>
            <AppWindow {...f} panel={panelW} ring>
                {(page) => (
                    <>
                        {/* The Page's header row (the breadcrumb), then its content. */}
                        <Breadcrumb x={page.x + 10} y={f.y + 8} w={50} count={2} />
                        <Rows x={page.x + 10} w={page.w - 20} y={f.y + 24} n={7} pitch={16} />
                        {/* The Panel area, docked: a title and lines. */}
                        <SkeletonBar x={f.x + f.w - panelW + 10} y={f.y + 10} w={30} h={5} heading />
                        {[0, 1, 2].map((i) => (
                            <SkeletonBar key={i} x={f.x + f.w - panelW + 10} y={f.y + 26 + i * 10} w={48 - i * 8} />
                        ))}
                    </>
                )}
            </AppWindow>
        </HeroDrawing>
    );
};

export const PageHero = () => {
    const f = { x: 20, y: 6, w: 260, h: 148 };
    const pad = 12;
    return (
        <HeroDrawing>
            <AppWindow {...f} ringPage>
                {(page) => (
                    <>
                        {/* The Page's title and its actions, then Sections with no fill: a heading and rows. */}
                        <SkeletonBar x={page.x + pad} y={page.y + 12} w={60} h={6} heading />
                        <SkeletonBar x={page.x + pad} y={page.y + 24} w={100} />
                        <ButtonShape x={page.x + page.w - pad - 30} y={page.y + 12} w={30} appearance="primary" />
                        <Section x={page.x + pad} y={page.y + 44} w={page.w - 2 * pad} h={42} rows={2} />
                        <Section x={page.x + pad} y={page.y + 96} w={page.w - 2 * pad} h={42} rows={2} />
                    </>
                )}
            </AppWindow>
        </HeroDrawing>
    );
};

export const SectionHero = () => {
    const s = { x: 0, y: 12, w: 300, h: 136 };
    const left = s.x + 14;
    const right = s.x + s.w - 14;
    const side = { x: right - 76, y: s.y + 44, w: 76, h: 52 };
    return (
        <HeroDrawing>
            <PageFill {...s} ring />
            {/* The header: heading at the content's left edge. */}
            <SkeletonBar x={left} y={s.y + 12} w={44} h={5} accent heading />
            <SkeletonBar x={left + 52} y={s.y + 13} w={40} />
            <Rule x1={left} x2={left + 30} y1={s.y + 26} y2={s.y + 26} stroke={PAINT.tabSelected} thick />
            {/* The view bar: its last control ends at the content's right edge. */}
            <Rect x={right - 10 - 4 - 40} y={s.y + 10} w={40} h={8} fill={PAINT.buttonDefault} stroke={PAINT.buttonDefaultBorder} corner="button" />
            <Rect x={right - 10} y={s.y + 10} w={10} h={8} fill={PAINT.buttonDefault} stroke={PAINT.buttonDefaultBorder} corner="button" />
            {/* The body, and the side beside it. */}
            <Rows x={left} w={side.x - 14 - left} y={s.y + 38} n={6} pitch={14} />
            <CardBox {...side} />
            <SkeletonBar x={side.x + 8} y={side.y + 10} w={40} h={4} heading />
            <SkeletonBar x={side.x + 8} y={side.y + 22} w={56} />
            <SkeletonBar x={side.x + 8} y={side.y + 30} w={46} />
        </HeroDrawing>
    );
};

export const CardHero = () => {
    const c = { x: 100, y: 2, w: 100, h: 156 };
    return (
        <HeroDrawing>
            <CardBox {...c} accent />
            <Rect x={c.x + 8} y={c.y + 8} w={c.w - 16} h={62} fill={PAINT.placeholderText} corner="cardImage" />
            <SkeletonBar x={c.x + 8} y={c.y + 82} w={52} h={5} heading />
            <SkeletonBar x={c.x + 8} y={c.y + 96} w={c.w - 16} />
            <SkeletonBar x={c.x + 8} y={c.y + 104} w={c.w - 36} />
            {/* The footer sits below the body, left-aligned, with no divider. */}
            <ButtonShape x={c.x + 8} y={c.y + 134} w={38} />
        </HeroDrawing>
    );
};

export const TableHero = () => {
    const t = { x: 18, y: 14, w: 264, h: 132 };
    const left = t.x + 12;
    const right = t.x + t.w - 12;
    const cols = [left + 18, left + 100, left + 156, left + 204];
    const rowY = (i) => t.y + 28 + i * 17;
    return (
        <HeroDrawing>
            <PageFill {...t} ring />
            {cols.map((cx, i) => (
                <SkeletonBar key={cx} x={cx} y={t.y + 12} w={i === 0 ? 40 : 26} h={4} heading />
            ))}
            <Rect x={t.x + 4} y={rowY(1)} w={t.w - 8} h={17} fill={PAINT.rowSelected} corner="tab" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <React.Fragment key={i}>
                    <Rule x1={left} x2={right} y1={rowY(i)} y2={rowY(i)} stroke={PAINT.rowDivider} />
                    {/* The row checkbox is the selection cue. */}
                    <Rect x={left + 1} y={rowY(i) + 5.5} w={6} h={6} fill={i === 1 ? PAINT.accent : PAINT.fieldSurface} stroke={i === 1 ? undefined : PAINT.fieldBorder} corner="icon" />
                    {cols.map((cx, k) => (
                        <SkeletonBar key={cx} x={cx} y={rowY(i) + 6.5} w={k === 0 ? 62 : 24} />
                    ))}
                </React.Fragment>
            ))}
        </HeroDrawing>
    );
};

export const FormHero = () => {
    const col = { x: 75, y: -20, w: 150, h: 200 };
    const x = col.x + 16;
    const w = col.w - 32;
    const half = (w - 8) / 2;
    return (
        <HeroDrawing>
            <PageFill {...col} ring />
            <Field x={x} y={2} w={w} />
            <Field x={x} y={38} w={w} />
            <Field x={x} y={74} w={half} />
            <Field x={x + half + 8} y={74} w={half} />
            <ButtonShape x={x + w - 34 - 4 - 34} y={130} w={34} />
            <ButtonShape x={x + w - 34} y={130} w={34} appearance="primary" />
        </HeroDrawing>
    );
};

export const ModalHero = () => (
    <HeroDrawing>
        {/* The page behind: rows across the whole frame. */}
        <PageSheet {...WHOLE} />
        <Rows x={WHOLE.x} w={WHOLE.w} y={WHOLE.y + 6} n={14} pitch={14} />
        {/* The Backdrop covers the whole frame; the Modal sits centered on it, ringed. */}
        <Backdrop {...WHOLE} />
        <Modal x={80} y={26} w={140} h={100} accent divider={false} closeButton />
    </HeroDrawing>
);

export const PanelHero = () => {
    const f = { x: 20, y: 6, w: 260, h: 148 };
    const panelW = 100;
    const panel = { x: f.x + f.w - panelW, y: f.y, w: panelW, h: f.h };
    return (
        <HeroDrawing>
            <AppWindow {...f} panel={panelW}>
                {(page) => (
                    <>
                        <SkeletonBar x={page.x + 10} y={f.y + 10} w={48} h={5} heading />
                        <Rows x={page.x + 10} w={page.w - 20} y={f.y + 26} n={7} pitch={16} />
                        {/* The Panel: a title, a form, its commit at the end. */}
                        <SkeletonBar x={panel.x + 8} y={panel.y + 10} w={panel.w * 0.4} h={5} accent heading />
                        {[0, 1].map((i) => (
                            <SkeletonBar key={i} x={panel.x + 8} y={panel.y + 26 + i * 10} w={panel.w * 0.7 - i * 14} />
                        ))}
                        <Field x={panel.x + 8} y={f.y + 62} w={panel.w - 16} />
                        <Field x={panel.x + 8} y={f.y + 92} w={panel.w - 16} />
                        <ButtonShape x={panel.x + panel.w - 8 - 32} y={f.y + 128} w={32} appearance="primary" />
                    </>
                )}
            </AppWindow>
            <Rect {...panel} stroke={PAINT.accent} />
        </HeroDrawing>
    );
};

export const PopupHero = () => {
    const page = { x: 40, y: -10, w: 220, h: 190 };
    const left = page.x + 14;
    const right = page.x + page.w - 14;
    const trigger = { w: 56, h: 12, y: 8 };
    const tx = right - trigger.w;
    const popup = { w: 76, h: 66 };
    return (
        <HeroDrawing>
            <PageFill {...page} />
            <SkeletonBar x={left} y={11} w={52} h={5} heading />
            <Rows x={left} w={right - left} y={30} n={9} pitch={14} />
            {/* The trigger sits at the bar's end, aligned to the rows' right edge. */}
            <Rect x={tx} y={trigger.y} w={trigger.w} h={trigger.h} fill={PAINT.buttonDefault} stroke={PAINT.buttonDefaultBorder} corner="button" />
            <SkeletonBar x={tx + 8} y={trigger.y + 4.5} w={26} />
            <path
                d={`M${tx + trigger.w - 14} ${trigger.y + 5} l3 3 l3 -3`}
                fill="none"
                stroke={PAINT.buttonDefaultText}
                style={HAIRLINE}
            />
            {/* Bottom-end: the popup's end meets the trigger's end, 4 below it. */}
            <Popup x={right - popup.w} y={trigger.y + trigger.h + 4} w={popup.w} h={popup.h} accent lines={false} />
            <Rect x={right - popup.w + 4} y={trigger.y + trigger.h + 4 + 16} w={popup.w - 8} h={12} fill={PAINT.rowSelected} corner="tab" />
            {[0, 1, 2].map((i) => (
                <SkeletonBar key={i} x={right - popup.w + 10} y={trigger.y + trigger.h + 4 + 10 + i * 18 + (i > 0 ? 4 : 0)} w={44 - i * 6} />
            ))}
        </HeroDrawing>
    );
};
