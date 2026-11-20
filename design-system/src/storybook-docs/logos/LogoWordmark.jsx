import React from 'react';
import PropTypes from 'prop-types';
import { Logo } from '@/components';
import { LOGO_SIZES } from '@/assets/Logo/Logo';
import { WORDMARKS } from '@/assets/Logo/logoArt';
import { Illustration } from '../illustrations/Illustration.jsx';
import { Measure, Zone } from '../illustrations/construction.jsx';
import { PAINT } from '../illustrations/paint.js';
import { Rule } from '../illustrations/primitives.jsx';
import { ROUNDED_ENDS, SQUARE_ENDS, STEP_CAP } from './wordmarkSteps.js';
import './LogoWordmark.scss';

/**
 * The Logos page's wordmark figures: the lockup at every size, the four steps
 * from the font to the logo's wordmark, the lockup rule, and two Don't
 * figures. Lockups and step 3 are the real Logo component and its exported
 * outlines; steps 0 to 2 draw the font's own outlines (see wordmarkSteps.js).
 * The step drawings and the rule are illustration-kit compositions.
 */

/** The lockup sizes, largest first, each with the wordmark drawn for it. */
export const LOCKUP_SIZES = LOGO_SIZES.filter((s) => WORDMARKS[s]).sort((a, b) => b - a);

const CAP = STEP_CAP;
/** The logo's letter gaps in font units: P–L 12%, L–U 6%, U–S 10% of the cap. */
const LOGO_GAPS = [88, 46, 72];
/** Drawing scale: one font unit is this many drawing units, so the cap is about 143. */
const K = 0.2;
const DRAW_CAP = CAP * K;
const PAD = 24;
const percent = (units) => `${Math.round((units / CAP) * 100)}%`;
const px = (units) => +(units * K).toFixed(2);

/** Where each letter's ink starts, given the gaps between them: a target left edge per letter. */
function layout(ink, gaps) {
    let x = 0;
    return ink.map(([l, r], i) => {
        const at = { from: l, left: x, right: x + (r - l) };
        x += r - l + (i < 3 ? gaps[i] : 0);
        return at;
    });
}

/** The font's own gaps, from the ink edges of its drawn letters. */
const gapsOf = (ink) => [0, 1, 2].map((i) => ink[i + 1][0] - ink[i][1]);

const Letters = ({ paths, placed }) => (
    <g fill="var(--ds-text)">
        {paths.map((d, i) => (
            <path key={i} d={d} transform={`translate(${px(placed ? placed[i].left - placed[i].from : 0)} 0) scale(${K})`} />
        ))}
    </g>
);
Letters.propTypes = { paths: PropTypes.arrayOf(PropTypes.string).isRequired, placed: PropTypes.array };

/** The cap-height guides across a step drawing. */
const CapLines = ({ width }) => (
    <>
        <Rule x1={-PAD} y1="0" x2={width + PAD} y2="0" stroke={PAINT.measureLine} dash="4 3" />
        <Rule x1={-PAD} y1={DRAW_CAP} x2={width + PAD} y2={DRAW_CAP} stroke={PAINT.measureLine} dash="4 3" />
    </>
);
CapLines.propTypes = { width: PropTypes.number.isRequired };

/** A gap tint with its measure under it, labeled in % of the cap. */
const GapRedline = ({ from, to }) => (
    <>
        <Zone x={px(from)} y={0} w={px(to - from)} h={DRAW_CAP} opacity={0.6} />
        <Measure x={px(from)} y={DRAW_CAP + 28} w={px(to - from)} tick={6} label={percent(to - from)} />
    </>
);
GapRedline.propTypes = { from: PropTypes.number.isRequired, to: PropTypes.number.isRequired };

const STEPS = [
    {
        title: 'The font out of the box',
        body: 'Google Sans Flex capitals at weight 530 and optical size 48, with the font’s own spacing and square stroke ends. This is the starting point.',
    },
    {
        title: 'Rounded ends',
        body: 'The font’s rounded-ends axis is turned on, so every stroke end gets the same soft cut as the plus’s arm ends. The spacing is unchanged.',
    },
    {
        title: 'Logo letter spacing',
        body: 'The logo sets its own gaps, as a share of the cap height: P–L 12%, L–U 6% and U–S 10%. They sit on the letters’ true edges, so they read the same at every size.',
    },
    {
        title: 'The U at 96%',
        body: 'The U is the widest letter and the only one with two full-height stems, so it reads heaviest. It is narrowed to 96% of its width about its center, so the four letters weigh about the same.',
    },
];

const stepFigure = (step) => {
    if (step === 3) {
        const set = WORDMARKS[48];
        const placed = layout(ROUNDED_ENDS.ink, LOGO_GAPS);
        const uWidth = (placed[2].right - placed[2].left) * 0.96;
        const width = px(set.width);
        return (
            <Illustration viewBox={`${-PAD} ${-PAD} ${width + PAD * 2} ${DRAW_CAP + PAD * 2 + 40}`} scale={1} title="PLUS wordmark with the U narrowed to 96% of its width">
                <CapLines width={width} />
                <Zone x={px(placed[2].left)} y={0} w={px(uWidth)} h={DRAW_CAP} opacity={0.6} />
                <Letters paths={set.paths} />
                <Measure x={px(placed[2].left)} y={DRAW_CAP + 28} w={px(uWidth)} tick={6} label="U 96%" />
            </Illustration>
        );
    }
    const data = step === 0 ? SQUARE_ENDS : ROUNDED_ENDS;
    const placed = step === 2 ? layout(data.ink, LOGO_GAPS) : null;
    const ink = placed ? placed.map((p) => [p.left, p.right]) : data.ink;
    const width = px(ink[3][1]);
    const gaps = placed ? LOGO_GAPS : gapsOf(data.ink);
    const names = ['the font out of the box', 'rounded ends', 'logo letter spacing'];
    return (
        <Illustration viewBox={`${-PAD} ${-PAD} ${width + PAD * 2} ${DRAW_CAP + PAD * 2 + 40}`} scale={1} title={`PLUS wordmark, ${names[step]}`}>
            <CapLines width={width} />
            {[0, 1, 2].map((i) => <GapRedline key={i} from={ink[i][1]} to={ink[i][1] + gaps[i]} />)}
            <Letters paths={data.paths} placed={placed} />
        </Illustration>
    );
};

/**
 * One step of the wordmark build, 0 to 3. Steps 0 to 2 draw the font's own
 * outlines; step 3 is the exported 48 outlines with the U marked.
 */
export const WordmarkStep = ({ step }) => {
    const meta = STEPS[step];
    return (
        <figure className="logo-wm" data-step={step}>
            {stepFigure(step)}
            <figcaption className="logo-wm__caption">
                <strong>{step} · {meta.title}.</strong> {meta.body}
            </figcaption>
        </figure>
    );
};
WordmarkStep.propTypes = { step: PropTypes.oneOf([0, 1, 2, 3]).isRequired };

/** The lockup at every size from 24 to 96, each captioned with its wordmark weight. */
export const LockupSizes = () => (
    <ul className="logo-lockups" aria-label="Lockup at each size">
        {LOCKUP_SIZES.slice().reverse().map((size) => (
            <li key={size} className="logo-lockups__item">
                <Logo size={size} wordmark />
                <span className="logo-wm__caption">{size} · weight {WORDMARKS[size].weight}</span>
            </li>
        ))}
    </ul>
);

const RULE_PAD_X = 36;
const RULE_PAD_Y = 32;

/** The lockup rule drawn over the real lockup at 96: cap half the mark, gap a quarter, centered. */
export const LockupRule = () => {
    const set = WORDMARKS[96];
    const width = 96 + 24 + (set.width * 48) / set.cap;
    const vbW = width + RULE_PAD_X * 2;
    const vbH = 96 + RULE_PAD_Y * 2;
    return (
        <div className="logo-rule" data-testid="lockup-rule" style={{ inlineSize: `${vbW}px` }}>
            <Illustration viewBox={`${-RULE_PAD_X} ${-RULE_PAD_Y} ${vbW} ${vbH}`} scale={1} title="The lockup rule: the wordmark's cap height is half the logomark, the gap is a quarter, and it is centered">
                <Rule x1="96" y1="24" x2={width} y2="24" stroke={PAINT.measureLine} dash="4 3" />
                <Rule x1="96" y1="72" x2={width} y2="72" stroke={PAINT.measureLine} dash="4 3" />
                <Measure x={width + 10} y={24} h={48} side="right" tick={4} label="½" />
                <Measure x={96} y={-10} w={24} side="top" tick={4} label="¼" />
                <Measure x={-10} y={0} h={96} side="left" tick={4} label="1" />
            </Illustration>
            <Logo
                className="logo-rule__logo"
                size={96}
                wordmark
                style={{ insetInlineStart: `${(RULE_PAD_X / vbW) * 100}%`, insetBlockStart: `${(RULE_PAD_Y / vbH) * 100}%` }}
            />
        </div>
    );
};

/** Don't: PLUS typed in a font beside the mark. */
export const TypedWordmarkFigure = () => (
    <span className="logo-dont">
        <Logo size={64} />
        <span className="logo-dont__typed" aria-hidden="true">PLUS</span>
    </span>
);

/** Don't: the real outlines tracked out. */
export const TrackedWordmarkFigure = () => {
    const set = WORDMARKS[64];
    const track = 200;
    const scale = 32 / set.cap;
    const width = (set.width + track * 3) * scale;
    return (
        <span className="logo-dont">
            <Logo size={64} />
            <svg className="logo-dont__tracked" role="img" aria-label="PLUS wordmark tracked out" width={width} height={32} viewBox={`0 0 ${width} 32`}>
                <g transform={`scale(${scale})`}>
                    {set.paths.map((d, i) => (
                        <path key={i} d={d} transform={`translate(${i * track} 0)`} />
                    ))}
                </g>
            </svg>
        </span>
    );
};
