import React from 'react';
import { PAINT } from '../illustrations/paint.js';

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
