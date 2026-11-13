import React from 'react';
import { HAIRLINE, PAINT } from '../illustrations/paint.js';

/**
 * Ten stroke glyphs on a 24 grid, each a different object, so a set reads as
 * one family: the same stroke, the same corners, the same live area. The
 * Iconography hero draws all ten; the overviews borrow a few.
 */
export const GLYPHS = {
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2.5" />
            <path d="M3 10H21M8 3v4M16 3v4" />
        </>
    ),
    user: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </>
    ),
    bell: <path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4" />,
    search: (
        <>
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5L21 21" />
        </>
    ),
    chat: <path d="M4 5h16v11H9l-5 4z" />,
    check: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12l3 3 5-6" />
        </>
    ),
    star: <path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z" />,
    folder: <path d="M3 6h7l2 2h9v11H3z" />,
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    book: <path d="M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7z" />,
};

/**
 * One glyph, `size` units square at (x, y). `weight` is the stroke in the
 * glyph's own 24 grid, so it scales with the glyph as an icon's stroke does.
 */
export const Glyph = ({ name, x, y, size, stroke = PAINT.iconGlyph, weight = 2 }) => (
    <g
        data-glyph={name}
        transform={`translate(${x} ${y}) scale(${size / 24})`}
        fill="none"
        stroke={stroke}
        strokeWidth={weight}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {GLYPHS[name]}
    </g>
);

/**
 * A glyph's construction, drawn under it: the 24 grid at every second line,
 * the two diagonals in the field border, and the keyline circle and square in
 * the accent, faint. Every line is a hairline.
 */
export const IconConstruction = ({ x, y, size }) => {
    const k = size / 24;
    const grid = { stroke: PAINT.illustrationEdge, style: HAIRLINE };
    const keyline = { fill: 'none', stroke: PAINT.accent, strokeOpacity: 0.55, style: HAIRLINE };
    return (
        <g data-shape="icon-construction">
            {Array.from({ length: 13 }, (_, i) => (
                <React.Fragment key={i}>
                    <line x1={x + i * 2 * k} y1={y} x2={x + i * 2 * k} y2={y + size} {...grid} />
                    <line x1={x} y1={y + i * 2 * k} x2={x + size} y2={y + i * 2 * k} {...grid} />
                </React.Fragment>
            ))}
            <line x1={x} y1={y} x2={x + size} y2={y + size} {...grid} />
            <line x1={x + size} y1={y} x2={x} y2={y + size} {...grid} />
            <circle cx={x + size / 2} cy={y + size / 2} r={10 * k} {...keyline} />
            <rect x={x + 3 * k} y={y + 3 * k} width={18 * k} height={18 * k} rx={2 * k} {...keyline} />
        </g>
    );
};
