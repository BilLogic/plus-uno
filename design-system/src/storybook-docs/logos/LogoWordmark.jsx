import React from 'react';
import PropTypes from 'prop-types';
import { Logo } from '@/components';
import { LOGO_SIZES } from '@/assets/Logo/Logo';
import { WORDMARKS } from '@/assets/Logo/logoArt';
import './LogoWordmark.scss';

/**
 * The Logos page's wordmark figures: the lockup at every size, the four steps
 * from the font to the logo's wordmark, the lockup rule, and two Don't
 * figures. Lockups and step 3 are the real Logo component and its exported
 * outlines; steps 0 to 2 set live Google Sans Flex so the font's own shapes
 * show before the brand tweaks.
 */

/** The lockup sizes, largest first, each with the wordmark drawn for it. */
export const LOCKUP_SIZES = LOGO_SIZES.filter((s) => WORDMARKS[s]).sort((a, b) => b - a);

/** Capitals are 716 font units tall; the logo's letter gaps as a share of that. */
const CAP = WORDMARKS[96].cap;
const LOGO_GAPS = [88, 46, 72];

/** Ink metrics of P L U S at weight 530 (the 48 lockup), in font units: [advance, ink left, ink right]. */
const FONT_INK = {
    P: [563.2, 51.9, 549.0],
    L: [475.6, 51.9, 471.2],
    U: [644.7, 45.2, 599.6],
    S: [552.0, 11.3, 529.8],
};
/** The font's own kerning in the L–U and U–S pairs, in font units. */
const FONT_KERN = [0, -11.7, -12.2];
const LETTERS = ['P', 'L', 'U', 'S'];

const fontGaps = LETTERS.slice(0, 3).map((k, i) => {
    const next = LETTERS[i + 1];
    return FONT_INK[k][0] - FONT_INK[k][2] + FONT_INK[next][1] + FONT_KERN[i];
});

/** Lay the four letters ink to ink with the given gaps. */
function lay(gaps) {
    let x = 0;
    const letters = LETTERS.map((k, i) => {
        const ink = FONT_INK[k][2] - FONT_INK[k][1];
        const letter = { k, tx: x - FONT_INK[k][1], l: x, r: x + ink };
        x += ink + (i < 3 ? gaps[i] : 0);
        return letter;
    });
    return { letters, width: x };
}

const PAD = 130;
const percent = (units) => `${Math.round((units / CAP) * 100)}%`;

const Frame = ({ width, label, children }) => (
    <svg
        className="logo-wm__svg"
        viewBox={`${-PAD} -150 ${width + PAD * 2} 1180`}
        role="img"
        aria-label={label}
    >
        {children}
        <line className="logo-wm__dash" x1={-PAD} y1="0" x2={width + PAD} y2="0" />
        <line className="logo-wm__dash" x1={-PAD} y1={CAP} x2={width + PAD} y2={CAP} />
    </svg>
);
Frame.propTypes = { width: PropTypes.number.isRequired, label: PropTypes.string.isRequired, children: PropTypes.node };

/** The gap redline under a gap: a bracket and its share of the cap. */
const Redline = ({ from, to }) => (
    <g>
        <rect className="logo-wm__band" x={from} y="0" width={to - from} height={CAP} />
        <line className="logo-wm__line" x1={from} y1="830" x2={to} y2="830" />
        <line className="logo-wm__line" x1={from} y1="795" x2={from} y2="865" />
        <line className="logo-wm__line" x1={to} y1="795" x2={to} y2="865" />
        <text className="logo-wm__label" x={(from + to) / 2} y="960">{percent(to - from)}</text>
    </g>
);
Redline.propTypes = { from: PropTypes.number.isRequired, to: PropTypes.number.isRequired };

/** Live Google Sans Flex letters, each placed by its ink so the gaps read true. */
const LiveLetters = ({ laid, rounded }) => (
    <g>
        {laid.letters.map((letter) => (
            <text
                key={letter.k}
                className={`logo-wm__letter logo-wm__letter--${rounded ? 'round' : 'square'}`}
                fontWeight={530}
                x={letter.tx}
                y={CAP}
            >
                {letter.k}
            </text>
        ))}
    </g>
);
LiveLetters.propTypes = { laid: PropTypes.object.isRequired, rounded: PropTypes.bool };

const STEPS = [
    {
        title: 'The font out of the box',
        body: 'Google Sans Flex capitals at weight 530 with the font’s own spacing and square stroke ends. This is the starting point.',
    },
    {
        title: 'Rounded ends',
        body: 'The font’s rounded-ends axis is turned on, so every stroke end gets the same soft cut as the plus’s arm ends.',
    },
    {
        title: 'Logo letter spacing',
        body: 'The font is spaced for running text, where capitals sit too close for a logo. The logo’s gaps, as a share of the cap height, are P–L 12%, L–U 6% and U–S 10% (the font gives 9%, 5% and 6%).',
    },
    {
        title: 'The U at 96%',
        body: 'The U is the widest letter and the only one with two full-height stems, so it reads heaviest. It is narrowed to 96% of its width about its center, so the four letters weigh about the same.',
    },
];

/** Ink edges of the U in the 48 lockup's outlines (rounded ends, optical size 48, narrowed to 96%). */
const U_ROUND_INK = { left: 43.74, right: 592.74 };
const U_NARROWED = (U_ROUND_INK.right - U_ROUND_INK.left) * 0.96;
const P_RIGHT = 567.0 - 71.0;
const L_RIGHT = P_RIGHT + LOGO_GAPS[0] + (501.0 - 71.0);
const U_LEFT = L_RIGHT + LOGO_GAPS[1];

/**
 * One step of the wordmark build, 0 to 3. Steps 0 to 2 are live text; step 3
 * is the exported 48 outlines with the U highlighted.
 */
export const WordmarkStep = ({ step }) => {
    const meta = STEPS[step];
    let figure;
    if (step === 3) {
        const outline = WORDMARKS[48];
        figure = (
            <Frame width={outline.width} label="PLUS wordmark with the U highlighted at 96% of its width">
                <rect className="logo-wm__band" x={U_LEFT} y="0" width={U_NARROWED} height={CAP} />
                <g>
                    {outline.paths.map((d, i) => (
                        <path key={i} className="logo-wm__outline" d={d} />
                    ))}
                </g>
                <text className="logo-wm__label" x={U_LEFT + U_NARROWED / 2} y="960">U 96% wide</text>
            </Frame>
        );
    } else {
        const laid = lay(step === 2 ? LOGO_GAPS : fontGaps);
        figure = (
            <Frame width={laid.width} label={`PLUS wordmark, ${meta.title.toLowerCase()}`}>
                <LiveLetters laid={laid} rounded={step > 0} />
                {step === 2 && laid.letters.slice(0, 3).map((a, i) => <Redline key={a.k} from={a.r} to={laid.letters[i + 1].l} />)}
            </Frame>
        );
    }
    return (
        <figure className="logo-wm" data-step={step}>
            {figure}
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

/** The lockup rule drawn over the real lockup at 96: cap half the mark, gap a quarter, centered. */
export const LockupRule = () => {
    const set = WORDMARKS[96];
    const width = 96 + 24 + (set.width * 48) / set.cap;
    return (
        <div className="logo-rule" data-testid="lockup-rule">
          <div className="logo-rule__stage">
            <Logo size={96} wordmark />
            <svg className="logo-rule__overlay" viewBox={`0 0 ${width.toFixed(1)} 96`} aria-hidden="true">
                <line className="logo-wm__dash" x1="96" y1="24" x2={width} y2="24" />
                <line className="logo-wm__dash" x1="96" y1="72" x2={width} y2="72" />
                <line className="logo-wm__line" x1={width + 8} y1="24" x2={width + 8} y2="72" />
                <text className="logo-rule__label" x={width + 20} y="52">½</text>
                <line className="logo-wm__line" x1="96" y1="-8" x2="120" y2="-8" />
                <line className="logo-wm__line" x1="96" y1="-12" x2="96" y2="-4" />
                <line className="logo-wm__line" x1="120" y1="-12" x2="120" y2="-4" />
                <text className="logo-rule__label" x="108" y="-18">¼</text>
                <line className="logo-wm__line" x1="-8" y1="0" x2="-8" y2="96" />
                <text className="logo-rule__label" x="-20" y="52">1</text>
            </svg>
          </div>
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
            <svg
                className="logo-dont__tracked"
                role="img"
                aria-label="PLUS wordmark tracked out"
                width={width}
                height={32}
                viewBox={`0 0 ${width} 32`}
                style={{ marginInlineStart: 'var(--stack-lg)' }}
            >
                <g transform={`scale(${scale})`}>
                    {set.paths.map((d, i) => (
                        <path key={i} d={d} transform={`translate(${i * track} 0)`} />
                    ))}
                </g>
            </svg>
        </span>
    );
};
