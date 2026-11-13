import React from 'react';
import { HAIRLINE, PAINT } from '../illustrations/paint.js';
import {
    Breadcrumb,
    ButtonShape,
    CardBox,
    CountTag,
    Field,
    Flag,
    Popup,
    Rect,
    Row,
    Rule,
    Section,
    Sidebar,
    SkeletonBar,
    StickyHeader,
} from '../illustrations/primitives.jsx';
import { HeroDrawing } from './HeroDrawing.jsx';

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

/** The mouse pointer: the kit's pointer roles. */
const Pointer = ({ x, y }) => (
    <path d={`M${x} ${y} l0 12 l3 -3 l2.5 5.5 l2 -1 l-2.5 -5.5 l4.5 0 z`} fill={PAINT.pointer} stroke={PAINT.pointerEdge} />
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

export const CommonActionsHero = () => {
    const { x0, x1 } = VIEW;
    const primary = { x: x1 - 30, y: 12, w: 30 };
    const def = { x: primary.x - 4 - 28, y: 12, w: 28 };
    const more = { x: def.x - 4 - 10, y: 12, w: 10 };
    return (
        <HeroDrawing>
            <SkeletonBar x={x0} y={13} w={64} h={5} heading />
            <Rows y={28} n={9} />
            <Rect x={more.x} y={more.y} w={more.w} h={8} fill={PAINT.buttonDefault} stroke={PAINT.buttonDefaultBorder} corner="button" />
            <ButtonShape x={def.x} y={def.y} w={def.w} />
            <ButtonShape x={primary.x} y={primary.y} w={primary.w} appearance="primary" />
            <Ring x={primary.x} y={primary.y} w={primary.w} h={8} />
            <Popup x={more.x - 6} y={26} w={52} h={46} />
        </HeroDrawing>
    );
};

export const FormsHero = () => (
    <HeroDrawing>
        <Rect x={70} y={-20} w={160} h={200} fill={PAINT.pageSurface} stroke={PAINT.illustrationEdge} />
        <Field x={86} y={2} w={128} />
        <Field x={86} y={38} w={128} accent />
        <Field x={86} y={74} w={128} />
        <Rule x1={70} x2={230} y1={116} y2={116} />
        <ButtonShape x={150} y={128} w={30} />
        <ButtonShape x={184} y={128} w={30} appearance="primary" />
    </HeroDrawing>
);

export const FilteringHero = () => {
    const { x0, x1 } = VIEW;
    const last = { x: x1 - 28, w: 28 };
    const filter = { x: last.x - 4 - 36, w: 36 };
    const first = { x: filter.x - 4 - 28, w: 28 };
    const box = { x: filter.x - 14, y: 26, w: 70, h: 74 };
    return (
        <HeroDrawing>
            <SkeletonBar x={x0} y={13} w={64} h={5} heading />
            <Rows y={28} n={9} />
            <ButtonShape x={first.x} y={12} w={first.w} />
            <Rect x={filter.x} y={11} w={filter.w} h={10} fill={PAINT.rowSelected} stroke={PAINT.accent} corner="button" />
            <ButtonShape x={last.x} y={12} w={last.w} />
            {/* The menu's rows replace the kit Popup's placeholder lines. */}
            <Popup x={box.x} y={box.y} w={box.w} h={box.h} lines={false} />
            {[0, 1, 2, 3].map((i) => (
                <React.Fragment key={i}>
                    <Rect x={box.x + 8} y={box.y + 8 + i * 12} w={6} h={6} fill={i === 1 || i === 2 ? PAINT.accent : PAINT.fieldSurface} stroke={i === 1 || i === 2 ? undefined : PAINT.fieldBorder} corner="icon" />
                    <SkeletonBar x={box.x + 20} y={box.y + 9 + i * 12} w={34 - i * 4} />
                </React.Fragment>
            ))}
        </HeroDrawing>
    );
};

export const NavigationHero = () => {
    const sb = { x: 10, y: -12, w: 86, h: 190 };
    const selectedY = sb.y + 24 + 17;
    return (
        <HeroDrawing>
            <Sidebar x={sb.x} y={sb.y} w={sb.w} h={sb.h} />
            <Ring x={sb.x + 4} y={selectedY} w={sb.w - 8} h={16} corner="sidebarRow" />
            <Rect x={sb.x + sb.w} y={-20} w={204} h={200} fill={PAINT.pageSurface} stroke={PAINT.illustrationEdge} />
            <Breadcrumb x={116} y={10} w={120} count={3} accent />
            <SkeletonBar x={116} y={30} w={70} h={6} heading />
            <SkeletonBar x={116} y={42} w={110} />
            <Rows x={116} w={174} y={60} n={7} />
        </HeroDrawing>
    );
};

export const SearchHero = () => (
    <HeroDrawing>
        <Rows x={-60} w={160} y={28} n={9} />
        <Rect x={110} y={8} w={174} h={20} fill={PAINT.fieldSurface} stroke={PAINT.accent} corner="field" />
        <Rect x={118} y={14} w={8} h={8} fill="none" stroke={PAINT.placeholderText} corner="full" />
        <SkeletonBar x={132} y={16} w={60} />
        <Popup x={110} y={32} w={174} h={52} />
    </HeroDrawing>
);

export const IndicatorsHero = () => {
    const { x0, x1 } = VIEW;
    return (
        <HeroDrawing>
            <circle cx={x1 - 8} cy={14} r={8} fill={PAINT.countSurface} stroke={PAINT.illustrationEdge} style={HAIRLINE} />
            <CountTag x={x1 - 6} y={2} accent />
            <Rule x1={x0} x2={x1} y1={30} y2={30} stroke={PAINT.rowDivider} />
            {[0, 1, 2, 3].map((i) => {
                const y = 36 + i * 22;
                const hot = i === 2;
                return (
                    <React.Fragment key={i}>
                        <SkeletonBar x={x0} y={y + 6} w={70} />
                        <SkeletonBar x={x0 + 100} y={y + 6} w={50} />
                        <Rect x={x1 - 56} y={y + 3} w={56} h={12} fill={hot ? PAINT.accent : PAINT.countSurface} stroke={hot ? PAINT.accent : PAINT.illustrationEdge} opacity={hot ? 0.2 : 1} corner="count" />
                        <circle cx={x1 - 49} cy={y + 9} r={2} fill={hot ? PAINT.accent : PAINT.trackerDot} />
                        <SkeletonBar x={x1 - 42} y={y + 7} w={30} tone={hot ? PAINT.accent : undefined} />
                        <Rule x1={x0} x2={x1} y1={y + 20} y2={y + 20} stroke={PAINT.rowDivider} />
                    </React.Fragment>
                );
            })}
        </HeroDrawing>
    );
};

export const NotificationsHero = () => (
    <HeroDrawing>
        <Rows x={-40} w={200} y={20} n={10} />
        <Flag x={164} y={12} w={120} h={30} accent />
        <Flag x={164} y={50} w={120} h={30} />
        <Flag x={164} y={88} w={120} h={30} />
    </HeroDrawing>
);

export const DisabledHero = () => (
    <HeroDrawing>
        <Rect x={50} y={-20} w={200} h={200} fill={PAINT.pageSurface} stroke={PAINT.illustrationEdge} />
        <SkeletonBar x={66} y={0} w={60} h={5} heading />
        <SkeletonBar x={66} y={12} w={110} />
        <Field x={66} y={30} w={168} />
        <Rule x1={50} x2={250} y1={112} y2={112} />
        <ButtonShape x={160} y={126} w={34} />
        <Rect x={198} y={126} w={36} h={8} fill={PAINT.shape} corner="button" />
        <Ring x={198} y={126} w={36} h={8} />
        <Rect x={170} y={98} w={64} h={14} fill={PAINT.popupSurface} stroke={PAINT.illustrationEdge} corner="popup" />
        <SkeletonBar x={178} y={103} w={44} />
        <Pointer x={226} y={130} />
    </HeroDrawing>
);

export const EmptyHero = () => (
    <HeroDrawing>
        <Rect x={50} y={-20} w={200} h={200} fill={PAINT.pageSurface} stroke={PAINT.illustrationEdge} />
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
            <Rect x={75} y={-20} w={150} h={200} fill={PAINT.pageSurface} stroke={PAINT.illustrationEdge} />
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
        <Rect x={60} y={-20} w={180} h={200} fill={PAINT.pageSurface} stroke={PAINT.illustrationEdge} />
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
        <Rect x={50} y={-20} w={200} h={200} fill={PAINT.pageSurface} stroke={PAINT.illustrationEdge} />
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
