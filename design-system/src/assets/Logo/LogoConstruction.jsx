import React from 'react';
import Logo from './Logo';
import './LogoConstruction.scss';

/**
 * The Logo construction drawing, docs only. The mark is drawn in a 96 box
 * (1u = 8). The overlay is laid over a large Logo; guides use the danger
 * border token, labels the subtle text token. It is not part of the Logo's
 * props and is not exported from the component barrel.
 */

/** The drawing's frame: the mark sits at (PAD_X, PAD_Y) and is MARK px wide in an `W` x `H` view box. */
const MARK = 396;
const PAD_X = 80;
const PAD_Y = 20;
const W = 560;
const H = 460;
const UNIT = MARK / 96;

const grid = Array.from({ length: 11 }, (_, i) => (i + 1) * 8);

/** Labels in the outer drawing (mark at 396, so 4.125 px per unit) so they stay readable. */
const LABELS = [
    [288, 40, '2u'],
    [363, 108, '2u'],
    [226, 168, '3u', 'end'],
    [226, 128, '0.7u', 'end'],
    [280.5, 182, '0.75u', 'middle'],
    [240, 206, 'center (8.5u, 3.5u)'],
    [4, 350, 'r 2u'],
    [330, 418, 'tangent 10u', 'middle'],
    [-20, 60, 'tangent 2u', 'end'],
];

export const CONSTRUCTION_RADII = { outer: 48, inner: 36, corner: 16 };

const LogoConstruction = ({ appearance = 'colored' }) => (
    <div className="plus-logo-construction" data-testid="logo-construction">
        <div className="plus-logo-construction__mark">
            <Logo appearance={appearance} size={96} data-testid="construction-logo" className="plus-logo-construction__logo" />
        </div>
        <svg
            className="plus-logo-construction__overlay"
            viewBox={`${-PAD_X} ${-PAD_Y} ${W} ${H}`}
            role="img"
            aria-label="Logo construction: keyline grid, circles of radius 6 and 4.5 units, corner circles of 2 units and the plus arm box of 3 by 3 units"
        >
            <g transform={`scale(${UNIT})`} data-testid="construction-guides">
                {grid.map((n) => (
                    <React.Fragment key={n}>
                        <line className="plus-logo-construction__grid" x1={n} y1="0" x2={n} y2="96" />
                        <line className="plus-logo-construction__grid" x1="0" y1={n} x2="96" y2={n} />
                    </React.Fragment>
                ))}
                <rect className="plus-logo-construction__long" x="0" y="0" width="96" height="96" />
                <circle className="plus-logo-construction__long" cx="48" cy="48" r={CONSTRUCTION_RADII.outer} />
                <circle className="plus-logo-construction__long" cx="48" cy="48" r={CONSTRUCTION_RADII.inner} />
                <line className="plus-logo-construction__long" x1="0" y1="0" x2="96" y2="96" />
                <line className="plus-logo-construction__long" x1="96" y1="0" x2="0" y2="96" />
                <circle className="plus-logo-construction__short" cx="80" cy="16" r={CONSTRUCTION_RADII.corner} />
                <circle className="plus-logo-construction__short" cx="16" cy="80" r={CONSTRUCTION_RADII.corner} />
                <line className="plus-logo-construction__short" x1="80" y1="-6" x2="80" y2="102" />
                <line className="plus-logo-construction__short" x1="-6" y1="16" x2="102" y2="16" />
                <rect className="plus-logo-construction__line" x="56" y="16" width="24" height="24" />
                <line className="plus-logo-construction__line" x1="68" y1="0" x2="68" y2="16" />
                <line className="plus-logo-construction__line" x1="80" y1="28" x2="96" y2="28" />
                <circle className="plus-logo-construction__dot" cx="68" cy="16" r=".9" />
                <circle className="plus-logo-construction__dot" cx="80" cy="28" r=".9" />
                <circle className="plus-logo-construction__dot" cx="68" cy="28" r=".9" />
            </g>
            <g>
                {LABELS.map(([x, y, text, anchor]) => (
                    <text key={text + x} className="plus-logo-construction__label" x={x} y={y} textAnchor={anchor}>{text}</text>
                ))}
            </g>
        </svg>
    </div>
);

export default LogoConstruction;
export { LogoConstruction };
