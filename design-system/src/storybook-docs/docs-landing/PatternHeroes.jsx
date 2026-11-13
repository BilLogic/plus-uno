import React from 'react';
import { HAIRLINE, PAINT } from '../illustrations/paint.js';
import {
    Breadcrumb,
    ButtonShape,
    CardBox,
    Field,
    Flag,
    PageSheet,
    Popup,
    Rect,
    Row,
    Rule,
    SkeletonBar,
    StickyHeader,
} from '../illustrations/primitives.jsx';
import { HeroDrawing, HERO_SIDEBAR_W } from './HeroDrawing.jsx';
import { AppWindow } from './HeroWindow.jsx';

/**
 * The Patterns heroes: each pattern's situation, cropped to its one cue, drawn
 * from the illustration kit and painted by its roles. Text is soft skeleton
 * bars; the one accent (brand bold) sits on the subject. Errors alone takes
 * the danger roles, because the color is the meaning there. Coordinates are
 * kit units (1 = 2px) from the stage's corner; a drawing bleeds past the stage
 * where the picture is a crop.
 *
 * A view bar's controls align to the content edges of the screen they sit in:
 * the heading starts at the content's left edge and the last control ends at
 * its right edge, the same edges the rows run between. `VIEW` holds those edges
 * for the screens below, so a bar never floats off its content.
 */

const VIEW = { x0: 24, x1: 276 };

/** A ring around a control: the accent on the subject. */
const Ring = ({ x, y, w, h, corner = 'button' }) => (
    <Rect x={x - 2} y={y - 2} w={w + 4} h={h + 4} fill="none" stroke={PAINT.accent} corner={corner} />
);

/** Rows of a table across the content edges, `n` of them from `y`. */
const Rows = ({ x = VIEW.x0, w = VIEW.x1 - VIEW.x0, y, n, pitch = 14 }) => (
    <>
        {Array.from({ length: n }, (_, i) => (
            <Row key={i} x={x} y={y + i * pitch} w={w} />
        ))}
    </>
);

export const OverviewHero = () => (
    <HeroDrawing>
        {[
            [10, 8],
            [155, 8],
            [10, 86],
            [155, 86],
        ].map(([x, y]) => (
            <CardBox key={`${x}-${y}`} x={x} y={y} w={135} h={66} />
        ))}
        <Field x={22} y={22} w={100} accent />
        <Rect x={168} y={20} w={56} h={14} fill={PAINT.fieldSurface} stroke={PAINT.fieldBorder} corner="field" />
        <Rect x={168} y={38} w={72} h={24} fill={PAINT.popupSurface} stroke={PAINT.illustrationEdge} corner="popup" />
        <SkeletonBar x={176} y={45} w={48} />
        <SkeletonBar x={176} y={53} w={34} />
        <Rect x={61} y={102} w={32} h={32} fill={PAINT.accent} opacity={0.2} corner="full" />
        <Rect x={69} y={110} w={16} h={16} fill={PAINT.accent} corner="card" />
        <Flag x={168} y={102} w={112} h={26} />
    </HeroDrawing>
);

/** The More icon button: a square with three dots. */
const MoreButton = ({ x, y, s }) => (
    <g>
        <Rect x={x} y={y} w={s} h={s} fill={PAINT.buttonDefault} stroke={PAINT.buttonDefaultBorder} corner="button" />
        {[-1, 0, 1].map((i) => (
            <circle key={i} cx={x + s / 2 + i * s * 0.2} cy={y + s / 2} r={s * 0.05} fill={PAINT.buttonDefaultText} />
        ))}
    </g>
);

/** A real button at a readable size: its box and its word as a bar in the label color. */
const BigButton = ({ x, y, w, h, primary = false }) => (
    <g>
        <Rect x={x} y={y} w={w} h={h} fill={primary ? PAINT.buttonPrimary : PAINT.buttonDefault} stroke={primary ? undefined : PAINT.buttonDefaultBorder} corner="button" />
        <SkeletonBar x={x + w * 0.25} y={y + h / 2 - 2.5} w={w * 0.5} h={5} tone={primary ? PAINT.buttonPrimaryText : undefined} />
    </g>
);

/** The button group itself, centered and large: More, a Default, the Primary ringed. */
export const CommonActionsHero = () => {
    const h = 28;
    const y = 80 - h / 2;
    const more = { x: 26, w: h };
    const def = { x: more.x + more.w + 8, w: 96 };
    const primary = { x: def.x + def.w + 8, w: 120 };
    return (
        <HeroDrawing>
            <MoreButton x={more.x} y={y} s={h} />
            <BigButton x={def.x} y={y} w={def.w} h={h} />
            <BigButton x={primary.x} y={y} w={primary.w} h={h} primary />
            <Ring x={primary.x} y={y} w={primary.w} h={h} />
        </HeroDrawing>
    );
};

/** A form mid-fill, drawn narrow so it reads in a tall tile: the middle field in focus, its buttons at the end. */
export const FormsHero = () => (
    <HeroDrawing>
        <PageSheet x={92} y={-20} w={116} h={200} />
        <Field x={102} y={6} w={96} />
        <Field x={102} y={40} w={96} accent />
        <Field x={102} y={74} w={96} />
        <ButtonShape x={140} y={118} w={26} />
        <ButtonShape x={170} y={118} w={28} appearance="primary" />
    </HeroDrawing>
);

/** A downward caret, the FilterButton's and PopupSelect's. */
const Chevron = ({ x, y, s = 4 }) => (
    <path d={`M${x} ${y} l${s} ${s} l${s} ${-s}`} fill="none" stroke={PAINT.buttonDefaultText} strokeLinecap="round" strokeLinejoin="round" style={HAIRLINE} />
);

/** A checkbox: the brand fill and its tick when checked, the input edge when not. */
const Check = ({ x, y, s = 9, on }) => (
    <g>
        <Rect x={x} y={y} w={s} h={s} fill={on ? PAINT.accent : PAINT.fieldSurface} stroke={on ? undefined : PAINT.fieldBorder} corner="icon" />
        {on && <path d={`M${x + s * 0.22} ${y + s * 0.5} l${s * 0.22} ${s * 0.22} l${s * 0.38} ${-s * 0.44}`} fill="none" stroke={PAINT.buttonPrimaryText} strokeLinecap="round" strokeLinejoin="round" />}
    </g>
);

/** A FilterButton as it renders: its label, a count when it has picks, the caret; picks put it on the selected fill. */
const FilterButton = ({ x, y, w, h = 20, label, count = false }) => (
    <g>
        <Rect x={x} y={y} w={w} h={h} fill={count ? PAINT.rowSelected : PAINT.buttonDefault} stroke={count ? undefined : PAINT.buttonDefaultBorder} corner="button" />
        <SkeletonBar x={x + 8} y={y + h / 2 - 2} w={label} />
        {count && <Rect x={x + 12 + label} y={y + h / 2 - 4} w={11} h={8} fill={PAINT.accent} corner="count" />}
        <Chevron x={x + w - 13} y={y + h / 2 - 2} />
    </g>
);

/**
 * A view bar with two real FilterButtons at its end. Grade has picks and is
 * open: its menu hangs bottom-start, 4 under it, two options checked, ringed.
 */
export const FilteringHero = () => {
    const bar = { y: 18, h: 20 };
    const status = { x: 214, w: 62 };
    const grade = { x: status.x - 6 - 84, w: 84 };
    const menu = { x: grade.x, y: bar.y + bar.h + 4, w: 120, h: 112 };
    return (
        <HeroDrawing>
            <PageSheet x={-40} y={0} w={380} h={190} />
            <SkeletonBar x={VIEW.x0} y={bar.y + 7} w={70} h={6} heading />
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <React.Fragment key={i}>
                    <Rule x1={VIEW.x0} x2={VIEW.x1} y1={52 + i * 22} y2={52 + i * 22} stroke={PAINT.rowDivider} />
                    <SkeletonBar x={VIEW.x0} y={61 + i * 22} w={60} />
                    <SkeletonBar x={VIEW.x0 + 80} y={61 + i * 22} w={30} />
                </React.Fragment>
            ))}
            <FilterButton x={grade.x} y={bar.y} w={grade.w} label={30} count />
            <FilterButton x={status.x} y={bar.y} w={status.w} label={26} />
            {/* The menu's rows replace the kit Popup's placeholder lines. */}
            <Popup x={menu.x} y={menu.y} w={menu.w} h={menu.h} lines={false} accent />
            {[false, true, true, false].map((on, i) => (
                <React.Fragment key={i}>
                    <Check x={menu.x + 10} y={menu.y + 10 + i * 20} on={on} />
                    <SkeletonBar x={menu.x + 26} y={menu.y + 12.5 + i * 20} w={i % 2 ? 60 : 46} />
                </React.Fragment>
            ))}
            <Rule x1={menu.x} x2={menu.x + menu.w} y1={menu.y + 90} y2={menu.y + 90} stroke={PAINT.rowDivider} />
            <SkeletonBar x={menu.x + 10} y={menu.y + 99} w={30} tone={PAINT.accent} />
        </HeroDrawing>
    );
};

export const NavigationHero = () => {
    const w = { x: -20, y: -6, w: 340, h: 172 };
    // The selected row: the second row, 24 below the logo row, one 17 pitch down.
    const selectedY = w.y + 24 + 17;
    return (
        <HeroDrawing>
            <AppWindow {...w}>
                {(page) => (
                    <>
                        <Breadcrumb x={page.x + 12} y={w.y + 10} w={120} count={3} accent />
                        <SkeletonBar x={page.x + 12} y={w.y + 30} w={70} h={6} heading />
                        <SkeletonBar x={page.x + 12} y={w.y + 42} w={110} />
                        <Rows x={page.x + 12} w={page.w - 24} y={w.y + 60} n={7} />
                    </>
                )}
            </AppWindow>
            <Ring x={w.x + 4} y={selectedY} w={HERO_SIDEBAR_W - 8} h={16} corner="sidebarRow" />
        </HeroDrawing>
    );
};

/** The search glyph: a lens and its handle. */
const Lens = ({ x, y, r }) => (
    <g fill="none" stroke={PAINT.buttonDefaultText} strokeLinecap="round" style={HAIRLINE}>
        <circle cx={x} cy={y} r={r} />
        <path d={`M${x + r * 0.7} ${y + r * 0.7} l${r * 0.8} ${r * 0.8}`} />
    </g>
);

/** The close cross. */
const Cross = ({ x, y, s }) => (
    <path d={`M${x} ${y} l${s} ${s} M${x + s} ${y} l${-s} ${s}`} stroke={PAINT.buttonDefaultText} strokeLinecap="round" style={HAIRLINE} />
);

/** The SearchField itself, centered and large: focused (ringed), a word typed, its results open under it. */
export const SearchHero = () => {
    const f = { x: 40, y: 14, w: 220, h: 26 };
    const r = { x: f.x, y: f.y + f.h + 4, w: f.w, h: 106 };
    return (
        <HeroDrawing>
            <Rect x={f.x} y={f.y} w={f.w} h={f.h} fill={PAINT.fieldSurface} stroke={PAINT.fieldBorder} corner="field" />
            <Ring x={f.x} y={f.y} w={f.w} h={f.h} corner="field" />
            <Lens x={f.x + 14} y={f.y + f.h / 2 - 1} r={4.5} />
            <SkeletonBar x={f.x + 28} y={f.y + f.h / 2 - 2.5} w={34} h={5} />
            <Cross x={f.x + f.w - 17} y={f.y + f.h / 2 - 3.5} s={7} />
            <Popup x={r.x} y={r.y} w={r.w} h={r.h} lines={false} />
            <SkeletonBar x={r.x + 10} y={r.y + 10} w={40} h={3} />
            {[0, 1, 2].map((i) => (
                <React.Fragment key={i}>
                    {i === 0 && <Rect x={r.x + 4} y={r.y + 20} w={r.w - 8} h={26} fill={PAINT.rowSelected} corner="tab" />}
                    <Rect x={r.x + 10} y={r.y + 26 + i * 27} w={14} h={14} fill={PAINT.shape} corner="full" />
                    <SkeletonBar x={r.x + 32} y={r.y + 27 + i * 27} w={70 - i * 10} h={5} />
                    <SkeletonBar x={r.x + 32} y={r.y + 36 + i * 27} w={44} h={3} />
                </React.Fragment>
            ))}
        </HeroDrawing>
    );
};

/** A StatusTag at a readable size: its dot and its word, on its subtle fill, edged on the hero ground. */
const StatusPill = ({ x, y, w, subject = false }) => (
    <g>
        <Rect x={x} y={y} w={w} h={18} fill={subject ? PAINT.rowSelected : PAINT.countSurface} stroke={subject ? undefined : PAINT.illustrationEdge} corner="count" />
        <circle cx={x + 9} cy={y + 9} r={3} fill={subject ? PAINT.accent : PAINT.trackerDot} />
        <SkeletonBar x={x + 17} y={y + 7} w={w - 26} h={4} tone={subject ? PAINT.accent : undefined} />
    </g>
);

/** A CountTag at a readable size: a pill with its number. */
const Count = ({ x, y, w = 22 }) => (
    <g>
        <Rect x={x} y={y} w={w} h={16} fill={PAINT.countSurface} stroke={PAINT.illustrationEdge} corner="count" />
        <SkeletonBar x={x + w / 2 - 4} y={y + 6} w={8} h={4} />
    </g>
);

/** The indicators themselves, centered and large: three StatusTags, the new one ringed; counts and a change beneath. */
export const IndicatorsHero = () => {
    const y1 = 52;
    const y2 = 88;
    const tags = [{ x: 36, w: 64 }, { x: 108, w: 84, subject: true }, { x: 200, w: 64 }];
    return (
        <HeroDrawing>
            {tags.map((t) => (
                <StatusPill key={t.x} x={t.x} y={y1} w={t.w} subject={t.subject} />
            ))}
            <Ring x={108} y={y1} w={84} h={18} corner="count" />
            <Count x={80} y={y2} />
            <Count x={108} y={y2} w={28} />
            <Rect x={144} y={y2} w={44} h={16} fill={PAINT.countSurface} stroke={PAINT.illustrationEdge} corner="count" />
            <path d={`M${152} ${y2 + 11} l0 -6 m-3 3 l3 -3 l3 3`} fill="none" stroke={PAINT.countText} strokeLinecap="round" strokeLinejoin="round" style={HAIRLINE} />
            <SkeletonBar x={160} y={y2 + 6} w={20} h={4} />
            <SkeletonBar x={196} y={y2 + 6} w={24} h={4} />
        </HeroDrawing>
    );
};

/** The info glyph inside a Flag: a filled disc with a tick. */
const FlagIcon = ({ x, y, r }) => (
    <g>
        <circle cx={x} cy={y} r={r} fill={PAINT.accent} />
        <path d={`M${x - r * 0.4} ${y} l${r * 0.28} ${r * 0.28} l${r * 0.55} ${-r * 0.55}`} fill="none" stroke={PAINT.buttonPrimaryText} strokeLinecap="round" strokeLinejoin="round" />
    </g>
);

/** One Flag, whole and centered where it lands, ringed; the one before it peeks out behind. */
export const NotificationsHero = () => {
    const f = { x: 30, y: 46, w: 240, h: 76 };
    return (
        <HeroDrawing>
            <g opacity={0.55}>
                <Popup x={f.x + 10} y={f.y - 14} w={f.w - 20} h={f.h} lines={false} />
            </g>
            <Popup x={f.x} y={f.y} w={f.w} h={f.h} lines={false} accent />
            <FlagIcon x={f.x + 20} y={f.y + 20} r={8} />
            <SkeletonBar x={f.x + 36} y={f.y + 15} w={86} h={5} heading />
            <SkeletonBar x={f.x + 36} y={f.y + 29} w={f.w - 72} />
            <SkeletonBar x={f.x + 36} y={f.y + 38} w={f.w - 102} />
            <SkeletonBar x={f.x + 36} y={f.y + f.h - 19} w={36} tone={PAINT.accent} />
            <SkeletonBar x={f.x + 82} y={f.y + f.h - 19} w={32} tone={PAINT.accent} />
            <Cross x={f.x + f.w - 20} y={f.y + 13} s={6} />
        </HeroDrawing>
    );
};

/** How PLUS fades a control it cannot use yet: the whole control at reduced opacity. */
const FADE = 0.38;

/** A Toggle: the brand track when on, the input edge's track when off; the knob on the input fill. */
const Toggle = ({ x, y, on }) => (
    <g>
        <Rect x={x} y={y} w={22} h={12} fill={on ? PAINT.accent : PAINT.fieldBorder} corner="full" />
        <Rect x={x + (on ? 11 : 1)} y={y + 1} w={10} h={10} fill={PAINT.fieldSurface} corner="full" />
    </g>
);

/** The arrow pointer with the not-allowed badge: the pointer refuses what it rests on. */
const NotAllowed = ({ x, y }) => (
    <g>
        <path d={`M${x} ${y} l0 13 l3.5 -3 l2.5 5.5 l2 -1 l-2.5 -5.5 l4.5 0 z`} fill={PAINT.pointer} stroke={PAINT.pointerEdge} strokeLinejoin="round" style={HAIRLINE} />
        <circle cx={x + 12} cy={y + 15} r={4.5} fill={PAINT.fieldSurface} stroke={PAINT.pointer} />
        <path d={`M${x + 9} ${y + 12} l6 6`} stroke={PAINT.pointer} strokeLinecap="round" />
    </g>
);

/**
 * A settings card: one row you can use, two you cannot yet, faded; the Primary
 * faded and ringed with the pointer refusing it; the reason in words beside it.
 */
export const DisabledHero = () => {
    const c = { x: 20, y: -2, w: 260, h: 164 };
    const rows = [{ op: 1, on: true }, { op: FADE, on: false }, { op: FADE, on: true }];
    const by = c.y + c.h - 36;
    const primary = { x: c.x + c.w - 16 - 70, w: 70, h: 20 };
    return (
        <HeroDrawing>
            <CardBox {...c} />
            <SkeletonBar x={c.x + 16} y={c.y + 15} w={75} h={5} heading />
            {rows.map((r, i) => {
                const yy = c.y + 38 + i * 26;
                return (
                    <React.Fragment key={i}>
                        <g opacity={r.op}>
                            <SkeletonBar x={c.x + 16} y={yy + 4} w={90} />
                            <SkeletonBar x={c.x + 16} y={yy + 12} w={60} h={3} />
                            <Toggle x={c.x + c.w - 16 - 22} y={yy + 2} on={r.on} />
                        </g>
                        <Rule x1={c.x + 16} x2={c.x + c.w - 16} y1={yy + 22} y2={yy + 22} stroke={PAINT.rowDivider} />
                    </React.Fragment>
                );
            })}
            <SkeletonBar x={c.x + 16} y={by + 8} w={110} />
            <g opacity={FADE}>
                <Rect x={primary.x} y={by} w={primary.w} h={primary.h} fill={PAINT.buttonPrimary} corner="button" />
                <SkeletonBar x={primary.x + 20} y={by + 8} w={30} tone={PAINT.buttonPrimaryText} />
            </g>
            <Ring x={primary.x} y={by} w={primary.w} h={primary.h} />
            <NotAllowed x={primary.x + 40} y={by + 9} />
        </HeroDrawing>
    );
};

export const EmptyHero = () => (
    <HeroDrawing>
        <PageSheet x={50} y={-20} w={200} h={200} />
        <SkeletonBar x={66} y={0} w={60} h={5} heading />
        <Rule x1={50} x2={250} y1={14} y2={14} />
        <Rect x={118} y={26} w={64} h={64} fill={PAINT.accent} opacity={0.2} corner="full" />
        <Rect x={134} y={42} w={32} h={32} fill={PAINT.accent} corner="card" />
        <SkeletonBar x={120} y={100} w={60} h={5} heading />
        <SkeletonBar x={105} y={112} w={90} />
        <ButtonShape x={126} y={128} w={48} appearance="primary" />
    </HeroDrawing>
);

export const ErrorsHero = () => {
    const x = 85;
    const w = 130;
    return (
        <HeroDrawing>
            <PageSheet x={75} y={-20} w={150} h={200} />
            <Rect x={x} y={6} w={w} h={22} fill={PAINT.dangerSurface} stroke={PAINT.fieldBorderInvalid} corner="card" />
            <Ring x={x} y={6} w={w} h={22} corner="card" />
            <circle cx={x + 12} cy={17} r={4} fill={PAINT.flagIconDanger} />
            <SkeletonBar x={x + 22} y={15} w={70} tone={PAINT.fieldMessageDanger} />
            <Field x={x} y={40} w={w} />
            <Field x={x} y={78} w={w} invalid />
            <SkeletonBar x={x} y={109} w={52} tone={PAINT.fieldMessageDanger} />
            <ButtonShape x={x + w - 36} y={132} w={36} appearance="primary" />
        </HeroDrawing>
    );
};

export const LoadingHero = () => (
    <HeroDrawing>
        <PageSheet x={60} y={-20} w={180} h={200} />
        <Rule x1={60} x2={240} y1={14} y2={14} stroke={PAINT.tabsDivider} />
        <Rule x1={60} x2={120} y1={14} y2={14} stroke={PAINT.accent} thick />
        {[0, 1].map((i) => (
            <React.Fragment key={i}>
                <Rect x={72} y={28 + i * 24} w={10} h={10} fill={PAINT.placeholderText} corner="icon" />
                <SkeletonBar x={90} y={29 + i * 24} w={70} heading />
                <SkeletonBar x={90} y={37 + i * 24} w={44} />
                <ButtonShape x={204} y={29 + i * 24} w={24} />
            </React.Fragment>
        ))}
        {[0, 1, 2].map((i) => (
            <Rect key={i} x={72} y={80 + i * 18} w={156} h={12} fill={PAINT.placeholderText} opacity={1 - i * 0.3} corner="field" />
        ))}
    </HeroDrawing>
);

export const OverflowHero = () => (
    <HeroDrawing>
        <PageSheet x={50} y={-20} w={200} h={200} />
        <StickyHeader x={62} y={8} w={176} h={140} accent />
        <Rect x={242} y={40} w={3} h={44} fill={PAINT.accent} corner="icon" />
    </HeroDrawing>
);

export const ReadOnlyHero = () => (
    <HeroDrawing>
        <CardBox x={75} y={-8} w={150} h={176} />
        <SkeletonBar x={89} y={8} w={50} h={5} heading />
        <Rect x={190} y={6} w={22} h={8} fill={PAINT.placeholderText} corner="full" />
        {[0, 1, 2, 3].map((i) => (
            <React.Fragment key={i}>
                <SkeletonBar x={89} y={34 + i * 26} w={34} h={3} />
                <SkeletonBar x={89} y={43 + i * 26} w={100 - i * 12} h={5} heading />
                <Rule x1={89} x2={211} y1={53 + i * 26} y2={53 + i * 26} stroke={PAINT.rowDivider} />
            </React.Fragment>
        ))}
        <Rect x={84} y={28} w={132} h={102} fill="none" stroke={PAINT.accent} corner="card" />
    </HeroDrawing>
);
