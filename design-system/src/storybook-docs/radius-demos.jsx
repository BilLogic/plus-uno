import React, { useEffect, useId, useRef, useState } from 'react';
import { IconButton } from '@/components';
import { Illustration } from '@/storybook-docs/illustrations/Illustration.jsx';
import { PAINT, HAIRLINE } from '@/storybook-docs/illustrations/paint.js';
import { ButtonShape, Card, Frame, Rule, Screen, SkeletonBar } from '@/storybook-docs/illustrations/primitives.jsx';

/**
 * Figures for Foundations/Radius. Every corner reads a radius token, and every
 * drawing is blocked out: words are skeleton bars, and the values a figure
 * names sit outside it, in a legend or caption that reads the same token.
 *
 * Two scales. Screen figures use the illustration kit's scale (one unit is 2px
 * of product UI), so a corner is its token halved. Close-up diagrams draw at
 * one unit per px and show at up to twice that, so a corner is its token as is.
 * The kit has no corner for every token on this page, so `TokenRect` takes the
 * token itself and clamps it the way the kit does.
 */

/* --------------------------------------------------------------- corners */

/** A token as a drawn corner at one of the two scales. */
const cornerOf = (token, scale) => {
    if (!token) return undefined;
    const value = token.startsWith('calc(') ? token : `var(${token})`;
    return scale === 'kit' ? `calc(${value} / 2)` : value;
};

/** A rect rounded by a token, held to half its shorter side as the kit holds its corners. */
const TokenRect = ({ x, y, w, h, token, scale = 'zoom', fill, stroke, clipPath, ...data }) => {
    const c = cornerOf(token, scale);
    const radius = c ? `min(${c}, ${Math.min(w, h) / 2}px)` : undefined;
    return (
        <rect
            x={x}
            y={y}
            width={w}
            height={h}
            fill={fill ?? 'none'}
            stroke={stroke}
            clipPath={clipPath}
            style={{ ...(stroke ? HAIRLINE : null), rx: radius ?? 0, ry: radius ?? 0 }}
            {...data}
        />
    );
};

/** A box on its real elevation (a Card's by default), at the kit's half scale, rounded by a token. */
const RaisedBox = ({ x, y, w, h, token, fill = PAINT.cardSurface, shadow = PAINT.cardShadow, ...data }) => (
    <foreignObject x={x} y={y} width={w} height={h} style={{ overflow: 'visible' }}>
        <div
            xmlns="http://www.w3.org/1999/xhtml"
            {...data}
            style={{
                boxSizing: 'border-box',
                width: w * 2,
                height: h * 2,
                transform: 'scale(0.5)',
                transformOrigin: '0 0',
                background: fill,
                boxShadow: shadow,
                borderRadius: `var(${token})`,
            }}
        />
    </foreignObject>
);

/* ---------------------------------------------------------------- values */

/** Each token's radius as the page resolves it, in px, read from hidden probes. */
const useRadii = (tokens) => {
    const ref = useRef(null);
    const [values, setValues] = useState({});
    const key = tokens.join('|');
    useEffect(() => {
        const read = () => {
            const out = {};
            ref.current?.querySelectorAll('[data-probe]').forEach((el) => {
                out[el.dataset.probe] = parseFloat(getComputedStyle(el).borderTopLeftRadius);
            });
            setValues(out);
        };
        read();
        const observer = new MutationObserver(read);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode', 'data-contrast-mode'] });
        return () => observer.disconnect();
    }, [key]);
    const probes = (
        <span ref={ref} hidden>
            {tokens.map((t) => <span key={t} data-probe={t} style={{ borderTopLeftRadius: `var(${t})` }} />)}
        </span>
    );
    return [values, probes];
};

/** 16 reads as `16`; the pill token reads as `full`. */
const show = (px) => (px === undefined || Number.isNaN(px) ? '' : px >= 999 ? 'full' : String(Math.round(px * 10) / 10));

/* ---------------------------------------------------------------- layout */

const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' };
const small = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };
const codeText = { font: 'var(--code)', color: 'var(--ds-text-subtle)' };
const well = {
    position: 'relative',
    padding: 'var(--card-pad-spacious)',
    borderRadius: 'var(--card-radius)',
    background: 'var(--ds-surface-sunken)',
};
const badge = {
    display: 'grid',
    placeItems: 'center',
    width: 'var(--image-xs)',
    height: 'var(--image-xs)',
    borderRadius: 'var(--radius-full)',
    background: 'var(--ds-background-brand-bold)',
    color: 'var(--ds-text-inverse)',
    font: 'var(--heading-xsmall)',
};

/**
 * A drawing in a well with numbered badges pinned to its parts, and a legend
 * beside it naming each part, its token and the value the token resolves to.
 * `parts`: `{ id, title, token?, value?, at: [x, y] }`, `at` in drawing units.
 */
const Legended = ({ testid, title, stage, parts, children }) => {
    const [values, probes] = useRadii(parts.filter((p) => p.token).map((p) => p.token));
    return (
        <div data-testid={testid} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--grid-gutter)', alignItems: 'center' }}>
            {probes}
            <div style={well}>
                <div style={{ position: 'relative' }}>
                    <Illustration viewBox={`0 0 ${stage.w} ${stage.h}`} capped={false} title={title}>
                        {children}
                    </Illustration>
                    {parts.map((p, i) => (
                        <span
                            key={p.id}
                            aria-hidden="true"
                            style={{
                                ...badge,
                                position: 'absolute',
                                insetInlineStart: `calc(${(p.at[0] / stage.w) * 100}% - var(--image-xs) / 2)`,
                                insetBlockStart: `calc(${(p.at[1] / stage.h) * 100}% - var(--image-xs) / 2)`,
                            }}
                        >
                            {i + 1}
                        </span>
                    ))}
                </div>
            </div>
            <ol data-testid="radius-legend" aria-label="Parts and their radius" style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                {parts.map((p, i) => (
                    <li key={p.id} data-legend={p.id} style={{ display: 'grid', gridTemplateColumns: 'var(--image-xs) 1fr', columnGap: 'var(--inline-md)', alignItems: 'center' }}>
                        <span aria-hidden="true" style={badge}>{i + 1}</span>
                        <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 'var(--inline-sm)', font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                            <strong>{p.title}</strong>
                            <span data-value>{p.value ?? show(values[p.token])}</span>
                            {p.token && <code style={codeText}>{p.token}</code>}
                        </span>
                    </li>
                ))}
            </ol>
        </div>
    );
};

/* ----------------------------------------------------------------- cover */

const COVER = { w: 320, h: 200 };

/** A menu row inset in a Popup: the Popup's radius minus its inset. */
const ROW_CORNER = 'calc(var(--popup-radius) - var(--popover-pad-menu))';

/**
 * One screen with every rule on it: the Page at the window edge, a Section and
 * a Card, a Popup with its rows nested inside, a field with its button, and a
 * pill that keeps its shape inside the Section.
 */
export const RadiusCover = () => (
    <Legended
        testid="radius-cover"
        title="A screen whose parts each round by their own radius token"
        stage={COVER}
        parts={[
            { id: 'page', title: 'Page at the window edge', value: '0', at: [306, 188] },
            { id: 'section', title: 'Section with a fill', token: '--section-radius', at: [54, 46] },
            { id: 'card', title: 'Card', token: '--card-radius', at: [308, 46] },
            { id: 'popup', title: 'Popup', token: '--popup-radius', at: [284, 126] },
            { id: 'row', title: 'Row inside the Popup', token: '--radius-control-md', at: [200, 145] },
            { id: 'field', title: 'Field, 40 high', token: '--radius-control-lg', at: [54, 136] },
            { id: 'button', title: 'Button in the field', token: '--button-radius-default', at: [168, 156] },
            { id: 'pill', title: 'Pill', token: '--radius-full', at: [172, 50] },
        ]}
    >
        <Screen x={0} y={0} w={COVER.w} h={COVER.h}>
            <TokenRect x={54} y={46} w={124} h={70} token="--section-radius" scale="kit" fill={PAINT.sectionSubtleSurface} />
            <SkeletonBar x={62} y={54} w={40} h={5} heading />
            <TokenRect x={146} y={53} w={24} h={8} token="--radius-full" scale="kit" fill={PAINT.countSurface} />
            {[0, 1, 2].map((i) => <SkeletonBar key={i} x={62} y={70 + i * 12} w={96 - i * 20} />)}
            <Card x={188} y={46} w={120} h={70} />
            <TokenRect x={54} y={130} w={124} h={20} token="--radius-control-lg" scale="kit" fill={PAINT.fieldSurface} stroke={PAINT.fieldBorder} />
            <SkeletonBar x={60} y={138} w={50} />
            <TokenRect x={160} y={132} w={16} h={16} token="--button-radius-default" scale="kit" fill={PAINT.shape} />
            <RaisedBox x={188} y={124} w={96} h={52} token="--popup-radius" fill={PAINT.popupSurface} shadow={PAINT.popupShadow} />
            <TokenRect x={190} y={126} w={92} h={16} token={ROW_CORNER} scale="kit" fill={PAINT.rowSelected} />
            {[0, 1, 2].map((i) => <SkeletonBar key={i} x={196} y={132 + i * 16} w={44 - i * 8} />)}
        </Screen>
    </Legended>
);

/* ----------------------------------------------------------------- scale */

const STEPS = [
    { token: '--radius-0125', role: 'Small details' },
    { token: '--radius-025', role: 'Tight grids, tags, compact buttons' },
    { token: '--radius-0375', role: '24 high controls, default buttons' },
    { token: '--radius-050', role: '32 high controls, the smallest nested visual' },
    { token: '--radius-0625', role: '40 high fields' },
    { token: '--radius-075', role: 'Popup, compact Card, Table' },
    { token: '--radius-100', role: 'Section, Modal, Card' },
    { token: '--radius-full', role: 'Pills' },
];

/** The eight steps, each a tile drawn at its token, its value and role beneath. */
export const ScaleStrip = () => {
    const [values, probes] = useRadii(STEPS.map((s) => s.token));
    return (
        <div data-testid="radius-scale" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(calc(var(--image-xl) * 2), 1fr))', gap: 'var(--grid-gutter)' }}>
            {probes}
            {STEPS.map((s) => (
                <figure key={s.token} data-step={s.token} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                    <Illustration width={64} height={64} title={`A tile rounded by ${s.token}`}>
                        <TokenRect x={0} y={0} w={64} h={64} token={s.token} fill={PAINT.shape} data-corner="" />
                    </Illustration>
                    <figcaption style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                        <strong data-value style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>{show(values[s.token])}</strong>
                        <span style={small}>{s.role}</span>
                    </figcaption>
                </figure>
            ))}
        </div>
    );
};

/* ------------------------------------------------------------- templates */

const MAP = { w: 320, h: 180 };

/** Frame, Page, Section and Card: 0 at the window, 16 for each template, 12 nested in a fill. */
export const TemplateMap = () => (
    <Legended
        testid="radius-templates"
        title="A Frame holding a Page, a Card, and a Section with a fill holding a compact Card"
        stage={MAP}
        parts={[
            { id: 'page', title: 'Page in the Frame', value: '0', at: [306, 168] },
            { id: 'section', title: 'Section with a fill', token: '--section-radius', at: [170, 46] },
            { id: 'card', title: 'Card', token: '--card-radius', at: [56, 46] },
            { id: 'card-compact', title: 'Card inside a filled Section', token: '--card-radius-compact', at: [180, 72] },
        ]}
    >
        <Screen x={0} y={0} w={MAP.w} h={MAP.h}>
            <Card x={56} y={46} w={100} h={120} />
            <TokenRect x={170} y={46} w={138} h={120} token="--section-radius" scale="kit" fill={PAINT.sectionSubtleSurface} data-part="section-box" />
            <SkeletonBar x={180} y={56} w={44} h={5} heading />
            <RaisedBox x={180} y={72} w={118} h={84} token="--card-radius-compact" data-part="card-compact" />
            <SkeletonBar x={190} y={84} w={60} heading />
            {[0, 1].map((i) => <SkeletonBar key={i} x={190} y={96 + i * 10} w={80 - i * 24} />)}
        </Screen>
    </Legended>
);

/* --------------------------------------------------------------- nesting */

/** A caption row of live values beneath a close-up. */
const Values = ({ items }) => {
    const [values, probes] = useRadii(items.filter((i) => i.token).map((i) => i.token));
    return (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 'var(--stack-sm) var(--inline-lg)' }}>
            {probes}
            {items.map((i) => (
                <li key={i.id} data-legend={i.id} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--inline-sm)', font: 'var(--body-small)', color: 'var(--ds-text)' }}>
                    <span style={{ color: 'var(--ds-text-subtle)' }}>{i.title}</span>
                    <strong data-value>{i.value ?? show(values[i.token])}</strong>
                    {i.token && <code style={codeText}>{i.token}</code>}
                </li>
            ))}
        </ul>
    );
};

/** A close-up in a well, its values beneath. */
const CloseUp = ({ testid, children, values }) => (
    <div data-testid={testid} style={stack}>
        <div style={well}>{children}</div>
        {values && <Values items={values} />}
    </div>
);

/** Inner corner = outer corner − padding: a row inset 4 inside a 12 Popup takes 8. */
export const NestingDiagram = () => (
    <CloseUp
        testid="radius-nesting"
        values={[
            { id: 'outer', title: 'Outer, the Popup', token: '--popup-radius' },
            { id: 'pad', title: 'minus the padding', value: '4' },
            { id: 'inner', title: 'equals the inner row', token: '--radius-control-md' },
        ]}
    >
        <Illustration viewBox="0 0 160 56" capped={false} title="The corner of a Popup and the row inset inside it, magnified: both curves share one center">
            <TokenRect x={8} y={8} w={200} h={100} token="--popup-radius" fill={PAINT.popupSurface} stroke={PAINT.frameDivider} data-part="outer" />
            <TokenRect x={12} y={12} w={192} h={32} token={ROW_CORNER} fill={PAINT.rowSelected} data-part="inner" />
            <SkeletonBar x={28} y={26} w={48} />
            {/* The two curves' shared center, and each curve's full circle around it. */}
            <g transform="translate(8 8)" fill="none" stroke={PAINT.annotation} strokeDasharray="1 1.5" vectorEffect="non-scaling-stroke" style={HAIRLINE}>
                <circle vectorEffect="non-scaling-stroke" style={{ cx: 'var(--popup-radius)', cy: 'var(--popup-radius)', r: 'var(--popup-radius)' }} />
                <circle vectorEffect="non-scaling-stroke" style={{ cx: 'var(--popup-radius)', cy: 'var(--popup-radius)', r: ROW_CORNER }} />
                <circle style={{ cx: 'var(--popup-radius)', cy: 'var(--popup-radius)', r: 'var(--stroke-2)' }} fill={PAINT.annotation} stroke="none" />
            </g>
        </Illustration>
    </CloseUp>
);

/** A field with its button inside: the button rounds at the field's radius minus the 4 inset. */
export const ButtonInField = () => (
    <CloseUp
        testid="radius-button-in-field"
        values={[
            { id: 'field', title: 'Field 40', token: '--radius-control-lg' },
            { id: 'button', title: 'button 32', token: '--button-radius-default' },
            { id: 'field-compact', title: 'Compact field 32', token: '--radius-control-md' },
            { id: 'button-compact', title: 'button 24', token: '--button-radius-compact' },
        ]}
    >
        <Illustration width={224} height={56} title="A 40 high field holding a 32 high button, and a 32 high field holding a 24 high button, each inset 4">
            <g data-density="default">
                <TokenRect x={4} y={8} w={120} h={40} token="--radius-control-lg" fill={PAINT.fieldSurface} stroke={PAINT.fieldBorder} data-part="field" />
                <SkeletonBar x={16} y={26} w={44} />
                <TokenRect x={88} y={12} w={32} h={32} token="--button-radius-default" fill={PAINT.shape} data-part="button" />
                <TokenRect x={98} y={22} w={12} h={12} token="--radius-0125" fill={PAINT.sidebarIcon} />
            </g>
            <g data-density="compact">
                <TokenRect x={140} y={12} w={80} h={32} token="--radius-control-md" fill={PAINT.fieldSurface} stroke={PAINT.fieldBorder} data-part="field" />
                <SkeletonBar x={150} y={26} w={28} />
                <TokenRect x={192} y={16} w={24} h={24} token="--button-radius-compact" fill={PAINT.shape} data-part="button" />
                <TokenRect x={198} y={22} w={12} h={12} token="--radius-0125" fill={PAINT.sidebarIcon} />
            </g>
        </Illustration>
    </CloseUp>
);

/** A joined group: the group's outer corners round, its inner seams stay square. */
export const JoinedGroup = () => {
    const clip = `joined-${useId().replace(/:/g, '')}`;
    return (
        <CloseUp testid="radius-joined">
            <Illustration width={200} height={48} title="Three joined buttons: rounded at the group's ends, square at each seam">
                <defs>
                    <clipPath id={clip}>
                        <TokenRect x={10} y={8} w={180} h={32} token="--button-radius-default" />
                    </clipPath>
                </defs>
                <rect x={10} y={8} width={60} height={32} fill={PAINT.rowSelected} clipPath={`url(#${clip})`} />
                <TokenRect x={10} y={8} w={180} h={32} token="--button-radius-default" stroke={PAINT.buttonDefaultBorder} />
                <Rule x1={70} y1={8} x2={70} y2={40} stroke={PAINT.buttonDefaultBorder} />
                <Rule x1={130} y1={8} x2={130} y2={40} stroke={PAINT.buttonDefaultBorder} />
                <rect data-part="seam" x={70} y={8} width={0} height={32} fill="none" />
                <rect data-part="seam" x={130} y={8} width={0} height={32} fill="none" />
                {[0, 1, 2].map((i) => <SkeletonBar key={i} x={26 + i * 60} y={22} w={28} />)}
            </Illustration>
        </CloseUp>
    );
};

/** Window edge: the Page meets the Frame's edge at 0, and a full-bleed Modal footer meets the Modal at 0. */
export const WindowEdge = () => {
    const clip = `modal-${useId().replace(/:/g, '')}`;
    return (
        <CloseUp testid="radius-window">
            <Illustration width={300} height={128} title="A Page running to the window's edge, and a Modal whose footer runs to its sides">
                <defs>
                    <clipPath id={`${clip}-window`}>
                        <TokenRect x={4} y={4} w={140} h={120} token="--radius-0375" scale="kit" />
                    </clipPath>
                </defs>
                <Frame x={4} y={4} w={140} h={120} />
                <TokenRect x={4} y={16} w={140} h={108} fill={PAINT.pageSurface} stroke={PAINT.pageEdge} clipPath={`url(#${clip}-window)`} data-part="page" />
                <SkeletonBar x={14} y={26} w={50} h={6} heading />
                {[0, 1, 2].map((i) => <SkeletonBar key={i} x={14} y={42 + i * 10} w={100 - i * 20} />)}
                <defs>
                    <clipPath id={clip}>
                        <TokenRect x={160} y={10} w={136} h={108} token="--modal-radius" scale="kit" />
                    </clipPath>
                </defs>
                <TokenRect x={160} y={10} w={136} h={108} token="--modal-radius" scale="kit" fill={PAINT.modalSurface} stroke={PAINT.modalDivider} data-part="modal" />
                <SkeletonBar x={172} y={22} w={50} h={6} heading />
                {[0, 1].map((i) => <SkeletonBar key={i} x={172} y={38 + i * 10} w={96 - i * 24} />)}
                <TokenRect x={160} y={92} w={136} h={26} fill={PAINT.sectionSubtleSurface} clipPath={`url(#${clip})`} data-part="footer-seam" />
                <Rule x1={160} y1={92} x2={296} y2={92} stroke={PAINT.modalDivider} />
                <ButtonShape x={226} y={101} w={28} />
                <ButtonShape x={258} y={101} w={28} appearance="primary" />
            </Illustration>
        </CloseUp>
    );
};

/** A pill keeps --radius-full wherever it sits: in a Card, and in a field. */
export const PillExemption = () => (
    <CloseUp testid="radius-pill">
        <Illustration width={260} height={80} title="A pill inside a Card and a pill inside a field, each fully rounded">
            <TokenRect x={4} y={4} w={120} h={72} token="--card-radius" fill={PAINT.cardSurface} stroke={PAINT.frameDivider} />
            <SkeletonBar x={20} y={20} w={56} h={6} heading />
            <TokenRect x={20} y={40} w={48} h={20} token="--radius-full" fill={PAINT.countSurface} data-part="pill" />
            <SkeletonBar x={30} y={48} w={28} />
            <TokenRect x={136} y={20} w={120} h={40} token="--radius-control-lg" fill={PAINT.fieldSurface} stroke={PAINT.fieldBorder} />
            <TokenRect x={144} y={28} w={56} h={24} token="--radius-full" fill={PAINT.countSurface} data-part="pill" />
            <SkeletonBar x={154} y={38} w={36} />
        </Illustration>
    </CloseUp>
);

/* ----------------------------------------------------------- do and don't */

/** A Popup with three rows, the rows rounded by `row`. */
const PopupRows = ({ row, title }) => (
    <Illustration width={160} height={96} title={title}>
        <TokenRect x={8} y={8} w={144} h={80} token="--popup-radius" fill={PAINT.popupSurface} stroke={PAINT.frameDivider} />
        {[0, 1].map((i) => (
            <TokenRect key={i} x={12} y={12 + i * 36} w={136} h={32} token={i === 0 ? row : undefined} fill={i === 0 ? PAINT.rowSelected : 'none'} />
        ))}
        <SkeletonBar x={24} y={26} w={56} />
        <SkeletonBar x={24} y={62} w={40} />
    </Illustration>
);

export const NestedDo = () => <PopupRows row={ROW_CORNER} title="Rows inset 4 inside a 12 Popup, rounded at 8" />;
export const NestedDont = () => <PopupRows row="--popup-radius" title="Rows inset 4 inside a 12 Popup, rounded at 12" />;

/** A Card's footer with two buttons; `odd` rounds the primary one off its default. */
const ButtonRow = ({ odd, title }) => (
    <Illustration width={160} height={64} title={title}>
        <TokenRect x={4} y={4} w={152} h={56} token="--card-radius" fill={PAINT.cardSurface} stroke={PAINT.frameDivider} />
        <SkeletonBar x={16} y={18} w={60} heading />
        <TokenRect x={60} y={32} w={40} h={16} token="--button-radius-default" stroke={PAINT.buttonDefaultBorder} />
        <TokenRect x={104} y={32} w={40} h={16} token={odd ? '--radius-full' : '--button-radius-default'} fill={PAINT.buttonPrimary} />
    </Illustration>
);

export const OverrideDo = () => <ButtonRow title="Two buttons at their default radius" />;
export const OverrideDont = () => <ButtonRow odd title="One button rounded to a pill beside a default one" />;

/** A Card and a tag on the scale, or nudged off it to 14 and 5. */
const OnScale = ({ off, title }) => (
    <Illustration width={160} height={80} title={title}>
        <TokenRect x={8} y={8} w={144} h={64} token={off ? 'calc(var(--radius-100) - var(--radius-0125))' : '--card-radius'} fill={PAINT.cardSurface} stroke={PAINT.frameDivider} />
        <SkeletonBar x={20} y={22} w={64} heading />
        <TokenRect x={20} y={40} w={40} h={16} token={off ? 'calc(var(--radius-025) + var(--radius-0125) / 2)' : '--radius-md'} fill={PAINT.countSurface} />
        <SkeletonBar x={28} y={46} w={24} />
    </Illustration>
);

export const OffScaleDo = () => <OnScale title="A Card at 16 and a tag at 4" />;
export const OffScaleDont = () => <OnScale off title="A Card at 14 and a tag at 5" />;

/** Six tiles 2 apart; `big` rounds them at 12 so the gaps pinch. */
const TightGrid = ({ big, title }) => (
    <Illustration width={160} height={80} title={title}>
        {Array.from({ length: 6 }, (_, i) => (
            <TokenRect key={i} x={10 + (i % 3) * 48} y={14 + Math.floor(i / 3) * 28} w={46} h={26} token={big ? '--radius-xl' : '--radius-md'} fill={PAINT.shape} />
        ))}
    </Illustration>
);

export const TightDo = () => <TightGrid title="Six tiles 2 apart, rounded at 4" />;
export const TightDont = () => <TightGrid big title="Six tiles 2 apart, rounded at 12, pinched at every gap" />;

/** A Modal header with its title and close control. */
const Header = ({ children }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--inline-md)', padding: 'var(--card-pad-default)', borderRadius: 'var(--modal-radius)', background: 'var(--ds-surface-overlay)', boxShadow: 'var(--ds-shadow-overlay)' }}>
        <span style={{ font: 'var(--heading-small)', color: 'var(--ds-text)' }}>Session details</span>
        {children}
    </div>
);

export const CloseDo = () => (
    <Header>
        <IconButton icon="xmark" label="Close" appearance="subtle" isTooltipDisabled />
    </Header>
);

export const CloseDont = () => (
    <Header>
        <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 'var(--item-height-md)', height: 'var(--item-height-md)', borderRadius: 'var(--radius-full)', background: 'var(--ds-background-neutral)', color: 'var(--ds-icon-subtle)' }}>
            <i className="fa-solid fa-xmark" />
        </span>
    </Header>
);
